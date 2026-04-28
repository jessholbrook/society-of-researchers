"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [context, setContext] = useState("");
  const [folder, setFolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !researchQuestion.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const project = await api.createProject({
        name: name.trim(),
        research_question: researchQuestion.trim(),
        context: context.trim() || undefined,
        folder: folder.trim() || undefined,
      });
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      setError(message);
      setSubmitting(false);
    }
  }

  const canSubmit = !submitting && name.trim() && researchQuestion.trim();

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
        <Link
          href="/"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">New Project</span>
      </nav>

      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        Create New Project
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Define your research question and provide context for the agent pipeline.
      </p>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10 mb-6">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Climate Impact on Urban Agriculture"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="research_question">Research Question</Label>
          <Textarea
            id="research_question"
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
            placeholder="What specific question should the research agents investigate?"
            rows={4}
            required
          />
          <p className="text-xs text-muted-foreground">
            Be specific. A focused question produces better research outputs.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="folder" className="flex items-baseline gap-1.5">
            Folder
            <span className="font-normal text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="e.g., Climate Research, Economics"
          />
          <p className="text-xs text-muted-foreground">
            Group this project in a sidebar folder.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="context" className="flex items-baseline gap-1.5">
            Additional Context
            <span className="font-normal text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Provide background information, constraints, specific domains to focus on, or any other relevant context..."
            rows={5}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" size="lg" disabled={!canSubmit}>
            {submitting && <Loader2 className="animate-spin" />}
            {submitting ? "Creating…" : "Create Project"}
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
