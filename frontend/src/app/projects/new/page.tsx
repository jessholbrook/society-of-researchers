"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [researchQuestion, setResearchQuestion] = useState("");
  const [context, setContext] = useState("");
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
      });
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      setSubmitting(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Projects
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-900 font-medium">New Project</span>
      </nav>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Create New Project</h1>
      <p className="text-sm text-slate-500 mb-8">
        Define your research question and provide context for the agent pipeline.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Climate Impact on Urban Agriculture"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        {/* Research Question */}
        <div>
          <label
            htmlFor="research_question"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Research Question
          </label>
          <textarea
            id="research_question"
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
            placeholder="What specific question should the research agents investigate?"
            rows={4}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y"
            required
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Be specific. A focused question produces better research outputs.
          </p>
        </div>

        {/* Context */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-slate-700 mb-1.5">
            Additional Context
            <span className="font-normal text-slate-400 ml-1">(optional)</span>
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Provide background information, constraints, specific domains to focus on, or any other relevant context..."
            rows={5}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !name.trim() || !researchQuestion.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? "Creating..." : "Create Project"}
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
