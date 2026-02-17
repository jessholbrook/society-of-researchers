from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models import AgentConfig
from ..store.database import Database

router = APIRouter(prefix="/api/agents", tags=["agents"])


class CreateAgentRequest(BaseModel):
    name: str
    role: str
    perspective: str = ""
    system_prompt: str
    stage: int
    temperature: float = 0.7
    model: str = "claude-sonnet-4-20250514"
    conflict_partners: list[str] = []
    enabled: bool = True
    project_id: str | None = None


class UpdateAgentRequest(BaseModel):
    name: str | None = None
    role: str | None = None
    perspective: str | None = None
    system_prompt: str | None = None
    temperature: float | None = None
    model: str | None = None
    conflict_partners: list[str] | None = None
    enabled: bool | None = None


def get_db() -> Database:
    from ..main import app_state
    return app_state["db"]


@router.get("", response_model=list[AgentConfig])
async def list_agents(stage: int | None = None, project_id: str | None = None) -> list[AgentConfig]:
    db = get_db()
    return await db.list_agents(stage=stage, project_id=project_id)


@router.post("", response_model=AgentConfig)
async def create_agent(req: CreateAgentRequest) -> AgentConfig:
    db = get_db()
    agent = AgentConfig(**req.model_dump())
    await db.create_agent(agent)
    return agent


@router.get("/defaults", response_model=list[AgentConfig])
async def get_defaults() -> list[AgentConfig]:
    db = get_db()
    return await db.list_agents(project_id=None)


@router.get("/{agent_id}", response_model=AgentConfig)
async def get_agent(agent_id: str) -> AgentConfig:
    db = get_db()
    agent = await db.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=dict)
async def update_agent(agent_id: str, req: UpdateAgentRequest) -> dict:
    db = get_db()
    agent = await db.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    fields = {k: v for k, v in req.model_dump().items() if v is not None}
    if fields:
        await db.update_agent(agent_id, **fields)
    return {"ok": True}


@router.delete("/{agent_id}", response_model=dict)
async def delete_agent(agent_id: str) -> dict:
    db = get_db()
    await db.delete_agent(agent_id)
    return {"ok": True}


@router.post("/{agent_id}/toggle", response_model=dict)
async def toggle_agent(agent_id: str) -> dict:
    db = get_db()
    agent = await db.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await db.update_agent(agent_id, enabled=not agent.enabled)
    return {"ok": True, "enabled": not agent.enabled}
