"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { AgentConfig } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { AgentCard } from "@/components/agents/AgentCard";
import { AgentConfigForm } from "@/components/agents/AgentConfigForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load agents";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleToggle = useCallback(async (agentId: string) => {
    try {
      const result = await api.toggleAgent(agentId);
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, enabled: result.enabled } : a))
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to toggle agent";
      setError(message);
    }
  }, []);

  const handleDelete = useCallback(async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;
    try {
      await api.deleteAgent(agentId);
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete agent";
      setError(message);
    }
  }, []);

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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save agent";
        setError(message);
      }
    },
    [editingAgent, projectId, fetchAgents]
  );

  const handleCancel = useCallback(() => {
    setEditingAgent(null);
    setIsCreating(false);
    setAddingToStage(null);
  }, []);

  const stages = [1, 2, 3, 4, 5, 6];
  const agentsByStage: Record<number, AgentConfig[]> = {};
  stages.forEach((s) => {
    agentsByStage[s] = agents.filter((a) => a.stage === s);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="ml-3 text-sm">Loading agents…</span>
      </div>
    );
  }

  const showForm = isCreating || editingAgent !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Agent Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure research agents for each pipeline stage.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {agents.length} agent{agents.length !== 1 ? "s" : ""} total
        </span>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {stages.map((stageNum) => (
        <Card key={stageNum}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary/15 text-primary text-xs font-bold">
                  {stageNum}
                </span>
                <CardTitle className="text-sm">{STAGE_NAMES[stageNum]}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {agentsByStage[stageNum].length} agent
                  {agentsByStage[stageNum].length !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCreate(stageNum)}
              >
                <Plus />
                Add Agent
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {agentsByStage[stageNum].length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
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
          </CardContent>
        </Card>
      ))}

      <Dialog open={showForm} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
