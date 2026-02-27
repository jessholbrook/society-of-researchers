"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";

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
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Completed project banner */}
      {project.state === "complete" && (
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Research Complete</h2>
              <p className="text-sm text-indigo-200">
                All 6 stages have been approved. View your final research report.
              </p>
            </div>
            <Link
              href={`/projects/${project.id}/report`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors shadow-sm flex-shrink-0 ml-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Report
            </Link>
          </div>
        </div>
      )}

      {/* Research context */}
      {project.context && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">Research Context</h3>
          <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
            {project.context}
          </p>
        </div>
      )}

      {/* Completed stages summary */}
      {project.stage_results.filter((r) => r.status === "approved").length > 0 && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            Completed Stages
          </h3>
          <div className="space-y-3">
            {project.stage_results
              .filter((r) => r.status === "approved")
              .sort((a, b) => a.stage_number - b.stage_number)
              .map((result) => (
                <Link
                  key={result.id}
                  href={`/projects/${project.id}/stages/${result.stage_number}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-950/50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Stage {result.stage_number}: {STAGE_NAMES[result.stage_number]}
                      </p>
                      <p className="text-xs text-zinc-600">
                        {result.agent_outputs.length} outputs
                        {result.human_override ? " + override" : ""}
                      </p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
