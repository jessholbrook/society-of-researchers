from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, Field

from .agent import AgentConfig, AgentOutput
from .conflict import ConflictReport


def _new_id() -> str:
    return uuid4().hex[:12]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class StageStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETE = "complete"
    APPROVED = "approved"
    SKIPPED = "skipped"


STAGE_NAMES: dict[int, str] = {
    1: "Problem Framing",
    2: "Evidence Gathering",
    3: "Analysis & Interpretation",
    4: "Insight Synthesis",
    5: "Communication",
    6: "Prototype & Intervention Design",
}

STAGE_DESCRIPTIONS: dict[int, str] = {
    1: "Define the research question, scope, and stakeholder landscape.",
    2: "Identify and gather evidence from multiple sources.",
    3: "Analyze evidence through multiple lenses, surface patterns and conflicts.",
    4: "Synthesize findings into actionable insights with confidence levels.",
    5: "Generate tailored deliverables for different audiences.",
    6: "Design interventions and prototypes grounded in research findings.",
}


class StageDefinition(BaseModel):
    number: int
    name: str
    description: str
    agents: list[AgentConfig] = Field(default_factory=list)


class StageResult(BaseModel):
    id: str = Field(default_factory=_new_id)
    project_id: str
    stage_number: int
    status: StageStatus = StageStatus.PENDING
    agent_outputs: list[AgentOutput] = Field(default_factory=list)
    conflict_report: ConflictReport | None = None
    human_override: str | None = None
    human_notes: str = ""
    approved_at: str | None = None
    created_at: str = Field(default_factory=_now_iso)
