"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { AgentConfig } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentConfigForm } from "@/components/agents/AgentConfigForm";

export default function AgentsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [addingToStage, setAddingToStage] = useState<number | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await api.listAgents({ project_id: projectId });
      setAgents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleToggle = useCallback(
    async (agentId: string) => {
      try {
        const result = await api.toggleAgent(agentId);
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId ? { ...a, enabled: result.enabled } : a
          )
        );
      } catch (err: any) {
        setError(err.message);
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (agentId: string) => {
      if (!confirm("Are you sure you want to delete this agent?")) return;
      try {
        await api.deleteAgent(agentId);
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
      } catch (err: any) {
        setError(err.message);
      }
    },
    []
  );

  const handleEdit = useCallback((agent: AgentConfig) => {
    setEditingAgent(agent);
    setIsCreating(false);
    setAddingToStage(null);
  }, []);

  const handleCreate = useCallback((stage: number) => {
    setAddingToStage(stage);
    setIsCreating(true);
    setEditingAgent(null);
  }, []);

  const handleSave = useCallback(
    async (data: Partial<AgentConfig>) => {
      try {
        if (editingAgent) {
          await api.updateAgent(editingAgent.id, data);
        } else {
          await api.createAgent({ ...data, project_id: projectId });
        }
        setEditingAgent(null);
        setIsCreating(false);
        setAddingToStage(null);
        await fetchAgents();
      } catch (err: any) {
        setError(err.message);
      }
    },
    [editingAgent, projectId, fetchAgents]
  );

  const handleCancel = useCallback(() => {
    setEditingAgent(null);
    setIsCreating(false);
    setAddingToStage(null);
  }, []);

  // Group agents by stage
  const stages = [1, 2, 3, 4, 5, 6];
  const agentsByStage: Record<number, AgentConfig[]> = {};
  stages.forEach((s) => {
    agentsByStage[s] = agents.filter((a) => a.stage === s);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading agents...</span>
      </div>
    );
  }

  // Show form in a modal overlay
  const showForm = isCreating || editingAgent !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Agent Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure research agents for each pipeline stage.
          </p>
        </div>
        <span className="text-sm text-slate-400">
          {agents.length} agent{agents.length !== 1 ? "s" : ""} total
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stages */}
      {stages.map((stageNum) => (
        <div key={stageNum} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                {stageNum}
              </span>
              <h3 className="text-sm font-semibold text-slate-800">
                {STAGE_NAMES[stageNum]}
              </h3>
              <span className="text-xs text-slate-400">
                {agentsByStage[stageNum].length} agent
                {agentsByStage[stageNum].length !== 1 ? "s" : ""}
              </span>
            </div>
            <button
              onClick={() => handleCreate(stageNum)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-indigo-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Agent
            </button>
          </div>

          {agentsByStage[stageNum].length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No agents configured for this stage.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agentsByStage[stageNum].map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Form modal overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleCancel}
          />
          {/* Modal */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mx-4">
            <AgentConfigForm
              agent={
                editingAgent
                  ? editingAgent
                  : addingToStage
                  ? ({
                      id: "",
                      name: "",
                      role: "",
                      perspective: "",
                      system_prompt: "",
                      stage: addingToStage,
                      temperature: 0.7,
                      model: "gpt-4",
                      conflict_partners: [],
                      enabled: true,
                      project_id: projectId,
                    } as AgentConfig)
                  : null
              }
              availableAgents={agents}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}
