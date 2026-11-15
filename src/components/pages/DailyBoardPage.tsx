import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CornerDownRight,
  GripVertical,
  MessageSquare,
  Plus,
  Search,
  Send,
  X,
} from 'lucide-react';
import { ALL_SCOPES, ASSIGNED_DEPARTMENT, ASSIGNED_SITE, PulseCard, SafetyDayState } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  blockerMatchesScope,
  computeKpiStatus,
  isLimitedRole,
  kpiById,
  pdcaExceptionQueue,
  roleCan,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { BlockerBox } from '../ui/BlockerPanel';

const SAFETY_CROSS_SLOTS: Array<number | null> = [
  null, null, 1, 2, 3, null, null,
  null, null, 4, 5, 6, null, null,
  7, 8, 9, 10, 11, 12, 13,
  14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27,
  null, null, 28, 29, 30, null, null,
  null, null, null, 31, null, null, null,
];

const MONTHS_2027 = [
  { value: '2027-01', label: 'Jan 2027' },
  { value: '2027-02', label: 'Feb 2027' },
  { value: '2027-03', label: 'Mar 2027' },
  { value: '2027-04', label: 'Apr 2027' },
  { value: '2027-05', label: 'May 2027' },
  { value: '2027-06', label: 'Jun 2027' },
  { value: '2027-07', label: 'Jul 2027' },
  { value: '2027-08', label: 'Aug 2027' },
  { value: '2027-09', label: 'Sep 2027' },
  { value: '2027-10', label: 'Oct 2027' },
  { value: '2027-11', label: 'Nov 2027' },
  { value: '2027-12', label: 'Dec 2027' },
];

export const DailyBoardPage: React.FC = () => {
  const {
    scope,
    setScope,
    activeRole,
    kpis,
    goals,
    initiatives,
    projects,
    tasks,
    blockers,
    pulseCards,
    safetyCross,
    domainSnapshot,
    dailyTier,
    setDailyTier,
    safetyMonth,
    setSafetyMonth,
    navigate,
    toggleSafetyDay,
    createPulseCard,
    savePulseCardDetails,
    movePulseCardStatus,
    togglePulseCardDone,
    escalatePulseCard,
    delegatePulseCard,
    addPulseCardComment,
    toggleTaskStatus,
  } = useWorkspace();

  const readOnly = activeRole === 'Auditor';
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');
  const [ownerFilter, setOwnerFilter] = useState<string>('ALL');

  // New quick card form
  const [newTitle, setNewTitle] = useState('');
  const [newRoute, setNewRoute] = useState<PulseCard['routeType']>('Direct fix');
  const [newKpi, setNewKpi] = useState('');
  const defaultOwnerForRole = activeRole === 'Basic user' ? 'Team Leader' : activeRole;
  const [newOwner, setNewOwner] = useState(defaultOwnerForRole);
  const [ownerCustomized, setOwnerCustomized] = useState(false);

  useEffect(() => {
    if (!ownerCustomized) {
      setNewOwner(defaultOwnerForRole);
    }
  }, [defaultOwnerForRole, ownerCustomized]);

  // Drag & Drop state
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<PulseCard['status'] | null>(null);

  // Inline Delegate popover state
  const [delegateCardId, setDelegateCardId] = useState<string | null>(null);
  const [delegateScope, setDelegateScope] = useState<string>(ASSIGNED_DEPARTMENT);
  const [delegateOwner, setDelegateOwner] = useState<string>('Team Leader');
  const [delegateNote, setDelegateNote] = useState<string>('');

  // Slide-over Card Detail Drawer
  const [drawerCardId, setDrawerCardId] = useState<string | null>(null);
  const drawerCard = useMemo(
    () => pulseCards.find((c) => c.id === drawerCardId) || null,
    [pulseCards, drawerCardId]
  );
  const [editTitle, setEditTitle] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editRoute, setEditRoute] = useState<PulseCard['routeType']>('Direct fix');
  const [editKpi, setEditKpi] = useState('');
  const [commentText, setCommentText] = useState('');

  const openDrawer = (c: PulseCard) => {
    setDrawerCardId(c.id);
    setEditTitle(c.title);
    setEditDetails(c.details || '');
    setEditDue(c.due || '');
    setEditRoute(c.routeType);
    setEditKpi(c.kpi || '');
    setCommentText('');
  };

  // Safety Cross calculations for active scope + month & YTD cumulative
  const monthCrossDoc = safetyCross.find((s) => s.scope === scope && s.month === safetyMonth);
  const monthDays = monthCrossDoc?.days || {};
  const monthStats = useMemo(() => {
    const vals = Object.values(monthDays);
    return {
      green: vals.filter((v) => v === 'green').length,
      amber: vals.filter((v) => v === 'amber').length,
      red: vals.filter((v) => v === 'red').length,
    };
  }, [monthDays]);

  const ytdYearPrefix = safetyMonth.slice(0, 4);
  const ytdStats = useMemo(() => {
    const matching = safetyCross.filter((s) => s.scope === scope && s.month.startsWith(ytdYearPrefix));
    let green = 0;
    let amber = 0;
    let red = 0;
    for (const m of matching) {
      for (const v of Object.values(m.days || {})) {
        if (v === 'green') green++;
        else if (v === 'amber') amber++;
        else if (v === 'red') red++;
      }
    }
    return { green, amber, red, monthsLogged: matching.length };
  }, [safetyCross, scope, ytdYearPrefix]);

  // Scoped pulse cards
  const scopedCards = useMemo(() => {
    return pulseCards.filter((c) => {
      if (!blockerMatchesScope(c.scope, scope)) return false;
      if (routeFilter !== 'ALL' && c.routeType !== routeFilter) return false;
      if (ownerFilter !== 'ALL' && c.owner !== ownerFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${c.id} ${c.title} ${c.details || ''} ${c.owner} ${c.kpi || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pulseCards, scope, dailyTier, routeFilter, ownerFilter, searchQuery]);

  const uniqueOwners = useMemo(
    () => [...new Set(pulseCards.map((c) => c.owner).filter(Boolean))],
    [pulseCards]
  );

  // Live KPI strip filtered for scope
  const scopedKpis = useMemo(() => {
    if (scope === 'Organization' && !isLimitedRole(activeRole)) return kpis;
    const goalKpis = new Set(
      goals
        .filter((g) => g.level === scope || (scope === ASSIGNED_SITE && g.level.startsWith('Department:')))
        .map((g) => g.kpi)
        .filter(Boolean)
    );
    const filtered = kpis.filter((k) => goalKpis.has(k.id));
    return filtered.length ? filtered : kpis.slice(0, 4);
  }, [kpis, goals, scope, activeRole]);

  // Scoped Team Tasks
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      const p = projects.find((x) => x.id === t.project);
      const init = p ? initiatives.find((i) => i.id === p.initiative) : undefined;
      const g = init ? goals.find((x) => x.id === init.goal) : undefined;
      if (activeRole === 'Basic user') return t.owner === 'Team Leader';
      if (scope === 'Organization') return true;
      return !g || blockerMatchesScope(g.level, scope);
    });
  }, [tasks, projects, initiatives, goals, activeRole, scope]);

  // Tier 2 Site/Department Scorecard tiles
  const tier2Scopes = isLimitedRole(activeRole)
    ? [ASSIGNED_SITE, ASSIGNED_DEPARTMENT]
    : ALL_SCOPES.filter((s) => s !== 'Organization');

  const obeyaExceptions = pdcaExceptionQueue(domainSnapshot, scope, true);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createPulseCard({
      title: newTitle,
      routeType: newRoute,
      kpi: newKpi,
      owner: newOwner || 'Team Leader',
    });
    setNewTitle('');
  };

  const renderKanbanBoard = () => {
    const columns: Array<{ status: PulseCard['status']; title: string; subtitle: string }> = [
      { status: 'Team action', title: 'Team Action', subtitle: 'Owned by shift / tier 1 team' },
      { status: 'Escalated', title: 'Escalated', subtitle: 'Tier 2/3 & PDCA support needed' },
      { status: 'Done', title: 'Done', subtitle: 'Verified & closed countermeasures' },
    ];

    return (
      <div className="space-y-4">
        {/* Filter + Quick Add Toolbar */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Kanban cards..."
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] pl-8 pr-3 py-1.5 text-xs text-[var(--ink)]"
                />
              </div>
              <select
                value={routeFilter}
                onChange={(e) => setRouteFilter(e.target.value)}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink)]"
              >
                <option value="ALL">All paths</option>
                <option value="Direct fix">Direct fix</option>
                <option value="A3">A3</option>
                <option value="Escalate">Escalate</option>
              </select>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink)]"
              >
                <option value="ALL">All owners</option>
                {uniqueOwners.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-[var(--muted)]">
              Drag cards across columns or click any card to inspect details
            </span>
          </div>

          {!readOnly && (
            <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-[var(--border)]">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add Tier 1 deviation, countermeasure, or stand-up action..."
                className="md:col-span-5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--ink)]"
              />
              <select
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value as PulseCard['routeType'])}
                className="md:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
              >
                <option value="Direct fix">Direct fix</option>
                <option value="A3">A3</option>
                <option value="Escalate">Escalate</option>
              </select>
              <select
                value={newKpi}
                onChange={(e) => setNewKpi(e.target.value)}
                className="md:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
              >
                <option value="">No KPI link</option>
                {kpis.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.id} · {k.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newOwner}
                onChange={(e) => {
                  setOwnerCustomized(true);
                  setNewOwner(e.target.value);
                }}
                placeholder="Owner"
                className="md:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
              />
              <button
                type="submit"
                className="md:col-span-1 inline-flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>
          )}
        </Card>

        {/* 3 Kanban Columns with Drag & Drop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colCards = scopedCards.filter((c) => c.status === col.status);
            const isOver = dragOverCol === col.status;
            return (
              <div
                key={col.status}
                onDragOver={(e) => {
                  if (readOnly) return;
                  e.preventDefault();
                  setDragOverCol(col.status);
                }}
                onDragLeave={() => {
                  if (dragOverCol === col.status) setDragOverCol(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverCol(null);
                  const cid = e.dataTransfer.getData('text/plain') || dragCardId;
                  setDragCardId(null);
                  if (cid && !readOnly) {
                    await movePulseCardStatus(cid, col.status);
                  }
                }}
                className={`rounded-xl border p-3.5 space-y-3 min-h-[260px] transition-colors ${
                  isOver
                    ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30'
                    : 'border-[var(--border)] bg-[var(--surface-subtle)]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
                  <div>
                    <div className="text-xs font-bold text-[var(--ink)]">{col.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">{col.subtitle}</div>
                  </div>
                  <span className="font-mono text-xs font-bold tabular-nums text-[var(--muted)]">
                    {colCards.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colCards.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--border-strong)] p-4 text-center text-xs text-[var(--muted)]">
                      Drop cards here
                    </div>
                  ) : (
                    colCards.map((c) => (
                      <div
                        key={c.id}
                        draggable={!readOnly}
                        onDragStart={(e) => {
                          setDragCardId(c.id);
                          e.dataTransfer.setData('text/plain', c.id);
                        }}
                        onDragEnd={() => {
                          setDragCardId(null);
                          setDragOverCol(null);
                        }}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2 hover:border-teal-500 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openDrawer(c)}
                            className="text-left flex-1 min-w-0 cursor-pointer group"
                          >
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              <span className="font-mono font-bold text-[var(--muted)]">{c.id}</span>
                              <StatusBadge label={c.routeType} />
                              {c.blockerId && <StatusBadge label={c.blockerId} tone="red" />}
                            </div>
                            <div className="mt-1 text-xs font-semibold text-[var(--ink)] group-hover:text-teal-600 dark:group-hover:text-teal-400">
                              {c.title}
                            </div>
                          </button>
                          {!readOnly && (
                            <span className="text-[var(--muted)] cursor-grab pt-0.5" title="Drag card">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[var(--muted)]">
                          {c.owner} · {c.scope}
                          {c.due ? ` · Due ${c.due}` : ''}
                          {c.kpi ? ` · ${c.kpi}` : ''}
                        </div>

                        {c.delegatedBy && (
                          <div className="rounded bg-sky-50 px-2 py-1 text-[11px] text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                            Delegated by {c.delegatedBy} ({c.delegatedAt})
                          </div>
                        )}

                        {/* Quick Card Actions */}
                        {!readOnly && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border)]">
                            <button
                              type="button"
                              onClick={() => togglePulseCardDone(c.id)}
                              className="rounded border border-[var(--border-strong)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                            >
                              {c.status === 'Done' ? 'Reopen' : '✓ Done'}
                            </button>
                            {c.status !== 'Escalated' && (
                              <button
                                type="button"
                                onClick={() => escalatePulseCard(c.id)}
                                className="rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300 cursor-pointer"
                              >
                                ↑ Escalate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (delegateCardId === c.id) {
                                  setDelegateCardId(null);
                                } else {
                                  setDelegateCardId(c.id);
                                  setDelegateScope(c.scope || ASSIGNED_DEPARTMENT);
                                  setDelegateOwner('Team Leader');
                                  setDelegateNote('');
                                }
                              }}
                              className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] px-2 py-0.5 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                            >
                              <CornerDownRight className="w-3 h-3" />
                              Delegate
                            </button>
                            {c.project && (
                              <button
                                type="button"
                                onClick={() => navigate('project', c.project)}
                                className="ml-auto text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                              >
                                A3 {c.project}
                              </button>
                            )}
                          </div>
                        )}

                        {delegateCardId === c.id && (
                          <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] p-2.5 space-y-2 text-xs">
                            <div className="font-semibold text-[var(--ink)]">Delegate to Team / Owner</div>
                            <select
                              value={delegateScope}
                              onChange={(e) => setDelegateScope(e.target.value)}
                              className="w-full rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-xs"
                            >
                              {ALL_SCOPES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={delegateOwner}
                              onChange={(e) => setDelegateOwner(e.target.value)}
                              placeholder="New accountable owner"
                              className="w-full rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              value={delegateNote}
                              onChange={(e) => setDelegateNote(e.target.value)}
                              placeholder="Delegation instruction (optional)"
                              className="w-full rounded border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-xs"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDelegateCardId(null)}
                                className="rounded border border-[var(--border-strong)] px-2 py-1 text-[11px]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await delegatePulseCard(c.id, delegateScope, delegateOwner, delegateNote);
                                  setDelegateCardId(null);
                                }}
                                className="rounded bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-700"
                              >
                                Confirm Delegate
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Daily Management Board (Tier 1–3)"
        subtitle="Real-time operational pulse: Safety Cross calendar, Live KPI status, Drag & Drop Kanban escalation/delegation, and synced Team Tasks."
        actions={
          <div className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-0.5">
            {(
              [
                { id: 'tier1', label: 'Tier 1 · Team Pulse' },
                { id: 'tier2', label: 'Tier 2 · Site Scorecard' },
                { id: 'tier3', label: 'Tier 3 · Obeya' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDailyTier(t.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  dailyTier === t.id
                    ? 'bg-teal-600 text-white'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />

      <ScopeBar />

      {/* Tier 1 View */}
      {dailyTier === 'tier1' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Safety & Quality Cross */}
            <Card className="lg:col-span-5 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)]">Safety &amp; Quality Cross</h2>
                  <p className="text-[11px] text-[var(--muted)]">Click day cell: OK → Near-miss → Incident</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <select
                    value={safetyMonth}
                    onChange={(e) => setSafetyMonth(e.target.value)}
                    aria-label="Safety Cross month"
                    className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 text-xs font-semibold text-[var(--ink)] tabular-nums"
                  >
                    {MONTHS_2027.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sc-cross">
                {SAFETY_CROSS_SLOTS.map((dayNum, idx) => {
                  if (dayNum === null) return <div key={`empty-${idx}`} className="sc-cell empty" />;
                  const state = monthDays[String(dayNum)] as SafetyDayState | undefined;
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleSafetyDay(scope, safetyMonth, dayNum)}
                      title={`Day ${dayNum}: ${state === 'green' ? 'Safe / OK' : state === 'amber' ? 'Near-miss / Minor' : state === 'red' ? 'Incident / Deviation' : 'Not logged'}`}
                      className={`sc-cell tabular-nums cursor-pointer ${state || ''}`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)] text-xs">
                <div className="rounded-lg bg-[var(--surface-subtle)]/60 p-2.5 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Selected Month ({safetyMonth})
                  </div>
                  <div className="font-mono tabular-nums text-[var(--ink)]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{monthStats.green} OK</span> ·{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{monthStats.amber} NM</span> ·{' '}
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{monthStats.red} Inc</span>
                  </div>
                </div>
                <div className="rounded-lg bg-[var(--surface-subtle)]/60 p-2.5 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    YTD {ytdYearPrefix} ({ytdStats.monthsLogged} mo)
                  </div>
                  <div className="font-mono tabular-nums text-[var(--ink)]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ytdStats.green} OK</span> ·{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{ytdStats.amber} NM</span> ·{' '}
                    <span className="text-rose-600 dark:text-rose-400 font-bold">{ytdStats.red} Inc</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Live KPI Pulse Panel */}
            <Card className="lg:col-span-7 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[var(--ink)]">Live KPI Pulse ({scope})</h2>
                  <p className="text-[11px] text-[var(--muted)]">Latest monthly actual vs target from KPI Bowling Chart</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('kpis')}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Open KPI Charts →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scopedKpis.map((k) => {
                  const st = computeKpiStatus(k);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => navigate('kpis', k.id)}
                      className="text-left rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 hover:border-teal-500 transition-colors cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-[var(--muted)]">{k.id}</span>
                        <StatusBadge label={st.label} />
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)]">{k.name}</div>
                      <div className="text-sm font-bold font-mono tabular-nums text-[var(--ink)]">
                        {st.actual !== undefined ? `${st.actual} ${k.unit}` : '—'}{' '}
                        <span className="text-xs font-normal text-[var(--muted)]">
                          / Target {st.target !== undefined ? `${st.target} ${k.unit}` : '—'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {renderKanbanBoard()}

          {/* Active Team Tasks synced to Project A3 % */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[var(--ink)]">Active Team Tasks ({visibleTasks.length})</h2>
                <p className="text-xs text-[var(--muted)]">Click task status to cycle Open → In progress → Done (auto-syncs Project A3 &amp; Initiative %)</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Task</th>
                    <th className="px-4 py-2.5 font-semibold">Project A3</th>
                    <th className="px-4 py-2.5 font-semibold">Owner</th>
                    <th className="px-4 py-2.5 font-semibold">Due</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {visibleTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-[var(--surface-subtle)]/40">
                      <td className="px-4 py-2.5 font-semibold text-[var(--ink)]">
                        <span className="font-mono text-[var(--muted)] mr-1.5">{t.id}</span>
                        {t.title}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => navigate('project', t.project)}
                          className="font-mono font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                        >
                          {t.project}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-[var(--muted)]">{t.owner}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-[var(--muted)]">{t.due || '—'}</td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => toggleTaskStatus(t.id)}
                          className="cursor-pointer"
                        >
                          <StatusBadge label={t.status} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tier 2 Site & Department Scorecard */}
      {dailyTier === 'tier2' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tier2Scopes.map((sc) => {
              const scGoals = goals.filter((g) => g.level === sc);
              const offOrRisk = scGoals.filter((g) => {
                const l = computeKpiStatus(kpiById(kpis, g.kpi)).label;
                return l === 'Off track' || l === 'At risk';
              }).length;
              const openBlockers = blockers.filter((b) => b.scope === sc && b.status !== 'Resolved').length;
              const scCards = pulseCards.filter((c) => c.scope === sc && c.status !== 'Done').length;
              const scCross = safetyCross.find((s) => s.scope === sc && s.month === safetyMonth)?.days || {};
              const incidents = Object.values(scCross).filter((v) => v === 'red').length;
              const isSelected = scope === sc;

              return (
                <Card
                  key={sc}
                  className={`p-5 space-y-3 transition-colors ${isSelected ? 'border-teal-500 ring-1 ring-teal-500/40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[var(--ink)]">{sc}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {scGoals.length} goals · {openBlockers} open blockers
                      </div>
                    </div>
                    <StatusBadge
                      label={openBlockers > 0 || offOrRisk > 0 ? 'Attention' : 'Stable'}
                      tone={openBlockers > 0 || offOrRisk > 0 ? 'amber' : 'green'}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center rounded-lg bg-[var(--surface-subtle)]/60 p-2.5 text-xs">
                    <div>
                      <div className="font-mono font-bold tabular-nums text-[var(--ink)]">{offOrRisk}</div>
                      <div className="text-[10px] text-[var(--muted)]">Risk KPIs</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold tabular-nums text-[var(--ink)]">{scCards}</div>
                      <div className="text-[10px] text-[var(--muted)]">Pulse Open</div>
                    </div>
                    <div>
                      <div className="font-mono font-bold tabular-nums text-[var(--ink)]">{incidents}</div>
                      <div className="text-[10px] text-[var(--muted)]">Safety Red</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setScope(sc)}
                      className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      Filter Tier 2 scope
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await setScope(sc);
                        setDailyTier('tier1');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
                    >
                      Open Tier 1
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-bold text-[var(--ink)]">Escalated Items for {scope}</h2>
            {obeyaExceptions.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No open escalations in {scope}.</p>
            ) : (
              <div className="space-y-3">
                {obeyaExceptions.map((b) => (
                  <BlockerBox key={b.id} blocker={b} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tier 3 Management Obeya */}
      {dailyTier === 'tier3' && (
        <div className="space-y-6">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-[var(--ink)]">Tier 3 Management Obeya · Exception Queue ({obeyaExceptions.length})</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('reviews')}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
              >
                Open PDCA Reviews →
              </button>
            </div>
            {obeyaExceptions.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">All strategic goals, KPIs, and initiatives in {scope} are operating within tolerance.</p>
            ) : (
              <div className="space-y-3">
                {obeyaExceptions.map((b) => (
                  <BlockerBox key={b.id} blocker={b} />
                ))}
              </div>
            )}
          </Card>

          {renderKanbanBoard()}
        </div>
      )}

      {/* Card Detail Slide-Over Drawer */}
      {drawerCard && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-[2px] no-print"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDrawerCardId(null);
          }}
        >
          <div className="w-full max-w-xl bg-[var(--surface)] border-l border-[var(--border-strong)] h-full flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-[var(--muted)]">{drawerCard.id}</span>
                  <StatusBadge label={drawerCard.status} />
                  {drawerCard.blockerId && <StatusBadge label={drawerCard.blockerId} tone="red" />}
                </div>
                <h2 className="mt-1 text-base font-bold text-[var(--ink)]">{drawerCard.title}</h2>
                <p className="text-xs text-[var(--muted)]">
                  {drawerCard.scope} · Owner: {drawerCard.owner}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerCardId(null)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Editable Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Card Title</label>
                  <input
                    type="text"
                    disabled={readOnly}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Operational Details / Countermeasure Context</label>
                  <textarea
                    rows={3}
                    disabled={readOnly}
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                    placeholder="Add machine line, shift observations, or immediate containment steps..."
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Routing Path</label>
                    <select
                      disabled={readOnly}
                      value={editRoute}
                      onChange={(e) => setEditRoute(e.target.value as PulseCard['routeType'])}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-xs text-[var(--ink)]"
                    >
                      <option value="Direct fix">Direct fix</option>
                      <option value="A3">A3</option>
                      <option value="Escalate">Escalate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Due Date</label>
                    <input
                      type="date"
                      disabled={readOnly}
                      value={editDue}
                      onChange={(e) => setEditDue(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-xs text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Linked KPI</label>
                    <select
                      disabled={readOnly}
                      value={editKpi}
                      onChange={(e) => setEditKpi(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-xs text-[var(--ink)]"
                    >
                      <option value="">None</option>
                      {kpis.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.id} · {k.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        savePulseCardDetails(drawerCard.id, {
                          title: editTitle,
                          details: editDetails,
                          due: editDue,
                          routeType: editRoute,
                          kpi: editKpi,
                        })
                      }
                      className="rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
                    >
                      Save Card Details
                    </button>
                  </div>
                )}
              </div>

              {/* Linked Governance Strip */}
              {(drawerCard.kpi || drawerCard.initiative || drawerCard.project || drawerCard.blockerId) && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]/50 p-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    Linked Strategy &amp; Escalation Chain
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {drawerCard.kpi && (
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerCardId(null);
                          navigate('kpis', drawerCard.kpi);
                        }}
                        className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold hover:border-teal-500 cursor-pointer"
                      >
                        KPI {drawerCard.kpi} ↗
                      </button>
                    )}
                    {drawerCard.initiative && (
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerCardId(null);
                          navigate('initiative', drawerCard.initiative);
                        }}
                        className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold hover:border-teal-500 cursor-pointer"
                      >
                        Initiative {drawerCard.initiative} ↗
                      </button>
                    )}
                    {drawerCard.project && (
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerCardId(null);
                          navigate('project', drawerCard.project);
                        }}
                        className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold hover:border-teal-500 cursor-pointer"
                      >
                        Project A3 {drawerCard.project} ↗
                      </button>
                    )}
                    {drawerCard.blockerId && (
                      <span className="rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                        Blocker {drawerCard.blockerId}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Stand-up Notes */}
              <div className="space-y-3 border-t border-[var(--border)] pt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                  <span>Stand-Up Notes &amp; Audit Log ({drawerCard.comments.length})</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {drawerCard.comments.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">No stand-up updates logged yet.</p>
                  ) : (
                    drawerCard.comments.map((cm, idx) => (
                      <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5 text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                          <span className="font-semibold text-[var(--ink)]">{cm.by}</span>
                          <span className="font-mono">{cm.at}</span>
                        </div>
                        <p className="text-[var(--ink)]">{cm.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {!readOnly && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!commentText.trim()) return;
                      await addPulseCardComment(drawerCard.id, commentText);
                      setCommentText('');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add stand-up handover note..."
                      className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
