import React, { useMemo, useState } from 'react';
import { Flag, Plus, Upload } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  computeKpiStatus,
  computeKpiStreak,
  kpiById,
  leadershipRole,
  parseCsvText,
  roleCan,
  visibleToRole,
  xm4Ancestors,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { BlockerSection } from '../ui/BlockerPanel';
import { HelpTip } from '../ui/HelpTip';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const KpisPage: React.FC = () => {
  const {
    scope,
    setScope,
    routeId,
    kpis,
    goals,
    initiatives,
    activeRole,
    navigate,
    showModal,
    recordKpiActual,
    updateKpiMonth,
    createKpi,
    escalateBlocker,
  } = useWorkspace();
  const { t, tScope, tMonth } = useLanguage();

  const [selectedId, setSelectedId] = useState<string>('');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [showNewKpi, setShowNewKpi] = useState(false);
  const [newKpiName, setNewKpiName] = useState('');
  const [newKpiUnit, setNewKpiUnit] = useState('%');
  const [newKpiDirection, setNewKpiDirection] = useState<'higher' | 'lower'>('higher');
  const [newKpiTarget, setNewKpiTarget] = useState('75');
  const [newKpiTolerance, setNewKpiTolerance] = useState('2');
  const canCreateKpi = leadershipRole(activeRole);

  const handleCreateKpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpiName.trim()) return;
    const parsedTarget = Number(newKpiTarget);
    const parsedTol = Number(newKpiTolerance);
    const createdId = await createKpi({
      name: newKpiName.trim(),
      unit: newKpiUnit.trim() || '%',
      direction: newKpiDirection,
      monthlyTarget: Number.isFinite(parsedTarget) ? parsedTarget : 0,
      tolerance: Number.isFinite(parsedTol) && parsedTol >= 0 ? parsedTol : 0,
    });
    if (createdId) {
      setNewKpiName('');
      setShowNewKpi(false);
      setSelectedId(createdId);
      navigate('kpis', createdId);
    }
  };

  const renderNewKpiForm = () =>
    showNewKpi && canCreateKpi ? (
      <Card className="p-5 space-y-3 border-teal-600/30 dark:border-teal-400/30">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--ink)]">{t('Create New KPI', 'Skapa ny KPI')}</h2>
          <button
            type="button"
            onClick={() => setShowNewKpi(false)}
            className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            {t('Cancel', 'Avbryt')}
          </button>
        </div>
        <form onSubmit={handleCreateKpiSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-4">
            <label className="block font-semibold text-[var(--muted)] mb-1">{t('KPI Name', 'KPI-namn')}</label>
            <input
              type="text"
              required
              value={newKpiName}
              onChange={(e) => setNewKpiName(e.target.value)}
              placeholder={t('e.g. Overall Equipment Effectiveness (OEE)', 't.ex. Tillgänglighet / OEE')}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-[var(--muted)] mb-1">{t('Unit', 'Enhet')}</label>
            <input
              type="text"
              value={newKpiUnit}
              onChange={(e) => setNewKpiUnit(e.target.value)}
              placeholder="%, min, SEK..."
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-[var(--muted)] mb-1">{t('Direction', 'Riktning')}</label>
            <select
              value={newKpiDirection}
              onChange={(e) => setNewKpiDirection(e.target.value as 'higher' | 'lower')}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2"
            >
              <option value="higher">{t('Higher is better', 'Högre är bättre')}</option>
              <option value="lower">{t('Lower is better', 'Lägre är bättre')}</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-[var(--muted)] mb-1">{t('Monthly Target', 'Månadsmål')}</label>
            <input
              type="number"
              step="any"
              value={newKpiTarget}
              onChange={(e) => setNewKpiTarget(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 font-mono tabular-nums"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block font-semibold text-[var(--muted)] mb-1">Tol ±</label>
            <input
              type="number"
              step="any"
              min="0"
              value={newKpiTolerance}
              onChange={(e) => setNewKpiTolerance(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 font-mono tabular-nums"
            />
          </div>
          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
            >
              {t('Save', 'Spara')}
            </button>
          </div>
        </form>
      </Card>
    ) : null;

  const scopedGoals = useMemo(() => {
    const visibleGoals = goals.filter((g) => visibleToRole(g, activeRole));
    if (scope === 'Organization') return visibleGoals;
    return visibleGoals.filter(
      (g) =>
        g.level === scope ||
        (scope.startsWith('Site:') && xm4Ancestors(goals, g).some((a) => a.level === scope))
    );
  }, [goals, scope, activeRole]);

  const allowedKpis = useMemo(() => {
    if (scope === 'Organization') {
      if (activeRole === 'Department director' || activeRole === 'Basic user' || activeRole === 'Auditor') {
        const roleKpiIds = new Set(scopedGoals.map((g) => g.kpi).filter(Boolean));
        const list = kpis.filter((k) => roleKpiIds.has(k.id));
        return list.length ? list : kpis;
      }
      return kpis;
    }
    const scopedKpiIds = new Set(scopedGoals.map((g) => g.kpi).filter(Boolean));
    return kpis.filter((k) => scopedKpiIds.has(k.id));
  }, [kpis, scopedGoals, scope, activeRole]);

  const activeKpi =
    kpiById(allowedKpis, routeId) || kpiById(allowedKpis, selectedId) || allowedKpis[0];

  const linkedGoalsForActive = useMemo(() => {
    if (!activeKpi) return [];
    return scopedGoals.filter((g) => g.kpi === activeKpi.id);
  }, [scopedGoals, activeKpi]);

  if (!activeKpi) {
    return (
      <div className="space-y-6">
        <SectionHeader
          title={t('KPIs & 12-Month Bowling Chart', 'KPI:er & 12-månaders Bowling Chart')}
          subtitle={t(
            'Monthly performance tracking synchronized with Goal Targets, CSV Imports, and Automated Exception Detection.',
            'Månatlig resultatuppföljning synkroniserad med målvärden, CSV-import och automatisk avvikelsesignalering.'
          )}
          actions={
            canCreateKpi ? (
              <button
                type="button"
                onClick={() => setShowNewKpi((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('New KPI', 'Ny KPI')}
              </button>
            ) : undefined
          }
        />
        <ScopeBar showYear={false} />
        {renderNewKpiForm()}
        <Card className="p-6 text-xs text-[var(--muted)] flex flex-wrap items-center justify-between gap-3">
          <span>
            {kpis.length === 0
              ? t(
                  'No KPIs created in this workspace yet. Create your first KPI to connect goals and start the 12-month Bowling Chart.',
                  'Inga KPI:er finns i denna arbetsyta ännu. Skapa din första KPI för att koppla mål och börja följa 12-månaders Bowling Chart.'
                )
              : `${t('No KPIs are linked to goals in', 'Inga KPI:er är kopplade till mål inom')} ${tScope(scope)}.`}
          </span>
          <div className="flex items-center gap-2">
            {canCreateKpi && !showNewKpi && (
              <button
                type="button"
                onClick={() => setShowNewKpi(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Create First KPI', 'Skapa första KPI:n')}
              </button>
            )}
            {scope !== 'Organization' && (
              <button
                type="button"
                onClick={() => setScope('Organization')}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer"
              >
                {t('Show Organization KPIs', 'Visa koncernens KPI:er')}
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const st = computeKpiStatus(activeKpi);
  const streak = computeKpiStreak(activeKpi);
  const canWrite = roleCan(activeRole, 'kpiWrite', activeKpi, { goals, initiatives });
  const canEsc = activeRole !== 'Basic user' && activeRole !== 'Auditor';

  const openMonthEditor = async (monthIndex: number) => {
    if (!canWrite) return;
    const currentActual = activeKpi.values[monthIndex] ?? null;
    const currentTarget = activeKpi.targets[monthIndex] ?? null;
    const mLabel = tMonth(monthIndex);
    const result = await showModal({
      type: 'kpiMonth',
      title: `${t('Edit', 'Redigera')} ${mLabel} 2027`,
      message: `${t('Update monthly actual or target for', 'Uppdatera månadens utfall eller mål för')} ${activeKpi.id} · ${activeKpi.name}.`,
      kpiMonth: {
        kpiId: activeKpi.id,
        monthIndex,
        monthLabel: mLabel,
        unit: activeKpi.unit,
        actual: currentActual,
        target: currentTarget,
      },
    });
    if (!result) return;
    await updateKpiMonth(activeKpi.id, monthIndex, result.actual, result.target);
  };

  // Responsive SVG Line Chart geometry
  const numericVals = [
    ...activeKpi.values.filter((v): v is number => v !== null && v !== undefined),
    ...activeKpi.targets.filter((v): v is number => v !== null && v !== undefined),
  ];
  const rawMin = numericVals.length ? Math.min(...numericVals) : 0;
  const rawMax = numericVals.length ? Math.max(...numericVals) : 100;
  const pad = Math.max(2, (rawMax - rawMin) * 0.15);
  const yMin = rawMin - pad;
  const yMax = rawMax + pad;

  const w = 720;
  const h = 230;
  const ml = 46;
  const mr = 20;
  const mt = 18;
  const mb = 28;
  const plotW = w - ml - mr;
  const plotH = h - mt - mb;

  const xPos = (i: number) => ml + (i / 11) * plotW;
  const yPos = (v: number) => mt + plotH - ((v - yMin) / Math.max(0.001, yMax - yMin)) * plotH;

  const targetPoints = activeKpi.targets
    .map((v, i) => (v !== null && v !== undefined ? `${xPos(i)},${yPos(v)}` : null))
    .filter(Boolean)
    .join(' ');
  const actualPoints = activeKpi.values
    .map((v, i) => (v !== null && v !== undefined ? `${xPos(i)},${yPos(v)}` : null))
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('KPIs & 12-Month Bowling Chart', 'KPI:er & 12-månaders Bowling Chart')}
        subtitle={t(
          'Monthly performance tracking synchronized with Goal Targets, CSV Imports, and Automated Exception Detection.',
          'Månatlig resultatuppföljning synkroniserad med målvärden, CSV-import och automatisk avvikelsesignalering.'
        )}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeKpi.id}
              onChange={(e) => {
                setSelectedId(e.target.value);
                navigate('kpis', e.target.value);
              }}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
            >
              {allowedKpis.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.id} · {k.name}
                </option>
              ))}
            </select>
            {canCreateKpi && (
              <button
                type="button"
                onClick={() => setShowNewKpi((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('New KPI', 'Ny KPI')}
              </button>
            )}
            {canWrite && (
              <button
                type="button"
                onClick={() => recordKpiActual(activeKpi.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Record Next Month', 'Registrera nästa månad')}
              </button>
            )}
            {canEsc && (
              <button
                type="button"
                onClick={() => escalateBlocker('kpi', activeKpi.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-500/15 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                {t('Escalate Blocker', 'Eskalera hinder')}
              </button>
            )}
          </div>
        }
      />

      {renderNewKpiForm()}

      <ScopeBar
        showYear={false}
        rightContent={
          <span className="text-xs text-[var(--muted)]">
            {allowedKpis.length} {allowedKpis.length === 1 ? 'KPI' : t('KPIs', 'KPI:er')} {t('in', 'i')} {tScope(scope)}
            {linkedGoalsForActive.length > 0
              ? ` · ${t('Linked', 'Kopplade mål')}: ${linkedGoalsForActive.map((g) => g.id).join(', ')}`
              : ''}
          </span>
        }
      />

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{t('Latest Actual', 'Senaste utfall')}</div>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {st.actual !== undefined ? `${st.actual} ${activeKpi.unit}` : '—'}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {st.month !== undefined ? tMonth(st.month) : t('No actuals', 'Inga utfall')} · <StatusBadge label={st.label} />
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            <span>{t('Month Target', 'Månadsmål')}</span>
            <HelpTip
              title="Statusberäkning (Direction & Tolerance)"
              body="SafeQMS beräknar avvikelsen (gap) utifrån riktning: 'higher' = Actual − Target, 'lower' = Target − Actual, 'range' = −|Actual − Target|. Gap ≥ 0 ger On track (grön), gap ≥ −tolerance ger At risk (gul), sämre ger Off track (röd)."
              note="En röd månad (Off track) eller två gula månader i rad (At risk ≥ 2) skapar automatiskt en PDCA-signal i Exception Queue."
              chapterId={8}
            />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {st.target !== undefined ? `${st.target} ${activeKpi.unit}` : '—'}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {t('Direction', 'Riktning')}:{' '}
            {activeKpi.direction === 'higher'
              ? t('Higher is better', 'Högre är bättre')
              : activeKpi.direction === 'lower'
                ? t('Lower is better', 'Lägre är bättre')
                : activeKpi.direction}{' '}
            · {t('Tolerance', 'Tolerans')} ±{activeKpi.tolerance}
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{t('Variance / Gap', 'Avvikelse / Gap')}</div>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {st.gap !== null ? `${st.gap >= 0 ? '+' : ''}${st.gap.toFixed(1)} ${activeKpi.unit}` : '—'}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {t('Adverse streak', 'Avvikelsesvit')}: {streak} {streak === 1 ? t('month', 'månad') : t('months', 'månader')}
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{t('Data Provenance', 'Datakälla')}</div>
          <div className="text-sm font-bold text-[var(--ink)] truncate">{activeKpi.source || t('Manual', 'Manuell')}</div>
          <div className="text-xs text-[var(--muted)]">
            {activeKpi.sourceUpdated ? `${t('Updated', 'Uppdaterad')} ${activeKpi.sourceUpdated}` : t('Live workspace store', 'Direkt i arbetsytan')}
          </div>
        </Card>
      </div>

      {/* Responsive SVG Line Chart */}
      <Card className="p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[var(--ink)]">
              {activeKpi.id} · {activeKpi.name} ({activeKpi.unit})
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {t('Solid line = Actual performance · Dashed line = Target trajectory', 'Heldragen linje = Utfall · Streckad linje = Målkurva')}
            </p>
          </div>
          {hoverIdx !== null && (
            <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 py-1 text-xs font-mono tabular-nums">
              {tMonth(hoverIdx)}: {t('Actual', 'Utfall')} {activeKpi.values[hoverIdx] ?? '—'} · {t('Target', 'Mål')} {activeKpi.targets[hoverIdx] ?? '—'}
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56 min-w-[540px]">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const val = yMin + (yMax - yMin) * tick;
              const y = yPos(val);
              return (
                <g key={tick}>
                  <line x1={ml} x2={w - mr} y1={y} y2={y} stroke="var(--svg-grid)" strokeWidth="1" />
                  <text x={ml - 8} y={y + 4} textAnchor="end" fontSize="10" fill="var(--svg-text)">
                    {val.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {targetPoints && (
              <polyline
                fill="none"
                stroke="var(--svg-axis)"
                strokeWidth="2"
                strokeDasharray="5 4"
                points={targetPoints}
              />
            )}
            {actualPoints && (
              <polyline
                fill="none"
                stroke="var(--teal)"
                strokeWidth="2.5"
                points={actualPoints}
              />
            )}

            {MONTHS.map((m, i) => {
              const x = xPos(i);
              const act = activeKpi.values[i];
              return (
                <g key={m} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
                  <text x={x} y={h - 6} textAnchor="middle" fontSize="10" fill="var(--svg-text)">
                    {tMonth(i)}
                  </text>
                  {act !== null && act !== undefined && (
                    <circle
                      cx={x}
                      cy={yPos(act)}
                      r={hoverIdx === i ? 5.5 : 4}
                      fill="var(--teal)"
                      stroke="var(--surface)"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </Card>

      {/* 12-Month Bowling Chart Table */}
      <div data-tour="kpi-bowling">
      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-[var(--ink)]">2027 Bowling Chart</h2>
            <HelpTip
              title="12-månaders Bowling Chart"
              body="Klicka på valfri månadscell (Target eller Actual) för att mata in eller justera utfallet direkt. Du kan även använda 'Record Next Month' eller CSV-import."
              note="KPI-status styr enbart utfallsprestation — projektens framdriftsprocent (%) uppdateras separat via ProjectTasks."
              chapterId={8}
            />
          </div>
          {canWrite && (
            <span className="text-xs text-[var(--muted)]">
              {t('Click any month cell to edit Target or Actual', 'Klicka på valfri månadscell för att redigera Mål eller Utfall')}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono tabular-nums">
            <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-3 py-2 text-left font-sans font-semibold">{t('Metric', 'Mått')}</th>
                {MONTHS.map((m, i) => (
                  <th key={m} className="p-0 font-semibold">
                    {canWrite ? (
                      <button
                        type="button"
                        onClick={() => openMonthEditor(i)}
                        title={`${t('Edit', 'Redigera')} ${tMonth(i)} 2027`}
                        className="w-full px-2 py-2 hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                      >
                        {tMonth(i)}
                      </button>
                    ) : (
                      <span className="block px-2 py-2">{tMonth(i)}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-3 py-2.5 text-left font-sans font-semibold text-[var(--muted)]">{t('Target', 'Mål')}</td>
                {MONTHS.map((m, i) => {
                  const val = activeKpi.targets[i] ?? '—';
                  return (
                    <td key={m} className="p-0 text-[var(--muted)]">
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={() => openMonthEditor(i)}
                          title={`${t('Edit Target', 'Redigera mål')} · ${tMonth(i)}`}
                          className="w-full px-2 py-2.5 hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                        >
                          {val}
                        </button>
                      ) : (
                        <span className="block px-2 py-2.5">{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-3 py-2.5 text-left font-sans font-semibold text-[var(--ink)]">{t('Actual', 'Utfall')}</td>
                {MONTHS.map((m, i) => {
                  const a = activeKpi.values[i];
                  const tgt = activeKpi.targets[i];
                  let cls = 'text-[var(--muted)]';
                  if (a !== null && a !== undefined && tgt !== null && tgt !== undefined) {
                    const gap =
                      activeKpi.direction === 'lower'
                        ? tgt - a
                        : activeKpi.direction === 'range'
                          ? -Math.abs(a - tgt)
                          : a - tgt;
                    cls =
                      gap >= 0
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : gap >= -activeKpi.tolerance
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-rose-600 dark:text-rose-400 font-bold';
                  }
                  return (
                    <td key={m} className={`p-0 ${cls}`}>
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={() => openMonthEditor(i)}
                          title={`${t('Edit Actual', 'Redigera utfall')} · ${tMonth(i)}`}
                          className="w-full px-2 py-2.5 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
                        >
                          {a ?? '—'}
                        </button>
                      ) : (
                        <span className="block px-2 py-2.5">{a ?? '—'}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      </div>

      <BlockerSection targetType="kpi" targetId={activeKpi.id} title={`KPI ${activeKpi.id} · ${t('Escalated Blockers', 'Eskalerade hinder')}`} />
    </div>
  );
};

export const CsvImportPage: React.FC = () => {
  const { kpis, activities, commitCsvImport, navigate } = useWorkspace();
  const { t } = useLanguage();
  const [csvText, setCsvText] = useState(
    'kpi_id,month,actual,target\nK-001,Aug,74,75\nK-002,Aug,45,42\nK-007,Aug,96,96'
  );

  const parsed = useMemo(() => parseCsvText(csvText, kpis), [csvText, kpis]);
  const importLogs = activities.filter((a) => a.kind === 'csvImport');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const txt = await f.text();
    setCsvText(txt);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t('CSV KPI Data Import', 'CSV-import av KPI-data')}
        subtitle={t(
          'Upload or paste monthly KPI actuals and targets (kpi_id,month,actual,target) to sync Bowling Charts and Goal status atomically.',
          'Ladda upp eller klistra in månatliga KPI-utfall och mål (kpi_id,month,actual,target) för att synkronisera Bowling Charts och målstatus automatiskt.'
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-[var(--ink)]">{t('CSV Payload', 'CSV-innehåll')}</label>
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-[var(--surface-subtle)]">
              <Upload className="w-3.5 h-3.5" />
              {t('Choose .csv file', 'Välj .csv-fil')}
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </label>
          </div>
          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] p-3 font-mono text-xs text-[var(--ink)]"
          />

          {parsed.errors.length > 0 && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200 space-y-1">
              {parsed.errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          {parsed.records.length > 0 && parsed.errors.length === 0 && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {t('Validated', 'Validerade')} {parsed.records.length} {t('KPI rows ready to commit to Firestore.', 'KPI-rader redo att importeras.')}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={parsed.errors.length > 0 || parsed.records.length === 0}
              onClick={async () => {
                const ok = await commitCsvImport(parsed.records);
                if (ok) navigate('kpis');
              }}
              className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t('Commit', 'Importera')} {parsed.records.length} {t('Rows', 'rader')}
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t('Available KPI IDs', 'Tillgängliga KPI-ID:n')}</h3>
            <div className="space-y-1.5 text-xs">
              {kpis.map((k) => (
                <div key={k.id} className="flex items-center justify-between">
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{k.id}</span>
                  <span className="truncate ml-2 text-[var(--muted)]">{k.name} ({k.unit})</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{t('Recent Imports', 'Senaste importer')}</h3>
            {importLogs.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">{t('No CSV imports recorded yet.', 'Inga CSV-importer registrerade ännu.')}</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {importLogs.slice(-5).reverse().map((l) => (
                  <div key={l.id} className="text-[var(--muted)]">
                    <span className="font-mono">{String(l.payload?.date)}</span> · {String(l.payload?.count)} {t('rows', 'rader')}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
