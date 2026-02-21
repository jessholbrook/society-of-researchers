export interface SSECallbacks {
  onAgentStart?: (data: { agent_id: string; agent_name: string }) => void;
  onAgentComplete?: (data: any) => void;
  onAgentError?: (data: any) => void;
  onConflictStart?: () => void;
  onConflictComplete?: (data: any) => void;
  onStageComplete?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function runStageSSE(
  projectId: string,
  stageNum: number,
  callbacks: SSECallbacks
): () => void {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${apiBase}/api/projects/${projectId}/stages/${stageNum}/run`;
  const eventSource = new EventSource(url);

  eventSource.addEventListener("agent_start", (e) => {
    callbacks.onAgentStart?.(JSON.parse(e.data));
  });
  eventSource.addEventListener("agent_complete", (e) => {
    callbacks.onAgentComplete?.(JSON.parse(e.data));
  });
  eventSource.addEventListener("agent_error", (e) => {
    callbacks.onAgentError?.(JSON.parse(e.data));
  });
  eventSource.addEventListener("conflict_start", (e) => {
    callbacks.onConflictStart?.();
  });
  eventSource.addEventListener("conflict_complete", (e) => {
    callbacks.onConflictComplete?.(JSON.parse(e.data));
  });
  eventSource.addEventListener("stage_complete", (e) => {
    callbacks.onStageComplete?.(JSON.parse(e.data));
    eventSource.close();
  });
  eventSource.onerror = (e) => {
    callbacks.onError?.(new Error("SSE connection failed"));
    eventSource.close();
  };

  // Return cleanup function
  return () => eventSource.close();
}
