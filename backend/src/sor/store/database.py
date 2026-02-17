from __future__ import annotations

import json
import os
from pathlib import Path

import aiosqlite

from ..models import (
    AgentConfig,
    AgentOutput,
    ConflictReport,
    Project,
    ProjectState,
    StageResult,
    StageStatus,
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    research_question TEXT NOT NULL,
    context TEXT DEFAULT '',
    state TEXT DEFAULT 'draft',
    current_stage INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    perspective TEXT DEFAULT '',
    system_prompt TEXT NOT NULL,
    stage INTEGER NOT NULL,
    temperature REAL DEFAULT 0.7,
    model TEXT DEFAULT 'claude-sonnet-4-20250514',
    conflict_partners TEXT DEFAULT '[]',
    enabled INTEGER DEFAULT 1,
    project_id TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stage_results (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    stage_number INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    conflict_report TEXT DEFAULT NULL,
    human_override TEXT DEFAULT NULL,
    human_notes TEXT DEFAULT '',
    approved_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, stage_number)
);

CREATE TABLE IF NOT EXISTS agent_outputs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    stage INTEGER NOT NULL,
    project_id TEXT NOT NULL,
    stage_result_id TEXT NOT NULL,
    content TEXT DEFAULT '',
    claims TEXT DEFAULT '[]',
    status TEXT DEFAULT 'pending',
    error TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_result_id) REFERENCES stage_results(id) ON DELETE CASCADE
);
"""


class Database:
    def __init__(self, path: str):
        self._path = path

    async def initialize(self) -> None:
        os.makedirs(os.path.dirname(self._path) or ".", exist_ok=True)
        async with aiosqlite.connect(self._path) as db:
            await db.executescript(SCHEMA)
            await db.commit()

    def _connect(self) -> aiosqlite.Connection:
        return aiosqlite.connect(self._path)

    # --- Projects ---

    async def create_project(self, project: Project) -> Project:
        async with self._connect() as db:
            await db.execute(
                "INSERT INTO projects (id, name, research_question, context, state, current_stage, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (project.id, project.name, project.research_question, project.context,
                 project.state, project.current_stage, project.created_at, project.updated_at),
            )
            await db.commit()
        return project

    async def get_project(self, project_id: str) -> Project | None:
        async with self._connect() as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
            row = await cursor.fetchone()
            if not row:
                return None
            project = Project(
                id=row["id"], name=row["name"], research_question=row["research_question"],
                context=row["context"], state=ProjectState(row["state"]),
                current_stage=row["current_stage"], created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
            project.stage_results = await self._get_stage_results(db, project_id)
            return project

    async def list_projects(self) -> list[Project]:
        async with self._connect() as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM projects ORDER BY created_at DESC")
            rows = await cursor.fetchall()
            projects = []
            for row in rows:
                p = Project(
                    id=row["id"], name=row["name"], research_question=row["research_question"],
                    context=row["context"], state=ProjectState(row["state"]),
                    current_stage=row["current_stage"], created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
                p.stage_results = await self._get_stage_results(db, p.id)
                projects.append(p)
            return projects

    async def update_project(self, project_id: str, **fields: object) -> None:
        if not fields:
            return
        sets = ", ".join(f"{k} = ?" for k in fields)
        vals = list(fields.values()) + [project_id]
        async with self._connect() as db:
            await db.execute(f"UPDATE projects SET {sets}, updated_at = datetime('now') WHERE id = ?", vals)
            await db.commit()

    async def delete_project(self, project_id: str) -> None:
        async with self._connect() as db:
            await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            await db.commit()

    # --- Stage Results ---

    async def _get_stage_results(self, db: aiosqlite.Connection, project_id: str) -> list[StageResult]:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM stage_results WHERE project_id = ? ORDER BY stage_number", (project_id,)
        )
        rows = await cursor.fetchall()
        results = []
        for row in rows:
            sr = StageResult(
                id=row["id"], project_id=row["project_id"], stage_number=row["stage_number"],
                status=StageStatus(row["status"]),
                conflict_report=json.loads(row["conflict_report"]) if row["conflict_report"] else None,
                human_override=row["human_override"], human_notes=row["human_notes"],
                approved_at=row["approved_at"], created_at=row["created_at"],
            )
            # Load agent outputs
            out_cursor = await db.execute(
                "SELECT * FROM agent_outputs WHERE stage_result_id = ? ORDER BY created_at", (sr.id,)
            )
            out_rows = await out_cursor.fetchall()
            sr.agent_outputs = [
                AgentOutput(
                    id=r["id"], agent_id=r["agent_id"], agent_name=r["agent_name"],
                    stage=r["stage"], project_id=r["project_id"], content=r["content"],
                    claims=json.loads(r["claims"]), status=r["status"], error=r["error"],
                    created_at=r["created_at"],
                )
                for r in out_rows
            ]
            results.append(sr)
        return results

    async def get_stage_result(self, project_id: str, stage_number: int) -> StageResult | None:
        async with self._connect() as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM stage_results WHERE project_id = ? AND stage_number = ?",
                (project_id, stage_number),
            )
            row = await cursor.fetchone()
            if not row:
                return None
            sr = StageResult(
                id=row["id"], project_id=row["project_id"], stage_number=row["stage_number"],
                status=StageStatus(row["status"]),
                conflict_report=json.loads(row["conflict_report"]) if row["conflict_report"] else None,
                human_override=row["human_override"], human_notes=row["human_notes"],
                approved_at=row["approved_at"], created_at=row["created_at"],
            )
            out_cursor = await db.execute(
                "SELECT * FROM agent_outputs WHERE stage_result_id = ? ORDER BY created_at", (sr.id,)
            )
            out_rows = await out_cursor.fetchall()
            sr.agent_outputs = [
                AgentOutput(
                    id=r["id"], agent_id=r["agent_id"], agent_name=r["agent_name"],
                    stage=r["stage"], project_id=r["project_id"], content=r["content"],
                    claims=json.loads(r["claims"]), status=r["status"], error=r["error"],
                    created_at=r["created_at"],
                )
                for r in out_rows
            ]
            return sr

    async def save_stage_result(self, sr: StageResult) -> None:
        conflict_json = sr.conflict_report.model_dump_json() if sr.conflict_report else None
        async with self._connect() as db:
            await db.execute(
                "INSERT OR REPLACE INTO stage_results "
                "(id, project_id, stage_number, status, conflict_report, human_override, human_notes, approved_at, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (sr.id, sr.project_id, sr.stage_number, sr.status, conflict_json,
                 sr.human_override, sr.human_notes, sr.approved_at, sr.created_at),
            )
            for out in sr.agent_outputs:
                await db.execute(
                    "INSERT OR REPLACE INTO agent_outputs "
                    "(id, agent_id, agent_name, stage, project_id, stage_result_id, content, claims, status, error, created_at) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (out.id, out.agent_id, out.agent_name, out.stage, out.project_id, sr.id,
                     out.content, json.dumps([c.model_dump() for c in out.claims]),
                     out.status, out.error, out.created_at),
                )
            await db.commit()

    async def update_stage_result(self, project_id: str, stage_number: int, **fields: object) -> None:
        if not fields:
            return
        sets = ", ".join(f"{k} = ?" for k in fields)
        vals = list(fields.values()) + [project_id, stage_number]
        async with self._connect() as db:
            await db.execute(
                f"UPDATE stage_results SET {sets} WHERE project_id = ? AND stage_number = ?", vals
            )
            await db.commit()

    # --- Agents ---

    async def create_agent(self, agent: AgentConfig) -> AgentConfig:
        async with self._connect() as db:
            await db.execute(
                "INSERT INTO agents (id, name, role, perspective, system_prompt, stage, temperature, model, conflict_partners, enabled, project_id) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (agent.id, agent.name, agent.role, agent.perspective, agent.system_prompt,
                 agent.stage, agent.temperature, agent.model,
                 json.dumps(agent.conflict_partners), int(agent.enabled), agent.project_id),
            )
            await db.commit()
        return agent

    async def get_agent(self, agent_id: str) -> AgentConfig | None:
        async with self._connect() as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
            row = await cursor.fetchone()
            if not row:
                return None
            return self._row_to_agent(row)

    async def list_agents(self, stage: int | None = None, project_id: str | None = None) -> list[AgentConfig]:
        query = "SELECT * FROM agents WHERE 1=1"
        params: list[object] = []
        if stage is not None:
            query += " AND stage = ?"
            params.append(stage)
        if project_id is not None:
            query += " AND project_id = ?"
            params.append(project_id)
        else:
            query += " AND project_id IS NULL"
        query += " ORDER BY stage, name"
        async with self._connect() as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(query, params)
            rows = await cursor.fetchall()
            return [self._row_to_agent(r) for r in rows]

    async def update_agent(self, agent_id: str, **fields: object) -> None:
        if not fields:
            return
        # Handle conflict_partners specially
        if "conflict_partners" in fields:
            fields["conflict_partners"] = json.dumps(fields["conflict_partners"])
        if "enabled" in fields:
            fields["enabled"] = int(fields["enabled"])
        sets = ", ".join(f"{k} = ?" for k in fields)
        vals = list(fields.values()) + [agent_id]
        async with self._connect() as db:
            await db.execute(f"UPDATE agents SET {sets} WHERE id = ?", vals)
            await db.commit()

    async def delete_agent(self, agent_id: str) -> None:
        async with self._connect() as db:
            await db.execute("DELETE FROM agents WHERE id = ?", (agent_id,))
            await db.commit()

    async def clone_defaults_for_project(self, project_id: str) -> list[AgentConfig]:
        """Clone all global default agents for a specific project."""
        defaults = await self.list_agents(project_id=None)
        cloned = []
        for agent in defaults:
            clone = agent.model_copy(update={"id": agent.id + f"-{project_id[:6]}", "project_id": project_id})
            await self.create_agent(clone)
            cloned.append(clone)
        return cloned

    @staticmethod
    def _row_to_agent(row: aiosqlite.Row) -> AgentConfig:
        return AgentConfig(
            id=row["id"], name=row["name"], role=row["role"],
            perspective=row["perspective"], system_prompt=row["system_prompt"],
            stage=row["stage"], temperature=row["temperature"], model=row["model"],
            conflict_partners=json.loads(row["conflict_partners"]),
            enabled=bool(row["enabled"]), project_id=row["project_id"],
        )
