"use client";

import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import type { Project, StageStatus } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PipelineCanvasProps {
  project: Project;
}

const STATUS_BADGE: Record<StageStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border",
  },
  running: {
    label: "Running",
    className: "bg-amber-100 text-amber-800 border-amber-200 animate-status-pulse",
  },
  complete: {
    label: "Complete",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  skipped: {
    label: "Skipped",
    className: "bg-muted text-muted-foreground/70 border-border",
  },
};

function StageStatusBadge({ status }: { status: StageStatus }) {
  const c = STATUS_BADGE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
        c.className
      )}
    >
      {c.label}
    </span>
  );
}

export function PipelineCanvas({ project }: PipelineCanvasProps) {
  const stages = [1, 2, 3, 4, 5, 6];

  function getStageStatus(stageNum: number): StageStatus {
    const result = project.stage_results.find((r) => r.stage_number === stageNum);
    return result?.status ?? "pending";
  }

  function getAgentCount(stageNum: number): number {
    const result = project.stage_results.find((r) => r.stage_number === stageNum);
    return result?.agent_outputs.length ?? 0;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Pipeline</h2>
          <span className="text-xs text-muted-foreground">
            Stage {project.current_stage} of 6
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
          {stages.map((stageNum, idx) => {
            const status = getStageStatus(stageNum);
            const agentCount = getAgentCount(stageNum);
            const isCurrent = stageNum === project.current_stage;
            const isApproved = status === "approved";
            const isComplete = status === "complete";

            return (
              <div key={stageNum} className="flex items-stretch flex-1 min-w-0">
                <Link
                  href={`/projects/${project.id}/stages/${stageNum}`}
                  className={cn(
                    "flex-1 min-w-[140px] rounded-lg border p-3 transition-all hover:bg-accent/40",
                    isCurrent
                      ? "border-primary/60 bg-primary/5 stage-glow"
                      : isApproved
                      ? "border-emerald-200 bg-emerald-50/60"
                      : isComplete
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-border bg-background hover:border-foreground/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      Stage {stageNum}
                    </span>
                    <StageStatusBadge status={status} />
                  </div>
                  <h3
                    className={cn(
                      "text-xs font-medium leading-tight mb-2",
                      isCurrent ? "text-foreground" : "text-foreground/80"
                    )}
                  >
                    {STAGE_NAMES[stageNum]}
                  </h3>
                  {agentCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="size-3" />
                      {agentCount} output{agentCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </Link>

                {idx < stages.length - 1 && (
                  <div className="flex items-center px-1.5 flex-shrink-0">
                    <ChevronRight className="size-4 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
