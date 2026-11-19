import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  Compass,
  FlaskConical,
  Info,
  Play,
  Printer,
  Rocket,
  RotateCcw,
  ShieldCheck,
  Square,
  Users,
} from 'lucide-react';
import { AppRoute, SAFEQMS_ROLES, SafeQmsRole, formatRoleLabel } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useWalkthrough } from '../../context/WalkthroughContext';
import {
  goalPlanCheck,
  pdcaExceptionQueue,
  roleCan,
  roleVisibleGoals,
  visibleInitiative,
  visibleProject,
} from '../../domain/syncEngine';
import { Card, SectionHeader } from '../ui/Badge';
import {
  ROLE_TRAINING_PROFILES,
  SOP_CHAPTERS,
  SopChapter,
} from '../sop/SopTrainingData';
import { SopProcessMap } from '../sop/SopProcessMap';
import { AllSandboxLabsGrid, SopSandboxLab } from '../sop/SopSandboxLabs';

type GuideTab = 'overview' | 'chapters' | 'sandbox' | 'roles';

export const SopGuidePage: React.FC = () => {
  const {
    activeRole,
    scope,
    year,
    routeId,
    goals,
    kpis,
    initiatives,
    projects,
    tasks,
    pulseCards,
    reviews,
    catchballs,
    approvals,
    domainSnapshot,
    navigate,
  } = useWorkspace();

  const {
    progress,
    startFullTour,
    startChapterTour,
    setLastChapter,
    toggleChapterCheck,
    toggleChapterComplete,
    resetTrainingProgress,
  } = useWalkthrough();

  const [activeTab, setActiveTab] = useState<GuideTab>('overview');
  const [selectedChapterId, setSelectedChapterId] = useState<number>(() => progress.lastChapter || 1);
  const [selectedRole, setSelectedRole] = useState<SafeQmsRole>(activeRole);

  // Sync deep-links such as #sop/chapter-5 from HelpTip or Walkthrough
  useEffect(() => {
    if (!routeId) return;
    const match = routeId.match(/^chapter-(\d+)$/);
    if (match) {
      const ch = Number(match[1]);
      if (ch >= 1 && ch <= SOP_CHAPTERS.length) {
        setSelectedChapterId(ch);
        setLastChapter(ch);
        setActiveTab('chapters');
      }
    }
  }, [routeId, setLastChapter]);

  // Keep Role Guide synced when Admin switches Role Preview
  useEffect(() => {
    setSelectedRole(activeRole);
  }, [activeRole]);

  const isBasic = activeRole === 'Basic user';
  const canCreateGoal = roleCan(activeRole, 'goalCreate', null, { goals, initiatives });

  const liveStats = useMemo(() => {
    const visibleGoals = roleVisibleGoals(goals, scope, activeRole);
    const isoReadyCount = visibleGoals.filter((g) => goalPlanCheck(g, kpis).ready).length;
    const draftGoalsCount = visibleGoals.filter((g) => g.approval === 'Draft').length;
    const approvedGoalsCount = visibleGoals.filter((g) => g.approval === 'Approved').length;
    const pendingApprovals = approvals.filter((a) => a.status === 'Pending').length;
    const activeCatchballs = catchballs.filter((c) => !['Approved', 'Rejected', 'Cancelled'].includes(c.status)).length;
    const visibleInits = initiatives.filter((i) => visibleInitiative(i, goals, activeRole));
    const visibleProjs = projects.filter((p) => visibleProject(p, initiatives, goals, activeRole));
    const openTasks = tasks.filter((t) => t.status !== 'Done').length;
    const activePulse = pulseCards.filter((c) => c.status !== 'Done').length;
    const exceptions = pdcaExceptionQueue(domainSnapshot, scope, true);

    return {
      visibleGoalsCount: visibleGoals.length,
      isoReadyCount,
      draftGoalsCount,
      approvedGoalsCount,
      pendingApprovals,
      activeCatchballs,
      visibleInitsCount: visibleInits.length,
      visibleProjsCount: visibleProjs.length,
      openTasks,
      activePulse,
      kpisCount: kpis.length,
      reviewsCount: reviews.length,
      exceptionsCount: exceptions.length,
    };
  }, [goals, kpis, initiatives, projects, tasks, pulseCards, reviews, catchballs, approvals, domainSnapshot, scope, activeRole]);

  const activeChapter: SopChapter =
    SOP_CHAPTERS.find((c) => c.id === selectedChapterId) || SOP_CHAPTERS[0];

  const completedChaptersCount = progress.completedChapters.length;
  const trainingPct = Math.round((completedChaptersCount / SOP_CHAPTERS.length) * 100);
  const roleProfile =
    ROLE_TRAINING_PROFILES.find((r) => r.role === selectedRole) || ROLE_TRAINING_PROFILES[0];
  const myRoleProfile =
    ROLE_TRAINING_PROFILES.find((r) => r.role === activeRole) || ROLE_TRAINING_PROFILES[0];

  const handleOpenChapter = (chapterId: number) => {
    setSelectedChapterId(chapterId);
    setLastChapter(chapterId);
    setActiveTab('chapters');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderRouteAction = (
    targetRoute: AppRoute,
    label: string,
    opts?: { requiresNonBasic?: boolean; requiresGoalCreate?: boolean }
  ) => {
    const blockedBasic = opts?.requiresNonBasic && isBasic;
    const blockedCreate = opts?.requiresGoalCreate && targetRoute === 'newgoal' && !canCreateGoal;
    if (blockedBasic || blockedCreate) {
      return (
        <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5 text-xs text-[var(--muted)] whitespace-nowrap">
          {label} ({blockedBasic ? 'Låst för Basic user' : 'Läsläge för din roll'})
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => navigate(targetRoute)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] hover:border-teal-600/40 transition-colors cursor-pointer whitespace-nowrap"
      >
        <span>{label}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
      </button>
    );
  };

  const getChapterLiveContext = (chapterId: number): string => {
    switch (chapterId) {
      case 1:
        return `Aktiv arbetsyta · Scope: ${scope} · Horizon: ${year} · Roll: ${formatRoleLabel(activeRole)}`;
      case 2:
        return `${liveStats.visibleGoalsCount} synliga mål i ${scope} · ${liveStats.isoReadyCount} ISO Ready`;
      case 3:
        return `${liveStats.visibleGoalsCount} mål i hierarkin (${liveStats.approvedGoalsCount} Approved · ${liveStats.draftGoalsCount} Draft)`;
      case 4:
        return `${liveStats.visibleGoalsCount} mål · ${liveStats.visibleInitsCount} initiativ · ${liveStats.kpisCount} KPI:er`;
      case 5:
        return `${liveStats.activeCatchballs} aktiva Catchball-trådar · ${liveStats.pendingApprovals} väntar i Formal Approvals`;
      case 6:
        return `${liveStats.visibleInitsCount} initiativ · ${liveStats.visibleProjsCount} Project A3 · ${liveStats.openTasks} öppna tasks`;
      case 7:
        return `${liveStats.activePulse} aktiva Pulse Cards i Daily Board · ${liveStats.openTasks} öppna tasks`;
      case 8:
        return `${liveStats.kpisCount} aktiva KPI-serier i arbetsytan`;
      case 9:
        return `${liveStats.exceptionsCount} aktiva signaler/blockerare i Exception Queue · ${liveStats.reviewsCount} PDCA Reviews`;
      case 10:
        return `${liveStats.isoReadyCount}/${liveStats.visibleGoalsCount} mål ISO Ready i ${scope}`;
      default:
        return '';
    }
  };

  const renderChapterBody = (ch: SopChapter, printable = false) => {
    const chCheckIds = ch.checklist.map((item) => item.id);
    const isChapterDone = progress.completedChapters.includes(ch.id);
    const isRoleMatch = ch.responsibleRoles.includes(activeRole);

    return (
      <div className="space-y-5">
        {/* Chapter Header */}
        <Card className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div className="space-y-1 max-w-3xl">
              <div className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-300">
                {ch.code} · {ch.levelLabel}
                {!printable && (
                  <>
                    {' '}
                    · <span className="text-[var(--muted)] font-normal">{getChapterLiveContext(ch.id)}</span>
                  </>
                )}
              </div>
              <h2 className="text-lg font-bold tracking-tight text-[var(--ink)]">{ch.title}</h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">{ch.purpose}</p>
            </div>

            {!printable && (
              <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">
                <button
                  type="button"
                  onClick={() => startChapterTour(ch.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Guidad genomgång</span>
                </button>
                {renderRouteAction(ch.route, ch.routeLabel, {
                  requiresNonBasic: ch.requiresNonBasic,
                })}
                {ch.secondaryRoute &&
                  renderRouteAction(ch.secondaryRoute.route, ch.secondaryRoute.label, {
                    requiresNonBasic: ch.secondaryRoute.requiresNonBasic,
                    requiresGoalCreate: ch.requiresGoalCreate,
                  })}
              </div>
            )}
          </div>

          {/* 4-Column Orientation Grid: When, Prerequisites, Role, Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-[var(--ink)]">När utförs detta?</div>
              <p className="text-[var(--muted)] leading-relaxed">{ch.whenToDo}</p>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-[var(--ink)]">Förutsättningar</div>
              <ul className="space-y-1 text-[var(--muted)] list-disc pl-4 leading-relaxed">
                {ch.prerequisites.map((pre, i) => (
                  <li key={i}>{pre}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-[var(--ink)]">
                Ansvarig roll {!printable && isRoleMatch && '· Gäller din roll'}
              </div>
              <p className="text-[var(--muted)] leading-relaxed">{ch.roleSummary}</p>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-[var(--ink)]">Navigering i appen</div>
              <p className="text-[var(--muted)] leading-relaxed">{ch.navigationPath}</p>
            </div>
          </div>
        </Card>

        {/* Key Distinction Callout (if present) */}
        {ch.keyDistinction && (
          <div className="rounded-xl border border-amber-600/30 bg-amber-500/8 p-4 space-y-1 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Viktig princip: {ch.keyDistinction.title}</span>
            </div>
            <p className="text-[var(--ink)] leading-relaxed">{ch.keyDistinction.body}</p>
          </div>
        )}

        {/* Two-Column Core: Step-by-Step Instructions + Practical Example */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Card className="lg:col-span-7 p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--ink)]">Steg-för-steg-instruktion</h3>
            <ol className="space-y-2.5 text-xs text-[var(--ink)] leading-relaxed">
              {ch.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[var(--surface-subtle)] border border-[var(--border)] font-mono text-[11px] font-bold text-teal-700 dark:text-teal-300 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="lg:col-span-5 p-5 space-y-3">
            <div>
              <div className="text-[11px] font-mono font-semibold text-teal-700 dark:text-teal-300">
                PRAKTISKT EXEMPEL
              </div>
              <h3 className="text-sm font-bold text-[var(--ink)] mt-0.5">{ch.practicalExample.heading}</h3>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{ch.practicalExample.summary}</p>
            </div>

            <div className="divide-y divide-[var(--border)] border-t border-[var(--border)] text-xs">
              {ch.practicalExample.rows.map((row, idx) => (
                <div key={idx} className="py-2.5 flex flex-col gap-0.5">
                  <span className="font-semibold text-[var(--muted)]">{row.label}</span>
                  <span className="font-medium text-[var(--ink)] leading-relaxed">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Interactive Safe Sandbox (when chapter has one, screen only) */}
        {!printable && ch.sandboxId && <SopSandboxLab kind={ch.sandboxId} />}

        {/* Expected Result, Next Step & Common Mistakes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <Card className="p-4 space-y-1.5">
            <div className="font-bold text-emerald-700 dark:text-emerald-300">Förväntat resultat</div>
            <p className="text-[var(--ink)] leading-relaxed">{ch.expectedResult}</p>
          </Card>

          <Card className="p-4 space-y-1.5">
            <div className="font-bold text-teal-700 dark:text-teal-300">Nästa steg i flödet</div>
            <p className="text-[var(--ink)] leading-relaxed">{ch.nextStep}</p>
          </Card>

          <Card className="p-4 space-y-1.5">
            <div className="font-bold text-amber-800 dark:text-amber-300">Vanliga misstag att undvika</div>
            <ul className="space-y-1 text-[var(--muted)] list-disc pl-4 leading-relaxed">
              {ch.commonMistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Honest Proposed Enhancement Note (if applicable) */}
        {ch.proposedNote && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)]/60 px-4 py-3 flex items-start gap-2.5 text-xs text-[var(--muted)]">
            <Info className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{ch.proposedNote}</span>
          </div>
        )}

        {/* Chapter Completion Checklist */}
        <Card className="p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--ink)]">Slutförandechecklista — {ch.code}</h3>
              <p className="text-xs text-[var(--muted)]">
                När alla punkter är klara markeras kapitlet automatiskt som genomfört i din utbildningsprogress.
              </p>
            </div>
            {!printable && (
              <button
                type="button"
                onClick={() => toggleChapterComplete(ch.id, chCheckIds)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer no-print whitespace-nowrap ${
                  isChapterDone
                    ? 'border-emerald-600/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300'
                    : 'border-[var(--border-strong)] bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isChapterDone ? 'Kapitel slutfört' : 'Markera kapitel klart'}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {ch.checklist.map((item) => {
              const checked = !!progress.chapterChecks[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={printable}
                  onClick={() => toggleChapterCheck(item.id, ch.id, chCheckIds)}
                  className={`w-full flex items-start gap-2.5 rounded-lg border p-2.5 text-left text-xs transition-colors ${
                    printable ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    checked
                      ? 'border-emerald-600/30 bg-emerald-500/8 text-[var(--ink)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-[var(--muted)] shrink-0 mt-0.5" />
                  )}
                  <span className={checked ? 'line-through opacity-75' : ''}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <SectionHeader
        title="SOP & User Guide — Interaktiv Utbildningsplattform"
        subtitle={`Komplett end-to-end-guide för SafeQMS Goal Management från strategi och kaskadering till daglig styrning, KPI, PDCA och ISO-revision. Aktiv roll: ${formatRoleLabel(activeRole)} · Scope: ${scope} · Horizon: ${year}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => navigate('onboarding')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Ny kund · Starta från noll</span>
            </button>
            <button
              type="button"
              onClick={() => startFullTour(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700/30 bg-teal-600/10 px-3.5 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-600/15 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-200 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Starta guidad genomgång</span>
            </button>
            {progress.lastTourStepId && (
              <button
                type="button"
                onClick={() => startFullTour(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
              >
                <span>Återuppta rundtur</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Skriv ut / Spara som PDF</span>
            </button>
          </div>
        }
      />

      {/* Interactive Training Progress & Mode Navigation Bar */}
      <Card className="p-4 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-[var(--ink)]">
              Din utbildningsprogress · {completedChaptersCount} av {SOP_CHAPTERS.length} kapitel klara ({trainingPct} %)
            </div>
            <div className="text-[11px] text-[var(--muted)]">
              Rekommenderade kapitel för <strong>{formatRoleLabel(activeRole)}</strong>: Kapitel{' '}
              {myRoleProfile.recommendedChapters.join(', ')} · Senast besökt: Kapitel {progress.lastChapter}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenChapter(progress.lastChapter || 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>Fortsätt Kapitel {progress.lastChapter || 1}</span>
            </button>
            {(completedChaptersCount > 0 || Object.keys(progress.chapterChecks).length > 0) && (
              <button
                type="button"
                onClick={resetTrainingProgress}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nollställ progress</span>
              </button>
            )}
          </div>
        </div>

        <div className="h-1.5 w-full rounded-full bg-[var(--surface-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-700 dark:bg-teal-500 transition-[width] duration-200"
            style={{ width: `${trainingPct}%` }}
          />
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border)]">
          {(
            [
              { id: 'overview', label: 'Översikt & Processkarta', icon: Compass },
              { id: 'chapters', label: 'Utbildningskapitel (1–10)', icon: BookOpen },
              { id: 'sandbox', label: 'Övnings-sandbox (6 labbar)', icon: FlaskConical },
              { id: 'roles', label: 'Rollguide (6 roller)', icon: Users },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-teal-700 text-white dark:bg-teal-600'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* SCREEN INTERACTIVE CONTENT */}
      <div className="no-print space-y-6">
        {/* TAB 1: OVERVIEW & INTERACTIVE 4-LEVEL PROCESS MAP */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Why Goal Management + Live Workspace Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <Card className="lg:col-span-7 p-5 space-y-3">
                <h2 className="text-sm font-bold text-[var(--ink)]">
                  Vad är Goal Management (Hoshin Kanri) — och var börjar du?
                </h2>
                <p className="text-xs text-[var(--ink)] leading-relaxed">
                  <strong>SafeQMS Goal Management</strong> kopplar ihop företagets långsiktiga strategi med det dagliga arbetet på golvet och kraven i ISO 9001, 14001 och 45001. Istället för att strategi blir ett separat bildspel som glöms bort säkerställer systemet en obruten kedja:
                </p>
                <p className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs font-semibold text-[var(--ink)] leading-relaxed">
                  Strategi → Goal Cascade → X-Matrix → Catchball → Formal Approval → Initiatives → Project A3 → Daily Management → KPI Measurement → PDCA → Management Review → Ständiga förbättringar.
                </p>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  <strong>Viktigt:</strong> Flödet är inte enbart linjärt. Daglig styrning (Tier 1–3), projektuppgifter, KPI-mätning och PDCA pågår parallellt varje dag och månad och återkopplar ständigt tillbaka till taktik och strategi.
                </p>
              </Card>

              <Card className="lg:col-span-5 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--ink)]">Live-status i din arbetsyta</h2>
                  <span className="font-mono text-[11px] text-[var(--muted)]">{scope} · {year}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
                    <div className="text-[11px] text-[var(--muted)]">Synliga mål</div>
                    <div className="font-mono text-base font-bold tabular-nums text-[var(--ink)]">
                      {liveStats.visibleGoalsCount}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">{liveStats.isoReadyCount} ISO Ready</div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
                    <div className="text-[11px] text-[var(--muted)]">Initiativ &amp; A3</div>
                    <div className="font-mono text-base font-bold tabular-nums text-[var(--ink)]">
                      {liveStats.visibleInitsCount} / {liveStats.visibleProjsCount}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">{liveStats.openTasks} öppna tasks</div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
                    <div className="text-[11px] text-[var(--muted)]">Catchball &amp; Beslut</div>
                    <div className="font-mono text-base font-bold tabular-nums text-[var(--ink)]">
                      {liveStats.activeCatchballs} / {liveStats.pendingApprovals}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">Aktiva / Väntar Approval</div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5">
                    <div className="text-[11px] text-[var(--muted)]">KPI &amp; PDCA-signaler</div>
                    <div className="font-mono text-base font-bold tabular-nums text-[var(--ink)]">
                      {liveStats.kpisCount} / {liveStats.exceptionsCount}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">{liveStats.reviewsCount} PDCA Reviews</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Interactive 4-Level Process Map */}
            <SopProcessMap
              activeChapterId={selectedChapterId}
              completedChapters={progress.completedChapters}
              onSelectChapter={handleOpenChapter}
            />

            {/* 10-Chapter Directory Grid */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base font-bold tracking-tight text-[var(--ink)]">
                  Alla 10 utbildningskapitel
                </h2>
                <span className="text-xs text-[var(--muted)]">Klicka på ett kapitel för att öppna det</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                {SOP_CHAPTERS.map((ch) => {
                  const done = progress.completedChapters.includes(ch.id);
                  const recommended = myRoleProfile.recommendedChapters.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleOpenChapter(ch.id)}
                      className={`rounded-xl border p-4 text-left transition-colors cursor-pointer space-y-1.5 ${
                        done
                          ? 'border-emerald-600/30 bg-emerald-500/6 hover:border-emerald-600/60'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-teal-600/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-teal-700 dark:text-teal-300">{ch.code}</span>
                        {done ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Klar ✓</span>
                        ) : recommended ? (
                          <span className="text-[var(--muted)]">För din roll</span>
                        ) : null}
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)] leading-snug">{ch.shortTitle}</div>
                      <div className="text-[11px] text-[var(--muted)] line-clamp-2 leading-relaxed">
                        {ch.levelLabel}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Honest Capability Transparency Card */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <span>Transparens: Implementerat idag vs. föreslagna framtida tillägg</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                <div className="space-y-1.5">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300">Fullt implementerat i SafeQMS</div>
                  <ul className="space-y-1 text-[var(--muted)] list-disc pl-4">
                    <li>Realtidssynk via Firestore med 6 roller, Scope/Horizon, ⌘K-sök och Administration (UID-team).</li>
                    <li>3-nivå Goal Cascade, 360° X-Matrix, Strategy A3, Catchball med turordning, Formal Approvals &amp; revisionslås (v1 → v2).</li>
                    <li>Initiatives med SQDC/TOC, Project A3 &amp; 5-Why, Project Tasks, Daily Board Tier 1–3 med Safety Cross &amp; Kanban, My Focus.</li>
                    <li>12-mån Bowling Chart med klickbara celler, CSV KPI Import, auto-signaler till PDCA Reviews, ISO Compliance, Management Review &amp; Audit Evidence Pack.</li>
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <div className="font-bold text-amber-800 dark:text-amber-300">Föreslagna framtida förbättringar (ej aktiva idag)</div>
                  <ul className="space-y-1 text-[var(--muted)] list-disc pl-4">
                    <li>Eget UI-formulär för att skapa helt nya KPI-definitioner och mätfrekvenser utöver månatliga serier.</li>
                    <li>1-klickskonvertering direkt från ett Tier 1 Pulse Card till ett nyskapat Project A3-dokument.</li>
                    <li>Fristående signeringsfält för verifierad effekt (Effectiveness Verification) på enskilda PDCA-beslut.</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: 10 GUIDED CHAPTERS */}
        {activeTab === 'chapters' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Chapter Sidebar Index */}
            <Card className="xl:col-span-3 p-3 space-y-1">
              <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Utbildningskapitel (1–10)
              </div>
              {SOP_CHAPTERS.map((ch) => {
                const active = ch.id === activeChapter.id;
                const done = progress.completedChapters.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleOpenChapter(ch.id)}
                    className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-teal-600/12 text-teal-800 font-bold ring-1 ring-inset ring-teal-700/20 dark:bg-teal-400/12 dark:text-teal-200'
                        : 'text-[var(--ink)] hover:bg-[var(--surface-subtle)] font-medium'
                    }`}
                  >
                    <span className="truncate">
                      <span className="font-mono text-[11px] text-[var(--muted)] mr-1.5">
                        {String(ch.id).padStart(2, '0')}
                      </span>
                      {ch.shortTitle}
                    </span>
                    {done && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </Card>

            {/* Active Chapter Content */}
            <div className="xl:col-span-9 space-y-5">
              {renderChapterBody(activeChapter, false)}

              {/* Previous / Next Chapter Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  disabled={activeChapter.id === 1}
                  onClick={() => handleOpenChapter(activeChapter.id - 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Föregående kapitel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                >
                  Tillbaka till Processkartan
                </button>

                <button
                  type="button"
                  disabled={activeChapter.id === SOP_CHAPTERS.length}
                  onClick={() => handleOpenChapter(activeChapter.id + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  <span>Nästa kapitel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALL SAFE LEARN-BY-DOING SANDBOX LABS */}
        {activeTab === 'sandbox' && (
          <div className="space-y-4">
            <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-[var(--ink)]">
                  Övnings-sandbox — Lär genom att göra (100 % isolerad)
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Alla 6 övningar använder realistiska exempel (OEE 55 % → 75 %, SMED Linje 3, Bowling Chart Q1) helt lokalt i webbläsaren. Inga ändringar skrivs till din skarpa Firestore-databas.
                </p>
              </div>
            </Card>
            <AllSandboxLabsGrid />
          </div>
        )}

        {/* TAB 4: ROLE-SPECIFIC TRAINING MATRIX (6 ROLES) */}
        {activeTab === 'roles' && (
          <Card className="p-5 space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[var(--ink)]">
                  Rollanpassad utbildning &amp; ansvarsmatris (6 roller)
                </h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Välj roll för att se exakt synlighet, rekommenderade kapitel, dagliga rutiner och behörighetsgränser. Guiden ger aldrig utökade rättigheter.
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                Din aktiva roll: {formatRoleLabel(activeRole)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAFEQMS_ROLES.map((r) => {
                const selected = selectedRole === r;
                const isMine = activeRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      selected
                        ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-500 dark:bg-teal-600'
                        : 'border-[var(--border-strong)] bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    {formatRoleLabel(r)}
                    {isMine ? ' (Du)' : ''}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink)]">{formatRoleLabel(roleProfile.role)}</h3>
                  <p className="text-xs text-[var(--muted)]">{roleProfile.tagline}</p>
                </div>
                <span className="text-xs text-[var(--muted)]">{roleProfile.visibility}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="font-bold text-[var(--ink)]">Arbetsrutiner i SafeQMS</div>
                  <ul className="space-y-1.5 text-[var(--muted)] list-disc pl-4 leading-relaxed">
                    {roleProfile.routines.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <div className="font-bold text-emerald-700 dark:text-emerald-300">Behörigheter</div>
                  <ul className="space-y-1.5 text-[var(--ink)] list-disc pl-4 leading-relaxed">
                    {roleProfile.permissions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <div className="font-bold text-amber-800 dark:text-amber-300">Begränsningar</div>
                  <ul className="space-y-1.5 text-[var(--muted)] list-disc pl-4 leading-relaxed">
                    {roleProfile.restrictions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Rekommenderad utbildningsväg:</span>
                {roleProfile.recommendedChapters.map((cid) => {
                  const c = SOP_CHAPTERS.find((x) => x.id === cid);
                  if (!c) return null;
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => handleOpenChapter(cid)}
                      className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:border-teal-600/50 cursor-pointer whitespace-nowrap"
                    >
                      {c.code}: {c.shortTitle}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* PRINTABLE COMPLETE SOP DOCUMENT (VISIBLE ONLY IN @media print) */}
      <div className="print-only space-y-8">
        <div className="space-y-2 border-b border-[var(--border-strong)] pb-4">
          <div className="text-xs font-mono text-[var(--muted)]">
            SafeQMS Goal Management · Standard Operating Procedure (SOP) · Scope: {scope} · Horizon: {year}
          </div>
          <h1 className="text-2xl font-bold">End-to-End Användarguide &amp; Arbetsflöde (Kapitel 1–10)</h1>
          <p className="text-xs text-[var(--muted)]">
            Strategi → Goal Cascade → X-Matrix → Catchball → Formal Approval → Initiatives → Project A3 → Daily Management → KPI Measurement → PDCA → Management Review → Ständiga förbättringar.
          </p>
        </div>

        <SopProcessMap
          activeChapterId={0}
          completedChapters={progress.completedChapters}
          onSelectChapter={() => {}}
        />

        <div className="space-y-3">
          <h2 className="text-base font-bold">Ansvarsmatris (6 roller)</h2>
          <table className="w-full text-left text-xs border-collapse border border-[var(--border-strong)]">
            <thead>
              <tr className="border-b border-[var(--border-strong)]">
                <th className="p-2 font-bold">Roll</th>
                <th className="p-2 font-bold">Synlighet</th>
                <th className="p-2 font-bold">Huvudansvar</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_TRAINING_PROFILES.map((r) => (
                <tr key={r.role} className="border-b border-[var(--border)]">
                  <td className="p-2 font-bold">{formatRoleLabel(r.role)}</td>
                  <td className="p-2">{r.visibility}</td>
                  <td className="p-2">{r.tagline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-8">
          {SOP_CHAPTERS.map((ch) => (
            <div key={`print-${ch.id}`} className="a3-box">
              {renderChapterBody(ch, true)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
