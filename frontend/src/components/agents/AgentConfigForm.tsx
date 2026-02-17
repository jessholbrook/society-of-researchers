"use client";

import { useState, useCallback } from "react";
import type { AgentConfig } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";

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

  const handleTogglePartner = useCallback(
    (agentId: string) => {
      setConflictPartners((prev) =>
        prev.includes(agentId)
          ? prev.filter((id) => id !== agentId)
          : [...prev, agentId]
      );
    },
    []
  );

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
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-slate-900">
          {agent && agent.id ? "Edit Agent" : "Create Agent"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="agent-name" className="block text-sm font-medium text-slate-700 mb-1">
          Name
        </label>
        <input
          id="agent-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Economic Analyst"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          required
        />
      </div>

      {/* Role */}
      <div>
        <label htmlFor="agent-role" className="block text-sm font-medium text-slate-700 mb-1">
          Role
        </label>
        <input
          id="agent-role"
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g., Analyzes economic impacts and trade-offs"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          required
        />
      </div>

      {/* Perspective */}
      <div>
        <label htmlFor="agent-perspective" className="block text-sm font-medium text-slate-700 mb-1">
          Perspective
        </label>
        <input
          id="agent-perspective"
          type="text"
          value={perspective}
          onChange={(e) => setPerspective(e.target.value)}
          placeholder="e.g., Market-driven, cost-benefit focused"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* System Prompt */}
      <div>
        <label htmlFor="agent-prompt" className="block text-sm font-medium text-slate-700 mb-1">
          System Prompt
        </label>
        <textarea
          id="agent-prompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Instructions for the agent's behavior and output format..."
          rows={8}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y font-mono leading-relaxed"
        />
      </div>

      {/* Temperature */}
      <div>
        <label htmlFor="agent-temp" className="block text-sm font-medium text-slate-700 mb-1">
          Temperature: <span className="font-normal text-indigo-600">{temperature.toFixed(1)}</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">0.0</span>
          <input
            id="agent-temp"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
          />
          <span className="text-xs text-slate-400">1.0</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Lower = more focused, higher = more creative
        </p>
      </div>

      {/* Stage */}
      <div>
        <label htmlFor="agent-stage" className="block text-sm font-medium text-slate-700 mb-1">
          Stage
        </label>
        <select
          id="agent-stage"
          value={stage}
          onChange={(e) => setStage(Number(e.target.value))}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        >
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              Stage {s}: {STAGE_NAMES[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Conflict Partners */}
      {otherAgents.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Conflict Partners
          </label>
          <p className="text-xs text-slate-400 mb-2">
            Select agents whose outputs should be compared for conflicts with this agent.
          </p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2.5">
            {otherAgents.map((other) => (
              <label
                key={other.id}
                className="flex items-center gap-2.5 p-1.5 rounded hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={conflictPartners.includes(other.id)}
                  onChange={() => handleTogglePartner(other.id)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-slate-700">
                    {other.name}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-2">
                    Stage {other.stage}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
        <button
          type="submit"
          disabled={saving || !name.trim() || !role.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {saving ? "Saving..." : agent && agent.id ? "Update Agent" : "Create Agent"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
