# Society of Researchers

A multi-agent research orchestration system that runs research through 6 stages, each staffed by 2-5 AI agents with distinct perspectives — some deliberately in conflict. Human researchers have edit control at every checkpoint.

## Architecture

- **Backend**: Python/FastAPI — agent orchestration, LLM calls (Anthropic), SQLite persistence
- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS

## Quick Start

### 1. Set up the backend

```bash
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

```bash
uv sync
uv run uvicorn sor.main:app --reload --port 8000 --app-dir src
```

### 2. Set up the frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## The 6 Stages

| Stage | Name | Agents | Key Tension |
|-------|------|--------|-------------|
| 1 | Problem Framing | Scoper, Expander, Stakeholder Mapper | Scoper vs Expander |
| 2 | Evidence Gathering | Archivist, Fieldworker, Quantifier, Skeptic | Fieldworker vs Quantifier |
| 3 | Analysis & Interpretation | Coder, Theorist, Contrarian, Connector, Narrator | Coder vs Theorist; Contrarian vs Narrator |
| 4 | Insight Synthesis | Strategist, Confidence Rater, Reframer | Strategist vs Confidence Rater |
| 5 | Communication | Executive Briefer, Detail Builder, Visualizer, Provocateur | Briefer vs Detail Builder |
| 6 | Prototype & Intervention | Solution Sketcher, Feasibility Checker, Experience Critic, Experiment Designer | Sketcher vs Feasibility Checker |

## How It Works

1. **Create a project** with a research question
2. **Run Stage 1** — agents analyze in parallel, then a conflict detector surfaces agreements and disagreements
3. **Review the Debate View** — see where agents agree (green) and disagree (red)
4. **Edit or override** — write your own synthesis or accept the agent outputs
5. **Approve & advance** — the approved output becomes context for the next stage
6. **Repeat through all 6 stages** — each stage builds on prior approved work

## Agent Management

- Toggle agents on/off per project
- Edit agent system prompts, temperature, perspective
- Create entirely new agents with custom roles
- Define conflict partnerships between agents

## 23 Default Agents

Each agent has a distinct perspective and system prompt tuned for its role. Agents with `conflict_partners` are designed to produce opposing viewpoints, forcing the human researcher to engage with multiple interpretations before advancing.
