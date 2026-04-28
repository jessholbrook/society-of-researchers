"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { AgentConfig } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AgentConfigFormProps {
  agent: AgentConfig | null;
  availableAgents: AgentConfig[];
  onSave: (data: Partial<AgentConfig>) => void;
  onCancel: () => void;
}

export function AgentConfigForm({
  agent,
  availableAgents,
  onSave,
  onCancel,
}: AgentConfigFormProps) {
  const [name, setName] = useState(agent?.name || "");
  const [role, setRole] = useState(agent?.role || "");
  const [perspective, setPerspective] = useState(agent?.perspective || "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt || "");
  const [temperature, setTemperature] = useState(agent?.temperature ?? 0.7);
  const [stage, setStage] = useState(agent?.stage ?? 1);
  const [conflictPartners, setConflictPartners] = useState<string[]>(
    agent?.conflict_partners || []
  );
  const [saving, setSaving] = useState(false);

  const otherAgents = availableAgents.filter((a) => a.id !== agent?.id);
  const isEditing = Boolean(agent && agent.id);

  const handleTogglePartner = useCallback((agentId: string) => {
    setConflictPartners((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || !role.trim()) return;
      setSaving(true);
      try {
        await onSave({
          name: name.trim(),
          role: role.trim(),
          perspective: perspective.trim(),
          system_prompt: systemPrompt.trim(),
          temperature,
          stage,
          conflict_partners: conflictPartners,
        });
      } finally {
        setSaving(false);
      }
    },
    [name, role, perspective, systemPrompt, temperature, stage, conflictPartners, onSave]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Agent" : "Create Agent"}</DialogTitle>
        <DialogDescription>
          Configure the persona, prompt, and conflict partners for this research agent.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="agent-name">Name</Label>
        <Input
          id="agent-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Economic Analyst"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-role">Role</Label>
        <Input
          id="agent-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Analyzes economic impacts and trade-offs"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-perspective">Perspective</Label>
        <Input
          id="agent-perspective"
          value={perspective}
          onChange={(e) => setPerspective(e.target.value)}
          placeholder="e.g., Market-driven, cost-benefit focused"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-prompt">System Prompt</Label>
        <Textarea
          id="agent-prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Instructions for the agent's behavior and output format…"
          rows={8}
          className="font-mono leading-relaxed"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-temp" className="flex items-baseline gap-1.5">
          Temperature:
          <span className="font-normal text-primary">{temperature.toFixed(1)}</span>
        </Label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">0.0</span>
          <input
            id="agent-temp"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="text-xs text-muted-foreground">1.0</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Lower = more focused, higher = more creative
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agent-stage">Stage</Label>
        <select
          id="agent-stage"
          value={stage}
          onChange={(e) => setStage(Number(e.target.value))}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              Stage {s}: {STAGE_NAMES[s]}
            </option>
          ))}
        </select>
      </div>

      {otherAgents.length > 0 && (
        <div className="space-y-2">
          <Label>Conflict Partners</Label>
          <p className="text-xs text-muted-foreground">
            Select agents whose outputs should be compared for conflicts with this agent.
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto border border-input rounded-md p-2">
            {otherAgents.map((other) => (
              <label
                key={other.id}
                className="flex items-center gap-2.5 p-1.5 rounded hover:bg-accent/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={conflictPartners.includes(other.id)}
                  onChange={() => handleTogglePartner(other.id)}
                  className="size-3.5 rounded border-input accent-primary"
                />
                <div className="flex-1 min-w-0 flex items-baseline gap-2">
                  <span className="text-xs font-medium truncate">{other.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    Stage {other.stage}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={saving || !name.trim() || !role.trim()}
        >
          {saving && <Loader2 className="animate-spin" />}
          {saving ? "Saving…" : isEditing ? "Update Agent" : "Create Agent"}
        </Button>
      </DialogFooter>
    </form>
  );
}
