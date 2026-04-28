"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentOutput } from "@/lib/types";

interface AgentOutputCardProps {
  output: AgentOutput;
  isStreaming: boolean;
}

function StatusIndicator({ status, isStreaming }: { status: AgentOutput["status"]; isStreaming: boolean }) {
  if (status === "running" || isStreaming) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-amber-400 font-medium">Running</span>
      </div>
    );
  }
  if (status === "complete") {
    return (
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-xs text-emerald-400 font-medium">Complete</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5">
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-xs text-red-400 font-medium">Error</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full bg-zinc-700" />
      <span className="text-xs text-zinc-600 font-medium">Pending</span>
    </div>
  );
}

export function AgentOutputCard({ output, isStreaming }: AgentOutputCardProps) {
  return (
    <div
      className={`bg-zinc-950 rounded-xl border p-5 transition-all ${
        isStreaming
          ? "border-amber-700/50 ring-1 ring-amber-800/30"
          : output.status === "error"
          ? "border-red-800/50"
          : "border-zinc-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
              output.status === "error"
                ? "bg-red-600"
                : isStreaming
                ? "bg-amber-600"
                : "bg-indigo-600"
            }`}
          >
            {output.agent_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">{output.agent_name}</h3>
            <p className="text-[11px] text-zinc-600">Stage {output.stage}</p>
          </div>
        </div>
        <StatusIndicator status={output.status} isStreaming={isStreaming} />
      </div>

      {/* Content */}
      {output.content && (
        <div className="mt-3 text-sm text-zinc-400 leading-relaxed max-h-96 overflow-y-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => <h1 className="text-base font-bold text-zinc-200 mt-4 mb-2" {...props} />,
              h2: (props) => <h2 className="text-sm font-bold text-zinc-200 mt-3 mb-1.5" {...props} />,
              h3: (props) => <h3 className="text-sm font-semibold text-zinc-200 mt-2 mb-1" {...props} />,
              p: (props) => <p className="mb-2" {...props} />,
              ul: (props) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
              ol: (props) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
              li: (props) => <li className="text-zinc-400" {...props} />,
              strong: (props) => <strong className="font-semibold text-zinc-200" {...props} />,
              em: (props) => <em className="italic text-zinc-300" {...props} />,
              code: (props) => <code className="bg-zinc-900 px-1 py-0.5 rounded text-[12px] text-zinc-300" {...props} />,
              hr: () => <hr className="my-3 border-zinc-800" />,
              blockquote: (props) => <blockquote className="border-l-2 border-zinc-700 pl-3 text-zinc-500 italic my-2" {...props} />,
              a: (props) => <a className="text-indigo-400 underline hover:text-indigo-300" target="_blank" rel="noreferrer" {...props} />,
            }}
          >
            {output.content}
          </ReactMarkdown>
        </div>
      )}

      {/* Error */}
      {output.status === "error" && output.error && (
        <div className="mt-3 p-3 bg-red-950/50 border border-red-800/50 rounded-lg">
          <p className="text-xs font-medium text-red-400 mb-0.5">Error</p>
          <p className="text-xs text-red-400/80">{output.error}</p>
        </div>
      )}

      {/* Claims */}
      {output.claims && output.claims.length > 0 && (
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 mb-2">
            {output.claims.length} Claim{output.claims.length !== 1 ? "s" : ""} Extracted
          </p>
          <div className="space-y-2">
            {output.claims.map((claim, i) => (
              <div key={i} className="p-2.5 bg-zinc-900 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-400 leading-relaxed">{claim.text}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-zinc-600">
                    Confidence: {Math.round(claim.confidence * 100)}%
                  </span>
                  {claim.source && (
                    <span className="text-[10px] text-zinc-600">
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
