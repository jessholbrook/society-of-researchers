import type { Project, StageResult, AgentConfig } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  // Projects
  listProjects: () => apiFetch<Project[]>("/api/projects"),
  getProject: (id: string) => apiFetch<Project>(`/api/projects/${id}`),
  createProject: (data: { name: string; research_question: string; context?: string }) =>
    apiFetch<Project>("/api/projects", { method: "POST", body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),

  // Stages
  getStageResult: (projectId: string, stageNum: number) =>
    apiFetch<StageResult | null>(`/api/projects/${projectId}/stages/${stageNum}`),
  approveStage: (projectId: string, stageNum: number) =>
    apiFetch<{ ok: boolean; next_stage?: number; complete?: boolean }>(`/api/projects/${projectId}/stages/${stageNum}/approve`, { method: "POST" }),
  generateReport: async (projectId: string): Promise<{ ok: boolean; report: string }> => {
    // Call backend directly to avoid Next.js proxy timeout on long LLM calls
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(300_000), // 5 minute timeout
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API error ${res.status}: ${body}`);
    }
    return res.json();
  },
  saveOverride: (projectId: string, stageNum: number, content: string, notes?: string) =>
    apiFetch<{ ok: boolean }>(`/api/projects/${projectId}/stages/${stageNum}/override`, {
      method: "PUT",
      body: JSON.stringify({ content, notes: notes || "" }),
    }),

  // Agents
  listAgents: (params?: { stage?: number; project_id?: string }) => {
    const qs = new URLSearchParams();
    if (params?.stage !== undefined) qs.set("stage", String(params.stage));
    if (params?.project_id) qs.set("project_id", params.project_id);
    return apiFetch<AgentConfig[]>(`/api/agents?${qs}`);
  },
  getAgent: (id: string) => apiFetch<AgentConfig>(`/api/agents/${id}`),
  createAgent: (data: Partial<AgentConfig>) =>
    apiFetch<AgentConfig>("/api/agents", { method: "POST", body: JSON.stringify(data) }),
  updateAgent: (id: string, data: Partial<AgentConfig>) =>
    apiFetch<{ ok: boolean }>(`/api/agents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAgent: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/agents/${id}`, { method: "DELETE" }),
  toggleAgent: (id: string) =>
    apiFetch<{ ok: boolean; enabled: boolean }>(`/api/agents/${id}/toggle`, { method: "POST" }),
};
