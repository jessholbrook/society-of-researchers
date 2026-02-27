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
    } catch (err: any) {
      setError(err.message || "Failed to create project");
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/" className="hover:text-indigo-400 transition-colors">
          Projects
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-zinc-200 font-medium">New Project</span>
      </nav>

      <h1 className="text-2xl font-bold text-white mb-2">Create New Project</h1>
      <p className="text-sm text-zinc-500 mb-8">
        Define your research question and provide context for the agent pipeline.
      </p>

      {error && (
        <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Project Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Climate Impact on Urban Agriculture"
            className={inputClass}
            required
          />
        </div>

        {/* Research Question */}
        <div>
          <label
            htmlFor="research_question"
            className="block text-sm font-medium text-zinc-300 mb-1.5"
          >
            Research Question
          </label>
          <textarea
            id="research_question"
            value={researchQuestion}
            onChange={(e) => setResearchQuestion(e.target.value)}
            placeholder="What specific question should the research agents investigate?"
            rows={4}
            className={`${inputClass} resize-y`}
            required
          />
          <p className="mt-1.5 text-xs text-zinc-600">
            Be specific. A focused question produces better research outputs.
          </p>
        </div>

        {/* Folder */}
        <div>
          <label htmlFor="folder" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Folder
            <span className="font-normal text-zinc-600 ml-1">(optional)</span>
          </label>
          <input
            id="folder"
            type="text"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="e.g., Climate Research, Economics"
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-zinc-600">
            Group this project in a sidebar folder.
          </p>
        </div>

        {/* Context */}
        <div>
          <label htmlFor="context" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Additional Context
            <span className="font-normal text-zinc-600 ml-1">(optional)</span>
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Provide background information, constraints, specific domains to focus on, or any other relevant context..."
            rows={5}
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !name.trim() || !researchQuestion.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting ? "Creating..." : "Create Project"}
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
