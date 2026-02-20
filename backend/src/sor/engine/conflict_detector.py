"""Conflict detection module.

Compares multiple agent outputs and produces a structured ConflictReport
identifying agreements, disagreements, unresolved tensions, and a synthesis.
"""

from __future__ import annotations

from ..models import AgentOutput, ConflictReport
from .llm_client import LLMClient, LLMError

CONFLICT_DETECTION_PROMPT = """\
You are an expert research conflict analyst. Your PRIMARY job is to surface \
disagreements, tensions, and contradictions between research agents. Agreement \
is expected — disagreement is where the real insight lives.

You perform FOUR types of analysis:
1. CROSS-AGENT: Where do different agents agree or disagree with each other?
2. WITHIN-AGENT: Does any single agent contradict itself (saying X in one section and not-X in another)?
3. EVIDENCE CHAINS: Are there claims presented as well-supported that actually lack traceable evidence?
4. STAGE CONSISTENCY: Do the outputs build logically on prior stage results, or do they silently drop or contradict earlier findings?

CRITICAL: Dig deep for disagreements. Even when agents seem to agree on the surface, look for:
- Different EMPHASIS or PRIORITIZATION (one agent treats X as primary, another as secondary)
- Different SCOPE or FRAMING (one agent frames the problem narrowly, another broadly)
- Different ASSUMPTIONS underlying similar conclusions
- Different EVIDENCE cited for the same claim
- Different CONFIDENCE levels in the same finding
- OMISSIONS — what one agent covers that others ignore entirely
- IMPLICIT vs EXPLICIT disagreements (agents may agree on "what" but disagree on "why" or "how much")

Analyze the provided agent outputs and return a JSON object with this exact structure:

{
  "agreements": [
    {
      "topic": "Short topic label",
      "summary": "What the agents agree on",
      "supporting_agents": ["Agent Name 1", "Agent Name 2"],
      "evidence": ["Key evidence point 1", "Key evidence point 2"]
    }
  ],
  "disagreements": [
    {
      "topic": "Short topic label",
      "summary": "What the agents disagree about",
      "positions": [
        {
          "agent_name": "Agent Name 1",
          "position": "This agent's stance",
          "evidence": "Evidence supporting this position",
          "confidence": 0.8
        },
        {
          "agent_name": "Agent Name 2",
          "position": "This agent's contrasting stance",
          "evidence": "Evidence supporting this position",
          "confidence": 0.6
        }
      ]
    }
  ],
  "unresolved_tensions": [
    "Description of a tension that cannot be easily resolved with available evidence"
  ],
  "within_agent_contradictions": [
    "Agent Name: states [X] in section A but [not-X] in section B"
  ],
  "evidence_chain_breaks": [
    "Agent Name: claims [specific claim] but cites no traceable source for it"
  ],
  "synthesis": "A balanced 2-4 sentence summary that integrates the strongest points from all agents, acknowledges key disagreements, flags any integrity issues found, and suggests a path forward."
}

Rules:
- PRIORITIZE finding disagreements. Surface AT LEAST 2-3 points of disagreement or tension if there are multiple agents.
- Look beyond surface-level agreement. Two agents saying "X matters" is agreement, but one saying "X is the #1 priority" while another buries it in a list is a disagreement about emphasis.
- Confidence scores should range from 0.0 to 1.0 based on the strength of evidence.
- Check EVERY agent for internal contradictions. Even small ones matter.
- Flag any claim that sounds authoritative but lacks a cited source — these are the most dangerous.
- The synthesis should be actionable and balanced, not merely descriptive.
- If within_agent_contradictions or evidence_chain_breaks are found, the synthesis MUST mention them.
- Only output valid JSON. No markdown fences, no commentary outside the JSON.
"""


async def detect_conflicts(
    agent_outputs: list[AgentOutput],
    llm_client: LLMClient,
    stage: int,
) -> ConflictReport:
    """Compare agent outputs and produce a structured conflict report.

    Args:
        agent_outputs: The completed outputs from all agents in this stage.
        llm_client: The LLM client to use for analysis.
        stage: The stage number these outputs belong to.

    Returns:
        A ConflictReport summarizing agreements, disagreements, and synthesis.
    """
    if not agent_outputs:
        return ConflictReport(stage=stage, synthesis="No agent outputs to analyze.")

    if len(agent_outputs) == 1:
        return ConflictReport(
            stage=stage,
            synthesis=(
                f"Only one agent ({agent_outputs[0].agent_name}) provided output. "
                "No cross-agent comparison is possible."
            ),
        )

    user_message = _build_comparison_message(agent_outputs, stage)

    try:
        data = await llm_client.complete_json(
            system_prompt=CONFLICT_DETECTION_PROMPT,
            user_message=user_message,
            temperature=0.0,
        )
    except LLMError:
        # If JSON parsing fails, return a minimal report rather than crashing
        return ConflictReport(
            stage=stage,
            synthesis="Conflict detection failed: unable to parse LLM response.",
            unresolved_tensions=["Automated conflict analysis was unsuccessful."],
        )

    # Second pass: if no disagreements found and multiple agents, probe deeper
    disagreements = data.get("disagreements", [])
    if not disagreements and len(agent_outputs) >= 2:
        try:
            second_pass = await _probe_for_disagreements(
                agent_outputs, llm_client, stage,
            )
            if second_pass:
                disagreements = second_pass.get("disagreements", [])
                # Merge any new tensions found
                existing_tensions = data.get("unresolved_tensions", [])
                new_tensions = second_pass.get("unresolved_tensions", [])
                data["unresolved_tensions"] = existing_tensions + new_tensions
        except LLMError:
            pass  # Keep first-pass results if second pass fails

    return ConflictReport(
        stage=stage,
        agreements=data.get("agreements", []),
        disagreements=disagreements,
        unresolved_tensions=data.get("unresolved_tensions", []),
        within_agent_contradictions=data.get("within_agent_contradictions", []),
        evidence_chain_breaks=data.get("evidence_chain_breaks", []),
        synthesis=data.get("synthesis", ""),
    )


DISAGREEMENT_PROBE_PROMPT = """\
You are a research debate facilitator. The initial conflict analysis found NO disagreements \
between the agents, but that is almost never truly the case when multiple perspectives analyze \
the same question.

Look specifically for:
1. FRAMING differences — do agents define the problem differently?
2. PRIORITY differences — do agents rank the same factors in different orders?
3. MISSING perspectives — does one agent cover topics others ignore entirely?
4. METHODOLOGICAL differences — do agents use different reasoning approaches?
5. IMPLICIT assumptions — what does each agent take for granted that others don't?
6. DEGREE differences — do agents agree on direction but differ on magnitude/urgency?

Return a JSON object with ONLY these fields:
{
  "disagreements": [
    {
      "topic": "Short topic label",
      "summary": "The subtle disagreement found",
      "positions": [
        {"agent_name": "...", "position": "...", "evidence": "...", "confidence": 0.7},
        {"agent_name": "...", "position": "...", "evidence": "...", "confidence": 0.6}
      ]
    }
  ],
  "unresolved_tensions": ["Any new tensions found"]
}

Only output valid JSON. No markdown fences.
"""


async def _probe_for_disagreements(
    agent_outputs: list[AgentOutput],
    llm_client: LLMClient,
    stage: int,
) -> dict | None:
    """Second pass: probe specifically for disagreements when first pass found none."""
    user_message = _build_comparison_message(agent_outputs, stage)
    try:
        return await llm_client.complete_json(
            system_prompt=DISAGREEMENT_PROBE_PROMPT,
            user_message=user_message,
            temperature=0.2,  # Slightly creative to find subtle differences
        )
    except LLMError:
        return None


def _build_comparison_message(agent_outputs: list[AgentOutput], stage: int) -> str:
    """Build the user message by concatenating all agent outputs with headers."""
    parts: list[str] = [
        f"## Stage {stage} Agent Outputs\n",
        f"Compare the following {len(agent_outputs)} agent outputs and identify "
        "agreements, disagreements, unresolved tensions, and provide a synthesis.\n",
    ]

    for i, output in enumerate(agent_outputs, 1):
        parts.append(f"### Agent {i}: {output.agent_name}")
        parts.append(f"**Agent ID:** {output.agent_id}")
        parts.append(f"**Status:** {output.status}")
        if output.content:
            parts.append(f"\n{output.content}\n")
        else:
            parts.append("\n(No content produced)\n")
        parts.append("---\n")

    return "\n".join(parts)
