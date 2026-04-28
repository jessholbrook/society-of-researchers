"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  CircleAlert,
  FileText,
  Loader2,
  MessageSquare,
  Play,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { runStageSSE } from "@/lib/sse";
import type { Project, StageResult } from "@/lib/types";
import { STAGE_NAMES, STAGE_DESCRIPTIONS } from "@/lib/types";
import { AgentOutputCard } from "@/components/stage/AgentOutputCard";
import { DebateView } from "@/components/stage/DebateView";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = "outputs" | "debate" | "override";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  running: "bg-amber-100 text-amber-800 border-amber-200 animate-status-pulse",
  complete: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function StageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const stageNum = Number(params.stageNum);

  const [, setProject] = useState<Project | null>(null);
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
      if (stageData?.human_override) setOverrideContent(stageData.human_override);
      if (stageData?.human_notes) setOverrideNotes(stageData.human_notes);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load stage";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId, stageNum]);

  useEffect(() => {
    fetchData();
    return () => {
      cleanupRef.current?.();
    };
  }, [fetchData]);

  const handleRunStage = useCallback(() => {
    setIsRunning(true);
    setError(null);
    setStreamingAgents(new Set());

    const cleanup = runStageSSE(projectId, stageNum, {
      onAgentStart: (data) => {
        setStreamingAgents((prev) => new Set(prev).add(data.agent_id));
        setStageResult((prev) => {
          const newOutput = {
            id: data.agent_id,
            agent_id: data.agent_id,
            agent_name: data.agent_name,
            stage: stageNum,
            project_id: projectId,
            content: "",
            claims: [],
            status: "running" as const,
            error: null,
            created_at: new Date().toISOString(),
          };
          if (!prev) {
            return {
              id: "",
              project_id: projectId,
              stage_number: stageNum,
              status: "running",
              agent_outputs: [newOutput],
              conflict_report: null,
              human_override: null,
              human_notes: "",
              approved_at: null,
              created_at: new Date().toISOString(),
            };
          }
          if (prev.agent_outputs.some((o) => o.agent_id === data.agent_id)) return prev;
          return {
            ...prev,
            status: "running",
            agent_outputs: [...prev.agent_outputs, newOutput],
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
                ? { ...o, status: "error" as const, error: data.error || "Unknown error" }
                : o
            ),
          };
        });
      },
      onConflictStart: () => {},
      onConflictComplete: (data) => {
        setStageResult((prev) => (prev ? { ...prev, conflict_report: data } : prev));
        setActiveTab("debate");
      },
      onStageComplete: () => {
        setIsRunning(false);
        setStreamingAgents(new Set());
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save override";
      setError(message);
    } finally {
      setSavingOverride(false);
    }
  }, [projectId, stageNum, overrideContent, overrideNotes, fetchData]);

  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      const result = await api.approveStage(projectId, stageNum);
      if (result.complete) router.push(`/projects/${projectId}/report`);
      else if (result.next_stage)
        router.push(`/projects/${projectId}/stages/${result.next_stage}`);
      else router.push(`/projects/${projectId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve";
      setError(message);
      setApproving(false);
    }
  }, [projectId, stageNum, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="ml-3 text-sm">Loading stage data…</span>
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
      <Card>
        <CardContent className="flex items-start justify-between gap-4 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Stage {stageNum}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                  STATUS_BADGE[stageStatus]
                )}
              >
                {stageStatus.charAt(0).toUpperCase() + stageStatus.slice(1)}
              </span>
            </div>
            <h2 className="text-lg font-semibold mb-1">{stageName}</h2>
            <p className="text-sm text-muted-foreground">{stageDescription}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canRun && (
              <Button onClick={handleRunStage} disabled={isRunning} size="lg">
                {isRunning ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play />
                    Run Stage
                  </>
                )}
              </Button>
            )}
            {stageStatus === "approved" && stageNum === 6 && (
              <Button
                size="lg"
                onClick={() => router.push(`/projects/${projectId}/report`)}
              >
                <FileText />
                View Report
              </Button>
            )}
            {stageStatus === "approved" && stageNum < 6 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-800 rounded-md text-sm font-medium border border-emerald-200">
                <Check className="size-4" />
                Approved
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="py-3 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="border-b">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1.5">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-5">
          {activeTab === "outputs" && (
            <div>
              {agentOutputs.length === 0 && !isRunning && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="size-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-1">No agent outputs yet</p>
                  <p className="text-xs">
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

          {activeTab === "debate" && (
            <div>
              {conflictReport ? (
                <DebateView report={conflictReport} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="size-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-1">No debate analysis yet</p>
                  <p className="text-xs">
                    Conflict analysis runs automatically after all agents complete.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "override" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="override-content">Override Content</Label>
                <p className="text-xs text-muted-foreground">
                  Provide your own synthesis or corrections to the agent outputs. This
                  will be used as the authoritative output for this stage.
                </p>
                <Textarea
                  id="override-content"
                  value={overrideContent}
                  onChange={(e) => setOverrideContent(e.target.value)}
                  placeholder="Write your override content here…"
                  rows={10}
                  className="font-mono leading-relaxed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="override-notes" className="flex items-baseline gap-1.5">
                  Notes
                  <span className="font-normal text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="override-notes"
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                  placeholder="Why are you overriding? What did the agents miss?"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSaveOverride}
                disabled={!overrideContent.trim() || savingOverride}
                size="lg"
              >
                {savingOverride && <Loader2 className="animate-spin" />}
                {savingOverride ? "Saving…" : "Save Override"}
              </Button>
              {stageResult?.human_override && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Override saved. This will be used as the stage output.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {canApprove && (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div>
              <h3 className="text-sm font-semibold mb-0.5">
                {stageNum === 6 ? "Research complete!" : "Ready to advance?"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {stageNum === 6
                  ? "Approve the final stage to generate a comprehensive research report."
                  : "Approve this stage to lock results and move to the next stage."}
              </p>
            </div>
            <Button onClick={handleApprove} disabled={approving} size="lg">
              {approving ? (
                <>
                  <Loader2 className="animate-spin" />
                  {stageNum === 6 ? "Generating Report…" : "Approving…"}
                </>
              ) : (
                <>
                  {stageNum === 6 ? <FileText /> : <Check />}
                  {stageNum === 6 ? "Complete & Generate Report" : "Approve & Advance"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
