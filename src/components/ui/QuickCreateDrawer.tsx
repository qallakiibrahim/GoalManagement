import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Loader2,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { ALL_SCOPES, ASSIGNED_DEPARTMENT } from '../../types/safeqms';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  isLimitedRole,
  leadershipRole,
  permittedParents,
  roleCan,
} from '../../domain/syncEngine';

export const QuickCreateDrawer: React.FC = () => {
  const { t, tScope } = useLanguage();
  const {
    quickCreateOpen,
    closeQuickCreate,
    activeRole,
    scope,
    year,
    goals,
    kpis,
    initiatives,
    members,
    isoStandards,
    createKpi,
    saveGoal,
    createInitiative,
    createProjectA3,
    addProjectTask,
    setMatrixRelationStrength,
    navigate,
    toast,
  } = useWorkspace();

  const canCreateGoal = roleCan(activeRole, 'goalCreate', null, { goals, initiatives });
  const canCreateKpi = leadershipRole(activeRole);
  const canCreateInit = roleCan(activeRole, 'initiativeWrite', null, { goals, initiatives });

  const allowedScopes = useMemo(
    () => (isLimitedRole(activeRole) ? [ASSIGNED_DEPARTMENT] : ALL_SCOPES),
    [activeRole]
  );

  const defaultOwner = useMemo(() => {
    if (activeRole === 'Department director') return 'Production Manager';
    if (activeRole === 'Basic user') return 'Team Leader';
    return members[0]?.displayName || 'Site Manager';
  }, [activeRole, members]);

  // Step A: Goal fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalLevel, setGoalLevel] = useState<string>(
    allowedScopes.includes(scope) ? scope : allowedScopes[0]
  );
  const [goalOwner, setGoalOwner] = useState(defaultOwner);
  const [goalTarget, setGoalTarget] = useState('80');
  const [goalUnit, setGoalUnit] = useState('%');
  const [goalDue, setGoalDue] = useState(`${year || '2027'}-12-31`);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [parentGoalId, setParentGoalId] = useState('');
  const [goalBaseline, setGoalBaseline] = useState('');
  const [goalResources, setGoalResources] = useState('');
  const [goalIsoRef, setGoalIsoRef] = useState('');

  // Step B: KPI fields
  const [includeKpi, setIncludeKpi] = useState(true);
  const [kpiMode, setKpiMode] = useState<'new' | 'existing'>(canCreateKpi ? 'new' : 'existing');
  const [existingKpiId, setExistingKpiId] = useState(kpis[0]?.id || '');
  const [kpiName, setKpiName] = useState('');
  const [kpiNameTouched, setKpiNameTouched] = useState(false);
  const [kpiDirection, setKpiDirection] = useState<'higher' | 'lower'>('higher');
  const [kpiTolerance, setKpiTolerance] = useState('2');
  const [kpiInitialActual, setKpiInitialActual] = useState('');

  // Step C: First Initiative & optional task
  const [includeInit, setIncludeInit] = useState(false);
  const [initTitle, setInitTitle] = useState('');
  const [initOwner, setInitOwner] = useState(defaultOwner);
  const [initSqdcFocus, setInitSqdcFocus] = useState<'S' | 'Q' | 'D' | 'C'>('Q');
  const [firstTaskTitle, setFirstTaskTitle] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync defaults when opening
  useEffect(() => {
    if (!quickCreateOpen) return;
    setGoalLevel(allowedScopes.includes(scope) ? scope : allowedScopes[0]);
    setGoalOwner(defaultOwner);
    setInitOwner(defaultOwner);
    setGoalDue(`${year || '2027'}-12-31`);
    setKpiMode(canCreateKpi ? 'new' : 'existing');
    if (kpis[0]?.id && !existingKpiId) setExistingKpiId(kpis[0].id);
    setErrorMsg('');
  }, [quickCreateOpen, scope, year, allowedScopes, defaultOwner, canCreateKpi, kpis, existingKpiId]);

  // Auto-prefill KPI name from Goal title unless user edited it manually
  useEffect(() => {
    if (!kpiNameTouched) {
      setKpiName(goalTitle);
    }
  }, [goalTitle, kpiNameTouched]);

  // Close on Escape
  useEffect(() => {
    if (!quickCreateOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) closeQuickCreate();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quickCreateOpen, submitting, closeQuickCreate]);

  const parentCandidates = useMemo(
    () => permittedParents(goals, goalLevel, undefined),
    [goals, goalLevel]
  );

  const isoReqOptions = useMemo(
    () =>
      isoStandards.flatMap((std) =>
        std.requirements.map((req) => ({
          id: req.id,
          label: `${std.code} ${req.number} · ${req.title}`,
        }))
      ),
    [isoStandards]
  );

  const resetForm = () => {
    setGoalTitle('');
    setGoalTarget('80');
    setGoalUnit('%');
    setParentGoalId('');
    setGoalBaseline('');
    setGoalResources('');
    setGoalIsoRef('');
    setShowAdvanced(false);
    setIncludeKpi(true);
    setKpiName('');
    setKpiNameTouched(false);
    setKpiDirection('higher');
    setKpiTolerance('2');
    setKpiInitialActual('');
    setIncludeInit(false);
    setInitTitle('');
    setFirstTaskTitle('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');

    if (!canCreateGoal) {
      setErrorMsg(
        t(
          'Your current role does not have permission to create goals.',
          'Din nuvarande roll saknar behörighet att skapa mål.'
        )
      );
      return;
    }

    const trimmedGoalTitle = goalTitle.trim();
    if (!trimmedGoalTitle) {
      setErrorMsg(t('Enter a goal title to continue.', 'Ange en titel för målet.'));
      return;
    }

    const parsedTarget = Number(goalTarget);
    if (!Number.isFinite(parsedTarget)) {
      setErrorMsg(t('Enter a valid numeric target value.', 'Ange ett giltigt numeriskt målvärde.'));
      return;
    }

    if (includeInit && canCreateInit && !initTitle.trim()) {
      setErrorMsg(
        t(
          'Enter a title for the initiative, or turn off the Initiative step.',
          'Ange en titel för initiativet, eller stäng av initiativsteget.'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create or reuse KPI
      let linkedKpiId: string | undefined;
      if (includeKpi) {
        if (kpiMode === 'new' && canCreateKpi) {
          const parsedTol = Number(kpiTolerance);
          const parsedInitActual =
            kpiInitialActual.trim() !== '' && Number.isFinite(Number(kpiInitialActual))
              ? Number(kpiInitialActual)
              : null;
          const createdKpiId = await createKpi({
            name: kpiName.trim() || trimmedGoalTitle,
            unit: goalUnit.trim() || '%',
            direction: kpiDirection,
            tolerance: Number.isFinite(parsedTol) && parsedTol >= 0 ? parsedTol : 0,
            monthlyTarget: parsedTarget,
            initialActual: parsedInitActual,
            source: t('Quick Create', 'Snabbskapa'),
          });
          if (createdKpiId) linkedKpiId = createdKpiId;
        } else if (existingKpiId) {
          linkedKpiId = existingKpiId;
        }
      }

      // 2. Create Strategic Goal linked to KPI
      const parsedBaseline =
        goalBaseline.trim() !== '' && Number.isFinite(Number(goalBaseline))
          ? Number(goalBaseline)
          : undefined;

      const createdGoalId = await saveGoal(undefined, {
        title: trimmedGoalTitle,
        level: goalLevel,
        parent: parentGoalId || undefined,
        owner: goalOwner.trim() || defaultOwner,
        year: year || '2027',
        kpi: linkedKpiId,
        baseline: parsedBaseline,
        target: parsedTarget,
        unit: goalUnit.trim() || '%',
        status: 'Active',
        planDue: goalDue || undefined,
        resources: goalResources.trim() || undefined,
        isoRefs: goalIsoRef ? [goalIsoRef] : undefined,
      });

      if (!createdGoalId) {
        setSubmitting(false);
        return;
      }

      // 3. Optional Initiative + X-Matrix Strong Link + optional first task
      let createdInitId: string | null = null;
      if (includeInit && canCreateInit && initTitle.trim()) {
        const sqdc = {
          S: initSqdcFocus === 'S' ? 2 : 0,
          Q: initSqdcFocus === 'Q' ? 2 : 0,
          D: initSqdcFocus === 'D' ? 2 : 0,
          C: initSqdcFocus === 'C' ? 2 : 0,
        };
        createdInitId = await createInitiative({
          title: initTitle.trim(),
          owner: initOwner.trim() || goalOwner.trim() || defaultOwner,
          goal: createdGoalId,
          status: 'Planned',
          progress: 0,
          sqdc,
          valueStream: tScope(goalLevel),
          isBottleneck: false,
        });

        if (createdInitId) {
          await setMatrixRelationStrength(createdGoalId, createdInitId, 2);
          if (linkedKpiId) {
            await setMatrixRelationStrength(createdInitId, linkedKpiId, 2);
          }

          if (firstTaskTitle.trim()) {
            const projId = await createProjectA3({
              title: initTitle.trim(),
              initiative: createdInitId,
              owner: initOwner.trim() || defaultOwner,
              escalationTier: 'Direct Fix',
              problem: trimmedGoalTitle,
              target: `${parsedTarget} ${goalUnit.trim() || '%'}`,
            });
            if (projId) {
              await addProjectTask(
                projId,
                firstTaskTitle.trim(),
                initOwner.trim() || defaultOwner,
                goalDue || undefined
              );
            }
          }
        }
      }

      const summaryParts = [
        `${t('Goal', 'Mål')} ${createdGoalId}`,
        linkedKpiId ? `KPI ${linkedKpiId}` : null,
        createdInitId ? `${t('Initiative', 'Initiativ')} ${createdInitId}` : null,
      ].filter(Boolean);

      toast(
        `${t('Created & linked:', 'Skapat & kopplat:')} ${summaryParts.join(' · ')}`,
        'success'
      );

      resetForm();
      closeQuickCreate();
      navigate('goalskpis');
    } catch {
      setErrorMsg(
        t(
          'Something went wrong while saving. Please try again.',
          'Något gick fel vid sparning. Försök igen.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!quickCreateOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-create-title"
    >
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px] transition-opacity"
        onClick={() => !submitting && closeQuickCreate()}
      />

      <div className="relative z-10 w-full max-w-xl bg-[var(--surface)] border-l border-[var(--border)] flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2
              id="quick-create-title"
              className="text-base font-bold tracking-tight text-[var(--ink)] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>{t('Quick Create · Goal + KPI + Initiative', 'Snabbskapa · Mål + KPI + Initiativ')}</span>
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {t(
                'Create and auto-link a complete goal package in one step without switching views.',
                'Skapa och koppla ihop ett komplett målpaket i ett enda steg utan att byta sida.'
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={closeQuickCreate}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer shrink-0"
            aria-label={t('Close', 'Stäng')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          {errorMsg && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-rose-800 dark:text-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          {/* STEP A: GOAL */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  {t('1. Goal', '1. Mål')}
                </h3>
              </div>
              <span className="text-[11px] text-[var(--muted)]">
                {t('Required', 'Obligatoriskt')}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[var(--muted)] mb-1">
                {t('Goal Title', 'Måltitel')} *
              </label>
              <input
                type="text"
                required
                autoFocus
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder={t(
                  'e.g. Increase Line 3 OEE to 72%',
                  't.ex. Öka OEE på Linje 3 till 72 %'
                )}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--ink)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[var(--muted)] mb-1">
                  {t('Scope / Level', 'Omfattning / Nivå')}
                </label>
                <select
                  value={goalLevel}
                  onChange={(e) => {
                    setGoalLevel(e.target.value);
                    setParentGoalId('');
                  }}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
                >
                  {allowedScopes.map((s) => (
                    <option key={s} value={s}>
                      {tScope(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--muted)] mb-1">
                  {t('Responsible Owner', 'Ansvarig ägare')}
                </label>
                <input
                  type="text"
                  value={goalOwner}
                  onChange={(e) => setGoalOwner(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-[var(--muted)] mb-1">
                  {t('Target Value', 'Målvärde')} *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 font-mono tabular-nums text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--muted)] mb-1">
                  {t('Unit', 'Enhet')}
                </label>
                <input
                  type="text"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  placeholder="%, min, SEK"
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[var(--muted)] mb-1">
                  {t('Due Date', 'Slutdatum')}
                </label>
                <input
                  type="date"
                  value={goalDue}
                  onChange={(e) => setGoalDue(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 font-mono tabular-nums text-[var(--ink)]"
                />
              </div>
            </div>

            {/* Collapsible Optional / Advanced Goal Fields */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                {showAdvanced ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span>
                  {t(
                    'Advanced fields (Parent goal, Baseline, Resources, ISO)',
                    'Avancerade fält (Överordnat mål, Baslinje, Resurser, ISO)'
                  )}
                </span>
              </button>

              {showAdvanced && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[var(--muted)] mb-1">
                      {t('Parent Goal', 'Överordnat mål')}
                    </label>
                    <select
                      value={parentGoalId}
                      onChange={(e) => setParentGoalId(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-[var(--ink)]"
                    >
                      <option value="">{t('None (Top-level)', 'Inget (Översta nivå)')}</option>
                      {parentCandidates.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.id} · {p.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--muted)] mb-1">
                      {t('Baseline', 'Baslinje / Nuläge')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={goalBaseline}
                      onChange={(e) => setGoalBaseline(e.target.value)}
                      placeholder="55"
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 font-mono tabular-nums text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--muted)] mb-1">
                      {t('Resources / Budget', 'Resurser / Budget')}
                    </label>
                    <input
                      type="text"
                      value={goalResources}
                      onChange={(e) => setGoalResources(e.target.value)}
                      placeholder={t('e.g. 2 days SMED workshop', 't.ex. 2 dagar SMED-workshop')}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-[var(--ink)]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--muted)] mb-1">
                      {t('ISO Requirement', 'ISO-krav')}
                    </label>
                    <select
                      value={goalIsoRef}
                      onChange={(e) => setGoalIsoRef(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-[var(--ink)]"
                    >
                      <option value="">{t('Optional', 'Valfritt')}</option>
                      {isoReqOptions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* STEP B: LINKED KPI */}
          <section className="space-y-3.5 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-[var(--ink)]">
                  {t('2. Measurement KPI', '2. Kopplad KPI')}
                </h3>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeKpi}
                  onChange={(e) => setIncludeKpi(e.target.checked)}
                  className="rounded border-[var(--border-strong)] accent-teal-700"
                />
                <span>{t('Include KPI', 'Inkludera KPI')}</span>
              </label>
            </div>

            {includeKpi && (
              <div className="space-y-3">
                {canCreateKpi && (
                  <div className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setKpiMode('new')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        kpiMode === 'new'
                          ? 'bg-teal-700 text-white dark:bg-teal-600'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {t('Create new KPI', 'Skapa ny KPI')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setKpiMode('existing')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        kpiMode === 'existing'
                          ? 'bg-teal-700 text-white dark:bg-teal-600'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {t('Link existing KPI', 'Koppla befintlig KPI')}
                    </button>
                  </div>
                )}

                {kpiMode === 'new' && canCreateKpi ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-[var(--muted)] mb-1">
                        {t('KPI Name', 'KPI-namn')}
                      </label>
                      <input
                        type="text"
                        value={kpiName}
                        onChange={(e) => {
                          setKpiNameTouched(true);
                          setKpiName(e.target.value);
                        }}
                        placeholder={t(
                          'Auto-filled from goal title',
                          'Förifylls automatiskt från måltiteln'
                        )}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">
                          {t('Direction', 'Riktning')}
                        </label>
                        <select
                          value={kpiDirection}
                          onChange={(e) =>
                            setKpiDirection(e.target.value as 'higher' | 'lower')
                          }
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 text-[var(--ink)]"
                        >
                          <option value="higher">{t('Higher is better', 'Högre är bättre')}</option>
                          <option value="lower">{t('Lower is better', 'Lägre är bättre')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">
                          {t('Tolerance ±', 'Tolerans ±')}
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={kpiTolerance}
                          onChange={(e) => setKpiTolerance(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 font-mono tabular-nums text-[var(--ink)]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">
                          {t('First Actual (opt.)', 'Startutfall (valfritt)')}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={kpiInitialActual}
                          onChange={(e) => setKpiInitialActual(e.target.value)}
                          placeholder="—"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-2 font-mono tabular-nums text-[var(--ink)]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-[var(--muted)] mb-1">
                      {t('Select Existing KPI', 'Välj befintlig KPI')}
                    </label>
                    <select
                      value={existingKpiId}
                      onChange={(e) => setExistingKpiId(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                    >
                      <option value="">{t('None', 'Ingen')}</option>
                      {kpis.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.id} · {k.name} ({k.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* STEP C: FIRST INITIATIVE */}
          {canCreateInit && (
            <section className="space-y-3.5 pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                  <h3 className="text-sm font-bold text-[var(--ink)]">
                    {t('3. First Initiative & Action', '3. Första initiativ & åtgärd')}
                  </h3>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeInit}
                    onChange={(e) => setIncludeInit(e.target.checked)}
                    className="rounded border-[var(--border-strong)] accent-teal-700"
                  />
                  <span>{t('Add initiative now', 'Lägg till initiativ nu')}</span>
                </label>
              </div>

              {includeInit && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-[var(--muted)] mb-1">
                      {t('Initiative Title', 'Initiativtitel')} *
                    </label>
                    <input
                      type="text"
                      required={includeInit}
                      value={initTitle}
                      onChange={(e) => setInitTitle(e.target.value)}
                      placeholder={t(
                        'e.g. SMED Changeover Programme Line 3',
                        't.ex. SMED ställtidsprogram Linje 3'
                      )}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[var(--muted)] mb-1">
                        {t('Initiative Owner', 'Initiativägare')}
                      </label>
                      <input
                        type="text"
                        value={initOwner}
                        onChange={(e) => setInitOwner(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--muted)] mb-1">
                        {t('Primary SQDC Focus', 'Primärt SQDC-fokus')}
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {(
                          [
                            { id: 'S', label: 'S' },
                            { id: 'Q', label: 'Q' },
                            { id: 'D', label: 'D' },
                            { id: 'C', label: 'C' },
                          ] as const
                        ).map((dim) => (
                          <button
                            key={dim.id}
                            type="button"
                            onClick={() => setInitSqdcFocus(dim.id)}
                            className={`rounded-lg border py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                              initSqdcFocus === dim.id
                                ? 'border-teal-700 bg-teal-700 text-white dark:border-teal-600 dark:bg-teal-600'
                                : 'border-[var(--border-strong)] bg-[var(--bg)] text-[var(--muted)] hover:text-[var(--ink)]'
                            }`}
                          >
                            {dim.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-[var(--muted)] mb-1">
                      {t('First Action / Task (optional)', 'Första uppgift / åtgärd (valfritt)')}
                    </label>
                    <input
                      type="text"
                      value={firstTaskTitle}
                      onChange={(e) => setFirstTaskTitle(e.target.value)}
                      placeholder={t(
                        'e.g. Film changeover and map internal vs external steps',
                        't.ex. Filma omställning och skilj inre/yttre ställtid'
                      )}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-[var(--ink)]"
                    />
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">
                    {t(
                      'X-Matrix strong relationships (●) between Goal, Initiative, and KPI are created automatically.',
                      'Starka X-Matrix-relationer (●) mellan Mål, Initiativ och KPI skapas automatiskt.'
                    )}
                  </p>
                </div>
              )}
            </section>
          )}
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              closeQuickCreate();
              navigate('newgoal');
            }}
            className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] hover:underline cursor-pointer whitespace-nowrap"
          >
            {t('Open full goal form', 'Öppna fullständigt målformulär')}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={submitting}
              onClick={closeQuickCreate}
              className="rounded-lg border border-[var(--border-strong)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('Cancel', 'Avbryt')}
            </button>
            <button
              type="button"
              disabled={submitting || !canCreateGoal}
              onClick={(e) => {
                const form = (e.currentTarget.closest('[role="dialog"]')?.querySelector('form') as HTMLFormElement | null);
                form?.requestSubmit();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{t('Create & Link', 'Skapa & koppla')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
