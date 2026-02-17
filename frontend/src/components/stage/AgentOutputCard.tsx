"use client";

import type { AgentOutput } from "@/lib/types";

interface AgentOutputCardProps {
  output: AgentOutput;
  isStreaming: boolean;
}

function StatusIndicator({ status, isStreaming }: { status: AgentOutput["status"]; isStreaming: boolean }) {
  if (status === "running" || isStreaming) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-amber-600 font-medium">Running</span>
      </div>
    );
  }
  if (status === "complete") {
    return (
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-xs text-green-600 font-medium">Complete</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-xs text-red-600 font-medium">Error</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full bg-slate-300" />
      <span className="text-xs text-slate-400 font-medium">Pending</span>
    </div>
  );
}

export function AgentOutputCard({ output, isStreaming }: AgentOutputCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border p-5 transition-all ${
        isStreaming
          ? "border-amber-300 shadow-sm ring-1 ring-amber-100"
          : output.status === "error"
          ? "border-red-200"
          : output.status === "complete"
          ? "border-slate-200"
          : "border-slate-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
              output.status === "error"
                ? "bg-red-400"
                : isStreaming
                ? "bg-amber-500"
                : "bg-indigo-500"
            }`}
          >
            {output.agent_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{output.agent_name}</h3>
            <p className="text-[11px] text-slate-400">Stage {output.stage}</p>
          </div>
        </div>
        <StatusIndicator status={output.status} isStreaming={isStreaming} />
      </div>

      {/* Content */}
      {output.content && (
        <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
          {output.content}
        </div>
      )}

      {/* Error */}
      {output.status === "error" && output.error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs font-medium text-red-700 mb-0.5">Error</p>
          <p className="text-xs text-red-600">{output.error}</p>
        </div>
      )}

      {/* Claims */}
      {output.claims && output.claims.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-2">
            {output.claims.length} Claim{output.claims.length !== 1 ? "s" : ""} Extracted
          </p>
          <div className="space-y-2">
            {output.claims.map((claim, i) => (
              <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-700 leading-relaxed">{claim.text}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-slate-400">
                    Confidence: {Math.round(claim.confidence * 100)}%
                  </span>
                  {claim.source && (
                    <span className="text-[10px] text-slate-400">
                      Source: {claim.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
