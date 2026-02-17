"""Conflict detection module.

Compares multiple agent outputs and produces a structured ConflictReport
identifying agreements, disagreements, unresolved tensions, and a synthesis.
"""

from __future__ import annotations

from ..models import AgentOutput, ConflictReport
from .llm_client import LLMClient, LLMError

CONFLICT_DETECTION_PROMPT = """\
You are an expert research conflict analyst. Your job is to carefully compare \
multiple research agent outputs and identify where they agree, where they \
disagree, and what tensions remain unresolved.

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
  "synthesis": "A balanced 2-4 sentence summary that integrates the strongest points from all agents, acknowledges key disagreements, and suggests a path forward."
}

Rules:
- Be thorough: identify ALL meaningful agreements and disagreements.
- Confidence scores should range from 0.0 to 1.0 based on the strength of evidence.
- If agents largely agree, note that and keep disagreements empty.
- If agents largely disagree, still look for any common ground.
- The synthesis should be actionable and balanced, not merely descriptive.
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

    return ConflictReport(
        stage=stage,
        agreements=data.get("agreements", []),
        disagreements=data.get("disagreements", []),
        unresolved_tensions=data.get("unresolved_tensions", []),
        synthesis=data.get("synthesis", ""),
    )


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
