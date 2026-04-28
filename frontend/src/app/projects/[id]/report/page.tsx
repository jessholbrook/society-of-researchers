"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProject(projectId)
      .then(setProject)
      .catch((err) => setError(err.message));
  }, [projectId]);

  const generateReport = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generateReport(projectId);
      setReport(result.report);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to generate report";
      setError(message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  const totalAgents =
    project?.stage_results.reduce(
      (sum, sr) => sum + (sr.agent_outputs?.length ?? 0),
      0
    ) ?? 0;
  const approvedStages =
    project?.stage_results.filter((sr) => sr.status === "approved").length ?? 0;
  const totalAgreements =
    project?.stage_results.reduce((sum, sr) => {
      const cr = sr.conflict_report;
      return cr ? sum + (cr.agreements?.length ?? 0) : sum;
    }, 0) ?? 0;
  const totalDisagreements =
    project?.stage_results.reduce((sum, sr) => {
      const cr = sr.conflict_report;
      return cr ? sum + (cr.disagreements?.length ?? 0) : sum;
    }, 0) ?? 0;

  const stats = [
    { label: "Stages", value: `${approvedStages}/6`, sub: "approved" },
    { label: "Agents", value: String(totalAgents), sub: "total outputs" },
    { label: "Agreements", value: String(totalAgreements), sub: "across stages" },
    { label: "Tensions", value: String(totalDisagreements), sub: "identified" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden">
        <CardContent className="space-y-6 py-6 lg:py-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wide">
                  <FileText className="size-3.5" />
                  Final Report
                </span>
                {project?.state === "complete" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
                    <Check className="size-3" />
                    Complete
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-semibold mb-2 leading-tight tracking-tight">
                {project?.name || "Research Report"}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                {project?.research_question}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push(`/projects/${projectId}`)}
              >
                <ArrowLeft />
                Project
              </Button>
              {report && (
                <Button onClick={generateReport} disabled={generating} size="lg">
                  {generating ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <RefreshCw />
                  )}
                  Regenerate
                </Button>
              )}
            </div>
          </div>

          {project && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((stat) => (
                <Card key={stat.label} className="bg-background/60 backdrop-blur-sm">
                  <CardContent className="py-3">
                    <p className="text-2xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground/70">
                        {stat.label}
                      </span>{" "}
                      {stat.sub}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {project && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const sr = project.stage_results.find((s) => s.stage_number === num);
            const agentCount = sr?.agent_outputs?.length ?? 0;
            const isApproved = sr?.status === "approved";
            const hasOverride = !!sr?.human_override;
            return (
              <button
                key={num}
                onClick={() => router.push(`/projects/${projectId}/stages/${num}`)}
                className={cn(
                  "group relative text-left p-3 rounded-xl border transition-all hover:bg-accent/40",
                  isApproved
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-border bg-background hover:border-foreground/20"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isApproved ? "text-emerald-700" : "text-muted-foreground"
                    )}
                  >
                    Stage {num}
                  </span>
                  {isApproved && (
                    <Check className="size-3.5 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs font-semibold truncate leading-tight">
                  {STAGE_NAMES[num]}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                  <span>
                    {agentCount} output{agentCount !== 1 ? "s" : ""}
                  </span>
                  {hasOverride && (
                    <span className="text-amber-700 font-medium">+ edited</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="flex items-start gap-3 py-4">
            <CircleAlert className="size-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Report generation failed
              </p>
              <p className="text-sm text-destructive/80 mt-0.5">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {(loading || generating) && !report && (
        <Card>
          <CardContent className="text-center py-16">
            <div className="relative size-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-3 rounded-full bg-background flex items-center justify-center">
                <FileText className="size-5 text-primary" />
              </div>
            </div>
            <p className="text-base font-semibold mb-1">
              Generating Research Report
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Synthesizing findings from {totalAgents} agent outputs across all 6
              stages…
            </p>
            <div className="flex justify-center gap-1 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <Card className="overflow-hidden p-0">
          <div className="px-6 lg:px-10 pt-8 pb-6 border-b">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium">Society of Researchers</span>
              <span className="size-1 rounded-full bg-muted-foreground/40" />
              <span>Multi-Agent Research Report</span>
              <span className="size-1 rounded-full bg-muted-foreground/40" />
              <span>
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="px-6 lg:px-10 py-10">
            <div
              className="report-content"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(report) }}
            />
          </div>

          <div className="px-6 lg:px-10 py-5 border-t bg-muted/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Generated from {approvedStages} stages, {totalAgents} agent outputs,{" "}
                {totalAgreements} agreements, {totalDisagreements} tensions
              </span>
              <button
                onClick={generateReport}
                disabled={generating}
                className="inline-flex items-center gap-1.5 text-primary hover:opacity-80 font-medium transition-opacity disabled:opacity-50"
              >
                <RefreshCw className="size-3.5" />
                Regenerate report
              </button>
            </div>
          </div>
        </Card>
      )}

      <style jsx global>{`
        .report-content {
          max-width: 72ch;
        }

        .report-content h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--foreground);
          margin-top: 3rem;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        .report-content h1:first-child {
          margin-top: 0;
        }

        .report-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--foreground);
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid color-mix(in oklab, var(--border) 60%, transparent);
          line-height: 1.3;
          letter-spacing: -0.005em;
        }

        .report-content h3 {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--foreground);
          margin-top: 2rem;
          margin-bottom: 0.6rem;
          line-height: 1.4;
        }

        .report-content p {
          font-size: 0.925rem;
          color: var(--muted-foreground);
          line-height: 1.8;
          margin-bottom: 1.15rem;
        }

        .report-content strong {
          color: var(--foreground);
          font-weight: 600;
        }

        .report-content em {
          color: color-mix(in oklab, var(--muted-foreground) 80%, transparent);
          font-style: italic;
        }

        .report-content ul,
        .report-content ol {
          margin-top: 0.5rem;
          margin-bottom: 1.5rem;
          padding-left: 1.25rem;
        }

        .report-content ul {
          list-style: none;
          padding-left: 0;
        }

        .report-content ul > li {
          position: relative;
          padding-left: 1.25rem;
        }

        .report-content ul > li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.65em;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
        }

        .report-content ol {
          list-style: decimal;
          padding-left: 1.5rem;
        }

        .report-content ol > li {
          padding-left: 0.35rem;
        }

        .report-content ol > li::marker {
          color: var(--primary);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .report-content li {
          font-size: 0.925rem;
          color: var(--muted-foreground);
          line-height: 1.75;
          margin-bottom: 0.5rem;
        }

        .report-content li strong {
          color: var(--foreground);
        }

        .report-content hr {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--border), transparent);
          margin: 2.5rem 0;
        }

        .report-content a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid color-mix(in oklab, var(--primary) 40%, transparent);
          transition: border-color 0.15s;
        }
        .report-content a:hover {
          border-bottom-color: var(--primary);
        }

        .report-content blockquote {
          border-left: 3px solid var(--primary);
          background: var(--muted);
          padding: 0.75rem 1.25rem;
          margin: 1.25rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .report-content blockquote p {
          color: var(--muted-foreground);
          font-style: italic;
          margin-bottom: 0;
        }

        .report-content code {
          background: var(--muted);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.85em;
          color: var(--foreground);
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        }
      `}</style>
    </div>
  );
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeList();
      html.push("<hr />");
      continue;
    }

    const headerMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headerMatch) {
      closeList();
      const level = headerMatch[1].length;
      html.push(`<h${level}>${inlineFormat(headerMatch[2])}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      closeList();
      html.push(`<blockquote><p>${inlineFormat(trimmed.slice(2))}</p></blockquote>`);
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inlineFormat(trimmed.slice(2))}</li>`);
      continue;
    }

    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inlineFormat(numMatch[1])}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineFormat(trimmed)}</p>`);
  }

  closeList();
  return html.join("\n");
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}
