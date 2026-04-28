"use client";

import { Pencil, Trash2, Zap } from "lucide-react";
import type { AgentConfig } from "@/lib/types";
import { STAGE_NAMES } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: AgentConfig;
  onToggle: (id: string) => void;
  onEdit: (agent: AgentConfig) => void;
  onDelete: (id: string) => void;
}

function Toggle({
  enabled,
  onClick,
  label,
}: {
  enabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0",
        enabled ? "bg-primary" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-block size-3.5 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-4.5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function AgentCard({ agent, onToggle, onEdit, onDelete }: AgentCardProps) {
  return (
    <Card className={cn("transition-opacity", !agent.enabled && "opacity-60")}>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h3 className="text-sm font-semibold truncate">{agent.name}</h3>
              <Badge variant="secondary" className="text-[10px]">
                Stage {agent.stage}: {STAGE_NAMES[agent.stage] || "Unknown"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
          </div>
          <Toggle
            enabled={agent.enabled}
            onClick={() => onToggle(agent.id)}
            label={agent.enabled ? "Disable agent" : "Enable agent"}
          />
        </div>

        {agent.perspective && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic">
            &quot;{agent.perspective}&quot;
          </p>
        )}

        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="size-3" />
            Temp: {agent.temperature.toFixed(1)}
          </span>
          <span>{agent.model}</span>
        </div>

        {agent.conflict_partners.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Conflict Partners
            </p>
            <div className="flex flex-wrap gap-1">
              {agent.conflict_partners.map((partner) => (
                <Badge
                  key={partner}
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]"
                >
                  {partner}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 pt-2 border-t">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onEdit(agent)}
          >
            <Pencil />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDelete(agent.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
