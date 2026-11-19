import React, { useMemo } from 'react';
import { ArrowUpRight, Compass } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  computeKpiStatus,
  pdcaExceptionQueue,
  visibleInitiative,
  visibleToRole,
  xm3Data,
  xm3Influence,
} from '../../domain/syncEngine';
import { Card, SectionHeader, SqdcStrip, StatusBadge } from '../ui/Badge';
import { BlockerBox } from '../ui/BlockerPanel';

export const MyFocusPage: React.FC = () => {
  const {
    activeRole,
    domainSnapshot,
    goals,
    kpis,
    initiatives,
    tasks,
    pulseCards,
    myFocusOwner,
    setMyFocusOwner,
    navigate,
    toggleTaskStatus,
    togglePulseCardDone,
  } = useWorkspace();

  const xData = useMemo(() => xm3Data(domainSnapshot), [domainSnapshot]);
  const ownerOptions = xData.owners.map((o) => o.name);
  const defaultOwner =
    activeRole === 'Department director'
      ? 'Production Manager'
      : activeRole === 'Basic user'
        ? 'Team Leader'
        : ownerOptions[0] || 'Site Manager';
  const currentOwner = ownerOptions.includes(myFocusOwner) ? myFocusOwner : defaultOwner;

  const influence = useMemo(
    () => xm3Influence(domainSnapshot, xData, 'owner', currentOwner),
    [domainSnapshot, xData, currentOwner]
  );

  const myGoals = goals.filter((g) => visibleToRole(g, activeRole) && (g.owner === currentOwner || influence.annual.has(g.id)));
  const myKpis = kpis.filter((k) => influence.kpi.has(k.id));
  const myInits = initiatives.filter((i) => visibleInitiative(i, goals, activeRole) && (i.owner === currentOwner || influence.initiative.has(i.id)));
  const myCards = pulseCards.filter((c) => c.status !== 'Done' && (c.owner === currentOwner || activeRole === 'Basic user'));
  const myTasks = tasks.filter((t) => t.owner === currentOwner || (activeRole === 'Basic user' && t.owner === 'Team Leader'));
  const myExceptions = pdcaExceptionQueue(domainSnapshot, domainSnapshot.scope, false).filter(
    (b) => b.owner === currentOwner || myInits.some((i) => i.id === b.targetId)
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Personal Obeya · My Focus"
        subtitle="Accountability cockpit linking X-Matrix KPIs, owned initiatives, daily pulse actions, and open PDCA exceptions."
        actions={
          <div data-tour="myfocus-header" className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <select
              value={currentOwner}
              onChange={(e) => setMyFocusOwner(e.target.value)}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
            >
              {[...new Set([defaultOwner, ...ownerOptions])].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Accountability KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {myKpis.slice(0, 4).map((k) => {
          const st = computeKpiStatus(k);
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => navigate('kpis', k.id)}
              className="text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] p-4 hover:border-teal-600/50 dark:hover:border-teal-400/50 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[var(--muted)]">{k.id}</span>
                <StatusBadge label={st.label} />
              </div>
              <div className="text-xs font-bold text-[var(--ink)]">{k.name}</div>
              <div className="text-lg font-bold font-mono tabular-nums text-[var(--ink)]">
                {st.actual ?? '—'} {k.unit} <span className="text-xs font-normal text-[var(--muted)]">/ {st.target ?? '—'}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Goals */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">Strategic Goals in Scope ({myGoals.length})</h2>
          {myGoals.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No goals directly owned by {currentOwner}.</p>
          ) : (
            <div className="space-y-2">
              {myGoals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => navigate('goal', g.id)}
                  className="w-full text-left rounded-lg border border-[var(--border)] p-3 hover:border-teal-600/50 dark:hover:border-teal-400/50 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--ink)] truncate">
                      <span className="font-mono text-[var(--muted)] mr-1.5">{g.id}</span>
                      {g.title}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">{g.level} · Target {g.target} {g.unit}</div>
                  </div>
                  <StatusBadge label={g.performance} />
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* My Initiatives & SQDC */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">Owned &amp; Supporting Initiatives ({myInits.length})</h2>
          {myInits.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No initiatives linked to {currentOwner}.</p>
          ) : (
            <div className="space-y-2.5">
              {myInits.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => navigate('initiative', i.id)}
                  className="w-full text-left rounded-lg border border-[var(--border)] p-3 hover:border-teal-600/50 dark:hover:border-teal-400/50 transition-colors space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-[var(--ink)]">
                      <span className="font-mono text-[var(--muted)] mr-1.5">{i.id}</span>
                      {i.title}
                    </div>
                    <span className="font-mono text-xs font-bold tabular-nums">{i.progress}%</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SqdcStrip initiative={i} compact />
                    <StatusBadge label={i.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Open Daily Board Kanban Cards */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--ink)]">Open Daily Pulse Cards ({myCards.length})</h2>
            <button
              type="button"
              onClick={() => navigate('daily')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Daily Board
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {myCards.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No open Daily Board cards assigned.</p>
          ) : (
            <div className="space-y-2">
              {myCards.map((c) => (
                <div key={c.id} className="rounded-lg border border-[var(--border)] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--ink)] truncate">
                      <span className="font-mono text-[var(--muted)] mr-1.5">{c.id}</span>
                      {c.title}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {c.scope} · <StatusBadge label={c.status} />
                    </div>
                  </div>
                  {activeRole !== 'Auditor' && (
                    <button
                      type="button"
                      onClick={() => togglePulseCardDone(c.id)}
                      className="rounded border border-[var(--border-strong)] px-2.5 py-1 text-[11px] font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer shrink-0"
                    >
                      ✓ Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Project Tasks */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">Project A3 Tasks ({myTasks.length})</h2>
          {myTasks.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No project tasks assigned directly to {currentOwner}.</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map((t) => (
                <div key={t.id} className="rounded-lg border border-[var(--border)] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--ink)] truncate">{t.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">
                      <button
                        type="button"
                        onClick={() => navigate('project', t.project)}
                        className="font-mono text-teal-700 dark:text-teal-400 hover:underline mr-1.5 cursor-pointer"
                      >
                        {t.project}
                      </button>
                      Due {t.due || '—'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={activeRole === 'Auditor'}
                    onClick={() => toggleTaskStatus(t.id)}
                    className="cursor-pointer shrink-0"
                  >
                    <StatusBadge label={t.status} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {myExceptions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">Active Blockers &amp; Escalations</h2>
          <div className="space-y-3">
            {myExceptions.map((b) => (
              <BlockerBox key={b.id} blocker={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
