import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Check,
  GitBranch,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  computeKpiStatus,
  isLimitedRole,
  roleCan,
  visibleToRole,
  xm4Ancestors,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { KpisPage } from './PerformancePages';
import { CascadePage } from './StrategyPages';

type GoalsKpisView = 'quick' | 'bowling' | 'goals';

export const GoalsKpisHubPage: React.FC = () => {
  const { t, tScope, tMonth } = useLanguage();
  const {
    scope,
    kpis,
    goals,
    initiatives,
    activeRole,
    routeId,
    navigate,
    updateKpiMonth,
    openQuickCreate,
  } = useWorkspace();

  const initialView: GoalsKpisView =
    routeId === 'bowling' || routeId === 'goals' ? routeId : 'quick';
  const [view, setView] = useState<GoalsKpisView>(initialView);

  // Month selector for inline quick-logging (defaults to current calendar month)
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [savingKpiId, setSavingKpiId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const canCreateGoal = roleCan(activeRole, 'goalCreate', null, { goals, initiatives });
  const canWriteCsv = roleCan(activeRole, 'kpiWrite', { id: 'K-002' }, { goals, initiatives });

  const scopedGoals = useMemo(() => {
    const visible = goals.filter((g) => visibleToRole(g, activeRole));
    if (scope === 'Organization') return visible;
    return visible.filter(
      (g) =>
        g.level === scope ||
        (scope.startsWith('Site:') && xm4Ancestors(goals, g).some((a) => a.level === scope))
    );
  }, [goals, scope, activeRole]);

  const scopedKpis = useMemo(() => {
    let list = kpis;
    if (scope !== 'Organization') {
      const ids = new Set(scopedGoals.map((g) => g.kpi).filter(Boolean));
      list = kpis.filter((k) => ids.has(k.id));
    } else if (activeRole === 'Department director' || activeRole === 'Basic user' || activeRole === 'Auditor') {
      const ids = new Set(scopedGoals.map((g) => g.kpi).filter(Boolean));
      const filtered = kpis.filter((k) => ids.has(k.id));
      list = filtered.length ? filtered : kpis;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (k) =>
          k.id.toLowerCase().includes(q) ||
          k.name.toLowerCase().includes(q) ||
          (k.source || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [kpis, scopedGoals, scope, activeRole, searchQuery]);

  const stats = useMemo(() => {
    let onTrack = 0;
    let attention = 0;
    let missingSelectedMonth = 0;
    for (const k of scopedKpis) {
      const st = computeKpiStatus(k);
      if (st.label === 'On track') onTrack++;
      else if (st.label === 'At risk' || st.label === 'Off track') attention++;
      const mVal = k.values[selectedMonth];
      if (mVal === null || mVal === undefined) missingSelectedMonth++;
    }
    return { onTrack, attention, missingSelectedMonth };
  }, [scopedKpis, selectedMonth]);

  const handleQuickSave = async (kpiId: string) => {
    const kpi = kpis.find((k) => k.id === kpiId);
    if (!kpi) return;
    const raw = draftValues[kpiId];
    const currentActual = kpi.values[selectedMonth];
    const textVal = raw !== undefined ? raw : currentActual !== null && currentActual !== undefined ? String(currentActual) : '';
    const trimmed = textVal.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (trimmed !== '' && !Number.isFinite(parsed)) return;

    setSavingKpiId(kpiId);
    try {
      await updateKpiMonth(kpiId, selectedMonth, parsed, kpi.targets[selectedMonth] ?? null);
      setDraftValues((prev) => {
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
        title={t('Goals & KPIs', 'Mål & KPI')}
        subtitle={t(
          'Fast monthly KPI entry, target tracking, and goal hierarchy in one unified workspace.',
          'Snabb månatlig KPI-inmatning, måluppföljning och målkaskad på ett och samma ställe.'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* View Segmented Switch */}
            <div className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setView('quick')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  view === 'quick'
                    ? 'bg-teal-700 text-white dark:bg-teal-600'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('Quick Entry', 'Snabbinmatning')}</span>
              </button>
              <button
                type="button"
                onClick={() => setView('bowling')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  view === 'bowling'
                    ? 'bg-teal-700 text-white dark:bg-teal-600'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bowling Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setView('goals')}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  view === 'goals'
                    ? 'bg-teal-700 text-white dark:bg-teal-600'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>
                  {t('Goals', 'Mål')} ({scopedGoals.length})
                </span>
              </button>
            </div>

            {canCreateGoal && (
              <button
                type="button"
                onClick={openQuickCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Quick Create', 'Snabbskapa')}</span>
              </button>
            )}
          </div>
        }
      />

      {view === 'quick' && (
        <div className="space-y-5">
          <ScopeBar
            showYear={false}
            rightContent={
              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                <span>
                  {t('On track', 'I fas')}:{' '}
                  <strong className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    {stats.onTrack}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {t('Attention', 'Kräver åtgärd')}:{' '}
                  <strong className="font-mono tabular-nums text-rose-700 dark:text-rose-400">
                    {stats.attention}
                  </strong>
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {t('Missing', 'Saknar utfall')} ({tMonth(selectedMonth)}):{' '}
                  <strong className="font-mono tabular-nums text-[var(--ink)]">
                    {stats.missingSelectedMonth}
                  </strong>
                </span>
              </div>
            }
          />

          {/* Compact Month & Search Toolbar */}
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--muted)]">
                {t('Log actuals for:', 'Registrera utfall för:')}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {Array.from({ length: 12 }, (_, mIdx) => (
                  <button
                    key={mIdx}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(mIdx);
                      setDraftValues({});
                    }}
                    className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedMonth === mIdx
                        ? 'bg-teal-700 text-white dark:bg-teal-600'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {tMonth(mIdx)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Filter KPIs...', 'Filtrera KPI:er...')}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs text-[var(--ink)] w-44"
              />
              {(canWriteCsv || !isLimitedRole(activeRole)) && (
                <button
                  type="button"
                  onClick={() => navigate('import')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              )}
            </div>
          </Card>

          {/* Fast Inline KPI Table */}
          {scopedKpis.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-[var(--ink)]">
                {t('No KPIs found in this scope.', 'Inga KPI:er hittades för vald omfattning.')}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {t(
                  'Create a Goal + KPI package in one step to start tracking monthly results.',
                  'Skapa ett Mål + KPI-paket i ett enda steg för att börja följa månadsresultat.'
                )}
              </p>
              {canCreateGoal && (
                <button
                  type="button"
                  onClick={openQuickCreate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('Create First Goal & KPI', 'Skapa ditt första Mål & KPI')}</span>
                </button>
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">{t('KPI & Linked Goal', 'KPI & kopplat mål')}</th>
                      <th className="px-4 py-2.5 font-semibold text-right">
                        {t('Target', 'Mål')} ({tMonth(selectedMonth)})
                      </th>
                      <th className="px-4 py-2.5 font-semibold">
                        {t('Actual', 'Utfall')} ({tMonth(selectedMonth)})
                      </th>
                      <th className="px-4 py-2.5 font-semibold">{t('Latest Status', 'Aktuell status')}</th>
                      <th className="px-4 py-2.5 font-semibold text-right">{t('Details', 'Detaljer')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {scopedKpis.map((k) => {
                      const st = computeKpiStatus(k);
                      const canWrite = roleCan(activeRole, 'kpiWrite', k, { goals, initiatives });
                      const linkedGoals = scopedGoals.filter((g) => g.kpi === k.id);
                      const mTarget = k.targets[selectedMonth];
                      const mActual = k.values[selectedMonth];
                      const inputVal =
                        draftValues[k.id] !== undefined
                          ? draftValues[k.id]
                          : mActual !== null && mActual !== undefined
                            ? String(mActual)
                            : '';
                      const isDirty =
                        draftValues[k.id] !== undefined &&
                        draftValues[k.id] !== (mActual !== null && mActual !== undefined ? String(mActual) : '');

                      return (
                        <tr key={k.id} className="hover:bg-[var(--surface-subtle)]/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[var(--ink)]">
                              <span className="font-mono text-[var(--muted)] mr-1.5">{k.id}</span>
                              {k.name}
                            </div>
                            <div className="text-[11px] text-[var(--muted)] mt-0.5">
                              {linkedGoals.length > 0
                                ? linkedGoals.map((g) => `${g.id} · ${tScope(g.level)}`).join(' / ')
                                : k.source || t('Workspace KPI', 'Arbetsyte-KPI')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--muted)] whitespace-nowrap">
                            {mTarget !== null && mTarget !== undefined ? `${mTarget} ${k.unit}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {canWrite ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleQuickSave(k.id);
                                }}
                                className="flex items-center gap-1.5"
                              >
                                <input
                                  type="number"
                                  step="any"
                                  value={inputVal}
                                  onChange={(e) =>
                                    setDraftValues((prev) => ({ ...prev, [k.id]: e.target.value }))
                                  }
                                  placeholder="—"
                                  aria-label={`${k.name} ${tMonth(selectedMonth)}`}
                                  className="w-24 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 font-mono tabular-nums text-xs text-[var(--ink)]"
                                />
                                <span className="text-[11px] text-[var(--muted)] shrink-0">{k.unit}</span>
                                <button
                                  type="submit"
                                  disabled={savingKpiId === k.id || !isDirty}
                                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                                    isDirty
                                      ? 'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500'
                                      : 'border border-[var(--border)] text-[var(--muted)] opacity-50 cursor-default'
                                  }`}
                                >
                                  {savingKpiId === k.id ? '...' : t('Save', 'Spara')}
                                </button>
                              </form>
                            ) : (
                              <span className="font-mono font-bold tabular-nums text-[var(--ink)]">
                                {mActual !== null && mActual !== undefined ? `${mActual} ${k.unit}` : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge label={st.label} />
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => navigate('kpis', k.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
                            >
                              <span>{t('Chart', 'Graf')}</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {view === 'bowling' && <KpisPage />}
      {view === 'goals' && <CascadePage />}
    </div>
  );
};
