from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from ..models import StageResult, StageStatus, Project
from ..engine.orchestrator import StageOrchestrator
from ..engine.llm_client import LLMClient
from ..store.database import Database

router = APIRouter(prefix="/api/projects/{project_id}/stages", tags=["stages"])


class OverrideRequest(BaseModel):
    content: str
    notes: str = ""


def get_db() -> Database:
    from ..main import app_state
    return app_state["db"]


def get_orchestrator() -> StageOrchestrator:
    from ..main import app_state
    return app_state["orchestrator"]


def get_llm() -> LLMClient:
    from ..main import app_state
    return app_state["llm_client"]


@router.get("", response_model=list[StageResult])
async def list_stage_results(project_id: str) -> list[StageResult]:
    db = get_db()
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project.stage_results


@router.get("/{stage_number}", response_model=StageResult | None)
async def get_stage_result(project_id: str, stage_number: int) -> StageResult | None:
    db = get_db()
    return await db.get_stage_result(project_id, stage_number)


@router.get("/{stage_number}/run")
async def run_stage(project_id: str, stage_number: int):
    db = get_db()
    orchestrator = get_orchestrator()

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if stage_number < 1 or stage_number > 6:
        raise HTTPException(status_code=400, detail="Stage must be 1-6")

    # Check prior stages are approved (except stage 1)
    if stage_number > 1:
        for i in range(1, stage_number):
            prior = await db.get_stage_result(project_id, i)
            if not prior or prior.status != StageStatus.APPROVED:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stage {i} must be approved before running stage {stage_number}",
                )

    # Get agents for this project and stage
    agents = await db.list_agents(stage=stage_number, project_id=project_id)
    if not agents:
        raise HTTPException(status_code=400, detail=f"No agents configured for stage {stage_number}")

    # Update project state
    await db.update_project(project_id, state="in_progress", current_stage=stage_number)

    async def event_generator():
        async for event in orchestrator.run_stage(project, stage_number, agents):
            yield {
                "event": event.type.value,
                "data": json.dumps({
                    "agent_id": event.agent_id,
                    "agent_name": event.agent_name,
                    "timestamp": event.timestamp,
                    **event.data,
                }),
            }

    return EventSourceResponse(event_generator())


@router.post("/{stage_number}/approve", response_model=dict)
async def approve_stage(project_id: str, stage_number: int) -> dict:
    db = get_db()
    result = await db.get_stage_result(project_id, stage_number)
    if not result:
        raise HTTPException(status_code=404, detail="Stage result not found")
    if result.status not in (StageStatus.COMPLETE, StageStatus.APPROVED):
        raise HTTPException(status_code=400, detail="Stage must be complete before approving")

    now = datetime.now(timezone.utc).isoformat()
    await db.update_stage_result(project_id, stage_number, status="approved", approved_at=now)

    if stage_number >= 6:
        # Final stage — mark project complete
        await db.update_project(project_id, state="complete", current_stage=6)
        return {"ok": True, "complete": True}

    # Advance project current_stage
    next_stage = stage_number + 1
    await db.update_project(project_id, current_stage=next_stage)
    return {"ok": True, "next_stage": next_stage}


@router.put("/{stage_number}/override", response_model=dict)
async def save_override(project_id: str, stage_number: int, req: OverrideRequest) -> dict:
    db = get_db()
    result = await db.get_stage_result(project_id, stage_number)
    if not result:
        raise HTTPException(status_code=404, detail="Stage result not found")

    await db.update_stage_result(
        project_id, stage_number,
        human_override=req.content, human_notes=req.notes,
    )
    return {"ok": True}


# --- Report generation (separate prefix for project-level endpoint) ---

report_router = APIRouter(prefix="/api/projects/{project_id}", tags=["report"])


REPORT_SYSTEM_PROMPT = """\
You are a research report writer. Given the outputs from a 6-stage multi-agent research pipeline, \
produce a comprehensive final report in Markdown format.

The report should include:
1. **Executive Summary** — 2-3 paragraph overview of the research question and key findings
2. **Research Question & Scope** — from Stage 1
3. **Key Evidence** — from Stage 2
4. **Analysis & Patterns** — from Stage 3
5. **Synthesized Insights** — from Stage 4
6. **Communication Deliverables** — from Stage 5
7. **Prototypes & Interventions** — from Stage 6, with descriptions of each prototype/intervention proposed
8. **Areas of Agreement** — where the research agents converged
9. **Unresolved Tensions** — where agents disagreed and what remains open
10. **Recommended Next Steps**

Write in clear, professional prose. Use markdown headers, bullets, and bold for readability. \
Attribute key claims to the agents that made them where relevant.\
"""


@report_router.post("/report")
async def generate_report(project_id: str):
    db = get_db()
    llm = get_llm()

    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Build the full context from all stage results
    sections: list[str] = []
    sections.append(f"# Research Question\n{project.research_question}")
    if project.context:
        sections.append(f"\n# Project Context\n{project.context}")

    for sr in sorted(project.stage_results, key=lambda s: s.stage_number):
        sections.append(f"\n## Stage {sr.stage_number}: {_stage_name(sr.stage_number)}")
        sections.append(f"Status: {sr.status}")

        if sr.human_override:
            sections.append(f"\n### Human Override\n{sr.human_override}")

        for output in sr.agent_outputs:
            if output.status == "complete" and output.content:
                sections.append(f"\n### {output.agent_name}\n{output.content}")

        if sr.conflict_report:
            cr = sr.conflict_report
            # conflict_report may be a dict (from DB) or a Pydantic model
            _get = lambda obj, key, default="": getattr(obj, key, None) or (obj.get(key, default) if isinstance(obj, dict) else default)
            synthesis = _get(cr, "synthesis")
            if synthesis:
                sections.append(f"\n### Synthesis\n{synthesis}")
            agreements = _get(cr, "agreements") or []
            disagreements = _get(cr, "disagreements") or []
            if agreements:
                sections.append(f"\n### Agreements ({len(agreements)})")
                for a in agreements:
                    sections.append(f"- **{_get(a, 'topic')}**: {_get(a, 'summary')}")
            if disagreements:
                sections.append(f"\n### Disagreements ({len(disagreements)})")
                for d in disagreements:
                    sections.append(f"- **{_get(d, 'topic')}**: {_get(d, 'summary')}")

    user_message = "\n".join(sections)

    try:
        report_content = await llm.complete(
            system_prompt=REPORT_SYSTEM_PROMPT,
            user_message=user_message,
            temperature=0.3,
            max_tokens=8192,
        )
        return {"ok": True, "report": report_content}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {exc}")


def _stage_name(num: int) -> str:
    names = {
        1: "Problem Framing",
        2: "Evidence Gathering",
        3: "Analysis & Interpretation",
        4: "Insight Synthesis",
        5: "Communication",
        6: "Prototype & Intervention",
    }
    return names.get(num, f"Stage {num}")
