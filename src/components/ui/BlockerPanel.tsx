import React from 'react';
import { ArrowUpRight, CheckCircle2, Flag, RotateCcw } from 'lucide-react';
import { EscalatedBlocker } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import { blockerTargetInfo, canEscalateTarget, roleCan } from '../../domain/syncEngine';
import { StatusBadge } from './Badge';

export const BlockerBox: React.FC<{
  blocker: EscalatedBlocker;
  fixedReviewId?: string;
  compact?: boolean;
}> = ({ blocker, fixedReviewId, compact = false }) => {
  const { goals, kpis, initiatives, projects, activeRole, navigate, convertToPdcaDecision, resolveBlocker, reopenBlocker } =
    useWorkspace();
  const info = blockerTargetInfo(blocker.targetType, blocker.targetId, { goals, kpis, initiatives, projects });
  const canReviewWrite = roleCan(activeRole, 'reviewWrite', null, { goals, initiatives });
  const targetIdEscaped = blocker.targetId;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-bold text-[var(--ink)]">{blocker.id}</span>
            <StatusBadge label={blocker.severity} />
            <StatusBadge label={blocker.category} tone="slate" />
            <StatusBadge label={blocker.status} />
            {blocker.isAuto && <StatusBadge label="Auto signal" tone="blue" />}
          </div>
          <div className="text-sm font-semibold text-[var(--ink)]">
            {info.typeLabel} {info.code} · {info.title}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {blocker.scope} · Owner: <span className="font-medium text-[var(--ink)]">{blocker.owner}</span>
            {blocker.raisedAt ? ` · Raised ${blocker.raisedAt}` : ''}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0 no-print">
          <button
            type="button"
            onClick={() => navigate(info.route, info.routeId)}
            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)]"
          >
            Open {info.code}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {canReviewWrite && blocker.status !== 'Resolved' && !blocker.reviewId && (
            <button
              type="button"
              onClick={async () => {
                const revId = await convertToPdcaDecision(
                  blocker.isAuto ? '' : blocker.id,
                  blocker.targetType,
                  targetIdEscaped,
                  fixedReviewId
                );
                if (revId) navigate('review', revId);
              }}
              className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Log PDCA Decision
            </button>
          )}

          {blocker.reviewId && (
            <button
              type="button"
              onClick={() => navigate('review', blocker.reviewId)}
              className="rounded-lg border border-teal-300 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
            >
              Review {blocker.reviewId}
            </button>
          )}

          {!blocker.isAuto && canReviewWrite && blocker.status !== 'Resolved' && (
            <button
              type="button"
              onClick={() => resolveBlocker(blocker.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve
            </button>
          )}

          {!blocker.isAuto && canReviewWrite && blocker.status === 'Resolved' && (
            <button
              type="button"
              onClick={() => reopenBlocker(blocker.id)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reopen
            </button>
          )}
        </div>
      </div>

      {!compact && (
        <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)] text-xs">
          <div>
            <span className="font-semibold text-[var(--muted)]">Obstacle: </span>
            <span className="text-[var(--ink)]">{blocker.summary}</span>
          </div>
          <div>
            <span className="font-semibold text-[var(--muted)]">Decision / Support Needed: </span>
            <span className="text-[var(--ink)]">{blocker.neededAction}</span>
          </div>
        </div>
      )}

      {blocker.status === 'Resolved' && blocker.resolutionNote && (
        <div className="rounded-lg bg-emerald-50/70 px-3 py-1.5 text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          Resolution ({blocker.resolvedAt}): {blocker.resolutionNote}
        </div>
      )}
    </div>
  );
};

export const BlockerSection: React.FC<{
  targetType: EscalatedBlocker['targetType'];
  targetId: string;
  title?: string;
}> = ({ targetType, targetId, title = 'Escalated Blockers & PDCA Support' }) => {
  const { blockers, goals, initiatives, projects, activeRole, escalateBlocker } = useWorkspace();
  const canEsc = canEscalateTarget(targetType, targetId, { activeRole, goals, initiatives, projects });
  const related = blockers.filter((b) => b.targetType === targetType && b.targetId === targetId);
  const openCount = related.filter((b) => b.status !== 'Resolved').length;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[var(--ink)]">{title}</h3>
          <p className="text-xs text-[var(--muted)]">
            {openCount} open · {related.length - openCount} resolved
          </p>
        </div>
        {canEsc && (
          <button
            type="button"
            onClick={() => escalateBlocker(targetType, targetId)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300 no-print"
          >
            <Flag className="w-3.5 h-3.5" />
            Escalate Blocker
          </button>
        )}
      </div>

      {related.length === 0 ? (
        <p className="text-xs text-[var(--muted)] py-2">
          No escalated blockers logged for {targetId}. Escalate an obstacle whenever management support or cross-functional decision is required.
        </p>
      ) : (
        <div className="space-y-3">
          {related.map((b) => (
            <BlockerBox key={b.id} blocker={b} />
          ))}
        </div>
      )}
    </div>
  );
};
