import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../ui/Badge';

type SandboxKind = 'cascade' | 'xmatrix' | 'catchball' | 'a3' | 'daily' | 'kpi-pdca';

const SandboxFrame: React.FC<{
  title: string;
  subtitle: string;
  onReset: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, onReset, children }) => (
  <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-subtle)]/50 p-4 space-y-4 no-print">
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
      <div>
        <div className="text-[11px] font-mono font-bold text-teal-700 dark:text-teal-300">
          ÖVA SJÄLV · SÄKER TRÄNINGSSANDBOX (PÅVERKAR EJ SKARP DATA)
        </div>
        <h4 className="text-sm font-bold text-[var(--ink)] mt-0.5">{title}</h4>
        <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Återställ övning</span>
      </button>
    </div>
    {children}
  </div>
);

/* 1. Goal Cascade Sandbox (Chapter 3) */
const CascadeSandbox: React.FC = () => {
  const [selectedParent, setSelectedParent] = useState<'org' | 'site' | 'none'>('org');
  const [deptTitle, setDeptTitle] = useState('Minska omställningsförluster med 30 %');

  const isValid = selectedParent === 'site';

  return (
    <SandboxFrame
      title="Övning 1: Koppla Primary Parent Goal i 3-nivåhierarkin"
      subtitle="Prova att koppla ett Department: Production-mål till olika föräldrar och se SafeQMS verkliga hierarkiregel."
      onReset={() => {
        setSelectedParent('org');
        setDeptTitle('Minska omställningsförluster med 30 %');
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5">
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Nytt avdelningsmål (Department: Production)</label>
            <input
              type="text"
              value={deptTitle}
              onChange={(e) => setDeptTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--ink)]"
            />
          </div>
          <div>
            <label className="block font-semibold text-[var(--muted)] mb-1">Välj Primary Parent Goal</label>
            <div className="space-y-1.5">
              {(
                [
                  { id: 'org', label: 'Organization: Höja OEE från 55 % till 75 %' },
                  { id: 'site', label: 'Site: Uppsala — Nå OEE 68 % under 2027' },
                  { id: 'none', label: 'Ingen förälder vald' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedParent(opt.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2 font-medium transition-colors cursor-pointer ${
                    selectedParent === opt.id
                      ? 'border-teal-700 bg-teal-600/10 text-[var(--ink)] dark:border-teal-400'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`rounded-lg border p-3 text-xs ${
              isValid
                ? 'border-emerald-600/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200'
                : 'border-rose-600/25 bg-rose-500/10 text-rose-900 dark:text-rose-200'
            }`}
          >
            {isValid ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Giltig kaskadering!</strong> Ett Department-mål måste peka på ett Site-mål. Spårbarheten blir nu hel ända upp till Organization (OEE 75 %).
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Stoppas av SafeQMS-regeln:</strong>{' '}
                  {selectedParent === 'org'
                    ? 'Ett Department-mål får inte hoppa över Site-nivån. Välj Site: Uppsala som Primary Parent Goal.'
                    : 'Site- och Department-mål måste alltid ha en Primary Parent Goal för att behålla röd tråd.'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-2">
          <div className="font-bold text-[var(--ink)]">Live förhandsvisning av Goal Cascade</div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
            <div className="text-[10px] font-mono text-teal-700 dark:text-teal-300">Organization · 3–5 år</div>
            <div className="font-semibold text-[var(--ink)]">Höja OEE från 55 % till 75 %</div>
          </div>
          <div className="tree-branch space-y-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
              <div className="text-[10px] font-mono text-sky-700 dark:text-sky-300">Site: Uppsala · 2027</div>
              <div className="font-semibold text-[var(--ink)]">Nå OEE 68 % under 2027</div>
            </div>
            <div className="tree-branch space-y-2">
              <div
                className={`rounded-lg border p-2.5 ${
                  isValid
                    ? 'border-emerald-600/40 bg-emerald-500/8'
                    : 'border-dashed border-amber-600/40 bg-amber-500/8'
                }`}
              >
                <div className="text-[10px] font-mono text-[var(--muted)]">
                  Department: Production · {isValid ? 'Korrekt kopplad' : 'Väntar på giltig Site-förälder'}
                </div>
                <div className="font-semibold text-[var(--ink)]">{deptTitle || 'Nytt avdelningsmål'}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
                <div className="text-[10px] font-mono text-[var(--muted)]">Department: Maintenance</div>
                <div className="font-semibold text-[var(--ink)]">Minska oplanerade stopp med 20 %</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SandboxFrame>
  );
};

/* 2. Interactive Mini X-Matrix Sandbox (Chapter 4) */
const XMatrixSandbox: React.FC = () => {
  const initialMatrix: Record<string, number> = {
    'g1-i1': 2,
    'g1-i2': 0.5,
    'g2-i1': 0,
    'g2-i2': 2,
    'i1-k1': 2,
    'i1-k2': 1,
    'i2-k1': 2,
    'i2-k2': 0,
  };
  const [links, setLinks] = useState<Record<string, number>>(initialMatrix);
  const [focusGoal, setFocusGoal] = useState<'all' | 'g1' | 'g2'>('all');

  const cycleStrength = (key: string) => {
    const order = [0, 0.5, 1, 2];
    setLinks((prev) => {
      const curr = prev[key] ?? 0;
      const next = order[(order.indexOf(curr) + 1) % order.length];
      return { ...prev, [key]: next };
    });
  };

  const symbol = (v: number) => (v === 2 ? '●' : v === 1 ? '◐' : v === 0.5 ? '○' : '–');
  const label = (v: number) => (v === 2 ? 'Strong (2)' : v === 1 ? 'Medium (1)' : v === 0.5 ? 'Weak (0.5)' : 'None (0)');

  const orphanGoals = ['g1', 'g2'].filter((g) => (links[`${g}-i1`] || 0) + (links[`${g}-i2`] || 0) === 0);

  return (
    <SandboxFrame
      title="Övning 2: Klicka i X-Matrix och hitta strategiska glapp"
      subtitle="Klicka på ett mål för att korsmarkera kopplade initiativ och KPI:er. Klicka på en symbolruta för att växla styrka (– → ○ → ◐ → ●)."
      onReset={() => {
        setLinks(initialMatrix);
        setFocusGoal('all');
      }}
    >
      <div className="space-y-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[var(--muted)] font-semibold">Korsmarkera mål:</span>
          {[
            { id: 'all' as const, text: 'Visa alla' },
            { id: 'g1' as const, text: 'Mål 1: Omställning -30 %' },
            { id: 'g2' as const, text: 'Mål 2: Oplanerade stopp -20 %' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFocusGoal(btn.id)}
              className={`rounded-lg border px-2.5 py-1 font-semibold cursor-pointer ${
                focusGoal === btn.id
                  ? 'border-teal-700 bg-teal-700 text-white dark:bg-teal-600'
                  : 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--ink)]'
              }`}
            >
              {btn.text}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Årsmål (Vänster)</th>
                <th className="px-3 py-2 text-center font-semibold">SMED-program (Initiativ 1)</th>
                <th className="px-3 py-2 text-center font-semibold">Förebyggande UH (Initiativ 2)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[
                { id: 'g1', name: 'Production: Minska omställning 30 %' },
                { id: 'g2', name: 'Maintenance: Minska oplanerade stopp 20 %' },
              ].map((g) => {
                const muted = focusGoal !== 'all' && focusGoal !== g.id;
                return (
                  <tr key={g.id} className={muted ? 'opacity-40' : ''}>
                    <td className="px-3 py-2.5 font-semibold text-[var(--ink)]">{g.name}</td>
                    {['i1', 'i2'].map((initId) => {
                      const key = `${g.id}-${initId}`;
                      const v = links[key] || 0;
                      return (
                        <td key={key} className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => cycleStrength(key)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1 font-mono hover:border-teal-600 cursor-pointer"
                          >
                            <span className="text-sm text-teal-700 dark:text-teal-300">{symbol(v)}</span>
                            <span className="text-[11px] text-[var(--muted)]">{label(v)}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Initiativ (Topp) → KPI (Höger)</th>
                <th className="px-3 py-2 text-center font-semibold">KPI: OEE (%)</th>
                <th className="px-3 py-2 text-center font-semibold">KPI: Omställningstid (min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {[
                { id: 'i1', name: 'SMED-program' },
                { id: 'i2', name: 'Förebyggande underhåll (PM)' },
              ].map((init) => {
                const related =
                  focusGoal === 'all' || (links[`${focusGoal}-${init.id}`] || 0) > 0;
                return (
                  <tr key={init.id} className={related ? '' : 'opacity-40'}>
                    <td className="px-3 py-2.5 font-semibold text-[var(--ink)]">{init.name}</td>
                    {['k1', 'k2'].map((kpiId) => {
                      const key = `${init.id}-${kpiId}`;
                      const v = links[key] || 0;
                      return (
                        <td key={key} className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => cycleStrength(key)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1 font-mono hover:border-teal-600 cursor-pointer"
                          >
                            <span className="text-sm text-teal-700 dark:text-teal-300">{symbol(v)}</span>
                            <span className="text-[11px] text-[var(--muted)]">{label(v)}</span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-[var(--muted)]">
          {orphanGoals.length > 0 ? (
            <span className="text-amber-800 dark:text-amber-300 font-semibold">
              Varning: Ett årsmål saknar nu initiativkoppling i X-Matrix! Klicka i tabellen ovan för att återkoppla det.
            </span>
          ) : (
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
              Strategisk linjering OK: Båda årsmålen drivs av initiativ som mäts av KPI:er.
            </span>
          )}
        </div>
      </div>
    </SandboxFrame>
  );
};

/* 3. Catchball & Revision Lock Simulator (Chapter 5) */
const CatchballSandbox: React.FC = () => {
  type Stage = 'Draft' | 'Awaiting department' | 'Awaiting director' | 'Aligned' | 'Pending' | 'Approved';
  const [stage, setStage] = useState<Stage>('Draft');
  const [revision, setRevision] = useState(1);
  const [target, setTarget] = useState(35);
  const [resources, setResources] = useState('Befintlig bemanning');

  const visibleToBasic = stage === 'Approved';

  return (
    <SandboxFrame
      title="Övning 3: Simulera Catchball, Godkännande & Revisionslås (v1 → v2)"
      subtitle="Stega igenom dialogen mellan ledning och avdelningschef. Testa sedan att redigera målet EFTER godkännande."
      onReset={() => {
        setStage('Draft');
        setRevision(1);
        setTarget(35);
        setResources('Befintlig bemanning');
      }}
    >
      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Aktuell status</div>
            <div className="mt-1">
              <StatusBadge label={stage} />
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Revision</div>
            <div className="mt-1 font-mono text-sm font-bold text-[var(--ink)]">v{revision}</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Förhandlat mål</div>
            <div className="mt-1 font-mono font-bold text-[var(--ink)]">-{target} % omställning</div>
            <div className="text-[11px] text-[var(--muted)] truncate">{resources}</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Synligt för Basic user?</div>
            <div className="mt-1 font-bold text-[var(--ink)]">
              {visibleToBasic ? 'Ja (Approved)' : 'Nej (väntar på godkännande)'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {stage === 'Draft' && (
            <button
              type="button"
              onClick={() => setStage('Awaiting department')}
              className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 cursor-pointer"
            >
              1. General director: Send Proposal (-{target} %)
            </button>
          )}
          {stage === 'Awaiting department' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setTarget(30);
                  setResources('2 dgr SMED-workshop + UH-tekniker');
                  setStage('Awaiting director');
                }}
                className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 cursor-pointer"
              >
                2. Department director: Counter-proposal (-30 % + SMED-resurs)
              </button>
              <button
                type="button"
                onClick={() => setStage('Aligned')}
                className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 font-semibold text-[var(--ink)] cursor-pointer"
              >
                Acceptera direkt (Align)
              </button>
            </>
          )}
          {stage === 'Awaiting director' && (
            <button
              type="button"
              onClick={() => setStage('Aligned')}
              className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 cursor-pointer"
            >
              3. General director: Bekräfta överenskommelse (Align)
            </button>
          )}
          {stage === 'Aligned' && (
            <button
              type="button"
              onClick={() => setStage('Pending')}
              className="rounded-lg bg-sky-700 px-3 py-1.5 font-semibold text-white hover:bg-sky-800 cursor-pointer"
            >
              4. Skicka till formellt beslut (Submit for Approval)
            </button>
          )}
          {stage === 'Pending' && (
            <button
              type="button"
              onClick={() => setStage('Approved')}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-800 cursor-pointer"
            >
              5. General director / QMS auditor: Approve
            </button>
          )}
          {stage === 'Approved' && (
            <button
              type="button"
              onClick={() => {
                setRevision((r) => r + 1);
                setStage('Draft');
              }}
              className="rounded-lg border border-amber-600/40 bg-amber-500/12 px-3 py-1.5 font-semibold text-amber-900 dark:text-amber-200 cursor-pointer"
            >
              Testa ändring på godkänt mål → Skapa Draft v{revision + 1}
            </button>
          )}
        </div>

        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
          {stage === 'Aligned'
            ? 'Observera: Status är Aligned men Basic user kan fortfarande INTE se målet. Aligned ≠ Approved — klicka Submit for Approval!'
            : stage === 'Approved'
              ? `Revision v${revision} är nu styrande och synlig för hela teamet. Klicka på knappen ovan för att se hur revisionslåset skyddar godkända mål vid senare ändringar.`
              : 'Följ knapparna i ordning för att se hela Catchball- och godkännandecykeln.'}
        </p>
      </div>
    </SandboxFrame>
  );
};

/* 4. Project A3 Task % vs KPI Proof Sandbox (Chapter 6) */
const ProjectA3Sandbox: React.FC = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Filma omställning på Linje 3 & separera intern/extern tid', owner: 'Team Leader', done: true },
    { id: 2, title: 'Montera snabbkopplingar och färgkodade mallar', owner: 'Maintenance Tech', done: true },
    { id: 3, title: 'Utbilda samtliga skift på ny SMED-standard', owner: 'Production Manager', done: false },
  ]);
  const [kpiVerified, setKpiVerified] = useState(false);

  const doneCount = tasks.filter((t) => t.done).length;
  const projectPct = Math.round((doneCount / tasks.length) * 100);
  const oeeActual = kpiVerified ? 68 : 57;

  return (
    <SandboxFrame
      title="Övning 4: Varför 100 % klara Project Tasks INTE bevisar uppnått KPI-mål"
      subtitle="Bocka av alla uppgifter i Project A3 (Line 3 Changeover Reduction) och jämför projektprogress med verkligt KPI-utfall."
      onReset={() => {
        setTasks([
          { id: 1, title: 'Filma omställning på Linje 3 & separera intern/extern tid', owner: 'Team Leader', done: true },
          { id: 2, title: 'Montera snabbkopplingar och färgkodade mallar', owner: 'Maintenance Tech', done: true },
          { id: 3, title: 'Utbilda samtliga skift på ny SMED-standard', owner: 'Production Manager', done: false },
        ]);
        setKpiVerified(false);
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--ink)]">Project Tasks (SMED Linje 3)</span>
            <span className="font-mono font-bold text-teal-700 dark:text-teal-300">{projectPct} % utfört</span>
          </div>
          {tasks.map((t) => (
            <label
              key={t.id}
              className="flex items-start gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() =>
                  setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
                }
                className="mt-0.5"
              />
              <div>
                <div className={`font-semibold text-[var(--ink)] ${t.done ? 'line-through opacity-70' : ''}`}>
                  {t.title}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Owner: {t.owner}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-3">
          <div className="font-bold text-[var(--ink)]">Jämförelse: Aktivitet vs. Verkligt KPI-utfall</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
              <div className="text-[10px] font-bold uppercase text-[var(--muted)]">Project A3 Progress</div>
              <div className="text-xl font-bold font-mono tabular-nums mt-1">{projectPct}%</div>
              <StatusBadge label={projectPct === 100 ? 'Completed' : 'In progress'} />
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
              <div className="text-[10px] font-bold uppercase text-[var(--muted)]">OEE KPI (Mål 60 %)</div>
              <div className="text-xl font-bold font-mono tabular-nums mt-1">{oeeActual}%</div>
              <StatusBadge label={oeeActual >= 60 ? 'On track' : 'Off track'} />
            </div>
          </div>

          <p className="text-[11px] text-[var(--muted)] leading-relaxed">
            {projectPct === 100 && !kpiVerified
              ? 'Notera! Projektet visar nu 100 % Completed — men OEE är fortfarande 57 % (Off track). Projektprocent bevisar endast att uppgifterna utförts, aldrig att resultatet uppnåtts.'
              : kpiVerified
                ? 'Först när uppmätt KPI i Bowling Chart bekräftar 68 % mot mål 60 % vet vi att SMED-åtgärderna gav faktisk effekt.'
                : 'Bocka i den sista projektasken för att se skillnaden mellan projektstatus och KPI-utfall.'}
          </p>

          <button
            type="button"
            onClick={() => setKpiVerified((v) => !v)}
            className="rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer"
          >
            {kpiVerified ? 'Återställ KPI till 57 % (före effekt)' : 'Simulera verifierad KPI-mätning nästa månad (68 %)'}
          </button>
        </div>
      </div>
    </SandboxFrame>
  );
};

/* 5. Daily Board Tier 1-3 Escalation Sandbox (Chapter 7) */
const DailyBoardSandbox: React.FC = () => {
  const [safetyDay, setSafetyDay] = useState<'green' | 'amber' | 'red'>('amber');
  const [tierStep, setTierStep] = useState<1 | 2 | 3>(1);

  const cycleSafety = () => {
    setSafetyDay((prev) => (prev === 'green' ? 'amber' : prev === 'amber' ? 'red' : 'green'));
  };

  return (
    <SandboxFrame
      title="Övning 5: Följ ett linjestopp genom Daily Board Tier 1 → Tier 2 → Tier 3"
      subtitle="Testa Safety Cross-klickning och klicka igenom hur en upprepad driftstörning eskaleras mellan mötesnivåerna."
      onReset={() => {
        setSafetyDay('amber');
        setTierStep(1);
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-2.5">
          <div className="font-bold text-[var(--ink)]">Safety Cross (klicka dagens ruta)</div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cycleSafety}
              className={`w-12 h-12 rounded-lg border font-mono text-sm font-bold cursor-pointer ${
                safetyDay === 'green'
                  ? 'bg-emerald-700 border-emerald-800 text-white'
                  : safetyDay === 'amber'
                    ? 'bg-amber-700 border-amber-800 text-white'
                    : 'bg-rose-700 border-rose-800 text-white'
              }`}
            >
              14
            </button>
            <div>
              <div className="font-semibold text-[var(--ink)]">
                {safetyDay === 'green' ? 'Grön · OK / Inga avvikelser' : safetyDay === 'amber' ? 'Gul · Tillbud / Mindre störning' : 'Röd · Incident / Upprepade stopp'}
              </div>
              <div className="text-[11px] text-[var(--muted)]">Klicka på 14 för att växla status</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 1 as const, label: 'Tier 1 · Team Pulse' },
              { id: 2 as const, label: 'Tier 2 · Site Scorecard' },
              { id: 3 as const, label: 'Tier 3 · Obeya' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierStep(t.id)}
                className={`rounded-lg border px-3 py-1.5 font-semibold cursor-pointer ${
                  tierStep === t.id
                    ? 'border-teal-700 bg-teal-700 text-white dark:bg-teal-600'
                    : 'border-[var(--border-strong)] bg-[var(--bg)] text-[var(--ink)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tierStep === 1 && (
            <div className="space-y-1">
              <div className="font-bold text-[var(--ink)]">Tier 1: Team Leader fångar avvikelsen på morgonmötet</div>
              <p className="text-[var(--muted)] leading-relaxed">
                Linje 3 har haft 3 oplanerade givarstopp under skiftet. Teamet skapar ett Pulse Card med rutt <strong>Escalate</strong> eftersom egen felsökning inte räckte.
              </p>
            </div>
          )}
          {tierStep === 2 && (
            <div className="space-y-1">
              <div className="font-bold text-[var(--ink)]">Tier 2: Avdelningschef &amp; Site samordnar stöd</div>
              <p className="text-[var(--muted)] leading-relaxed">
                Production Manager och Maintenance Manager ser eskaleringen på Site Scorecard och tilldelar underhållstekniker samma förmiddag. Om reservdel saknas eller problemet återkommer skickas det vidare till Tier 3.
              </p>
            </div>
          )}
          {tierStep === 3 && (
            <div className="space-y-1">
              <div className="font-bold text-[var(--ink)]">Tier 3: Ledning fattar resursbeslut &amp; kopplar till PDCA</div>
              <p className="text-[var(--muted)] leading-relaxed">
                Ledningen omvandlar blockeraren till ett formellt PDCA Decision med ägare och budget — och knyter rotorsaksanalysen till ett förbättringsinitiativ.
              </p>
            </div>
          )}
        </div>
      </div>
    </SandboxFrame>
  );
};

/* 6. OEE Bowling Chart + PDCA Trigger Sandbox (Chapters 8 & 9) */
const KpiPdcaSandbox: React.FC = () => {
  const defaultRows = [
    { month: 'Jan', target: 56, actual: '55' },
    { month: 'Feb', target: 58, actual: '58' },
    { month: 'Mar', target: 60, actual: '57' },
    { month: 'Apr', target: 62, actual: '' },
  ];
  const [rows, setRows] = useState(defaultRows);
  const [tolerance, setTolerance] = useState(2);
  const [pdcaOpened, setPdcaOpened] = useState(false);

  const calcStatus = (actualStr: string, target: number) => {
    if (actualStr.trim() === '' || !Number.isFinite(Number(actualStr))) {
      return { label: 'Not measured', gap: null as number | null };
    }
    const gap = Number(actualStr) - target; // higher-is-better
    if (gap >= 0) return { label: 'On track', gap };
    if (gap >= -tolerance) return { label: 'At risk', gap };
    return { label: 'Off track', gap };
  };

  const evaluated = rows.map((r) => ({ ...r, ...calcStatus(r.actual, r.target) }));
  const hasOffTrack = evaluated.some((r) => r.label === 'Off track');

  return (
    <SandboxFrame
      title="Övning 6: Interaktiv OEE Bowling Chart & PDCA-trigger"
      subtitle="Ändra faktiska utfall (Jan/Feb/Mar/Apr) eller tolerans och se SafeQMS verkliga statusformel samt skillnaden mellan KPI-varning och öppnad PDCA Review."
      onReset={() => {
        setRows(defaultRows);
        setTolerance(2);
        setPdcaOpened(false);
      }}
    >
      <div className="space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold text-[var(--ink)]">
            KPI: OEE (%) · Direction: <span className="font-mono">higher</span>
          </div>
          <label className="inline-flex items-center gap-2 font-semibold text-[var(--muted)]">
            <span>Tolerans (± procentenheter):</span>
            <input
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={tolerance}
              onChange={(e) => setTolerance(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1 font-mono text-[var(--ink)] tabular-nums"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-center text-xs font-mono tabular-nums">
            <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 text-left font-sans font-semibold">Rad</th>
                {evaluated.map((r) => (
                  <th key={r.month} className="px-3 py-2 font-semibold">{r.month}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-3 py-2 text-left font-sans font-semibold text-[var(--muted)]">Target (%)</td>
                {evaluated.map((r) => (
                  <td key={r.month} className="px-3 py-2 text-[var(--muted)]">{r.target}%</td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-left font-sans font-semibold text-[var(--ink)]">Actual (%) — redigera</td>
                {evaluated.map((r, idx) => (
                  <td key={r.month} className="px-2 py-1.5">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={r.actual}
                      placeholder="—"
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, actual: e.target.value } : row))
                        )
                      }
                      className="w-16 rounded border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 text-center font-mono text-xs text-[var(--ink)]"
                    />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-left font-sans font-semibold text-[var(--muted)]">Gap</td>
                {evaluated.map((r) => (
                  <td key={r.month} className="px-3 py-2 text-[var(--muted)]">
                    {r.gap === null ? '—' : `${r.gap >= 0 ? '+' : ''}${r.gap.toFixed(1)}%`}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-left font-sans font-semibold text-[var(--muted)]">Beräknad status</td>
                {evaluated.map((r) => (
                  <td key={r.month} className="px-3 py-2">
                    <StatusBadge label={r.label} />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="flex items-start gap-2">
            {hasOffTrack ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              {hasOffTrack ? (
                <span>
                  <strong>Automatisk KPI-varning aktiv:</strong> Minst en månad ligger <strong>Off track</strong> (gap &lt; -{tolerance}).{' '}
                  {pdcaOpened
                    ? 'Formell PDCA Review är nu öppnad och beslutad med ansvarig ägare och datum.'
                    : 'Detta är ännu bara en varning — ingen PDCA Review har öppnats förrän ledningen skapar ett beslut.'}
                </span>
              ) : (
                <span>
                  <strong>Ingen röd KPI-signal:</strong> Alla uppmätta månader ligger inom tolerans (±{tolerance}). Prova att sänka Mars till 57 % för att trigga Off track.
                </span>
              )}
            </div>
          </div>

          {hasOffTrack && (
            <button
              type="button"
              onClick={() => setPdcaOpened((v) => !v)}
              className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer whitespace-nowrap"
            >
              {pdcaOpened ? 'Stäng övnings-PDCA' : 'Öppna formell PDCA Review'}
            </button>
          )}
        </div>
      </div>
    </SandboxFrame>
  );
};

export const SopSandboxLab: React.FC<{ kind: SandboxKind }> = ({ kind }) => {
  switch (kind) {
    case 'cascade':
      return <CascadeSandbox />;
    case 'xmatrix':
      return <XMatrixSandbox />;
    case 'catchball':
      return <CatchballSandbox />;
    case 'a3':
      return <ProjectA3Sandbox />;
    case 'daily':
      return <DailyBoardSandbox />;
    case 'kpi-pdca':
      return <KpiPdcaSandbox />;
  }
};

export const AllSandboxLabsGrid: React.FC = () => (
  <div className="space-y-5">
    <CascadeSandbox />
    <XMatrixSandbox />
    <CatchballSandbox />
    <ProjectA3Sandbox />
    <DailyBoardSandbox />
    <KpiPdcaSandbox />
  </div>
);
