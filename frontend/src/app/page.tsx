"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project, ProjectState } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";

function StatusBadge({ state }: { state: ProjectState }) {
  const styles: Record<ProjectState, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    complete: "bg-green-50 text-green-700 border-green-200",
  };
  const labels: Record<ProjectState, string> = {
    draft: "Draft",
    in_progress: "In Progress",
    complete: "Complete",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[state]}`}
    >
      {labels[state]}
    </span>
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
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your multi-agent research projects
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Project
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-slate-500">Loading projects...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && projects.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <svg
            className="w-12 h-12 text-slate-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <h3 className="text-lg font-medium text-slate-700 mb-1">No projects yet</h3>
          <p className="text-sm text-slate-500 mb-6">
            Create your first research project to get started.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Create Project
          </Link>
        </div>
      )}

      {/* Project cards */}
      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  {project.name}
                </h3>
                <StatusBadge state={project.state} />
              </div>
              <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                {project.research_question}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5"
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
                  Stage {project.current_stage}:{" "}
                  {STAGE_NAMES[project.current_stage] || "Unknown"}
                </span>
                <span>
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
