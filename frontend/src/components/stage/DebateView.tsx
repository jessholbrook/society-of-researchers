"use client";

import type { ConflictReport } from "@/lib/types";

interface DebateViewProps {
  report: ConflictReport;
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
        <p className="text-sm text-zinc-600">No conflict analysis available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agreements */}
      {hasAgreements && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-emerald-950/60 flex items-center justify-center">
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">
              Agreements ({agreements.length})
            </h3>
          </div>
          <div className="space-y-3">
            {agreements.map((agreement, i) => (
              <div key={i} className="bg-zinc-950 rounded-xl border border-emerald-800/40 p-4">
                <h4 className="text-sm font-semibold text-zinc-200 mb-1.5">
                  {agreement.topic}
                </h4>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                  {agreement.summary}
                </p>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                    Supporting:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(agreement.supporting_agents ?? []).map((agent) => (
                      <span
                        key={agent}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
                {(agreement.evidence ?? []).length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                      Evidence
                    </p>
                    {(agreement.evidence ?? []).map((ev, j) => (
                      <div key={j} className="pl-3 border-l-2 border-emerald-800/40">
                        <p className="text-xs text-zinc-500 italic leading-relaxed">{ev}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Disagreements */}
      {hasDisagreements && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-red-950/60 flex items-center justify-center">
              <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">
              Disagreements ({disagreements.length})
            </h3>
          </div>
          <div className="space-y-3">
            {disagreements.map((disagreement, i) => (
              <div key={i} className="bg-zinc-950 rounded-xl border border-red-800/40 p-4">
                <h4 className="text-sm font-semibold text-zinc-200 mb-1.5">
                  {disagreement.topic}
                </h4>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                  {disagreement.summary}
                </p>
                <div className="space-y-2">
                  <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">
                    Positions
                  </p>
                  {(disagreement.positions ?? []).map((pos, j) => (
                    <div key={j} className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-zinc-300">
                          {pos.agent_name}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          Confidence: {Math.round(pos.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-1.5">
                        {pos.position}
                      </p>
                      {pos.evidence && (
                        <div className="pl-2.5 border-l-2 border-red-800/40 mt-2">
                          <p className="text-[11px] text-zinc-600 italic leading-relaxed">
                            {pos.evidence}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Unresolved Tensions */}
      {hasTensions && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-amber-950/60 flex items-center justify-center">
              <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">
              Unresolved Tensions ({tensions.length})
            </h3>
          </div>
          <div className="bg-zinc-950 rounded-xl border border-amber-800/40 p-4">
            <ul className="space-y-2">
              {tensions.map((tension, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-zinc-400 leading-relaxed">{tension}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Synthesis */}
      {report.synthesis && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-indigo-950/60 flex items-center justify-center">
              <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">Synthesis</h3>
          </div>
          <div className="bg-zinc-950 rounded-xl border border-indigo-800/40 p-5">
            <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
              {report.synthesis}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
