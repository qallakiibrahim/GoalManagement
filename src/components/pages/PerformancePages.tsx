import React, { useMemo, useState } from 'react';
import { Flag, Plus, Upload } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  computeKpiStatus,
  computeKpiStreak,
  kpiById,
  parseCsvText,
  roleCan,
  visibleToRole,
  xm4Ancestors,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { BlockerSection } from '../ui/BlockerPanel';

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
    recordKpiActual,
    escalateBlocker,
  } = useWorkspace();

  const [selectedId, setSelectedId] = useState<string>('');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

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
          title="KPIs &amp; 12-Month Bowling Chart"
          subtitle="Monthly performance tracking synchronized with Goal Targets, CSV Imports, and Automated Exception Detection."
        />
        <ScopeBar showYear={false} />
        <Card className="p-6 text-xs text-[var(--muted)] flex flex-wrap items-center justify-between gap-3">
          <span>No KPIs are linked to goals in {scope}.</span>
          {scope !== 'Organization' && (
            <button
              type="button"
              onClick={() => setScope('Organization')}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              Show Organization KPIs
            </button>
          )}
        </Card>
      </div>
    );
  }

  const st = computeKpiStatus(activeKpi);
  const streak = computeKpiStreak(activeKpi);
  const canWrite = roleCan(activeRole, 'kpiWrite', activeKpi, { goals, initiatives });
  const canEsc = activeRole !== 'Basic user' && activeRole !== 'Auditor';

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
        title="KPIs &amp; 12-Month Bowling Chart"
        subtitle="Monthly performance tracking synchronized with Goal Targets, CSV Imports, and Automated Exception Detection."
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
            {canWrite && (
              <button
                type="button"
                onClick={() => recordKpiActual(activeKpi.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Record Next Month
              </button>
            )}
            {canEsc && (
              <button
                type="button"
                onClick={() => escalateBlocker('kpi', activeKpi.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-500/15 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-300 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                Escalate Blocker
              </button>
            )}
          </div>
        }
      />

      <ScopeBar
        showYear={false}
        rightContent={
          <span className="text-xs text-[var(--muted)]">
            {allowedKpis.length} KPI{allowedKpis.length === 1 ? '' : 's'} in {scope}
            {linkedGoalsForActive.length > 0
              ? ` · Linked: ${linkedGoalsForActive.map((g) => g.id).join(', ')}`
              : ''}
          </span>
        }
      />

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Latest Actual</div>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {st.actual !== undefined ? `${st.actual} ${activeKpi.unit}` : '—'}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {st.month !== undefined ? MONTHS[st.month] : 'No actuals'} · <StatusBadge label={st.label} />
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Month Target</div>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {st.target !== undefined ? `${st.target} ${activeKpi.unit}` : '—'}
          </div>
          <div className="text-xs text-[var(--muted)]">
            Direction: {activeKpi.direction} · Tolerance ±{activeKpi.tolerance}
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Variance / Gap</div>
          <div className="text-2xl font-bold font-mono tabular-nums">
            {st.gap !== null ? `${st.gap >= 0 ? '+' : ''}${st.gap.toFixed(1)} ${activeKpi.unit}` : '—'}
          </div>
          <div className="text-xs text-[var(--muted)]">
            Adverse streak: {streak} month{streak === 1 ? '' : 's'}
          </div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Data Provenance</div>
          <div className="text-sm font-bold text-[var(--ink)] truncate">{activeKpi.source || 'Manual'}</div>
          <div className="text-xs text-[var(--muted)]">
            {activeKpi.sourceUpdated ? `Updated ${activeKpi.sourceUpdated}` : 'Live workspace store'}
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
            <p className="text-xs text-[var(--muted)]">Solid line = Actual performance · Dashed line = Target trajectory</p>
          </div>
          {hoverIdx !== null && (
            <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface-subtle)] px-3 py-1 text-xs font-mono tabular-nums">
              {MONTHS[hoverIdx]}: Actual {activeKpi.values[hoverIdx] ?? '—'} · Target {activeKpi.targets[hoverIdx] ?? '—'}
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56 min-w-[540px]">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const val = yMin + (yMax - yMin) * t;
              const y = yPos(val);
              return (
                <g key={t}>
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
                    {m}
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
      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--ink)]">2027 Bowling Chart</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono tabular-nums">
            <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-3 py-2 text-left font-sans font-semibold">Metric</th>
                {MONTHS.map((m) => (
                  <th key={m} className="px-2 py-2 font-semibold">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-3 py-2.5 text-left font-sans font-semibold text-[var(--muted)]">Target</td>
                {MONTHS.map((_, i) => (
                  <td key={i} className="px-2 py-2.5 text-[var(--muted)]">
                    {activeKpi.targets[i] ?? '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2.5 text-left font-sans font-semibold text-[var(--ink)]">Actual</td>
                {MONTHS.map((_, i) => {
                  const a = activeKpi.values[i];
                  const t = activeKpi.targets[i];
                  let cls = 'text-[var(--muted)]';
                  if (a !== null && a !== undefined && t !== null && t !== undefined) {
                    const gap =
                      activeKpi.direction === 'lower'
                        ? t - a
                        : activeKpi.direction === 'range'
                          ? -Math.abs(a - t)
                          : a - t;
                    cls =
                      gap >= 0
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : gap >= -activeKpi.tolerance
                          ? 'text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-rose-600 dark:text-rose-400 font-bold';
                  }
                  return (
                    <td key={i} className={`px-2 py-2.5 ${cls}`}>
                      {a ?? '—'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <BlockerSection targetType="kpi" targetId={activeKpi.id} title={`KPI ${activeKpi.id} Escalated Blockers`} />
    </div>
  );
};

export const CsvImportPage: React.FC = () => {
  const { kpis, activities, commitCsvImport, navigate } = useWorkspace();
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
        title="CSV KPI Data Import"
        subtitle="Upload or paste monthly KPI actuals and targets (`kpi_id,month,actual,target`) to sync Bowling Charts and Goal status atomically."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-[var(--ink)]">CSV Payload</label>
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold cursor-pointer hover:bg-[var(--surface-subtle)]">
              <Upload className="w-3.5 h-3.5" />
              Choose .csv file
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
              Validated {parsed.records.length} KPI rows ready to commit to Firestore.
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
              Commit {parsed.records.length} Rows
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Available KPI IDs</h3>
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Recent Imports</h3>
            {importLogs.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">No CSV imports recorded yet.</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {importLogs.slice(-5).reverse().map((l) => (
                  <div key={l.id} className="text-[var(--muted)]">
                    <span className="font-mono">{String(l.payload?.date)}</span> · {String(l.payload?.count)} rows
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
