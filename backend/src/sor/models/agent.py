from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


def _new_id() -> str:
    return uuid4().hex[:12]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Claim(BaseModel):
    text: str
    evidence: str = ""
    confidence: float = 0.0
    source: str = ""


class AgentConfig(BaseModel):
    id: str = Field(default_factory=_new_id)
    name: str
    role: str
    perspective: str = ""
    system_prompt: str
    stage: int
    temperature: float = 0.7
    model: str = "claude-sonnet-4-20250514"
    conflict_partners: list[str] = Field(default_factory=list)
    enabled: bool = True
    project_id: str | None = None


class AgentOutput(BaseModel):
    id: str = Field(default_factory=_new_id)
    agent_id: str
    agent_name: str
    stage: int
    project_id: str
    content: str = ""
    claims: list[Claim] = Field(default_factory=list)
    status: str = "pending"
    error: str | None = None
    created_at: str = Field(default_factory=_now_iso)
