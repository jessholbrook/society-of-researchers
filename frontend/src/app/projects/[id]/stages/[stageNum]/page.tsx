"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { runStageSSE } from "@/lib/sse";
import type { Project, StageResult, AgentOutput } from "@/lib/types";
import { STAGE_NAMES, STAGE_DESCRIPTIONS } from "@/lib/types";
import { AgentOutputCard } from "@/components/stage/AgentOutputCard";
import { DebateView } from "@/components/stage/DebateView";

type Tab = "outputs" | "debate" | "override";

export default function StageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const stageNum = Number(params.stageNum);

  const [project, setProject] = useState<Project | null>(null);
  const [stageResult, setStageResult] = useState<StageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("outputs");
  const [isRunning, setIsRunning] = useState(false);
  const [streamingAgents, setStreamingAgents] = useState<Set<string>>(new Set());
  const [overrideContent, setOverrideContent] = useState("");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [projectData, stageData] = await Promise.all([
        api.getProject(projectId),
        api.getStageResult(projectId, stageNum),
      ]);
      setProject(projectData);
      setStageResult(stageData);
      if (stageData?.human_override) {
        setOverrideContent(stageData.human_override);
      }
      if (stageData?.human_notes) {
        setOverrideNotes(stageData.human_notes);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, stageNum]);

  useEffect(() => {
    fetchData();
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [fetchData]);

  const handleRunStage = useCallback(() => {
    setIsRunning(true);
    setError(null);
    setStreamingAgents(new Set());

    const cleanup = runStageSSE(projectId, stageNum, {
      onAgentStart: (data) => {
        setStreamingAgents((prev) => {
          const next = new Set(prev);
          next.add(data.agent_id);
          return next;
        });
        // Add a placeholder output
        setStageResult((prev) => {
          if (!prev) {
            return {
              id: "",
              project_id: projectId,
              stage_number: stageNum,
              status: "running",
              agent_outputs: [
                {
                  id: data.agent_id,
                  agent_id: data.agent_id,
                  agent_name: data.agent_name,
                  stage: stageNum,
                  project_id: projectId,
                  content: "",
                  claims: [],
                  status: "running",
                  error: null,
                  created_at: new Date().toISOString(),
                },
              ],
              conflict_report: null,
              human_override: null,
              human_notes: "",
              approved_at: null,
              created_at: new Date().toISOString(),
            };
          }
          const exists = prev.agent_outputs.some((o) => o.agent_id === data.agent_id);
          if (exists) return prev;
          return {
            ...prev,
            status: "running",
            agent_outputs: [
              ...prev.agent_outputs,
              {
                id: data.agent_id,
                agent_id: data.agent_id,
                agent_name: data.agent_name,
                stage: stageNum,
                project_id: projectId,
                content: "",
                claims: [],
                status: "running",
                error: null,
                created_at: new Date().toISOString(),
              },
            ],
          };
        });
      },
      onAgentComplete: (data) => {
        setStreamingAgents((prev) => {
          const next = new Set(prev);
          next.delete(data.agent_id);
          return next;
        });
        setStageResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            agent_outputs: prev.agent_outputs.map((o) =>
              o.agent_id === data.agent_id
                ? {
                    ...o,
                    content: data.content || o.content,
                    claims: data.claims || o.claims,
                    status: "complete" as const,
                  }
                : o
            ),
          };
        });
      },
      onAgentError: (data) => {
        setStreamingAgents((prev) => {
          const next = new Set(prev);
          next.delete(data.agent_id);
          return next;
        });
        setStageResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            agent_outputs: prev.agent_outputs.map((o) =>
              o.agent_id === data.agent_id
                ? {
                    ...o,
                    status: "error" as const,
                    error: data.error || "Unknown error",
                  }
                : o
            ),
          };
        });
      },
      onConflictStart: () => {
        // Conflict analysis is starting - could show a loading state
      },
      onConflictComplete: (data) => {
        setStageResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            conflict_report: data,
          };
        });
        setActiveTab("debate");
      },
      onStageComplete: (data) => {
        setIsRunning(false);
        setStreamingAgents(new Set());
        // Refresh full data
        fetchData();
      },
      onError: (err) => {
        setIsRunning(false);
        setStreamingAgents(new Set());
        setError(err.message);
      },
    });

    cleanupRef.current = cleanup;
  }, [projectId, stageNum, fetchData]);

  const handleSaveOverride = useCallback(async () => {
    if (!overrideContent.trim()) return;
    setSavingOverride(true);
    try {
      await api.saveOverride(projectId, stageNum, overrideContent, overrideNotes);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingOverride(false);
    }
  }, [projectId, stageNum, overrideContent, overrideNotes, fetchData]);

  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      const result = await api.approveStage(projectId, stageNum);
      if (result.complete) {
        // Final stage — navigate to report page
        router.push(`/projects/${projectId}/report`);
      } else if (result.next_stage) {
        router.push(`/projects/${projectId}/stages/${result.next_stage}`);
      } else {
        router.push(`/projects/${projectId}`);
      }
    } catch (err: any) {
      setError(err.message);
      setApproving(false);
    }
  }, [projectId, stageNum, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-slate-500">Loading stage data...</span>
      </div>
    );
  }

  const stageName = STAGE_NAMES[stageNum] || `Stage ${stageNum}`;
  const stageDescription = STAGE_DESCRIPTIONS[stageNum] || "";
  const stageStatus = stageResult?.status || "pending";
  const agentOutputs = stageResult?.agent_outputs || [];
  const conflictReport = stageResult?.conflict_report;
  const canRun = stageStatus === "pending" || stageStatus === "complete";
  const canApprove = stageStatus === "complete" && !isRunning;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "outputs", label: "Agent Outputs", count: agentOutputs.length },
    { id: "debate", label: "Debate View" },
    { id: "override", label: "Human Override" },
  ];

  return (
    <div className="space-y-6">
      {/* Stage header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Stage {stageNum}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                  stageStatus === "running"
                    ? "bg-amber-100 text-amber-700 animate-status-pulse"
                    : stageStatus === "complete"
                    ? "bg-blue-100 text-blue-700"
                    : stageStatus === "approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {stageStatus.charAt(0).toUpperCase() + stageStatus.slice(1)}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">{stageName}</h2>
            <p className="text-sm text-slate-500">{stageDescription}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {canRun && (
              <button
                onClick={handleRunStage}
                disabled={isRunning}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
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
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Run Stage
                  </>
                )}
              </button>
            )}
            {stageStatus === "approved" && stageNum === 6 && (
              <button
                onClick={() => router.push(`/projects/${projectId}/report`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Report
              </button>
            )}
            {stageStatus === "approved" && stageNum < 6 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Approved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5">
          {/* Agent Outputs tab */}
          {activeTab === "outputs" && (
            <div>
              {agentOutputs.length === 0 && !isRunning && (
                <div className="text-center py-12">
                  <svg
                    className="w-10 h-10 text-slate-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <p className="text-sm text-slate-500 mb-1">No agent outputs yet</p>
                  <p className="text-xs text-slate-400">
                    Click &quot;Run Stage&quot; to execute this pipeline stage.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {agentOutputs.map((output) => (
                  <AgentOutputCard
                    key={output.agent_id}
                    output={output}
                    isStreaming={streamingAgents.has(output.agent_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Debate View tab */}
          {activeTab === "debate" && (
            <div>
              {conflictReport ? (
                <DebateView report={conflictReport} />
              ) : (
                <div className="text-center py-12">
                  <svg
                    className="w-10 h-10 text-slate-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-sm text-slate-500 mb-1">No debate analysis yet</p>
                  <p className="text-xs text-slate-400">
                    Conflict analysis runs automatically after all agents complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Human Override tab */}
          {activeTab === "override" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Override Content
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Provide your own synthesis or corrections to the agent outputs.
                  This will be used as the authoritative output for this stage.
                </p>
                <textarea
                  value={overrideContent}
                  onChange={(e) => setOverrideContent(e.target.value)}
                  placeholder="Write your override content here..."
                  rows={10}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y font-mono leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                  <span className="font-normal text-slate-400 ml-1">(optional)</span>
                </label>
                <textarea
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Why are you overriding? What did the agents miss?"
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-y"
                />
              </div>
              <button
                onClick={handleSaveOverride}
                disabled={!overrideContent.trim() || savingOverride}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingOverride && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {savingOverride ? "Saving..." : "Save Override"}
              </button>
              {stageResult?.human_override && (
                <p className="text-xs text-green-600">
                  Override saved. This will be used as the stage output.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Approve & Advance */}
      {canApprove && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-0.5">
                {stageNum === 6 ? "Research complete!" : "Ready to advance?"}
              </h3>
              <p className="text-xs text-slate-400">
                {stageNum === 6
                  ? "Approve the final stage to generate a comprehensive research report."
                  : "Approve this stage to lock results and move to the next stage."}
              </p>
            </div>
            <button
              onClick={handleApprove}
              disabled={approving}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                stageNum === 6
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {approving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {stageNum === 6 ? "Generating Report..." : "Approving..."}
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {stageNum === 6 ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    )}
                  </svg>
                  {stageNum === 6 ? "Complete & Generate Report" : "Approve & Advance"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
