from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models import Project, ProjectState
from ..store.database import Database

router = APIRouter(prefix="/api/projects", tags=["projects"])


class CreateProjectRequest(BaseModel):
    name: str
    research_question: str
    context: str = ""


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    research_question: str | None = None
    context: str | None = None


def get_db() -> Database:
    from ..main import app_state
    return app_state["db"]


@router.post("", response_model=Project)
async def create_project(req: CreateProjectRequest) -> Project:
    db = get_db()
    project = Project(name=req.name, research_question=req.research_question, context=req.context)
    await db.create_project(project)
    # Clone default agents for this project
    await db.clone_defaults_for_project(project.id)
    return project


@router.get("", response_model=list[Project])
async def list_projects() -> list[Project]:
    db = get_db()
    return await db.list_projects()


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str) -> Project:
    db = get_db()
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=dict)
async def update_project(project_id: str, req: UpdateProjectRequest) -> dict:
    db = get_db()
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    fields = {k: v for k, v in req.model_dump().items() if v is not None}
    if fields:
        await db.update_project(project_id, **fields)
    return {"ok": True}


@router.delete("/{project_id}", response_model=dict)
async def delete_project(project_id: str) -> dict:
    db = get_db()
    await db.delete_project(project_id)
    return {"ok": True}
