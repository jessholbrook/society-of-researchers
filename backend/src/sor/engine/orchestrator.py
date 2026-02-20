"""Stage orchestrator.

Runs all agents for a given stage in parallel, detects conflicts between
their outputs, and yields SSE events throughout the process.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncGenerator

from ..models import (
    AgentConfig,
    AgentOutput,
    ConflictReport,
    Project,
    SSEEvent,
    SSEEventType,
    StageResult,
    StageStatus,
)
from ..store.database import Database
from .conflict_detector import detect_conflicts
from .llm_client import LLMClient, LLMError

logger = logging.getLogger(__name__)


class StageOrchestrator:
    """Orchestrates a single research stage: runs agents, detects conflicts,
    persists results, and streams SSE events."""

    def __init__(self, llm_client: LLMClient, db: Database):
        self._llm = llm_client
        self._db = db

    async def run_stage(
        self,
        project: Project,
        stage_number: int,
        agents: list[AgentConfig],
    ) -> AsyncGenerator[SSEEvent, None]:
        """Run all enabled agents for a stage and stream progress events.

        Args:
            project: The project this stage belongs to.
            stage_number: Which stage to run (1-6).
            agents: Agent configurations for this stage.

        Yields:
            SSEEvent instances tracking progress through the stage.
        """
        enabled_agents = [a for a in agents if a.enabled]

        # --- STAGE_START ---
        yield SSEEvent(
            type=SSEEventType.STAGE_START,
            data={
                "project_id": project.id,
                "stage_number": stage_number,
                "agent_count": len(enabled_agents),
            },
        )

        if not enabled_agents:
            yield SSEEvent(
                type=SSEEventType.STAGE_COMPLETE,
                data={
                    "project_id": project.id,
                    "stage_number": stage_number,
                    "status": "complete",
                    "message": "No enabled agents for this stage.",
                },
            )
            return

        # Build context from prior approved stages
        prior_context = self._build_prior_context(project, stage_number)

        # Build the user message combining research question + context + prior stages
        user_message = self._build_user_message(project, prior_context)

        # --- Yield AGENT_START for each agent ---
        for agent in enabled_agents:
            yield SSEEvent(
                type=SSEEventType.AGENT_START,
                agent_id=agent.id,
                agent_name=agent.name,
                data={"stage": stage_number},
            )

        # --- Run agents with staggered starts to avoid rate limits ---
        async def _staggered_run(agent: AgentConfig, delay: float) -> AgentOutput:
            if delay > 0:
                await asyncio.sleep(delay)
            return await self._run_single_agent(agent, user_message, project.id)

        tasks = [
            _staggered_run(agent, i * 5.0)  # 5 second stagger between agents
            for i, agent in enumerate(enabled_agents)
        ]
        agent_outputs: list[AgentOutput] = await asyncio.gather(*tasks)

        # --- Yield AGENT_COMPLETE / AGENT_ERROR for each ---
        for output in agent_outputs:
            if output.status == "error":
                yield SSEEvent(
                    type=SSEEventType.AGENT_ERROR,
                    agent_id=output.agent_id,
                    agent_name=output.agent_name,
                    data={
                        "stage": stage_number,
                        "error": output.error or "Unknown error",
                    },
                )
            else:
                yield SSEEvent(
                    type=SSEEventType.AGENT_COMPLETE,
                    agent_id=output.agent_id,
                    agent_name=output.agent_name,
                    data={
                        "stage": stage_number,
                        "content_length": len(output.content),
                    },
                )

        # --- CONFLICT_START ---
        yield SSEEvent(
            type=SSEEventType.CONFLICT_START,
            data={
                "project_id": project.id,
                "stage_number": stage_number,
                "agent_count": len(agent_outputs),
            },
        )

        # --- Run conflict detection ---
        successful_outputs = [o for o in agent_outputs if o.status == "complete"]
        conflict_report = await detect_conflicts(
            agent_outputs=successful_outputs,
            llm_client=self._llm,
            stage=stage_number,
        )

        # --- CONFLICT_COMPLETE ---
        yield SSEEvent(
            type=SSEEventType.CONFLICT_COMPLETE,
            data={
                "project_id": project.id,
                "stage_number": stage_number,
                "agreements": len(conflict_report.agreements),
                "disagreements": len(conflict_report.disagreements),
                "synthesis": conflict_report.synthesis,
            },
        )

        # --- Persist the stage result ---
        stage_result = StageResult(
            project_id=project.id,
            stage_number=stage_number,
            status=StageStatus.COMPLETE,
            agent_outputs=agent_outputs,
            conflict_report=conflict_report,
        )
        await self._db.save_stage_result(stage_result)

        # --- STAGE_COMPLETE ---
        yield SSEEvent(
            type=SSEEventType.STAGE_COMPLETE,
            data={
                "project_id": project.id,
                "stage_number": stage_number,
                "status": "complete",
                "stage_result_id": stage_result.id,
                "agent_outputs": len(agent_outputs),
                "agreements": len(conflict_report.agreements),
                "disagreements": len(conflict_report.disagreements),
            },
        )

    async def _run_single_agent(
        self,
        agent: AgentConfig,
        user_message: str,
        project_id: str,
    ) -> AgentOutput:
        """Run a single agent and return its output.

        Args:
            agent: The agent configuration to run.
            user_message: The assembled user message with question and context.
            project_id: The project this run belongs to.

        Returns:
            AgentOutput with status "complete" on success or "error" on failure.
        """
        try:
            content = await self._llm.complete(
                system_prompt=agent.system_prompt,
                user_message=user_message,
                temperature=agent.temperature,
                model=agent.model,
            )
            return AgentOutput(
                agent_id=agent.id,
                agent_name=agent.name,
                stage=agent.stage,
                project_id=project_id,
                content=content,
                status="complete",
            )
        except LLMError as exc:
            logger.error("Agent %s failed: %s", agent.name, exc)
            return AgentOutput(
                agent_id=agent.id,
                agent_name=agent.name,
                stage=agent.stage,
                project_id=project_id,
                content="",
                status="error",
                error=str(exc),
            )
        except Exception as exc:
            logger.exception("Unexpected error running agent %s", agent.name)
            return AgentOutput(
                agent_id=agent.id,
                agent_name=agent.name,
                stage=agent.stage,
                project_id=project_id,
                content="",
                status="error",
                error=f"Unexpected error: {exc}",
            )

    def _build_prior_context(self, project: Project, current_stage: int) -> str:
        """Build context from previously approved stage results.

        For each approved stage, uses the human_override text if present,
        otherwise concatenates the agent outputs.

        Args:
            project: The project containing stage results.
            current_stage: The stage about to run (prior stages are < this).

        Returns:
            Formatted string of prior stage context, or empty string if none.
        """
        parts: list[str] = []

        approved_results = sorted(
            [
                sr
                for sr in project.stage_results
                if sr.status == StageStatus.APPROVED and sr.stage_number < current_stage
            ],
            key=lambda sr: sr.stage_number,
        )

        for sr in approved_results:
            parts.append(f"## Stage {sr.stage_number} (Approved)")

            if sr.human_override:
                parts.append(sr.human_override)
            else:
                for output in sr.agent_outputs:
                    if output.status == "complete" and output.content:
                        parts.append(f"### {output.agent_name}")
                        parts.append(output.content)

            if sr.conflict_report and sr.conflict_report.synthesis:
                parts.append(f"\n**Synthesis:** {sr.conflict_report.synthesis}")

            parts.append("")  # blank line separator

        return "\n".join(parts)

    @staticmethod
    def _build_user_message(project: Project, prior_context: str) -> str:
        """Assemble the full user message sent to each agent.

        Combines the research question, structured context components, and
        the accumulated context from prior approved stages.

        The structured context ensures every agent receives consistent framing
        about what is being researched, why, and for whom — preventing generic
        or context-free analysis.
        """
        sections: list[str] = []

        sections.append("# Research Question")
        sections.append(project.research_question)

        if project.context:
            sections.append("\n# Structured Context")
            sections.append(
                "Use the following context to ground ALL of your analysis. "
                "Every claim, theme, and recommendation you produce must be "
                "specific to this context — not generic advice that could apply "
                "to any organization.\n"
            )
            sections.append(project.context)
            sections.append(
                "\n**Grounding Rule:** Before finalizing any insight, check: "
                "'Would this insight change if the company, product, or audience were different?' "
                "If the answer is no, make it more specific to the context above."
            )

        if prior_context:
            sections.append("\n# Prior Stage Results")
            sections.append(prior_context)

        sections.append(
            "\n# Your Task"
            "\nProvide your analysis based on your assigned role and perspective. "
            "Be thorough, cite evidence where possible, and clearly state your "
            "confidence level in key claims."
            "\n\n**Quality Gates:**"
            "\n- Every claim must be traceable to specific evidence. Mark unsourced claims."
            "\n- Every insight must be specific to this project's context. Flag generic observations."
            "\n- Every recommendation must state what decision it enables. Omit decision-inert findings."
        )

        return "\n".join(sections)
