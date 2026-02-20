from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .engine.llm_client import LLMClient
from .engine.orchestrator import StageOrchestrator
from .store.database import Database
from .routes import projects, stages, agents, documents

# Module-level state accessible to routes
app_state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    db = Database(settings.database_path)
    await db.initialize()

    llm_client = LLMClient(api_key=settings.anthropic_api_key, default_model=settings.default_model)
    orchestrator = StageOrchestrator(llm_client=llm_client, db=db)

    app_state["db"] = db
    app_state["llm_client"] = llm_client
    app_state["orchestrator"] = orchestrator

    # Seed default agents if none exist
    existing = await db.list_agents(project_id=None)
    if not existing:
        from .engine.defaults import DEFAULT_AGENTS
        for agent in DEFAULT_AGENTS:
            await db.create_agent(agent)

    yield

    # Shutdown
    await llm_client.close()


app = FastAPI(
    title="Society of Researchers",
    description="Multi-agent research orchestration system",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(stages.router)
app.include_router(stages.report_router)
app.include_router(agents.router)
app.include_router(documents.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "has_api_key": bool(settings.anthropic_api_key)}
