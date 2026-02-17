"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";

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
    api.getProject(projectId).then(setProject).catch((err) => setError(err.message));
  }, [projectId]);

  const generateReport = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const result = await api.generateReport(projectId);
      setReport(result.report);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    generateReport();
  }, [generateReport]);

  // Stats from project
  const totalAgents = project?.stage_results.reduce(
    (sum, sr) => sum + (sr.agent_outputs?.length ?? 0), 0
  ) ?? 0;
  const approvedStages = project?.stage_results.filter(
    (sr) => sr.status === "approved"
  ).length ?? 0;
  const totalAgreements = project?.stage_results.reduce((sum, sr) => {
    const cr = sr.conflict_report;
    if (!cr) return sum;
    const agreements = (cr as any).agreements ?? [];
    return sum + agreements.length;
  }, 0) ?? 0;
  const totalDisagreements = project?.stage_results.reduce((sum, sr) => {
    const cr = sr.conflict_report;
    if (!cr) return sum;
    const disagreements = (cr as any).disagreements ?? [];
    return sum + disagreements.length;
  }, 0) ?? 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold tracking-wide uppercase">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Final Report
                </div>
                {project?.state === "complete" && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-semibold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Complete
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2 leading-tight">
                {project?.name || "Research Report"}
              </h1>
              <p className="text-indigo-200 text-sm leading-relaxed max-w-2xl">
                {project?.research_question}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-6">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white/10 backdrop-blur-sm text-white/90 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Project
              </button>
              {report && (
                <button
                  onClick={generateReport}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {generating ? (
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Regenerate
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          {project && (
            <div className="grid grid-cols-4 gap-3 mt-6">
              {[
                { label: "Stages", value: `${approvedStages}/6`, sub: "approved" },
                { label: "Agents", value: String(totalAgents), sub: "total outputs" },
                { label: "Agreements", value: String(totalAgreements), sub: "across stages" },
                { label: "Tensions", value: String(totalDisagreements), sub: "identified" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] text-indigo-200 mt-0.5">
                    <span className="font-medium text-white/80">{stat.label}</span> {stat.sub}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline stages — compact horizontal */}
      {project && (
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const sr = project.stage_results.find((s) => s.stage_number === num);
            const agentCount = sr?.agent_outputs?.length ?? 0;
            const isApproved = sr?.status === "approved";
            const hasOverride = !!sr?.human_override;
            return (
              <button
                key={num}
                onClick={() => router.push(`/projects/${projectId}/stages/${num}`)}
                className={`group relative text-left p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                  isApproved
                    ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isApproved ? "text-emerald-600" : "text-slate-400"
                  }`}>
                    Stage {num}
                  </span>
                  {isApproved && (
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  {STAGE_NAMES[num]}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400">
                    {agentCount} output{agentCount !== 1 ? "s" : ""}
                  </span>
                  {hasOverride && (
                    <span className="text-[10px] text-amber-500 font-medium">+ edited</span>
                  )}
                </div>
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-transparent to-slate-50/50 pointer-events-none" />
              </button>
            );
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">Report generation failed</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading / Generating */}
      {(loading || generating) && !report && (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full bg-indigo-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <p className="text-base font-semibold text-slate-800 mb-1">Generating Research Report</p>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Synthesizing findings from {totalAgents} agent outputs across all 6 stages...
          </p>
          <div className="flex justify-center gap-1 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Report content */}
      {report && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Report inner header */}
          <div className="px-10 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="font-medium">Society of Researchers</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Multi-Agent Research Report</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
          </div>

          {/* Report body */}
          <div className="px-10 py-10">
            <div
              className="report-content"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(report) }}
            />
          </div>

          {/* Report footer */}
          <div className="px-10 py-5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Generated from {approvedStages} stages, {totalAgents} agent outputs,{" "}
                {totalAgreements} agreements, {totalDisagreements} tensions
              </span>
              <button
                onClick={generateReport}
                disabled={generating}
                className="inline-flex items-center gap-1.5 text-indigo-500 hover:text-indigo-700 font-medium transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report styles */}
      <style jsx global>{`
        .report-content {
          max-width: 72ch;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
        }

        .report-content h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 3rem;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #e2e8f0;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }
        .report-content h1:first-child {
          margin-top: 0;
        }

        .report-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
          line-height: 1.3;
          letter-spacing: -0.005em;
        }

        .report-content h3 {
          font-size: 1.05rem;
          font-weight: 600;
          color: #334155;
          margin-top: 2rem;
          margin-bottom: 0.6rem;
          line-height: 1.4;
        }

        .report-content p {
          font-size: 0.925rem;
          color: #475569;
          line-height: 1.8;
          margin-bottom: 1.15rem;
        }

        .report-content strong {
          color: #1e293b;
          font-weight: 600;
        }

        .report-content em {
          color: #64748b;
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
          background: #a5b4fc;
        }

        .report-content ol {
          list-style: decimal;
          padding-left: 1.5rem;
        }

        .report-content ol > li {
          padding-left: 0.35rem;
        }

        .report-content ol > li::marker {
          color: #6366f1;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .report-content li {
          font-size: 0.925rem;
          color: #475569;
          line-height: 1.75;
          margin-bottom: 0.5rem;
        }

        .report-content li strong {
          color: #1e293b;
        }

        .report-content hr {
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, #cbd5e1, transparent);
          margin: 2.5rem 0;
        }

        .report-content a {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid #c7d2fe;
          transition: border-color 0.15s;
        }
        .report-content a:hover {
          border-bottom-color: #4f46e5;
        }

        .report-content blockquote {
          border-left: 3px solid #a5b4fc;
          background: #f8fafc;
          padding: 0.75rem 1.25rem;
          margin: 1.25rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        .report-content blockquote p {
          color: #64748b;
          font-style: italic;
          margin-bottom: 0;
        }

        .report-content code {
          background: #f1f5f9;
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.85em;
          color: #334155;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        }
      `}</style>
    </div>
  );
}

/**
 * Markdown-to-HTML converter for research reports.
 */
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
