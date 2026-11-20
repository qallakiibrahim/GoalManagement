import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Check, Compass, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  computeKpiStatus,
  pdcaExceptionQueue,
  roleCan,
  visibleInitiative,
  visibleToRole,
  xm3Data,
  xm3Influence,
} from '../../domain/syncEngine';
import { Card, SectionHeader, SqdcStrip, StatusBadge } from '../ui/Badge';
import { BlockerBox } from '../ui/BlockerPanel';

export const MyFocusPage: React.FC = () => {
  const { t, tScope, tMonth } = useLanguage();
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
    updateKpiMonth,
    openQuickCreate,
  } = useWorkspace();

  const currentMonthIdx = useMemo(() => new Date().getMonth(), []);
  const [kpiDrafts, setKpiDrafts] = useState<Record<string, string>>({});
  const [savingKpiId, setSavingKpiId] = useState<string | null>(null);

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
  const myTasks = tasks.filter((tk) => tk.owner === currentOwner || (activeRole === 'Basic user' && tk.owner === 'Team Leader'));
  const myExceptions = pdcaExceptionQueue(domainSnapshot, domainSnapshot.scope, false).filter(
    (b) => b.owner === currentOwner || myInits.some((i) => i.id === b.targetId)
  );

  const openTaskCount = myTasks.filter((tk) => tk.status !== 'Done').length;
  const kpisMissingThisMonth = myKpis.filter(
    (k) => k.values[currentMonthIdx] === null || k.values[currentMonthIdx] === undefined
  ).length;
  const canCreateGoal = roleCan(activeRole, 'goalCreate', null, { goals, initiatives });

  const handleInlineKpiSave = async (kpiId: string) => {
    const kpi = kpis.find((x) => x.id === kpiId);
    if (!kpi) return;
    const raw = kpiDrafts[kpiId];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (trimmed !== '' && !Number.isFinite(parsed)) return;
    setSavingKpiId(kpiId);
    try {
      await updateKpiMonth(kpiId, currentMonthIdx, parsed, kpi.targets[currentMonthIdx] ?? null);
      setKpiDrafts((prev) => {
        const next = { ...prev };
        delete next[kpiId];
        return next;
      });
    } finally {
      setSavingKpiId(null);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('Personal Obeya · My Focus', 'Personlig Obeya · Mitt fokus')}
        subtitle={t(
          'Accountability cockpit linking X-Matrix KPIs, owned initiatives, daily pulse actions, and open PDCA exceptions.',
          'Ansvarscockpit som samlar dina X-Matrix-KPI:er, initiativ, dagliga pulskort och öppna PDCA-avvikelser.'
        )}
        actions={
          <div data-tour="myfocus-header" className="flex flex-wrap items-center gap-2">
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
            {canCreateGoal && (
              <button
                type="button"
                onClick={openQuickCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Quick Create', 'Snabbskapa')}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Action Needed Today Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--muted)]">
              {t('Open Daily Actions & Tasks', 'Öppna kort & uppgifter')}
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[var(--ink)] mt-0.5">
              {myCards.length + openTaskCount}
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {myCards.length} {t('pulse cards', 'pulskort')} · {openTaskCount} {t('tasks', 'uppgifter')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('daily')}
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer whitespace-nowrap"
          >
            Daily Board →
          </button>
        </Card>

        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--muted)]">
              {t('KPIs Missing Actual', 'KPI:er saknar utfall')} ({tMonth(currentMonthIdx)})
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[var(--ink)] mt-0.5">
              {kpisMissingThisMonth}
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {t('of', 'av')} {myKpis.length} {t('owned KPIs', 'kopplade KPI:er')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('goalskpis')}
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer whitespace-nowrap"
          >
            {t('Log KPIs →', 'Registrera →')}
          </button>
        </Card>

        <Card className="p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--muted)]">
              {t('Active PDCA Exceptions', 'Aktiva PDCA-avvikelser')}
            </div>
            <div
              className={`text-2xl font-bold font-mono tabular-nums mt-0.5 ${
                myExceptions.length > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {myExceptions.length}
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              {myExceptions.length > 0
                ? t('Requires decision or follow-up', 'Kräver beslut eller uppföljning')
                : t('No active escalations', 'Inga aktiva eskaleringar')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('reviews')}
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer whitespace-nowrap"
          >
            PDCA →
          </button>
        </Card>
      </div>

      {/* Accountability KPIs with Inline Quick-Log */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {myKpis.slice(0, 4).map((k) => {
          const st = computeKpiStatus(k);
          const canWrite = roleCan(activeRole, 'kpiWrite', k, { goals, initiatives });
          const mActual = k.values[currentMonthIdx];
          const valStr =
            kpiDrafts[k.id] !== undefined
              ? kpiDrafts[k.id]
              : mActual !== null && mActual !== undefined
                ? String(mActual)
                : '';
          const isDirty =
            kpiDrafts[k.id] !== undefined &&
            kpiDrafts[k.id] !== (mActual !== null && mActual !== undefined ? String(mActual) : '');

          return (
            <Card key={k.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate('kpis', k.id)}
                  className="font-mono text-xs font-bold text-[var(--muted)] hover:text-teal-700 dark:hover:text-teal-400 cursor-pointer"
                >
                  {k.id}
                </button>
                <StatusBadge label={st.label} />
              </div>
              <button
                type="button"
                onClick={() => navigate('kpis', k.id)}
                className="block text-left text-xs font-bold text-[var(--ink)] hover:underline cursor-pointer truncate w-full"
              >
                {k.name}
              </button>
              <div className="text-lg font-bold font-mono tabular-nums text-[var(--ink)]">
                {st.actual ?? '—'} {k.unit}{' '}
                <span className="text-xs font-normal text-[var(--muted)]">/ {st.target ?? '—'}</span>
              </div>
              {canWrite && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleInlineKpiSave(k.id);
                  }}
                  className="flex items-center gap-1.5 pt-2 border-t border-[var(--border)]"
                >
                  <span className="text-[11px] font-medium text-[var(--muted)] shrink-0">
                    {tMonth(currentMonthIdx)}:
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={valStr}
                    onChange={(e) => setKpiDrafts((prev) => ({ ...prev, [k.id]: e.target.value }))}
                    placeholder="—"
                    aria-label={`${k.name} ${tMonth(currentMonthIdx)}`}
                    className="w-full min-w-0 rounded-md border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 font-mono tabular-nums text-xs text-[var(--ink)]"
                  />
                  <button
                    type="submit"
                    disabled={!isDirty || savingKpiId === k.id}
                    title={t('Save actual', 'Spara utfall')}
                    className={`h-7 px-2 inline-flex items-center justify-center rounded-md text-xs font-semibold transition-colors shrink-0 ${
                      isDirty
                        ? 'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 cursor-pointer'
                        : 'border border-[var(--border)] text-[var(--muted)] opacity-50 cursor-default'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Goals */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t('Strategic Goals in Scope', 'Strategiska mål i fokus')} ({myGoals.length})</h2>
          {myGoals.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">{t('No goals directly owned by', 'Inga mål direkt ägda av')} {currentOwner}.</p>
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
                    <div className="text-[11px] text-[var(--muted)]">{tScope(g.level)} · {t('Target', 'Mål')} {g.target} {g.unit}</div>
                  </div>
                  <StatusBadge label={g.performance} />
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* My Initiatives & SQDC */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t('Owned & Supporting Initiatives', 'Egna & stödjande initiativ')} ({myInits.length})</h2>
          {myInits.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">{t('No initiatives linked to', 'Inga initiativ kopplade till')} {currentOwner}.</p>
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
            <h2 className="text-sm font-bold text-[var(--ink)]">{t('Open Daily Pulse Cards', 'Öppna pulskort i Daily Board')} ({myCards.length})</h2>
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
            <p className="text-xs text-[var(--muted)]">{t('No open Daily Board cards assigned.', 'Inga öppna kort i Daily Board tilldelade.')}</p>
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
                      {tScope(c.scope)} · <StatusBadge label={c.status} />
                    </div>
                  </div>
                  {activeRole !== 'Auditor' && (
                    <button
                      type="button"
                      onClick={() => togglePulseCardDone(c.id)}
                      className="rounded border border-[var(--border-strong)] px-2.5 py-1 text-[11px] font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer shrink-0"
                    >
                      {t('✓ Done', '✓ Klar')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My Project Tasks */}
        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t('Project A3 Tasks', 'Projekt-A3 uppgifter')} ({myTasks.length})</h2>
          {myTasks.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">{t('No project tasks assigned directly to', 'Inga projektuppgifter tilldelade direkt till')} {currentOwner}.</p>
          ) : (
            <div className="space-y-2">
              {myTasks.map((tk) => (
                <div key={tk.id} className="rounded-lg border border-[var(--border)] p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--ink)] truncate">{tk.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">
                      <button
                        type="button"
                        onClick={() => navigate('project', tk.project)}
                        className="font-mono text-teal-700 dark:text-teal-400 hover:underline mr-1.5 cursor-pointer"
                      >
                        {tk.project}
                      </button>
                      {t('Due', 'Förfaller')} {tk.due || '—'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={activeRole === 'Auditor'}
                    onClick={() => toggleTaskStatus(tk.id)}
                    className="cursor-pointer shrink-0"
                  >
                    <StatusBadge label={tk.status} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {myExceptions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t('Active Blockers & Escalations', 'Aktiva hinder & eskaleringar')}</h2>
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
