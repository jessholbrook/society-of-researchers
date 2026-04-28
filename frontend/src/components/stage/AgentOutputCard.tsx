"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Loader2, X } from "lucide-react";
import type { AgentOutput } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AgentOutputCardProps {
  output: AgentOutput;
  isStreaming: boolean;
}

function StatusIndicator({
  status,
  isStreaming,
}: {
  status: AgentOutput["status"];
  isStreaming: boolean;
}) {
  if (status === "running" || isStreaming) {
    return (
      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-xs font-medium">Running</span>
      </div>
    );
  }
  if (status === "complete") {
    return (
      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
        <Check className="size-4" />
        <span className="text-xs font-medium">Complete</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5 text-destructive">
        <X className="size-4" />
        <span className="text-xs font-medium">Error</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <div className="size-3 rounded-full bg-muted" />
      <span className="text-xs font-medium">Pending</span>
    </div>
  );
}

export function AgentOutputCard({ output, isStreaming }: AgentOutputCardProps) {
  return (
    <Card
      className={cn(
        "transition-all",
        isStreaming && "border-amber-300 ring-1 ring-amber-200/50",
        output.status === "error" && "border-destructive/40"
      )}
    >
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "size-8 rounded-lg flex items-center justify-center text-xs font-bold text-white",
                output.status === "error"
                  ? "bg-destructive"
                  : isStreaming
                  ? "bg-amber-500"
                  : "bg-primary"
              )}
            >
              {output.agent_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">
                {output.agent_name}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Stage {output.stage}
              </p>
            </div>
          </div>
          <StatusIndicator status={output.status} isStreaming={isStreaming} />
        </div>

        {output.content && (
          <div className="text-sm text-muted-foreground leading-relaxed max-h-96 overflow-y-auto">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: (props) => (
                  <h1 className="text-base font-bold text-foreground mt-4 mb-2" {...props} />
                ),
                h2: (props) => (
                  <h2 className="text-sm font-bold text-foreground mt-3 mb-1.5" {...props} />
                ),
                h3: (props) => (
                  <h3 className="text-sm font-semibold text-foreground mt-2 mb-1" {...props} />
                ),
                p: (props) => <p className="mb-2" {...props} />,
                ul: (props) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
                ol: (props) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
                li: (props) => <li {...props} />,
                strong: (props) => (
                  <strong className="font-semibold text-foreground" {...props} />
                ),
                em: (props) => <em className="italic text-foreground/80" {...props} />,
                code: (props) => (
                  <code
                    className="bg-muted px-1 py-0.5 rounded text-[12px] text-foreground"
                    {...props}
                  />
                ),
                hr: () => <hr className="my-3 border-border" />,
                blockquote: (props) => (
                  <blockquote
                    className="border-l-2 border-border pl-3 text-muted-foreground italic my-2"
                    {...props}
                  />
                ),
                a: (props) => (
                  <a
                    className="text-primary underline hover:opacity-80"
                    target="_blank"
                    rel="noreferrer"
                    {...props}
                  />
                ),
              }}
            >
              {output.content}
            </ReactMarkdown>
          </div>
        )}

        {output.status === "error" && output.error && (
          <Card className="border-destructive/40 bg-destructive/10 shadow-none">
            <CardContent className="py-2.5">
              <p className="text-xs font-medium text-destructive mb-0.5">Error</p>
              <p className="text-xs text-destructive/80">{output.error}</p>
            </CardContent>
          </Card>
        )}

        {output.claims && output.claims.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {output.claims.length} Claim{output.claims.length !== 1 ? "s" : ""} Extracted
            </p>
            <div className="space-y-2">
              {output.claims.map((claim, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg border border-border bg-muted/30"
                >
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {claim.text}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>
                      Confidence: {Math.round(claim.confidence * 100)}%
                    </span>
                    {claim.source && <span>Source: {claim.source}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
