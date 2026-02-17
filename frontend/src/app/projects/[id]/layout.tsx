"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    try {
      const data = await api.getProject(projectId);
      setProject(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading project...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-sm text-red-700 mb-4">{error || "Project not found"}</p>
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Breadcrumb & Title */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Projects
          </Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 font-medium">{project.name}</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{project.research_question}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${project.id}/agents`}
              className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Manage Agents
            </Link>
          </div>
        </div>
      </div>

      {/* Pipeline Canvas */}
      <div className="mb-6">
        <PipelineCanvas project={project} />
      </div>

      {/* Page content - pass project via context-like pattern */}
      {children}
    </div>
  );
}
