from __future__ import annotations

from pydantic import BaseModel, Field


class AgentPosition(BaseModel):
    agent_name: str
    position: str
    evidence: str = ""
    confidence: float = 0.0


class AgreementPoint(BaseModel):
    topic: str
    summary: str
    supporting_agents: list[str] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)


class DisagreementPoint(BaseModel):
    topic: str
    summary: str
    positions: list[AgentPosition] = Field(default_factory=list)


class ConflictReport(BaseModel):
    stage: int
    agreements: list[AgreementPoint] = Field(default_factory=list)
    disagreements: list[DisagreementPoint] = Field(default_factory=list)
    unresolved_tensions: list[str] = Field(default_factory=list)
    synthesis: str = ""
