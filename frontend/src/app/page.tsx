"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, FolderPlus, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { Project, ProjectState } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATE_BADGE: Record<
  ProjectState,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground border-border",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  complete: {
    label: "Complete",
    className:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

function StatusBadge({ state }: { state: ProjectState }) {
  const { label, className } = STATE_BADGE[state];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your multi-agent research projects
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/projects/new">
            <Plus />
            New Project
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span className="ml-3 text-sm">Loading projects…</span>
        </div>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/10 mb-6">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && projects.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center py-16">
            <FolderPlus className="size-10 text-muted-foreground mb-4" />
            <h3 className="text-base font-medium mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create your first research project to get started.
            </p>
            <Button asChild>
              <Link href="/projects/new">
                <Plus />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group focus-visible:outline-none"
            >
              <Card className="h-full transition-colors hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <StatusBadge state={project.state} />
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.research_question}
                  </CardDescription>
                </CardHeader>
                <CardContent />
                <CardFooter className="justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <ChevronRight className="size-3.5" />
                    Stage {project.current_stage}:{" "}
                    {STAGE_NAMES[project.current_stage] || "Unknown"}
                  </span>
                  <span>
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
