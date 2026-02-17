from __future__ import annotations

from datetime import datetime, timezone
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, Field

from .stage import StageResult


def _new_id() -> str:
    return uuid4().hex[:12]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ProjectState(StrEnum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETE = "complete"


class Project(BaseModel):
    id: str = Field(default_factory=_new_id)
    name: str
    research_question: str
    context: str = ""
    state: ProjectState = ProjectState.DRAFT
    current_stage: int = 1
    stage_results: list[StageResult] = Field(default_factory=list)
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)
