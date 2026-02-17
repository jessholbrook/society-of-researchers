"use client";

import type { AgentConfig } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";

interface AgentCardProps {
  agent: AgentConfig;
  onToggle: (id: string) => void;
  onEdit: (agent: AgentConfig) => void;
  onDelete: (id: string) => void;
}

export function AgentCard({ agent, onToggle, onEdit, onDelete }: AgentCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-4 transition-all ${
        agent.enabled ? "border-slate-200" : "border-slate-200 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {agent.name}
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
              Stage {agent.stage}: {STAGE_NAMES[agent.stage] || "Unknown"}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">{agent.role}</p>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(agent.id)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${
            agent.enabled ? "bg-indigo-600" : "bg-slate-300"
          }`}
          aria-label={agent.enabled ? "Disable agent" : "Enable agent"}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform shadow-sm ${
              agent.enabled ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Perspective */}
      {agent.perspective && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2 italic">
          &quot;{agent.perspective}&quot;
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Temp: {agent.temperature.toFixed(1)}
        </span>
        <span className="text-[10px] text-slate-400">{agent.model}</span>
      </div>

      {/* Conflict partners */}
      {agent.conflict_partners.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Conflict Partners
          </p>
          <div className="flex flex-wrap gap-1">
            {agent.conflict_partners.map((partner) => (
              <span
                key={partner}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onEdit(agent)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </button>
        <button
          onClick={() => onDelete(agent.id)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
