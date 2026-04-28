import { api } from "./api";
import type { StageResult } from "./types";

export interface SSECallbacks {
  onAgentStart?: (data: { agent_id: string; agent_name: string }) => void;
  onAgentComplete?: (data: any) => void;
  onAgentError?: (data: any) => void;
  onConflictStart?: () => void;
  onConflictComplete?: (data: any) => void;
  onStageComplete?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Runs a stage via the backend SSE endpoint. Uses fetch + ReadableStream
 * instead of EventSource so we can read HTTP status codes and error bodies
 * (EventSource hides these and only reports a generic connection failure).
 *
 * If the SSE stream drops mid-flight (browser tab throttling, transient
 * network blip, intermediate proxy with idle-timeout), the orchestrator
 * keeps running on the server. We poll the stage state for up to 90s after
 * a drop and synthesize the missing events when the server reports the
 * stage as complete — so the user doesn't have to manually refresh.
 */
export function runStageSSE(
  projectId: string,
  stageNum: number,
  callbacks: SSECallbacks
): () => void {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${apiBase}/api/projects/${projectId}/stages/${stageNum}/run`;
  const controller = new AbortController();
  const seenAgentIds = new Set<string>();
  const completedAgentIds = new Set<string>();
  let conflictStarted = false;

  // Recovery: when the SSE stream drops without stage_complete, the backend
  // very likely finished the work anyway. Poll for the persisted result and
  // replay any events the client missed before falling back to an error.
  async function recoverFromDrop(reason: string) {
    const deadline = Date.now() + 90_000;
    let lastResult: StageResult | null = null;
    while (Date.now() < deadline && !controller.signal.aborted) {
      try {
        lastResult = await api.getStageResult(projectId, stageNum);
      } catch {
        lastResult = null;
      }
      if (lastResult && lastResult.status === "complete") break;
      if (lastResult && lastResult.status === "approved") break;
      // Wait before next poll; status is still running on the server.
      await new Promise((r) => setTimeout(r, 4000));
    }
    if (controller.signal.aborted) return;

    if (lastResult && (lastResult.status === "complete" || lastResult.status === "approved")) {
      // Replay any agent_complete events we never received.
      for (const output of lastResult.agent_outputs ?? []) {
        if (!completedAgentIds.has(output.agent_id)) {
          if (output.status === "error") {
            callbacks.onAgentError?.({
              agent_id: output.agent_id,
              agent_name: output.agent_name,
              stage: output.stage,
              error: output.error || "Unknown error",
            });
          } else {
            callbacks.onAgentComplete?.({
              agent_id: output.agent_id,
              agent_name: output.agent_name,
              stage: output.stage,
              content: output.content,
              claims: output.claims,
            });
          }
        }
      }

      if (!conflictStarted) callbacks.onConflictStart?.();
      if (lastResult.conflict_report) {
        callbacks.onConflictComplete?.(lastResult.conflict_report);
      }
      callbacks.onStageComplete?.({
        project_id: projectId,
        stage_number: stageNum,
        status: lastResult.status,
        agent_outputs: lastResult.agent_outputs?.length ?? 0,
        agreements: lastResult.conflict_report?.agreements?.length ?? 0,
        disagreements: lastResult.conflict_report?.disagreements?.length ?? 0,
      });
      return;
    }

    // Backend genuinely didn't finish — surface the original drop reason.
    callbacks.onError?.(
      new Error(
        `${reason} The server is still working on this stage — refresh the page in a minute to check.`
      )
    );
  }

  (async () => {
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      callbacks.onError?.(new Error(`Unable to reach the server: ${err.message}`));
      return;
    }

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const body = await res.json();
        if (body?.detail) message = body.detail;
      } catch {
        // response body wasn't JSON; keep the generic status message
      }
      callbacks.onError?.(new Error(message));
      return;
    }

    if (!res.body) {
      callbacks.onError?.(new Error("Response has no body"));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let stageCompleted = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line (\n\n)
        let frameEnd: number;
        while ((frameEnd = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, frameEnd);
          buffer = buffer.slice(frameEnd + 2);

          let eventName: string | null = null;
          let data = "";
          for (const line of frame.split("\n")) {
            if (line.startsWith(":")) continue; // SSE comment/ping
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              data = line.slice(5).trim();
            }
          }
          if (!eventName) continue;

          let parsed: any = null;
          if (data) {
            try {
              parsed = JSON.parse(data);
            } catch {
              continue;
            }
          }

          switch (eventName) {
            case "agent_start":
              if (parsed?.agent_id) seenAgentIds.add(parsed.agent_id);
              callbacks.onAgentStart?.(parsed);
              break;
            case "agent_complete":
              if (parsed?.agent_id) completedAgentIds.add(parsed.agent_id);
              callbacks.onAgentComplete?.(parsed);
              break;
            case "agent_error":
              if (parsed?.agent_id) completedAgentIds.add(parsed.agent_id);
              callbacks.onAgentError?.(parsed);
              break;
            case "conflict_start":
              conflictStarted = true;
              callbacks.onConflictStart?.();
              break;
            case "conflict_complete":
              callbacks.onConflictComplete?.(parsed);
              break;
            case "stage_complete":
              stageCompleted = true;
              callbacks.onStageComplete?.(parsed);
              return;
          }
        }
      }

      // Stream ended cleanly but the server never sent stage_complete.
      // Try to recover from the persisted state.
      if (!stageCompleted) {
        await recoverFromDrop("Connection dropped before the stage finished.");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      // Stream interrupted. Try recovery before falling back to error.
      await recoverFromDrop(`Stream interrupted: ${err.message}.`);
    }
  })();

  return () => controller.abort();
}
