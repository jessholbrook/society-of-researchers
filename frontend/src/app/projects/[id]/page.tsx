"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Check, ChevronRight, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  const approvedStages = project.stage_results.filter(
    (r) => r.status === "approved"
  );

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

      {approvedStages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completed Stages</CardTitle>
            <CardDescription>
              {approvedStages.length} of 6 stages approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvedStages
              .sort((a, b) => a.stage_number - b.stage_number)
              .map((result) => (
                <Link
                  key={result.id}
                  href={`/projects/${project.id}/stages/${result.stage_number}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-foreground/20 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Stage {result.stage_number}: {STAGE_NAMES[result.stage_number]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.agent_outputs.length} outputs
                        {result.human_override ? " · override" : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
