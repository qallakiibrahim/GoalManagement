import React, { useMemo, useState } from 'react';
import { Printer, Table2 } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  computeKpiStatus,
  goalById,
  initById,
  kpiById,
  roleCan,
  xm3Data,
  xm3Impact,
  xm3Influence,
  xm3OwnerImpact,
  xm4HierarchyStrength,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';

type Selection =
  | { kind: 'none' }
  | { kind: 'node'; type: 'corp' | 'annual' | 'initiative' | 'kpi' | 'owner'; id: string }
  | { kind: 'cell'; sector: 'tl' | 'tr' | 'bl' | 'br'; from: string; to: string };

export const XMatrixPage: React.FC = () => {
  const {
    scope,
    year,
    activeRole,
    goals,
    initiatives,
    relations,
    kpiOwners,
    domainSnapshot,
    navigate,
    cycleMatrixRelation,
    editMatrixNote,
    cycleKpiOwner,
    editKpiOwnerNote,
  } = useWorkspace();

  const [strongOnly, setStrongOnly] = useState(false);
  const [showTables, setShowTables] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: 'none' });

  const xData = useMemo(() => xm3Data(domainSnapshot), [domainSnapshot]);

  const activeInfluence = useMemo(() => {
    if (selection.kind === 'node') {
      return xm3Influence(domainSnapshot, xData, selection.type, selection.id);
    }
    if (selection.kind === 'cell') {
      const m = xm3Influence(domainSnapshot, xData, selection.sector === 'br' ? 'kpi' : selection.sector === 'bl' ? 'annual' : 'initiative', selection.sector === 'br' ? selection.from : selection.sector === 'bl' ? selection.from : selection.from);
      return m;
    }
    return null;
  }, [selection, domainSnapshot, xData]);

  const dotClass = (strength: number, variant: '' | 'blue' | 'owner' = '') => {
    const level = strength >= 2 ? 'strong' : strength >= 1 ? 'medium' : strength > 0 ? 'weak' : 'none';
    return `xm3-dot ${variant} ${level}`.trim();
  };

  const labelClass = (type: 'corp' | 'annual' | 'initiative' | 'kpi' | 'owner', id: string, base: string) => {
    if (!activeInfluence) return base;
    if (selection.kind === 'node' && selection.type === type && selection.id === id) return `${base} xm3-selected`;
    if (activeInfluence[type].has(id)) return `${base} xm3-related`;
    return `${base} xm3-muted`;
  };

  const boardStyle = {
    '--xm-a': Math.max(1, xData.annual.length),
    '--xm-k': Math.max(1, xData.kpis.length),
    '--xm-i': Math.max(1, xData.initiatives.length),
    '--xm-c': Math.max(1, xData.org.length),
    '--xm-o': Math.max(1, xData.owners.length),
    '--xm-top': `${Math.max(190, xData.initiatives.length * 48)}px`,
    '--xm-bottom': `${Math.max(190, Math.max(xData.org.length, xData.owners.length) * 48)}px`,
    '--xm-left': `${Math.max(260, xData.annual.length * 56)}px`,
    '--xm-right': `${Math.max(260, xData.kpis.length * 56)}px`,
  } as React.CSSProperties;

  const canEditCell = (from: string, to: string) => roleCan(activeRole, 'matrixEdit', { from, to }, { goals, initiatives });
  const canEditOwner = activeRole === 'Administratör' || activeRole === 'General director' || activeRole === 'QMS auditor' || activeRole === 'Department director';

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Hoshin Kanri 360° X-Matrix"
        subtitle="Connect Multi-Year Pillars (Bottom) → Annual Goals (Left) → Initiatives (Top) → KPIs (Right) → Cross-Functional Owners (SE Wing)."
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={strongOnly}
                onChange={(e) => setStrongOnly(e.target.checked)}
              />
              Strong / Primary Only
            </label>
            <button
              type="button"
              onClick={() => setShowTables((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              <Table2 className="w-3.5 h-3.5" />
              {showTables ? 'Hide Tables' : 'Relationship Tables'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Matrix
            </button>
          </div>
        }
      />

      <ScopeBar
        rightContent={
          selection.kind !== 'none' && (
            <button
              type="button"
              onClick={() => setSelection({ kind: 'none' })}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline cursor-pointer"
            >
              Clear X-Matrix Highlight
            </button>
          )
        }
      />

      {/* Interactive 360° Board */}
      <div className="xm3-scroller">
        <div className="xm3-board" style={boardStyle}>
          {/* NW: Annual Goals x Initiatives */}
          <div className="xm3-grid xm3-tl">
            {xData.initiatives.map((init) =>
              xData.annual.map((g) => {
                const s = xm3Impact(relations, g.id, init.id);
                const shown = strongOnly && s < 2 ? 0 : s;
                const isChosen = selection.kind === 'cell' && selection.sector === 'tl' && selection.from === g.id && selection.to === init.id;
                const isRelated = Boolean(activeInfluence && activeInfluence.annual.has(g.id) && activeInfluence.initiative.has(init.id));
                const isMuted = Boolean(activeInfluence && !isRelated);
                return (
                  <button
                    key={`${g.id}-${init.id}`}
                    type="button"
                    onClick={() => setSelection({ kind: 'cell', sector: 'tl', from: g.id, to: init.id })}
                    onDoubleClick={() => cycleMatrixRelation(g.id, init.id)}
                    title={`${g.id} → ${init.id} (${s === 2 ? 'Strong' : s === 1 ? 'Medium' : s === 0.5 ? 'Weak' : 'None'}). Click to inspect, double-click to cycle.`}
                    className={`xm3-cell ${isChosen ? 'xm3-chosen' : isRelated ? 'xm3-related' : isMuted ? 'xm3-muted' : ''}`}
                  >
                    <span className={dotClass(shown)} />
                  </button>
                );
              })
            )}
          </div>

          {/* N: Initiatives List */}
          <div className="xm3-toplist">
            {xData.initiatives.map((init) => (
              <button
                key={init.id}
                type="button"
                onClick={() => setSelection({ kind: 'node', type: 'initiative', id: init.id })}
                className={labelClass('initiative', init.id, 'xm3-label')}
              >
                <span className="xm3-id">{init.id}</span>
                <span className="xm3-name">{init.title}</span>
                <span className="xm3-person">{init.owner}</span>
              </button>
            ))}
          </div>

          {/* NE: Initiatives x KPIs */}
          <div className="xm3-grid xm3-tr">
            {xData.initiatives.map((init) =>
              xData.kpis.map((k) => {
                const s = xm3Impact(relations, init.id, k.id);
                const shown = strongOnly && s < 2 ? 0 : s;
                const isChosen = selection.kind === 'cell' && selection.sector === 'tr' && selection.from === init.id && selection.to === k.id;
                const isRelated = Boolean(activeInfluence && activeInfluence.initiative.has(init.id) && activeInfluence.kpi.has(k.id));
                const isMuted = Boolean(activeInfluence && !isRelated);
                return (
                  <button
                    key={`${init.id}-${k.id}`}
                    type="button"
                    onClick={() => setSelection({ kind: 'cell', sector: 'tr', from: init.id, to: k.id })}
                    onDoubleClick={() => cycleMatrixRelation(init.id, k.id)}
                    title={`${init.id} → ${k.id}. Click to inspect, double-click to cycle.`}
                    className={`xm3-cell ${isChosen ? 'xm3-chosen' : isRelated ? 'xm3-related' : isMuted ? 'xm3-muted' : ''}`}
                  >
                    <span className={dotClass(shown)} />
                  </button>
                );
              })
            )}
          </div>

          {/* Top-right Legend */}
          <div className="xm3-legendpanel text-[11px]">
            <div className="font-bold text-[var(--ink)] mb-1">Matrix Legend</div>
            <div className="flex items-center gap-2"><span className="xm3-dot strong" /> <span>Strong / Primary Owner (●)</span></div>
            <div className="flex items-center gap-2"><span className="xm3-dot medium" /> <span>Medium / Support (◐)</span></div>
            <div className="flex items-center gap-2"><span className="xm3-dot weak" /> <span>Weak link (○)</span></div>
            <div className="flex items-center gap-2"><span className="xm3-dot blue strong" /> <span>Hierarchy parent (SW)</span></div>
            <div className="flex items-center gap-2"><span className="xm3-dot owner strong" /> <span>SE Cross-Functional Owner</span></div>
          </div>

          {/* W: Annual Goals Axis */}
          <div className="xm3-leftaxis">
            {xData.annual.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelection({ kind: 'node', type: 'annual', id: g.id })}
                className={labelClass('annual', g.id, 'xm3-axis')}
              >
                <span className="xm3-verticalid">{g.id}</span>
                <span className="xm3-vertical">{g.title}</span>
              </button>
            ))}
          </div>

          {/* Core Compass */}
          <div className="xm3-core">
            <div className="xm3-quadrant xm3-qtop"><span>Initiatives (How)</span></div>
            <div className="xm3-quadrant xm3-qleft"><span>Annual Goals</span></div>
            <div className="xm3-quadrant xm3-qright"><span>KPIs (Metrics)</span></div>
            <div className="xm3-quadrant xm3-qbottom"><span>Breakthrough Pillars</span></div>
            <div className="xm3-inner">
              <div className="text-[10px] font-mono font-bold uppercase text-teal-600 dark:text-teal-400">Hoshin 360°</div>
              <div className="text-xs font-bold leading-tight mt-0.5">{scope}</div>
              <div className="text-[11px] text-[var(--muted)] tabular-nums">{year}</div>
            </div>
          </div>

          {/* E: KPI Axis */}
          <div className="xm3-rightaxis">
            {xData.kpis.map((k) => {
              const st = computeKpiStatus(k);
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setSelection({ kind: 'node', type: 'kpi', id: k.id })}
                  className={labelClass('kpi', k.id, 'xm3-axis')}
                >
                  <span className="xm3-verticalid">{k.id}</span>
                  <span className="xm3-vertical">{k.name}</span>
                  <span className={`text-[10px] font-bold font-mono ${st.label === 'On track' ? 'text-emerald-600' : st.label === 'At risk' ? 'text-amber-600' : 'text-rose-600'}`}>
                    {st.actual ?? '—'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SE Header */}
          <div className="xm3-ownerwinghead">
            <div className="text-xs font-bold text-[var(--owner)]">Cross-Functional Ownership</div>
            <div className="text-[11px] text-[var(--muted)]">Accountable KPI Leaders &amp; Support</div>
          </div>

          {/* SW: Annual Goals x Multi-Year Pillars */}
          <div className="xm3-grid xm3-bl">
            {xData.org.map((pillar) =>
              xData.annual.map((g) => {
                const hs = xm4HierarchyStrength(goals, g.id, pillar.id);
                const shown = strongOnly && hs < 2 ? 0 : hs;
                const isChosen = selection.kind === 'cell' && selection.sector === 'bl' && selection.from === g.id && selection.to === pillar.id;
                const isRelated = Boolean(activeInfluence && activeInfluence.annual.has(g.id) && activeInfluence.corp.has(pillar.id));
                const isMuted = Boolean(activeInfluence && !isRelated);
                return (
                  <button
                    key={`${pillar.id}-${g.id}`}
                    type="button"
                    onClick={() => setSelection({ kind: 'cell', sector: 'bl', from: g.id, to: pillar.id })}
                    className={`xm3-cell ${hs === 1 ? 'xm4-indirect' : ''} ${isChosen ? 'xm3-chosen' : isRelated ? 'xm3-related' : isMuted ? 'xm3-muted' : ''}`}
                    title={`${g.id} → ${pillar.id} hierarchy link`}
                  >
                    <span className={dotClass(shown, 'blue')} />
                  </button>
                );
              })
            )}
          </div>

          {/* S: Strategic Pillars List */}
          <div className="xm3-bottomlist">
            {xData.org.map((pillar) => (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setSelection({ kind: 'node', type: 'corp', id: pillar.id })}
                className={labelClass('corp', pillar.id, 'xm3-label')}
              >
                <span className="xm3-id">{pillar.id}</span>
                <span className="xm3-name">{pillar.title}</span>
              </button>
            ))}
          </div>

          {/* SE: KPIs x Accountable Owners */}
          <div className="xm3-br-grid">
            {xData.owners.map((owner) =>
              xData.kpis.map((k) => {
                const os = xm3OwnerImpact(kpiOwners, k.id, owner.id);
                const shown = strongOnly && os < 2 ? 0 : os;
                const isChosen = selection.kind === 'cell' && selection.sector === 'br' && selection.from === k.id && selection.to === owner.id;
                const isRelated = Boolean(activeInfluence && activeInfluence.kpi.has(k.id) && activeInfluence.owner.has(owner.id));
                const isMuted = Boolean(activeInfluence && !isRelated);
                return (
                  <button
                    key={`${owner.id}-${k.id}`}
                    type="button"
                    onClick={() => setSelection({ kind: 'cell', sector: 'br', from: k.id, to: owner.id })}
                    onDoubleClick={() => cycleKpiOwner(k.id, owner.id)}
                    title={`${owner.id} accountability on ${k.id}. Click to inspect, double-click to cycle.`}
                    className={`xm3-cell ${isChosen ? 'xm3-chosen' : isRelated ? 'xm3-related' : isMuted ? 'xm3-muted' : ''}`}
                  >
                    <span className={dotClass(shown, 'owner')} />
                  </button>
                );
              })
            )}
          </div>

          {/* Far Right: Owners List */}
          <div className="xm3-ownerslist">
            {xData.owners.map((owner) => (
              <button
                key={owner.id}
                type="button"
                onClick={() => setSelection({ kind: 'node', type: 'owner', id: owner.id })}
                className={labelClass('owner', owner.id, 'xm3-label')}
              >
                <span className="xm3-name">{owner.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rich Selection Inspector */}
      <Card className="p-5 space-y-3">
        {selection.kind === 'none' && (
          <div className="text-xs text-[var(--muted)]">
            <strong className="text-[var(--ink)]">Interactive Inspector:</strong> Click any Goal, Initiative, KPI, Pillar, Owner, or matrix intersection cell to trace full Hoshin causality. Double-click NW, NE, or SE intersections to cycle strength &amp; sync Firestore in real time.
          </div>
        )}

        {selection.kind === 'node' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-teal-600 dark:text-teal-400">
                Highlighted {selection.type} · {selection.id}
              </div>
              <div className="text-sm font-bold text-[var(--ink)] mt-0.5">
                {selection.type === 'corp' || selection.type === 'annual'
                  ? goalById(goals, selection.id)?.title
                  : selection.type === 'initiative'
                    ? initById(initiatives, selection.id)?.title
                    : selection.type === 'kpi'
                      ? kpiById(domainSnapshot.kpis, selection.id)?.name
                      : selection.id}
              </div>
              {activeInfluence && (
                <div className="text-xs text-[var(--muted)] mt-1">
                  Trace: {activeInfluence.corp.size} pillars · {activeInfluence.annual.size} goals · {activeInfluence.initiative.size} initiatives · {activeInfluence.kpi.size} KPIs · {activeInfluence.owner.size} owners
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {(selection.type === 'corp' || selection.type === 'annual') && (
                <button
                  type="button"
                  onClick={() => navigate('goal', selection.id)}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
                >
                  Open Goal ↗
                </button>
              )}
              {selection.type === 'initiative' && (
                <button
                  type="button"
                  onClick={() => navigate('initiative', selection.id)}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
                >
                  Open Initiative ↗
                </button>
              )}
              {selection.type === 'kpi' && (
                <button
                  type="button"
                  onClick={() => navigate('kpis', selection.id)}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
                >
                  Open KPI Chart ↗
                </button>
              )}
            </div>
          </div>
        )}

        {selection.kind === 'cell' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono font-bold text-teal-700 dark:text-teal-400">
                Intersection {selection.from} → {selection.to}
              </div>
              {selection.sector === 'bl' ? (
                <div className="text-xs text-[var(--ink)] mt-1">
                  Hierarchical parent-child cascade link ({xm4HierarchyStrength(goals, selection.from, selection.to) === 2 ? 'Direct parent' : xm4HierarchyStrength(goals, selection.from, selection.to) === 1 ? 'Organization root ancestor' : 'No hierarchy link'}). Manage parent in Goal detail.
                </div>
              ) : selection.sector === 'br' ? (
                <div className="text-xs text-[var(--ink)] mt-1">
                  Accountability level:{' '}
                  <strong>
                    {xm3OwnerImpact(kpiOwners, selection.from, selection.to) === 2
                      ? 'Primary Owner'
                      : xm3OwnerImpact(kpiOwners, selection.from, selection.to) === 1
                        ? 'Cross-Functional Support'
                        : 'Unassigned'}
                  </strong>
                  {kpiOwners.find((x) => x.kpi === selection.from && x.owner === selection.to)?.note && (
                    <span> — {kpiOwners.find((x) => x.kpi === selection.from && x.owner === selection.to)?.note}</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-[var(--ink)] mt-1">
                  Relationship strength:{' '}
                  <strong>
                    {xm3Impact(relations, selection.from, selection.to) === 2
                      ? 'Strong'
                      : xm3Impact(relations, selection.from, selection.to) === 1
                        ? 'Medium'
                        : xm3Impact(relations, selection.from, selection.to) === 0.5
                          ? 'Weak'
                          : 'None'}
                  </strong>
                  {relations.find((r) => r.from === selection.from && r.to === selection.to)?.note && (
                    <span> — {relations.find((r) => r.from === selection.from && r.to === selection.to)?.note}</span>
                  )}
                </div>
              )}
            </div>

            {selection.sector !== 'bl' && (
              <div className="flex gap-2">
                {selection.sector === 'br' ? (
                  canEditOwner && (
                    <>
                      <button
                        type="button"
                        onClick={() => cycleKpiOwner(selection.from, selection.to)}
                        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
                      >
                        Cycle Owner Role
                      </button>
                      <button
                        type="button"
                        onClick={() => editKpiOwnerNote(selection.from, selection.to)}
                        className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                      >
                        Edit Note
                      </button>
                    </>
                  )
                ) : (
                  canEditCell(selection.from, selection.to) && (
                    <>
                      <button
                        type="button"
                        onClick={() => cycleMatrixRelation(selection.from, selection.to)}
                        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
                      >
                        Cycle Strength
                      </button>
                      <button
                        type="button"
                        onClick={() => editMatrixNote(selection.from, selection.to)}
                        className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                      >
                        Edit Rationale
                      </button>
                    </>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Optional Relationship Tables */}
      {showTables && (
        <Card className="overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold text-[var(--ink)]">Active Matrix Relationships ({relations.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-2 font-semibold">From</th>
                  <th className="px-4 py-2 font-semibold">To</th>
                  <th className="px-4 py-2 font-semibold">Strength</th>
                  <th className="px-4 py-2 font-semibold">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {relations.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 font-mono font-bold">{r.from}</td>
                    <td className="px-4 py-2 font-mono font-bold">{r.to}</td>
                    <td className="px-4 py-2">
                      <StatusBadge label={r.strength === 2 ? 'Strong' : r.strength === 1 ? 'Medium' : 'Weak'} />
                    </td>
                    <td className="px-4 py-2 text-[var(--muted)]">{r.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
