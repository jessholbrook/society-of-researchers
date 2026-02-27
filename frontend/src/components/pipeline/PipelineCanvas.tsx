"use client";

import Link from "next/link";
import type { Project, StageStatus } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";

interface PipelineCanvasProps {
  project: Project;
}

function StageStatusBadge({ status }: { status: StageStatus }) {
  const config: Record<StageStatus, { label: string; className: string }> = {
    pending: {
      label: "Pending",
      className: "bg-zinc-800 text-zinc-500",
    },
    running: {
      label: "Running",
      className: "bg-amber-950/60 text-amber-400 animate-status-pulse",
    },
    complete: {
      label: "Complete",
      className: "bg-blue-950/60 text-blue-400",
    },
    approved: {
      label: "Approved",
      className: "bg-emerald-950/60 text-emerald-400",
    },
    skipped: {
      label: "Skipped",
      className: "bg-zinc-800 text-zinc-600",
    },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

export function PipelineCanvas({ project }: PipelineCanvasProps) {
  const stages = [1, 2, 3, 4, 5, 6];

  function getStageStatus(stageNum: number): StageStatus {
    const result = project.stage_results.find((r) => r.stage_number === stageNum);
    if (result) return result.status;
    return "pending";
  }

  function getAgentCount(stageNum: number): number {
    const result = project.stage_results.find((r) => r.stage_number === stageNum);
    return result?.agent_outputs.length ?? 0;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-zinc-300">Pipeline</h2>
        <span className="text-xs text-zinc-600">
          Stage {project.current_stage} of 6
        </span>
      </div>
      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
        {stages.map((stageNum, idx) => {
          const status = getStageStatus(stageNum);
          const agentCount = getAgentCount(stageNum);
          const isCurrent = stageNum === project.current_stage;

          return (
            <div key={stageNum} className="flex items-stretch flex-1 min-w-0">
              {/* Stage card */}
              <Link
                href={`/projects/${project.id}/stages/${stageNum}`}
                className={`flex-1 min-w-[140px] rounded-lg border p-3 transition-all hover:bg-zinc-800/80 ${
                  isCurrent
                    ? "border-indigo-500/50 bg-indigo-950/30 stage-glow"
                    : status === "approved"
                    ? "border-emerald-800/40 bg-emerald-950/20"
                    : status === "complete"
                    ? "border-blue-800/40 bg-blue-950/20"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isCurrent ? "text-indigo-400" : "text-zinc-600"
                    }`}
                  >
                    Stage {stageNum}
                  </span>
                  <StageStatusBadge status={status} />
                </div>
                <h3
                  className={`text-xs font-medium leading-tight mb-2 ${
                    isCurrent ? "text-indigo-200" : "text-zinc-400"
                  }`}
                >
                  {STAGE_NAMES[stageNum]}
                </h3>
                {agentCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {agentCount} output{agentCount !== 1 ? "s" : ""}
                  </div>
                )}
              </Link>

              {/* Connector arrow */}
              {idx < stages.length - 1 && (
                <div className="flex items-center px-1.5 flex-shrink-0">
                  <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
