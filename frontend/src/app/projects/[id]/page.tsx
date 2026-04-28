"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  CircleDot,
  FileText,
  Loader2,
  Pencil,
  Play,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Project, StageResult, StageStatus } from "@/lib/types";
import { STAGE_DESCRIPTIONS, STAGE_NAMES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_PILL: Record<
  StageStatus,
  { label: string; icon: React.ReactNode; bg: string; iconBg: string }
> = {
  pending: {
    label: "Pending",
    icon: <CircleDot className="size-4" />,
    bg: "text-muted-foreground",
    iconBg: "bg-muted text-muted-foreground/70",
  },
  running: {
    label: "Running",
    icon: <Loader2 className="size-4 animate-spin" />,
    bg: "text-amber-800",
    iconBg: "bg-amber-100 text-amber-700",
  },
  complete: {
    label: "Complete",
    icon: <Play className="size-4" />,
    bg: "text-blue-800",
    iconBg: "bg-blue-100 text-blue-700",
  },
  approved: {
    label: "Approved",
    icon: <Check className="size-4" />,
    bg: "text-emerald-800",
    iconBg: "bg-emerald-100 text-emerald-700",
  },
  skipped: {
    label: "Skipped",
    icon: <CircleDot className="size-4" />,
    bg: "text-muted-foreground",
    iconBg: "bg-muted text-muted-foreground/70",
  },
};

function StageRow({
  projectId,
  stageNum,
  result,
}: {
  projectId: string;
  stageNum: number;
  result: StageResult | undefined;
}) {
  const status: StageStatus = result?.status ?? "pending";
  const meta = STATUS_PILL[status];
  const outputs = result?.agent_outputs?.length ?? 0;
  const completedOutputs =
    result?.agent_outputs?.filter((o) => o.status === "complete").length ?? 0;
  const synthesis = result?.conflict_report?.synthesis;
  const agreements = result?.conflict_report?.agreements?.length ?? 0;
  const disagreements = result?.conflict_report?.disagreements?.length ?? 0;

  return (
    <Link
      href={`/projects/${projectId}/stages/${stageNum}`}
      className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/40 transition-colors"
    >
      <div
        className={cn(
          "size-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          meta.iconBg
        )}
      >
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">
            Stage {stageNum}: {STAGE_NAMES[stageNum]}
          </p>
          <span className={cn("text-[10px] font-bold uppercase tracking-wider", meta.bg)}>
            {meta.label}
          </span>
          {result?.human_override && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800">
              <Pencil className="size-3" />
              Edited
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {STAGE_DESCRIPTIONS[stageNum]}
        </p>
        {(outputs > 0 || agreements > 0 || disagreements > 0) && (
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
            {outputs > 0 && (
              <span>
                {completedOutputs}/{outputs} agent output
                {outputs !== 1 ? "s" : ""}
              </span>
            )}
            {agreements > 0 && (
              <span className="text-emerald-700">
                {agreements} agreement{agreements !== 1 ? "s" : ""}
              </span>
            )}
            {disagreements > 0 && (
              <span className="text-destructive/80">
                {disagreements} tension{disagreements !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
        {synthesis && (
          <p className="text-xs text-foreground/80 mt-2 line-clamp-3 leading-relaxed">
            {synthesis}
          </p>
        )}
      </div>
      <ChevronRight className="size-4 text-muted-foreground flex-shrink-0 mt-2" />
    </Link>
  );
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getProject(projectId)
      .then(setProject)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const resultsByStage = new Map(
    project.stage_results.map((r) => [r.stage_number, r])
  );
  const approvedCount = project.stage_results.filter(
    (r) => r.status === "approved"
  ).length;

  return (
    <div className="space-y-6">
      {project.state === "complete" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div>
              <h2 className="text-base font-semibold mb-1">Research Complete</h2>
              <p className="text-sm text-muted-foreground">
                All 6 stages have been approved. View your final research report.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href={`/projects/${project.id}/report`}>
                <FileText />
                View Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {project.context && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Research Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {project.context}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Stage Activity</CardTitle>
          <CardDescription>
            {approvedCount} of 6 stages approved · click any stage to view details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((stageNum) => (
            <StageRow
              key={stageNum}
              projectId={project.id}
              stageNum={stageNum}
              result={resultsByStage.get(stageNum)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
