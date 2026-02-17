from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum

from pydantic import BaseModel, Field


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class SSEEventType(StrEnum):
    STAGE_START = "stage_start"
    AGENT_START = "agent_start"
    AGENT_COMPLETE = "agent_complete"
    AGENT_ERROR = "agent_error"
    CONFLICT_START = "conflict_start"
    CONFLICT_COMPLETE = "conflict_complete"
    STAGE_COMPLETE = "stage_complete"


class SSEEvent(BaseModel):
    type: SSEEventType
    agent_id: str | None = None
    agent_name: str | None = None
    data: dict = Field(default_factory=dict)
    timestamp: str = Field(default_factory=_now_iso)
