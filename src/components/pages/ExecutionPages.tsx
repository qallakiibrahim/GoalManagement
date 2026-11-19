import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Copy, Layers, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { EscalationTier, FiveWhyStep, Initiative, SqdcMatrix } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  goalById,
  initById,
  roleCan,
  roleVisibleGoals,
  sqdcScore,
  visibleInitiative,
  visibleProject,
} from '../../domain/syncEngine';
import { Card, SectionHeader, SqdcStrip, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { BlockerSection } from '../ui/BlockerPanel';
import { HelpTip } from '../ui/HelpTip';

export const ProjectsListPage: React.FC = () => {
  const { scope, goals, initiatives, projects, activeRole, navigate } = useWorkspace();
  const [sqdcFilter, setSqdcFilter] = useState<'ALL' | 'S' | 'Q' | 'D' | 'C' | 'BOTTLENECK'>('ALL');

  const visInits = useMemo(() => {
    const base = initiatives.filter((i) => visibleInitiative(i, goals, activeRole));
    if (sqdcFilter === 'ALL') return base;
    if (sqdcFilter === 'BOTTLENECK') return base.filter((i) => i.isBottleneck);
    return base.filter((i) => Number(i.sqdc?.[sqdcFilter] || 0) > 0);
  }, [initiatives, goals, activeRole, sqdcFilter]);

  const visProjects = projects.filter((p) => visibleProject(p, initiatives, goals, activeRole));
  const avgProg = visInits.length
    ? Math.round(visInits.reduce((a, i) => a + Number(i.progress || 0), 0) / visInits.length)
    : 0;
  const bottlenecks = visInits.filter((i) => i.isBottleneck).length;
  const safetyFirst = visInits.filter((i) => Number(i.sqdc?.S || 0) === 2).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Initiatives &amp; Project A3 Execution"
        subtitle={`Strategic initiatives prioritized by SQDC (Safety, Quality, Delivery, Cost) & Theory of Constraints (${scope}).`}
        actions={
          roleCan(activeRole, 'initiativeWrite', null, { goals, initiatives }) && (
            <button
              type="button"
              onClick={() => navigate('newinitiative')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Initiative
            </button>
          )
        }
      />

      <ScopeBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Active Initiatives</div>
          <div className="text-2xl font-bold tabular-nums">{visInits.length}</div>
          <div className="text-xs text-[var(--muted)]">{avgProg}% average execution</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">TOC Bottlenecks</div>
          <div className="text-2xl font-bold tabular-nums">{bottlenecks}</div>
          <div className="text-xs text-[var(--muted)]">Focused constraint improvements</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Safety Primary (S2)</div>
          <div className="text-2xl font-bold tabular-nums">{safetyFirst}</div>
          <div className="text-xs text-[var(--muted)]">Top-priority safety actions</div>
        </Card>
        <Card className="p-4 space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Project A3s</div>
          <div className="text-2xl font-bold tabular-nums">{visProjects.length}</div>
          <div className="text-xs text-[var(--muted)]">Structured problem solving sheets</div>
        </Card>
      </div>

      {/* Filter Bar + SQDC Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'ALL', label: 'All SQDC', dot: '', active: 'border-teal-700 bg-teal-700 text-white dark:border-teal-600 dark:bg-teal-600' },
              { id: 'BOTTLENECK', label: 'TOC Bottlenecks Only', dot: 'bg-amber-600 dark:bg-amber-400', active: 'border-amber-700 bg-amber-700 text-white dark:border-amber-600 dark:bg-amber-600' },
              { id: 'S', label: 'Safety (S)', dot: 'bg-emerald-600 dark:bg-emerald-400', active: 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-600 dark:bg-emerald-600' },
              { id: 'Q', label: 'Quality (Q)', dot: 'bg-sky-600 dark:bg-sky-400', active: 'border-sky-700 bg-sky-700 text-white dark:border-sky-600 dark:bg-sky-600' },
              { id: 'D', label: 'Delivery (D)', dot: 'bg-indigo-600 dark:bg-indigo-400', active: 'border-indigo-700 bg-indigo-700 text-white dark:border-indigo-600 dark:bg-indigo-600' },
              { id: 'C', label: 'Cost (C)', dot: 'bg-amber-600 dark:bg-amber-400', active: 'border-amber-700 bg-amber-700 text-white dark:border-amber-600 dark:bg-amber-600' },
            ] as const
          ).map((f) => {
            const isActive = sqdcFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSqdcFilter(f.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? f.active
                    : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                {f.dot && (
                  <span className={`inline-block w-2 h-2 rounded-xs ${isActive ? 'bg-white/90' : f.dot}`} />
                )}
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[var(--ink)]/80" />
            <span>Solid = Primary (2)</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-xs border border-[var(--border-strong)] bg-[var(--surface-hover)]" />
            <span>Tinted = Secondary (1)</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-xs border border-[var(--border)] bg-[var(--surface-subtle)]" />
            <span>Muted = None (0)</span>
          </span>
        </div>
      </div>

      {/* Initiatives Table */}
      <div data-tour="initiatives-table">
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--ink)]">Strategic Initiatives ({visInits.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Initiative</th>
                <th className="px-4 py-2.5 font-semibold">Goal &amp; Owner</th>
                <th className="px-4 py-2.5 font-semibold">SQDC &amp; Constraint</th>
                <th className="px-4 py-2.5 font-semibold">Progress</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {visInits.map((i) => {
                const g = goalById(goals, i.goal);
                return (
                  <tr
                    key={i.id}
                    onClick={() => navigate('initiative', i.id)}
                    className="hover:bg-[var(--surface-subtle)]/50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--ink)]">
                        <span className="font-mono text-[var(--muted)] mr-1.5">{i.id}</span>
                        {i.title}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] mt-0.5">{i.valueStream || 'Operational stream'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--ink)]">{i.owner}</div>
                      <div className="text-[11px] text-[var(--muted)]">
                        {i.goal} {g ? `· ${g.title}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SqdcStrip initiative={i} />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold tabular-nums">{i.progress}%</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={i.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      </div>

      {/* Projects & A3 Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-bold text-[var(--ink)]">Project A3s &amp; 5-Why Sheets ({visProjects.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Project A3</th>
                <th className="px-4 py-2.5 font-semibold">Tier</th>
                <th className="px-4 py-2.5 font-semibold">Initiative</th>
                <th className="px-4 py-2.5 font-semibold">Owner</th>
                <th className="px-4 py-2.5 font-semibold">Progress</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {visProjects.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate('project', p.id)}
                  className="hover:bg-[var(--surface-subtle)]/50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-semibold text-[var(--ink)]">
                    <span className="font-mono text-[var(--muted)] mr-1.5">{p.id}</span>
                    {p.title}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={p.escalationTier || 'Full A3'} />
                  </td>
                  <td className="px-4 py-3 font-mono text-[var(--muted)]">{p.initiative}</td>
                  <td className="px-4 py-3">{p.owner}</td>
                  <td className="px-4 py-3 font-mono font-bold tabular-nums">{p.progress}%</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export const InitiativeFormPage: React.FC = () => {
  const { scope, goals, initiatives, activeRole, createInitiative, navigate } = useWorkspace();
  const visibleGoals = roleVisibleGoals(goals, scope, activeRole).filter((g) =>
    roleCan(activeRole, 'initiativeWrite', { goal: g.id }, { goals, initiatives })
  );

  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('Production Manager');
  const [goal, setGoal] = useState(visibleGoals[0]?.id || '');
  const [budget, setBudget] = useState('€15,000');
  const [valueStream, setValueStream] = useState('');
  const [isBottleneck, setIsBottleneck] = useState(true);
  const [description, setDescription] = useState('');
  const [sqdc, setSqdc] = useState<SqdcMatrix>({ S: 1, Q: 1, D: 2, C: 1 });

  useEffect(() => {
    if (!visibleGoals.length) {
      if (goal) setGoal('');
      return;
    }
    if (!visibleGoals.some((g) => g.id === goal)) {
      setGoal(visibleGoals[0].id);
    }
  }, [visibleGoals, goal]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !goal) return;
    const id = await createInitiative({
      title: title.trim(),
      owner: owner.trim(),
      goal,
      status: 'Planned',
      progress: 0,
      budget,
      description,
      sqdc,
      valueStream,
      isBottleneck,
    });
    if (id) navigate('initiative', id);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <SectionHeader title="New Strategic Initiative" subtitle="Create a strategic action program linked directly to a Hoshin Goal and X-Matrix." />
      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Initiative Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Supported Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
              >
                {visibleGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.id} · {g.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Accountable Owner</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Value Stream / Constraint</label>
              <input
                type="text"
                value={valueStream}
                onChange={(e) => setValueStream(e.target.value)}
                placeholder="e.g. Line 3 Packaging · Capacity Bottleneck"
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Budget Estimate</label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              { key: 'S', name: 'Safety', dot: 'bg-emerald-600 dark:bg-emerald-400' },
              { key: 'Q', name: 'Quality', dot: 'bg-sky-600 dark:bg-sky-400' },
              { key: 'D', name: 'Delivery', dot: 'bg-indigo-600 dark:bg-indigo-400' },
              { key: 'C', name: 'Cost', dot: 'bg-amber-600 dark:bg-amber-400' },
            ] as const).map(({ key: k, name, dot }) => (
              <div key={k}>
                <label className="flex items-center gap-1.5 font-semibold text-[var(--muted)] mb-1">
                  <span className={`inline-block w-2 h-2 rounded-xs ${dot}`} />
                  <span>SQDC · {k} ({name})</span>
                </label>
                <select
                  value={sqdc[k]}
                  onChange={(e) => setSqdc((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-xs"
                >
                  <option value={0}>0 · None</option>
                  <option value={1}>1 · Secondary</option>
                  <option value={2}>2 · Primary</option>
                </select>
              </div>
            ))}
          </div>

          <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isBottleneck}
              onChange={(e) => setIsBottleneck(e.target.checked)}
            />
            Flag as Theory of Constraints (TOC) System Bottleneck
          </label>

          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate('projects')}
              className="rounded-lg border border-[var(--border-strong)] px-3.5 py-2 font-semibold"
            >
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer">
              Create Initiative
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const InitiativeDetailPage: React.FC = () => {
  const { routeId, initiatives, goals, projects, activeRole, updateInitiativeFocus, createProjectA3, navigate } = useWorkspace();
  const init = initById(initiatives, routeId);

  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Initiative['status']>('Planned');
  const [valueStream, setValueStream] = useState('');
  const [isBottleneck, setIsBottleneck] = useState(false);
  const [sqdc, setSqdc] = useState<SqdcMatrix>({ S: 0, Q: 0, D: 0, C: 0 });
  const [showNewA3, setShowNewA3] = useState(false);
  const [newA3Title, setNewA3Title] = useState('');
  const [newA3Owner, setNewA3Owner] = useState('');
  const [newA3Tier, setNewA3Tier] = useState<EscalationTier>('Full A3');

  useEffect(() => {
    if (init) {
      setProgress(init.progress);
      setStatus(init.status);
      setValueStream(init.valueStream || '');
      setIsBottleneck(Boolean(init.isBottleneck));
      setSqdc(init.sqdc || { S: 0, Q: 0, D: 0, C: 0 });
    }
  }, [init]);

  if (!init) {
    return (
      <Card className="p-6 text-xs text-[var(--muted)]">
        Initiative not found.{' '}
        <button type="button" onClick={() => navigate('projects')} className="text-teal-600 underline cursor-pointer">
          Back to Initiatives
        </button>
      </Card>
    );
  }

  const canWrite = roleCan(activeRole, 'initiativeWrite', init, { goals, initiatives });
  const parentGoal = goalById(goals, init.goal);
  const childProjects = projects.filter((p) => p.initiative === init.id);
  const score = sqdcScore({ ...init, sqdc });

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`${init.id} · ${init.title}`}
        subtitle={`${init.owner} · Supported Goal: ${init.goal} ${parentGoal ? `(${parentGoal.title})` : ''} · Budget ${init.budget || '—'}`}
        actions={
          <div className="flex items-center gap-2">
            <SqdcStrip initiative={{ ...init, sqdc, isBottleneck }} />
            <StatusBadge label={init.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--ink)]">Execution Progress, SQDC &amp; TOC Bottleneck Focus</h2>
            <span className="font-mono text-xs font-bold text-[var(--muted)]">Leverage {score.weighted}/8</span>
          </div>

          <p className="text-xs text-[var(--muted)]">{init.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="flex items-center gap-1.5 font-semibold text-[var(--muted)] mb-1">
                <span>Execution %</span>
                <HelpTip
                  title="Projektframdrift (%) ≠ KPI-måluppfyllelse"
                  body="Execution % mäter hur stor andel av initiativets och tillhörande Project A3-uppgifter som slutförts. När du bockar av ProjectTasks räknas procenten om automatiskt."
                  note="100 % genomförda projektuppgifter bevisar att åtgärden är utförd — om den faktiskt gav önskad effekt bevisas först av KPI-utfallet i Bowling Chart."
                  chapterId={6}
                />
              </label>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!canWrite}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 font-mono tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Status</label>
              <select
                disabled={!canWrite}
                value={status}
                onChange={(e) => setStatus(e.target.value as Initiative['status'])}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2"
              >
                <option value="Planned">Planned</option>
                <option value="On track">On track</option>
                <option value="At risk">At risk</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">Value Stream</label>
              <input
                type="text"
                disabled={!canWrite}
                value={valueStream}
                onChange={(e) => setValueStream(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[var(--border)]">
            {([
              { key: 'S', name: 'Safety', dot: 'bg-emerald-600 dark:bg-emerald-400' },
              { key: 'Q', name: 'Quality', dot: 'bg-sky-600 dark:bg-sky-400' },
              { key: 'D', name: 'Delivery', dot: 'bg-indigo-600 dark:bg-indigo-400' },
              { key: 'C', name: 'Cost', dot: 'bg-amber-600 dark:bg-amber-400' },
            ] as const).map(({ key: k, name, dot }) => (
              <div key={k}>
                <label className="flex items-center gap-1.5 font-semibold text-[var(--muted)] mb-1">
                  <span className={`inline-block w-2 h-2 rounded-xs ${dot}`} />
                  <span>SQDC · {k} ({name})</span>
                </label>
                <select
                  disabled={!canWrite}
                  value={sqdc[k]}
                  onChange={(e) => setSqdc((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2"
                >
                  <option value={0}>0 · None</option>
                  <option value={1}>1 · Secondary</option>
                  <option value={2}>2 · Primary</option>
                </select>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                disabled={!canWrite}
                checked={isBottleneck}
                onChange={(e) => setIsBottleneck(e.target.checked)}
              />
              Theory of Constraints (TOC) Primary Bottleneck
            </label>

            {canWrite && (
              <button
                type="button"
                onClick={() =>
                  updateInitiativeFocus(init.id, {
                    progress,
                    status,
                    valueStream,
                    isBottleneck,
                    sqdc,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save Execution &amp; SQDC
              </button>
            )}
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[var(--ink)]">Child Project A3s ({childProjects.length})</h2>
            {canWrite && (
              <button
                type="button"
                onClick={() => {
                  setNewA3Owner((prev) => prev || init.owner);
                  setShowNewA3((prev) => !prev);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                New Project A3
              </button>
            )}
          </div>

          {showNewA3 && canWrite && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newA3Title.trim()) return;
                const createdId = await createProjectA3({
                  initiative: init.id,
                  title: newA3Title.trim(),
                  owner: newA3Owner.trim() || init.owner,
                  escalationTier: newA3Tier,
                });
                if (createdId) {
                  setNewA3Title('');
                  setShowNewA3(false);
                  navigate('project', createdId);
                }
              }}
              className="rounded-lg border border-teal-600/30 bg-[var(--surface-subtle)]/60 p-3 space-y-2.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-[var(--muted)] mb-1">Project A3 Title</label>
                <input
                  type="text"
                  required
                  value={newA3Title}
                  onChange={(e) => setNewA3Title(e.target.value)}
                  placeholder="e.g. Line 3 SMED Changeover Reduction"
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[var(--muted)] mb-1">Owner</label>
                  <input
                    type="text"
                    value={newA3Owner}
                    onChange={(e) => setNewA3Owner(e.target.value)}
                    placeholder={init.owner}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--muted)] mb-1">Tier</label>
                  <select
                    value={newA3Tier}
                    onChange={(e) => setNewA3Tier(e.target.value as EscalationTier)}
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1.5"
                  >
                    <option value="Full A3">Full A3</option>
                    <option value="5-Why">5-Why</option>
                    <option value="Quick Fix">Quick Fix</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewA3(false)}
                  className="rounded-lg border border-[var(--border-strong)] px-2.5 py-1 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-3 py-1 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 cursor-pointer"
                >
                  Create &amp; Open A3
                </button>
              </div>
            </form>
          )}

          {childProjects.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No project A3 sheets linked yet.</p>
          ) : (
            <div className="space-y-2">
              {childProjects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate('project', p.id)}
                  className="w-full text-left rounded-lg border border-[var(--border)] p-3 hover:border-teal-500 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[var(--muted)]">{p.id}</span>
                    <StatusBadge label={p.status} />
                  </div>
                  <div className="text-xs font-bold text-[var(--ink)]">{p.title}</div>
                  <div className="text-[11px] text-[var(--muted)] font-mono tabular-nums">
                    {p.progress}% complete · {p.escalationTier || 'Full A3'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <BlockerSection targetType="initiative" targetId={init.id} title="Initiative Blockers &amp; PDCA Support" />
    </div>
  );
};

export const ProjectA3Page: React.FC = () => {
  const {
    routeId,
    projects,
    initiatives,
    goals,
    tasks,
    activeRole,
    saveProjectA3,
    addProjectTask,
    toggleTaskStatus,
    navigate,
  } = useWorkspace();

  const project = projects.find((p) => p.id === routeId);
  const init = project ? initById(initiatives, project.initiative) : undefined;
  const projTasks = tasks.filter((t) => t.project === routeId);

  const [escalationTier, setEscalationTier] = useState<EscalationTier>('Full A3');
  const [problem, setProblem] = useState('');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [root, setRoot] = useState('');
  const [fiveWhys, setFiveWhys] = useState<FiveWhyStep[]>([]);
  const [counter, setCounter] = useState('');
  const [learning, setLearning] = useState('');

  // Quick add task inline
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState('Team Leader');
  const [taskDue, setTaskDue] = useState('2027-08-30');

  useEffect(() => {
    if (project) {
      setEscalationTier(project.escalationTier || 'Full A3');
      setProblem(project.problem || '');
      setCurrent(project.current || '');
      setTarget(project.target || '');
      setRoot(project.root || '');
      setFiveWhys(Array.isArray(project.fiveWhys) ? project.fiveWhys : []);
      setCounter(project.counter || '');
      setLearning(project.learning || '');
    }
  }, [project]);

  if (!project) {
    return (
      <Card className="p-6 text-xs text-[var(--muted)]">
        Project A3 not found.{' '}
        <button type="button" onClick={() => navigate('projects')} className="text-teal-600 underline cursor-pointer">
          Return to Projects
        </button>
      </Card>
    );
  }

  const canWrite = roleCan(activeRole, 'projectWrite', project, { goals, initiatives });
  const canToggleTask = (owner: string) =>
    activeRole !== 'Auditor' && (canWrite || (activeRole === 'Basic user' && owner === 'Team Leader'));

  const addWhyStep = () => {
    if (fiveWhys.length >= 5) return;
    const nextLvl = fiveWhys.length + 1;
    setFiveWhys([...fiveWhys, { level: nextLvl, question: `Why #${nextLvl}?`, answer: '' }]);
  };

  const updateWhyStep = (idx: number, field: 'question' | 'answer', val: string) => {
    setFiveWhys((prev) => prev.map((w, i) => (i === idx ? { ...w, [field]: val } : w)));
  };

  const removeWhyStep = (idx: number) => {
    setFiveWhys((prev) =>
      prev.filter((_, i) => i !== idx).map((w, i) => ({ ...w, level: i + 1 }))
    );
  };

  const copyLastWhyToRoot = () => {
    const nonEmpty = [...fiveWhys].reverse().find((w) => w.answer.trim());
    if (nonEmpty) {
      setRoot(nonEmpty.answer.trim());
    }
  };

  const handleSave = () => {
    saveProjectA3(project.id, {
      escalationTier,
      problem,
      current,
      target,
      root,
      fiveWhys,
      counter,
      learning,
    });
  };

  const showDeepBoxes = escalationTier !== 'Direct Fix';
  const showFullA3Boxes = escalationTier === 'Full A3';

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`${project.id} · ${project.title}`}
        subtitle={`Owner: ${project.owner} · Linked Initiative: ${project.initiative} ${init ? `(${init.title})` : ''} · Progress ${project.progress}%`}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <StatusBadge label={project.status} />
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print A3
            </button>
            {canWrite && (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Save A3 &amp; 5-Why
              </button>
            )}
          </div>
        }
      />

      {/* Escalation Tier Selector */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 text-xs">
          <Layers className="w-4 h-4 text-teal-600" />
          <span className="font-bold text-[var(--ink)]">Problem-Solving Escalation Tier:</span>
          <HelpTip
            title="Välj rätt djup: Direct Fix, 5-Why eller Full A3"
            body="Direct Fix används för enkla avvikelser med känd orsak. 5-Why lägger till strukturerad rotårsaksanalys. Full A3 aktiverar hela det utskrivbara A3-bladet med bakgrund, nuläge, målläge, rotårsak, motåtgärder och lärdomar."
            chapterId={6}
          />
          <span className="text-[var(--muted)]">
            Match documentation depth to issue complexity
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] p-0.5">
          {(['Direct Fix', '5-Why', 'Full A3'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              disabled={!canWrite}
              onClick={() => setEscalationTier(tier)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                escalationTier === tier
                  ? 'bg-teal-600 text-white'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </Card>

      {/* Printable A3 Grid */}
      <div className="a3-sheet rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Box 01 Background / Problem */}
          <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              01 · Background &amp; Problem Statement
            </div>
            <textarea
              rows={3}
              disabled={!canWrite}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
            />
          </div>

          {/* Box 02 Current & Target */}
          <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              02 · Current Condition &amp; 03 · Target Condition
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Current State</label>
                <textarea
                  rows={2}
                  disabled={!canWrite}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Target State</label>
                <textarea
                  rows={2}
                  disabled={!canWrite}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Box 04 Interactive 5-Why Root Cause Analysis */}
          {showDeepBoxes && (
            <div className="a3-box lg:col-span-2 rounded-xl border border-[var(--border)] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                    04 · Interactive 5-Why Root Cause Builder ({fiveWhys.length}/5)
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    Drill down step by step until systemic process root cause is exposed
                  </p>
                </div>
                {canWrite && (
                  <div className="flex flex-wrap items-center gap-2 no-print">
                    {fiveWhys.length > 0 && (
                      <button
                        type="button"
                        onClick={copyLastWhyToRoot}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Last Why to Summary
                      </button>
                    )}
                    {fiveWhys.length < 5 && (
                      <button
                        type="button"
                        onClick={addWhyStep}
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Why #{fiveWhys.length + 1}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {fiveWhys.length > 0 && (
                <div className="space-y-2.5">
                  {fiveWhys.map((step, idx) => (
                    <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)]/40 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300">
                          Why #{step.level}
                        </span>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => removeWhyStep(idx)}
                            className="text-[var(--muted)] hover:text-rose-600 p-1 no-print cursor-pointer"
                            title="Remove step"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          disabled={!canWrite}
                          value={step.question}
                          onChange={(e) => updateWhyStep(idx, 'question', e.target.value)}
                          placeholder={`Why question ${step.level}...`}
                          className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold"
                        />
                        <input
                          type="text"
                          disabled={!canWrite}
                          value={step.answer}
                          onChange={(e) => updateWhyStep(idx, 'answer', e.target.value)}
                          placeholder="Evidence-based causal answer..."
                          className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Root Cause Summary</label>
                <textarea
                  rows={2}
                  disabled={!canWrite}
                  value={root}
                  onChange={(e) => setRoot(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
                />
              </div>
            </div>
          )}

          {/* Box 05 & 06 Countermeasures & Follow-up */}
          <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              05 · Countermeasures &amp; Design Changes
            </div>
            <textarea
              rows={3}
              disabled={!canWrite}
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
            />
          </div>

          {showFullA3Boxes && (
            <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                06 · Check Results &amp; Standardize Learning
              </div>
              <textarea
                rows={3}
                disabled={!canWrite}
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs"
              />
            </div>
          )}
        </div>

        {/* Box 07 Synced Milestones / Implementation Tasks */}
        <div className="a3-box rounded-xl border border-[var(--border)] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                07 · Implementation Plan &amp; Milestones ({projTasks.length})
              </div>
              <p className="text-[11px] text-[var(--muted)]">
                Toggling milestone status automatically recalculates Project {project.id} % and parent Initiative {project.initiative} %
              </p>
            </div>
            {init && (
              <button
                type="button"
                onClick={() => navigate('initiative', init.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline no-print cursor-pointer"
              >
                Initiative {init.id} ({init.progress}%)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Activity</th>
                  <th className="px-3 py-2 font-semibold">Owner</th>
                  <th className="px-3 py-2 font-semibold">Due</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {projTasks.map((t) => (
                  <tr key={t.id}>
                    <td className="px-3 py-2 font-semibold">
                      <span className="font-mono text-[var(--muted)] mr-1.5">{t.id}</span>
                      {t.title}
                    </td>
                    <td className="px-3 py-2 text-[var(--muted)]">{t.owner}</td>
                    <td className="px-3 py-2 font-mono tabular-nums text-[var(--muted)]">{t.due || '—'}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        disabled={!canToggleTask(t.owner)}
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

          {canWrite && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!taskTitle.trim()) return;
                await addProjectTask(project.id, taskTitle, taskOwner, taskDue);
                setTaskTitle('');
              }}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[var(--border)] no-print"
            >
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add A3 implementation activity..."
                className="sm:col-span-6 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="text"
                value={taskOwner}
                onChange={(e) => setTaskOwner(e.target.value)}
                placeholder="Owner"
                className="sm:col-span-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs"
              />
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="sm:col-span-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                className="sm:col-span-1 inline-flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Add
              </button>
            </form>
          )}
        </div>
      </div>

      <BlockerSection targetType="project" targetId={project.id} title="08 · Project A3 Escalated Blockers" />
    </div>
  );
};
