"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project, StageResult } from "@/lib/types";
import { STAGE_NAMES, STAGE_DESCRIPTIONS } from "@/lib/types";

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
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStage = project.current_stage;
  const currentResult = project.stage_results.find(
    (r) => r.stage_number === currentStage
  );
  const completedStages = project.stage_results.filter(
    (r) => r.status === "approved"
  ).length;

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Status
          </h3>
          <p className="text-lg font-semibold text-slate-900 capitalize">
            {project.state.replace("_", " ")}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Current Stage
          </h3>
          <p className="text-lg font-semibold text-slate-900">
            {currentStage}. {STAGE_NAMES[currentStage]}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Progress
          </h3>
          <p className="text-lg font-semibold text-slate-900">
            {completedStages} / 6 Stages Approved
          </p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${(completedStages / 6) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completed project banner */}
      {project.state === "complete" && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 text-white">
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

      {/* Current stage prompt */}
      {project.state !== "complete" && (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Current Stage
              </span>
              {currentResult && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                    currentResult.status === "running"
                      ? "bg-amber-100 text-amber-700"
                      : currentResult.status === "complete"
                      ? "bg-blue-100 text-blue-700"
                      : currentResult.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {currentResult.status}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {STAGE_NAMES[currentStage]}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {STAGE_DESCRIPTIONS[currentStage]}
            </p>

            {/* Summary of current result if exists */}
            {currentResult && currentResult.agent_outputs.length > 0 && (
              <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  {currentResult.agent_outputs.length} agent output
                  {currentResult.agent_outputs.length !== 1 ? "s" : ""}
                  {currentResult.conflict_report && " with conflict analysis"}
                </p>
                {currentResult.human_override && (
                  <p className="text-xs text-amber-600 mt-1">
                    Human override applied
                  </p>
                )}
              </div>
            )}

            {/* No result yet */}
            {!currentResult && (
              <p className="text-sm text-slate-400 italic">
                No results yet. Run this stage to begin.
              </p>
            )}
          </div>
          <Link
            href={`/projects/${project.id}/stages/${currentStage}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm flex-shrink-0 ml-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            Go to Stage
          </Link>
        </div>
      </div>
      )}

      {/* Research context */}
      {project.context && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Research Context</h3>
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
            {project.context}
          </p>
        </div>
      )}

      {/* Completed stages summary */}
      {project.stage_results.filter((r) => r.status === "approved").length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
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
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        Stage {result.stage_number}: {STAGE_NAMES[result.stage_number]}
                      </p>
                      <p className="text-xs text-slate-400">
                        {result.agent_outputs.length} outputs
                        {result.human_override ? " + override" : ""}
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
