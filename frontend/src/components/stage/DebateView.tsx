"use client";

import { AlertTriangle, Check, FileText, X } from "lucide-react";
import type { ConflictReport } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DebateViewProps {
  report: ConflictReport;
}

function SectionHeader({
  icon,
  iconClass,
  title,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className={cn(
          "size-5 rounded-full flex items-center justify-center",
          iconClass
        )}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

export function DebateView({ report }: DebateViewProps) {
  const agreements = report.agreements ?? [];
  const disagreements = report.disagreements ?? [];
  const tensions = report.unresolved_tensions ?? [];

  const hasAgreements = agreements.length > 0;
  const hasDisagreements = disagreements.length > 0;
  const hasTensions = tensions.length > 0;

  if (!hasAgreements && !hasDisagreements && !hasTensions && !report.synthesis) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          No conflict analysis available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasAgreements && (
        <section>
          <SectionHeader
            icon={<Check className="size-3 text-emerald-700" />}
            iconClass="bg-emerald-100"
            title={`Agreements (${agreements.length})`}
          />
          <div className="space-y-3">
            {agreements.map((agreement, i) => (
              <Card key={i} className="border-emerald-200">
                <CardContent className="space-y-2 py-4">
                  <h4 className="text-sm font-semibold">{agreement.topic}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {agreement.summary}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Supporting:
                    </span>
                    {(agreement.supporting_agents ?? []).map((a) => (
                      <Badge
                        key={a}
                        variant="outline"
                        className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]"
                      >
                        {a}
                      </Badge>
                    ))}
                  </div>
                  {(agreement.evidence ?? []).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        Evidence
                      </p>
                      {(agreement.evidence ?? []).map((ev, j) => (
                        <div key={j} className="pl-3 border-l-2 border-emerald-300">
                          <p className="text-xs text-muted-foreground italic leading-relaxed">
                            {ev}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {hasDisagreements && (
        <section>
          <SectionHeader
            icon={<X className="size-3 text-destructive" />}
            iconClass="bg-destructive/15"
            title={`Disagreements (${disagreements.length})`}
          />
          <div className="space-y-3">
            {disagreements.map((disagreement, i) => (
              <Card key={i} className="border-destructive/30">
                <CardContent className="space-y-2 py-4">
                  <h4 className="text-sm font-semibold">{disagreement.topic}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {disagreement.summary}
                  </p>
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Positions
                    </p>
                    {(disagreement.positions ?? []).map((pos, j) => (
                      <div
                        key={j}
                        className="p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold">
                            {pos.agent_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Confidence: {Math.round(pos.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed mb-1.5">
                          {pos.position}
                        </p>
                        {pos.evidence && (
                          <div className="pl-2.5 border-l-2 border-destructive/30 mt-2">
                            <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                              {pos.evidence}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {hasTensions && (
        <section>
          <SectionHeader
            icon={<AlertTriangle className="size-3 text-amber-700" />}
            iconClass="bg-amber-100"
            title={`Unresolved Tensions (${tensions.length})`}
          />
          <Card className="border-amber-200">
            <CardContent className="py-4">
              <ul className="space-y-2">
                {tensions.map((tension, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="size-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {tension}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {report.synthesis && (
        <section>
          <SectionHeader
            icon={<FileText className="size-3 text-primary" />}
            iconClass="bg-primary/15"
            title="Synthesis"
          />
          <Card className="border-primary/30">
            <CardContent className="py-4">
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {report.synthesis}
              </p>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
