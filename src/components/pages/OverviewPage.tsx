import React from 'react';
import { ArrowRight, CheckCircle2, MessageSquareMore, Plus, Target } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  cbCanAct,
  computeKpiStatus,
  goalById,
  goalPlanCheck,
  initiativeLinkedToGoal,
  isoShort,
  kpiById,
  managementSummary,
  pdcaExceptionQueue,
  roleCan,
  roleVisibleGoals,
  visibleInitiative,
  visibleToRole,
  xm4OrgParent,
  xm4ScopeIncludes,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';
import { ScopeBar } from '../ui/ScopeBar';
import { BlockerBox } from '../ui/BlockerPanel';

export const OverviewPage: React.FC = () => {
  const { t, tScope } = useLanguage();
  const {
    scope,
    goals,
    kpis,
    initiatives,
    tasks,
    relations,
    catchballs,
    approvals,
    activities,
    isoStandards,
    activeRole,
    domainSnapshot,
    navigate,
    toggleTaskStatus,
    openQuickCreate,
  } = useWorkspace();

  const isBasic = activeRole === 'Basic user';
  const isAuditor = activeRole === 'Auditor';
  const visibleGoals = roleVisibleGoals(goals, scope, activeRole);
  const orgGoals = goals.filter((g) => g.level === 'Organization' && visibleToRole(g, activeRole));
  const summary = managementSummary(domainSnapshot);
  const exceptions = pdcaExceptionQueue(domainSnapshot, scope, true);

  const actionableCatchballs = catchballs.filter(
    (c) =>
      cbCanAct(c, 'counter', activeRole, goals, initiatives) ||
      cbCanAct(c, 'send', activeRole, goals, initiatives) ||
      cbCanAct(c, 'approval', activeRole, goals, initiatives)
  );

  const visibleInits = initiatives.filter((i) => visibleInitiative(i, goals, activeRole));
  const avgInitProgress = visibleInits.length
    ? Math.round(visibleInits.reduce((acc, i) => acc + Number(i.progress || 0), 0) / visibleInits.length)
    : 0;

  const directorDecisions = activities.filter((a) => a.kind === 'directorDecision');

  return (
    <div className="space-y-6">
      <SectionHeader
        title={
          isBasic
            ? t('My Team Workspace', 'Mitt teamutrymme')
            : isAuditor
              ? t('Audit Readiness Overview', 'Översikt · Revisionsberedskap')
              : t('Strategy Execution Overview', 'Strategisk översikt')
        }
        subtitle={
          isBasic
            ? t('Your assigned team tasks, active targets, and daily stand-up priorities.', 'Dina tilldelade uppgifter, aktiva mål och prioriteringar för daglig styrning.')
            : isAuditor
              ? t('Read-only ISO 9001, 14001 & 45001 goal alignment, evidence traceability, and review records.', 'Skrivskyddad vy för ISO 9001, 14001 & 45001 – måluppfyllelse, bevisspårbarhet och genomgångar.')
              : t('Hoshin Kanri alignment from multi-year strategic pillars through annual KPIs, initiatives, and daily Tier 1–3 execution.', 'Hoshin Kanri från fleråriga strategiska pelare till årsmål, KPI:er, initiativ och daglig styrning Nivå 1–3.')
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('myfocus')}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
            >
              {t('My Focus', 'Mitt fokus')}
            </button>
            <button
              type="button"
              onClick={() => navigate('daily')}
              className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
            >
              Daily Board
            </button>
            {roleCan(activeRole, 'goalCreate', null, { goals, initiatives }) ? (
              <button
                type="button"
                onClick={openQuickCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Quick Create', 'Snabbskapa')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('governance', 'matrix')}
                className="rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
              >
                {t('Open X-Matrix', 'Öppna X-Matrix')}
              </button>
            )}
          </div>
        }
      />

      <ScopeBar />

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t('Goals in Scope', 'Mål i omfattning')}
          </div>
          <div className="text-2xl font-bold tabular-nums text-[var(--ink)]">{visibleGoals.length}</div>
          <div className="text-xs text-[var(--muted)]">
            {summary.on.length} {t('on track', 'i fas')} · {summary.risk.length + summary.off.length} {t('risk/off', 'risk/avvikelse')}
          </div>
        </Card>
        <Card className="p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t('ISO Planning Ready', 'ISO 6.2 Planeringsredo')}
          </div>
          <div className="text-2xl font-bold tabular-nums text-[var(--ink)]">
            {summary.complete.length}/{visibleGoals.length}
          </div>
          <div className="text-xs text-[var(--muted)]">
            {summary.gaps.length} {t('missing required fields', 'saknar obligatoriska fält')}
          </div>
        </Card>
        <Card className="p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t('Initiative Execution', 'Initiativgenomförande')}
          </div>
          <div className="text-2xl font-bold tabular-nums text-[var(--ink)]">{avgInitProgress}%</div>
          <div className="text-xs text-[var(--muted)]">
            {visibleInits.length} {t('active', 'aktiva')} · {summary.atRiskInits.length} {t('at risk', 'i riskzon')}
          </div>
        </Card>
        <Card className="p-4 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t('Management Attention', 'Ledningsfokus')}
          </div>
          <div className="text-2xl font-bold tabular-nums text-[var(--ink)]">{exceptions.length}</div>
          <div className="text-xs text-[var(--muted)]">
            {summary.pending.length} {t('pending approvals', 'väntar på godkännande')} · {summary.open.length} {t('PDCA open', 'öppna PDCA')}
          </div>
        </Card>
      </div>

      {/* 4 Strategic Pillars Strip */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--ink)]">
            {t('Multi-Year Strategic Pillars', 'Fleråriga strategiska målpelare')}
          </h2>
          <button
            type="button"
            onClick={() => navigate('pillars')}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
          >
            {t('View all pillars →', 'Visa alla målpelare →')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {orgGoals.map((pg) => {
            const k = kpiById(kpis, pg.kpi);
            const st = computeKpiStatus(k);
            const childCount = goals.filter(
              (c) =>
                c.level !== 'Organization' &&
                visibleToRole(c, activeRole) &&
                xm4OrgParent(goals, c)?.id === pg.id &&
                (scope === 'Organization' || xm4ScopeIncludes(goals, c, scope, activeRole))
            ).length;
            return (
              <button
                key={pg.id}
                type="button"
                onClick={() => navigate('goal', pg.id)}
                className="text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--card-shadow)] p-4 hover:border-teal-600/50 dark:hover:border-teal-400/50 transition-colors space-y-2 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--muted)]">{pg.id}</span>
                  <StatusBadge label={st.label} />
                </div>
                <div className="text-sm font-bold text-[var(--ink)] line-clamp-2">{pg.title}</div>
                <div className="text-xs text-[var(--muted)]">
                  {pg.iso || isoShort(isoStandards, pg)} · {childCount} {t('linked goals', 'kopplade mål')}
                </div>
                <div className="pt-1 text-xs font-semibold tabular-nums text-[var(--ink)]">
                  KPI: {st.actual !== undefined ? `${st.actual} ${pg.unit || ''}` : '—'} / {t('Target', 'Mål')} {pg.target} {pg.unit || ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Strategy-to-Execution Stepper */}
      {!isBasic && (
        <Card className="p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
            {t('Strategy-to-Execution Lifecycle', 'Flöde · Från strategi till genomförande')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { step: t('01 Define', '01 Definiera'), label: t('Pillars & Goals', 'Pelare & Mål'), route: 'pillars' as const, meta: `${orgGoals.length} ${t('pillars', 'pelare')}` },
              { step: t('02 Align', '02 Koppla'), label: 'X-Matrix 360°', route: 'matrix' as const, meta: `${relations.length} ${t('links', 'kopplingar')}` },
              { step: t('03 Negotiate', '03 Förankra'), label: 'Catchball', route: 'catchball' as const, meta: `${actionableCatchballs.length} ${t('your turn', 'din tur')}` },
              { step: t('04 Deliver', '04 Genomför'), label: t('Initiatives & A3', 'Initiativ & A3'), route: 'projects' as const, meta: `${avgInitProgress}% ${t('avg', 'snitt')}` },
              { step: t('05 Daily', '05 Dagligt'), label: t('Tier 1–3 Pulse', 'Puls Nivå 1–3'), route: 'daily' as const, meta: 'Safety & Kanban' },
              { step: t('06 Assure', '06 Säkra'), label: 'PDCA & ISO', route: 'evidence' as const, meta: `${approvals.filter((a) => a.status === 'Pending').length} ${t('pending', 'väntar')}` },
            ].map((item) => (
              <button
                key={item.step}
                type="button"
                onClick={() => navigate(item.route)}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)]/60 p-3 text-left hover:border-teal-600/50 dark:hover:border-teal-400/50 transition-colors cursor-pointer"
              >
                <div className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-400">{item.step}</div>
                <div className="text-xs font-bold text-[var(--ink)] mt-0.5">{item.label}</div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">{item.meta}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Main Split: Goals / Priorities + Exceptions or Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[var(--ink)]">
                {t('Strategic Goals & Targets', 'Strategiska mål & målvärden')} ({tScope(scope)})
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {t('Synced live with monthly KPI bowling chart performance', 'Synkas i realtid med månatliga KPI-utfall i Bowling Chart')}
              </p>
            </div>
            {roleCan(activeRole, 'goalCreate', null, { goals, initiatives }) && (
              <button
                type="button"
                onClick={() => navigate('newgoal')}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('Add Goal', 'Lägg till mål')}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-subtle)] text-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">{t('Goal', 'Mål')}</th>
                  <th className="px-4 py-2.5 font-semibold">{t('Level & Owner', 'Nivå & Ägare')}</th>
                  <th className="px-4 py-2.5 font-semibold">{t('Target', 'Målvärde')}</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">{t('Plan', 'ISO-plan')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {visibleGoals.map((g) => {
                  const st = computeKpiStatus(kpiById(kpis, g.kpi));
                  const plan = goalPlanCheck(g, kpis);
                  const linkedCount = initiatives.filter((i) => initiativeLinkedToGoal(i, g.id, relations)).length;
                  return (
                    <tr
                      key={g.id}
                      onClick={() => navigate('goal', g.id)}
                      className="hover:bg-[var(--surface-subtle)]/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--ink)]">
                          <span className="font-mono text-[var(--muted)] mr-1.5">{g.id}</span>
                          {g.title}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] mt-0.5">
                          {isoShort(isoStandards, g)} · {linkedCount} {t(linkedCount === 1 ? 'initiative' : 'initiatives', 'initiativ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        <div className="font-medium text-[var(--ink)]">{tScope(g.level)}</div>
                        <div>{g.owner}</div>
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">
                        <div className="font-semibold text-[var(--ink)]">
                          {st.actual !== undefined ? st.actual : '—'} / {g.target} {g.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <StatusBadge label={st.label} />
                          <StatusBadge label={g.approval} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${plan.ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {plan.ready ? t('ISO Ready', 'ISO-redo') : t('Gaps', 'Saknar fält')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right column: Basic user Tasks OR Management Attention */}
        <div className="space-y-4">
          {isBasic ? (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--ink)]">{t('My Assigned Tasks', 'Mina tilldelade uppgifter')}</h2>
                <button
                  type="button"
                  onClick={() => navigate('daily')}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Daily Board →
                </button>
              </div>
              <div className="space-y-2">
                {tasks
                  .filter((tk) => tk.owner === 'Team Leader')
                  .map((tk) => (
                    <div key={tk.id} className="rounded-lg border border-[var(--border)] p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--ink)] truncate">{tk.title}</div>
                        <div className="text-[11px] text-[var(--muted)]">
                          {tk.project} · {t('Due', 'Förfaller')} {tk.due || '—'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(tk.id)}
                        className="shrink-0 cursor-pointer"
                      >
                        <StatusBadge label={tk.status} />
                      </button>
                    </div>
                  ))}
              </div>
            </Card>
          ) : (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--ink)]">{t('Catchball Turn Queue', 'Catchball · Din tur')}</h2>
                <button
                  type="button"
                  onClick={() => navigate('catchball')}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  {t('All threads →', 'Alla trådar →')}
                </button>
              </div>
              {actionableCatchballs.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">
                  {t('No Catchball proposals currently awaiting your response.', 'Inga Catchball-förslag väntar på ditt svar just nu.')}
                </p>
              ) : (
                <div className="space-y-2">
                  {actionableCatchballs.map((c) => {
                    const g = goalById(goals, c.goal);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => navigate('catchballitem', c.id)}
                        className="w-full text-left rounded-lg border border-[var(--border)] p-3 hover:border-teal-600/50 dark:hover:border-teal-400/50 transition-colors cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-[var(--muted)]">{c.id} · {c.goal}</span>
                          <StatusBadge label={c.status} />
                        </div>
                        <div className="text-xs font-semibold text-[var(--ink)]">{g?.title || c.goal}</div>
                        <div className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                          <MessageSquareMore className="w-3 h-3" />
                          <span>{t('Proposed target', 'Föreslaget målvärde')}: {c.proposal.target} {g?.unit || ''}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {directorDecisions.length > 0 && !isBasic && (
            <Card className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--ink)]">{t('Formal Decision Feed', 'Senaste formella beslut')}</h2>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-2">
                {directorDecisions.slice(-3).reverse().map((act) => (
                  <div key={act.id} className="rounded-lg border border-[var(--border)] p-2.5 text-xs space-y-0.5">
                    <div className="font-semibold text-[var(--ink)]">
                      {String(act.payload?.goalId)} · {String(act.payload?.goalTitle)}
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      {t('Approved by', 'Godkänt av')} {String(act.payload?.approvedBy)} · {String(act.payload?.at)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Management Attention Exceptions */}
      {!isBasic && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--ink)]">
                {t('Management Attention · Exceptions', 'Ledningsfokus · Avvikelser')} ({exceptions.length})
              </h2>
              <p className="text-xs text-[var(--muted)]">
                {t('Active escalated blockers and red/recurring KPI signals in', 'Aktiva eskalerade hinder och röda/återkommande KPI-signaler i')} {tScope(scope)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('reviews')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
            >
              {t('Open PDCA Reviews', 'Öppna PDCA-genomgångar')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {exceptions.length === 0 ? (
            <Card className="p-5 text-xs text-[var(--muted)] flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              {t('No active blockers or off-track exceptions for', 'Inga aktiva hinder eller avvikelser för')} {tScope(scope)}.
            </Card>
          ) : (
            <div className="space-y-3">
              {exceptions.slice(0, 4).map((b) => (
                <BlockerBox key={b.id} blocker={b} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
