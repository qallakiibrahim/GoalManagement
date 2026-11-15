import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  MessageSquareMore,
  Plus,
  Printer,
  Save,
  Send,
} from 'lucide-react';
import { ALL_SCOPES, ASSIGNED_DEPARTMENT, StrategicGoal } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  computeKpiStatus,
  goalById,
  goalPlanCheck,
  initiativeLinkedToGoal,
  isoShort,
  kpiById,
  permittedParents,
  roleCan,
  roleVisibleGoals,
  visibleInitiative,
  visibleToRole,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { BlockerSection } from '../ui/BlockerPanel';

export const PillarsPage: React.FC = () => {
  const { goals, kpis, initiatives, relations, isoStandards, activeRole, scope, navigate } = useWorkspace();
  const orgGoals = goals.filter((g) => g.level === 'Organization' && visibleToRole(g, activeRole));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Multi-Year Strategic Pillars (3–5 Years)"
        subtitle="Top-level breakthrough objectives establishing direction for Sites, Departments, and Cross-Functional X-Matrix ownership."
        actions={
          roleCan(activeRole, 'goalCreate', { level: 'Organization' }, { goals, initiatives }) && (
            <button
              type="button"
              onClick={() => navigate('newgoal')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Breakthrough Pillar
            </button>
          )
        }
      />

      <ScopeBar />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {orgGoals.map((pg) => {
          const st = computeKpiStatus(kpiById(kpis, pg.kpi));
          const childGoals = goals.filter((c) => c.parent === pg.id && visibleToRole(c, activeRole));
          const linkedInits = initiatives.filter(
            (i) =>
              visibleInitiative(i, goals, activeRole) &&
              (initiativeLinkedToGoal(i, pg.id, relations) ||
                childGoals.some((cg) => initiativeLinkedToGoal(i, cg.id, relations)))
          );
          return (
            <Card key={pg.id} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[var(--muted)]">{pg.id}</span>
                    <span className="text-[var(--muted)]">{pg.year}</span>
                    <StatusBadge label={pg.approval} />
                    <StatusBadge label={st.label} />
                  </div>
                  <h2 className="mt-1 text-base font-bold text-[var(--ink)]">{pg.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('goal', pg.id)}
                  className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer shrink-0"
                >
                  Open
                </button>
              </div>

              <p className="text-xs text-[var(--muted)]">{pg.description || pg.planWhat}</p>

              <div className="grid grid-cols-3 gap-2 rounded-lg bg-[var(--surface-subtle)]/60 p-3 text-xs">
                <div>
                  <div className="text-[10px] text-[var(--muted)] uppercase font-bold">Owner</div>
                  <div className="font-semibold text-[var(--ink)] truncate">{pg.owner}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--muted)] uppercase font-bold">KPI Pace</div>
                  <div className="font-mono font-bold tabular-nums text-[var(--ink)]">
                    {st.actual ?? '—'} / {pg.target} {pg.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--muted)] uppercase font-bold">ISO Links</div>
                  <div className="font-semibold text-[var(--ink)] truncate">{isoShort(isoStandards, pg)}</div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  Annual Deployed Goals ({childGoals.length}) · {linkedInits.length} Initiatives ({scope})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {childGoals.map((cg) => (
                    <button
                      key={cg.id}
                      type="button"
                      onClick={() => navigate('goal', cg.id)}
                      className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-xs font-medium text-[var(--ink)] hover:border-teal-500 cursor-pointer"
                    >
                      <span className="font-mono text-[var(--muted)] mr-1">{cg.id}</span>
                      {cg.title}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export const CascadePage: React.FC = () => {
  const { goals, kpis, initiatives, isoStandards, activeRole, scope, navigate } = useWorkspace();
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const visible = roleVisibleGoals(goals, scope, activeRole);
  const roots = visible.filter((g) => !g.parent || !visible.some((v) => v.id === g.parent));

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (g: StrategicGoal): React.ReactNode => {
    const children = visible.filter((c) => c.parent === g.id);
    const isCollapsed = collapsedIds.has(g.id);
    const st = computeKpiStatus(kpiById(kpis, g.kpi));
    return (
      <div key={g.id} className="space-y-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            {children.length > 0 ? (
              <button
                type="button"
                onClick={() => toggleCollapse(g.id)}
                className="mt-0.5 rounded p-1 text-[var(--muted)] hover:bg-[var(--surface-subtle)] cursor-pointer"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            ) : (
              <span className="w-6 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-[var(--muted)]">{g.id}</span>
                <span className="font-semibold text-teal-700 dark:text-teal-400">{g.level}</span>
                <StatusBadge label={st.label} />
                <StatusBadge label={g.approval} />
              </div>
              <button
                type="button"
                onClick={() => navigate('goal', g.id)}
                className="mt-1 text-left text-sm font-bold text-[var(--ink)] hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer"
              >
                {g.title}
              </button>
              <div className="text-[11px] text-[var(--muted)] mt-0.5">
                {g.owner} · {st.actual ?? '—'} / {g.target} {g.unit} · {isoShort(isoStandards, g)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('goal', g.id)}
              className="rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              Inspect / Edit
            </button>
          </div>
        </div>

        {!isCollapsed && children.length > 0 && (
          <div className="tree-branch space-y-2">{children.map((c) => renderNode(c))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Goal Cascade Hierarchy"
        subtitle="Multi-tier Hoshin deployment from Group Strategic Pillars to Sites and Functional Departments."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('tree')}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  viewMode === 'tree' ? 'bg-teal-600 text-white' : 'text-[var(--muted)]'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                Tree
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  viewMode === 'table' ? 'bg-teal-600 text-white' : 'text-[var(--muted)]'
                }`}
              >
                Table
              </button>
            </div>
            {roleCan(activeRole, 'goalCreate', null, { goals, initiatives }) && (
              <button
                type="button"
                onClick={() => navigate('newgoal')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Goal
              </button>
            )}
          </div>
        }
      />

      <ScopeBar />

      {viewMode === 'tree' ? (
        <div className="space-y-3">{roots.map((r) => renderNode(r))}</div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ID</th>
                  <th className="px-4 py-2.5 font-semibold">Goal</th>
                  <th className="px-4 py-2.5 font-semibold">Level</th>
                  <th className="px-4 py-2.5 font-semibold">Parent</th>
                  <th className="px-4 py-2.5 font-semibold">Owner</th>
                  <th className="px-4 py-2.5 font-semibold">Target</th>
                  <th className="px-4 py-2.5 font-semibold">Approval</th>
                  <th className="px-4 py-2.5 font-semibold">KPI Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {visible.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => navigate('goal', g.id)}
                    className="hover:bg-[var(--surface-subtle)]/50 cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-mono font-bold text-[var(--muted)]">{g.id}</td>
                    <td className="px-4 py-2.5 font-semibold text-[var(--ink)]">{g.title}</td>
                    <td className="px-4 py-2.5">{g.level}</td>
                    <td className="px-4 py-2.5 font-mono text-[var(--muted)]">{g.parent || 'Root'}</td>
                    <td className="px-4 py-2.5">{g.owner}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums">
                      {g.target} {g.unit}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge label={g.approval} />
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge label={computeKpiStatus(kpiById(kpis, g.kpi)).label} />
                    </td>
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

export const GoalFormPage: React.FC<{ isNew?: boolean }> = ({ isNew = false }) => {
  const {
    routeId,
    goals,
    kpis,
    initiatives,
    catchballs,
    isoStandards,
    activeRole,
    year,
    navigate,
    saveGoal,
    submitGoal,
  } = useWorkspace();

  const existing = isNew ? undefined : goalById(goals, routeId);
  const canEdit = existing
    ? roleCan(activeRole, 'goalEdit', existing, { goals, initiatives })
    : roleCan(activeRole, 'goalCreate', null, { goals, initiatives });

  const [title, setTitle] = useState('');
  const [level, setLevel] = useState(activeRole === 'Department director' ? ASSIGNED_DEPARTMENT : 'Site: Uppsala');
  const [parent, setParent] = useState('');
  const [owner, setOwner] = useState('Site Manager');
  const [goalYear, setGoalYear] = useState(year);
  const [kpi, setKpi] = useState('K-001');
  const [baseline, setBaseline] = useState('0');
  const [target, setTarget] = useState('0');
  const [unit, setUnit] = useState('%');
  const [status, setStatus] = useState<StrategicGoal['status']>('Planned');
  const [description, setDescription] = useState('');
  const [planWhat, setPlanWhat] = useState('');
  const [resources, setResources] = useState('');
  const [planDue, setPlanDue] = useState('2027-12-31');
  const [evaluation, setEvaluation] = useState('');
  const [isoRefs, setIsoRefs] = useState<string[]>([]);
  const [riskRefs, setRiskRefs] = useState('');
  const [processRefs, setProcessRefs] = useState('');
  const [evidenceRefs, setEvidenceRefs] = useState('');
  const [isoSearch, setIsoSearch] = useState('');

  useEffect(() => {
    if (existing) {
      setTitle(existing.title);
      setLevel(existing.level);
      setParent(existing.parent || '');
      setOwner(existing.owner);
      setGoalYear(existing.year);
      setKpi(existing.kpi || 'K-001');
      setBaseline(String(existing.baseline ?? 0));
      setTarget(String(existing.target ?? 0));
      setUnit(existing.unit || '%');
      setStatus(existing.status);
      setDescription(existing.description || '');
      setPlanWhat(existing.planWhat || '');
      setResources(existing.resources || '');
      setPlanDue(existing.planDue || '2027-12-31');
      setEvaluation(existing.evaluation || '');
      setIsoRefs(existing.isoRefs || []);
      setRiskRefs(existing.riskRefs || '');
      setProcessRefs(existing.processRefs || '');
      setEvidenceRefs(existing.evidenceRefs || '');
    } else if (isNew) {
      const defLevel = activeRole === 'Department director' ? ASSIGNED_DEPARTMENT : 'Site: Uppsala';
      const parents = permittedParents(goals, defLevel);
      setLevel(defLevel);
      setParent(parents[0]?.id || '');
      setGoalYear(year);
      setIsoRefs(['req-9001-6.2']);
    }
  }, [existing, isNew, activeRole, year, goals]);

  const validParents = useMemo(() => permittedParents(goals, level, existing?.id), [goals, level, existing?.id]);

  const draftGoalForCheck: StrategicGoal = {
    ...(existing || {
      id: 'NEW',
      workspaceId: '',
      ownerUid: '',
      memberUids: [],
      approval: 'Draft',
      performance: 'Not measured',
      revision: 1,
    }),
    title,
    level,
    parent: level === 'Organization' ? '' : parent,
    owner,
    year: goalYear,
    kpi,
    baseline: Number(baseline),
    target: Number(target),
    unit,
    status,
    description,
    planWhat,
    resources,
    planDue,
    evaluation,
    isoRefs,
    riskRefs,
    processRefs,
    evidenceRefs,
  };

  const planCheck = goalPlanCheck(draftGoalForCheck, kpis);
  const linkedCatchball = existing
    ? catchballs.find((c) => c.goal === existing.id && !['Approved', 'Cancelled'].includes(c.status))
    : undefined;

  if (!isNew && !existing) {
    return (
      <Card className="p-6 text-sm text-[var(--muted)]">
        Goal not found.{' '}
        <button type="button" onClick={() => navigate('cascade')} className="text-teal-600 underline cursor-pointer">
          Return to Goal Cascade
        </button>
      </Card>
    );
  }

  const toggleIsoRef = (reqId: string) => {
    setIsoRefs((prev) => (prev.includes(reqId) ? prev.filter((r) => r !== reqId) : [...prev, reqId]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedId = await saveGoal(existing?.id, {
      title,
      level,
      parent: level === 'Organization' ? '' : parent,
      owner,
      year: goalYear,
      kpi,
      baseline: Number(baseline),
      target: Number(target),
      unit,
      status,
      description,
      planWhat,
      resources,
      planDue,
      evaluation,
      isoRefs,
      riskRefs,
      processRefs,
      evidenceRefs,
    });
    if (savedId && isNew) {
      navigate('goal', savedId);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={isNew ? 'Create Strategic Goal' : `${existing?.id} · ${existing?.title}`}
        subtitle={
          existing
            ? `${existing.level} · Revision v${existing.revision} · Approval: ${existing.approval}`
            : 'Define a Hoshin Kanri objective linked to an ISO clause, measurable KPI, and parent strategic goal.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {existing && linkedCatchball && activeRole !== 'Basic user' && (
              <button
                type="button"
                onClick={() => navigate('catchballitem', linkedCatchball.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
              >
                <MessageSquareMore className="w-3.5 h-3.5" />
                Catchball {linkedCatchball.id}
              </button>
            )}
            {existing && canEdit && existing.approval === 'Draft' && (
              <button
                type="button"
                onClick={() => submitGoal(existing.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Submit for Approval
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form onSubmit={handleSave} className="xl:col-span-2 space-y-5">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-[var(--ink)]">Strategic Definition &amp; Hierarchy</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Organizational Level</label>
                <select
                  disabled={!canEdit}
                  value={level}
                  onChange={(e) => {
                    const nextLevel = e.target.value;
                    setLevel(nextLevel);
                    const nextValid = permittedParents(goals, nextLevel, existing?.id);
                    setParent(nextLevel === 'Organization' ? '' : nextValid[0]?.id || '');
                  }}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
                >
                  {ALL_SCOPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Primary Parent Goal</label>
                <select
                  disabled={!canEdit || level === 'Organization'}
                  value={level === 'Organization' ? '' : parent}
                  onChange={(e) => setParent(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
                >
                  {level === 'Organization' ? (
                    <option value="">Root (Multi-Year Strategic Pillar)</option>
                  ) : (
                    validParents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} · {p.title} ({p.level})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Accountable Owner</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Horizon / Year</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={goalYear}
                  onChange={(e) => setGoalYear(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)] tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[var(--border)]">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Linked KPI</label>
                <select
                  disabled={!canEdit}
                  value={kpi}
                  onChange={(e) => {
                    setKpi(e.target.value);
                    const found = kpiById(kpis, e.target.value);
                    if (found) setUnit(found.unit);
                  }}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-xs text-[var(--ink)]"
                >
                  {kpis.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.id} · {k.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Baseline</label>
                <input
                  type="number"
                  step="any"
                  disabled={!canEdit}
                  value={baseline}
                  onChange={(e) => setBaseline(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Target</label>
                <input
                  type="number"
                  step="any"
                  disabled={!canEdit}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Unit</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                />
              </div>
            </div>
          </Card>

          {/* ISO 6.2 Planning Card */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-[var(--ink)]">ISO 9001 / 14001 / 45001 Clause 6.2 Planning</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Description / Intent</label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">What will be done</label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={planWhat}
                  onChange={(e) => setPlanWhat(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Resources Required</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={resources}
                    onChange={(e) => setResources(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    disabled={!canEdit}
                    value={planDue}
                    onChange={(e) => setPlanDue(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--muted)] mb-1">How results will be evaluated</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={evaluation}
                  onChange={(e) => setEvaluation(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Risk References</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={riskRefs}
                    onChange={(e) => setRiskRefs(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Process References</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={processRefs}
                    onChange={(e) => setProcessRefs(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">Evidence Doc Refs</label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={evidenceRefs}
                    onChange={(e) => setEvidenceRefs(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* ISO References Grid */}
          <Card className="p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[var(--ink)]">Linked ISO Standard Clauses ({isoRefs.length})</h2>
              <input
                type="text"
                value={isoSearch}
                onChange={(e) => setIsoSearch(e.target.value)}
                placeholder="Filter clauses..."
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1 text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {isoStandards.flatMap((std) =>
                std.requirements
                  .filter((r) => !isoSearch.trim() || `${std.code} ${r.number} ${r.title}`.toLowerCase().includes(isoSearch.toLowerCase()))
                  .map((r) => {
                    const checked = isoRefs.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs cursor-pointer ${
                          checked
                            ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40'
                            : 'border-[var(--border)] bg-[var(--bg)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!canEdit}
                          checked={checked}
                          onChange={() => toggleIsoRef(r.id)}
                          className="mt-0.5"
                        />
                        <span>
                          <strong className="font-mono">{std.code} §{r.number}</strong> · {r.title}
                        </span>
                      </label>
                    );
                  })
              )}
            </div>

            {canEdit && (
              <div className="pt-3 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {existing ? 'Save Changes (New Revision if Approved)' : 'Create Strategic Goal'}
                </button>
              </div>
            )}
          </Card>
        </form>

        {/* Right Side Checklist + Blockers */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--ink)]">ISO Readiness Checklist</h2>
              <StatusBadge label={planCheck.ready ? 'Ready' : 'Incomplete'} tone={planCheck.ready ? 'green' : 'amber'} />
            </div>
            <div className="space-y-1.5">
              {planCheck.checks.map((c) => (
                <div key={c.key} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${c.ok ? 'text-emerald-600' : 'text-[var(--muted)] opacity-40'}`} />
                  <span className={c.ok ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}>{c.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {existing && <BlockerSection targetType="goal" targetId={existing.id} />}
        </div>
      </div>
    </div>
  );
};

export const StrategyA3Page: React.FC = () => {
  const { scope, year, goals, kpis, initiatives, plans, isoStandards, activeRole, domainSnapshot, navigate } = useWorkspace();
  const orgGoals = goals.filter((g) => g.level === 'Organization' && visibleToRole(g, activeRole));
  const annualGoals = roleVisibleGoals(goals, scope, activeRole).filter((g) => g.level !== 'Organization');
  const activePlan = plans.find((p) => p.scope === scope) || plans[0];
  const exceptions = initiatives.filter((i) => visibleInitiative(i, goals, activeRole));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="One-Page Strategy A3 Summary"
        subtitle={`Printable Hoshin Kanri alignment sheet for ${scope} (${year}).`}
        actions={
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer no-print"
          >
            <Printer className="w-3.5 h-3.5" />
            Print A3 Landscape
          </button>
        }
      />

      <ScopeBar />

      <div className="a3-sheet rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase text-teal-600 dark:text-teal-400">
              SafeQMS Strategy A3 · {scope} · Horizon {year}
            </div>
            <h2 className="text-lg font-bold text-[var(--ink)]">{activePlan?.name || 'Annual Strategy Alignment'}</h2>
          </div>
          <div className="text-xs text-[var(--muted)]">
            Owner: <strong className="text-[var(--ink)]">{activePlan?.owner || 'Executive Management'}</strong> · Rev v{activePlan?.revision || 1}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              01 · Strategic Breakthrough Pillars
            </div>
            {orgGoals.map((g) => (
              <div key={g.id} className="text-xs border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
                <div className="font-bold text-[var(--ink)]">
                  <span className="font-mono text-[var(--muted)] mr-1.5">{g.id}</span>
                  {g.title}
                </div>
                <div className="text-[11px] text-[var(--muted)]">{isoShort(isoStandards, g)} · Target {g.target} {g.unit}</div>
              </div>
            ))}
          </div>

          <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              02 · Deployed Annual Objectives ({annualGoals.length})
            </div>
            {annualGoals.map((g) => {
              const st = computeKpiStatus(kpiById(kpis, g.kpi));
              return (
                <div key={g.id} className="flex items-center justify-between gap-2 text-xs border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate('goal', g.id)}
                      className="font-semibold text-[var(--ink)] hover:underline text-left cursor-pointer"
                    >
                      <span className="font-mono text-[var(--muted)] mr-1">{g.id}</span>
                      {g.title}
                    </button>
                    <div className="text-[11px] text-[var(--muted)]">{g.level} · {g.owner}</div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="font-bold">{st.actual ?? '—'} / {g.target} {g.unit}</div>
                    <div className="text-[10px] text-[var(--muted)]">{st.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              03 · Priority Initiatives &amp; Bottlenecks
            </div>
            {exceptions.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2 text-xs border-b border-[var(--border)] pb-1.5 last:border-0">
                <div className="min-w-0 truncate">
                  <span className="font-mono text-[var(--muted)] mr-1">{i.id}</span>
                  <span className="font-semibold">{i.title}</span>
                </div>
                <span className="font-mono font-bold tabular-nums shrink-0">
                  {i.progress}% · {i.status}
                </span>
              </div>
            ))}
          </div>

          <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              04 · PDCA Governance Cadence ({domainSnapshot.reviews.length} Reviews)
            </div>
            <p className="text-xs text-[var(--muted)]">
              Monthly Bowling Chart deviations trigger root-cause A3 analysis and Catchball resource calibration during Site &amp; Group PDCA Reviews.
            </p>
            <div className="space-y-1.5">
              {domainSnapshot.reviews.map((r) => (
                <div key={r.id} className="text-xs">
                  <strong className="font-mono">{r.id}</strong> · {r.title} ({r.date}) · {r.decisions.filter((d) => d.status === 'Open').length} open actions
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
