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
 */
export function runStageSSE(
  projectId: string,
  stageNum: number,
  callbacks: SSECallbacks
): () => void {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
  const url = `${apiBase}/api/projects/${projectId}/stages/${stageNum}/run`;
  const controller = new AbortController();

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
              callbacks.onAgentStart?.(parsed);
              break;
            case "agent_complete":
              callbacks.onAgentComplete?.(parsed);
              break;
            case "agent_error":
              callbacks.onAgentError?.(parsed);
              break;
            case "conflict_start":
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

      // Stream ended cleanly but the server never sent stage_complete —
      // surface this as an error so the UI doesn't sit stuck in "running".
      if (!stageCompleted) {
        callbacks.onError?.(
          new Error(
            "Connection closed before the stage finished. The stage may still be running on the server — refresh in a minute."
          )
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      callbacks.onError?.(new Error(`Stream interrupted: ${err.message}`));
    }
  })();

  return () => controller.abort();
}
