import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ExternalLink,
  Layers,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  ALL_SCOPES,
  AppRoute,
  EscalationTier,
  PulseCard,
  SqdcMatrix,
  formatRoleLabel,
} from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useWalkthrough } from '../../context/WalkthroughContext';
import {
  cbCanAct,
  computeKpiStatus,
  goalById,
  goalPlanCheck,
  kpiById,
  leadershipRole,
  permittedParents,
  roleCan,
} from '../../domain/syncEngine';
import { Card, SectionHeader, StatusBadge } from '../ui/Badge';

interface OnboardingStepDef {
  step: number;
  code: string;
  group: string;
  title: string;
  shortTitle: string;
  moduleName: string;
  targetRoute: AppRoute;
  sopChapter: number;
  whyNow: string;
  responsible: string;
  moduleInstruction: string;
}

const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    step: 1,
    code: 'STEG 01',
    group: 'Grund & Mätning',
    title: 'Arbetsyta, Scope & Teamroller',
    shortTitle: 'Arbetsyta & Team',
    moduleName: 'Team & Workspace Settings',
    targetRoute: 'settings',
    sopChapter: 1,
    whyNow:
      'Börja med en ren kundarbetsyta (eller bekräfta din befintliga), sätt planeringshorisont (t.ex. 2027) och kontrollera ISO-katalog samt användarroller innan några mål skapas.',
    responsible: 'Administrator',
    moduleInstruction: 'Granska arbetsytans medlemmar, roller (6 nivåer) och ISO-katalog i Settings.',
  },
  {
    step: 2,
    code: 'STEG 02',
    group: 'Grund & Mätning',
    title: 'Skapa första mätbara KPI:n',
    shortTitle: 'Första KPI:n',
    moduleName: 'KPIs & Bowling Chart',
    targetRoute: 'kpis',
    sopChapter: 8,
    whyNow:
      'Enligt modularkitekturen och ISO 6.2 måste varje strategiskt mål kopplas till en mätbar KPI. Genom att skapa din första KPI nu kan du länka den direkt i Steg 3.',
    responsible: 'Administrator / General director / QMS auditor',
    moduleInstruction: 'Verifiera din nyskapade KPI-serie och dess 12-månaders målbana i Bowling Chart.',
  },
  {
    step: 3,
    code: 'STEG 03',
    group: 'Nivå 1 · Strategisk styrning',
    title: 'Skapa strategiskt toppmål (Organization) + ISO 6.2',
    shortTitle: 'Strategiskt toppmål',
    moduleName: 'Strategic Pillars',
    targetRoute: 'pillars',
    sopChapter: 2,
    whyNow:
      'Toppmålet på Organization-nivå (3–5 år) är roten i hela målhierarkin. Fyll i samtliga ISO 6.2-planeringsfält direkt så målet blir ISO Ready från start.',
    responsible: 'Administrator / General director / QMS auditor',
    moduleInstruction: 'Inspektera ditt strategiska toppmål bland Strategic Pillars.',
  },
  {
    step: 4,
    code: 'STEG 04',
    group: 'Nivå 1 · Strategisk styrning',
    title: 'Bryt ner i Goal Cascade (Site → Department)',
    shortTitle: 'Goal Cascade',
    moduleName: 'Goal Cascade',
    targetRoute: 'cascade',
    sopChapter: 3,
    whyNow:
      'Strategi blir bara verklighet när den bryts ner i tre nivåer: Organization → Site → Department via Primary Parent Goal.',
    responsible: 'General director / Site & Department director',
    moduleInstruction: 'Kontrollera det kompletta 3-nivåträdet (Organization → Site → Department) i Goal Cascade.',
  },
  {
    step: 5,
    code: 'STEG 05',
    group: 'Nivå 1 · Strategisk styrning',
    title: 'Catchball-förhandling & Formellt godkännande',
    shortTitle: 'Catchball & Approval',
    moduleName: 'Catchball & Formal Approvals',
    targetRoute: 'approvals',
    sopChapter: 5,
    whyNow:
      'Mål på Site- och Department-nivå ska förankras genom tvåvägsdialog (Catchball) innan de formellt godkänns i Approvals. Först när ett mål är Approved blir det officiellt för Basic user.',
    responsible: 'Department director + General director / QMS auditor',
    moduleInstruction: 'Granska Catchball-historik, revisionsspår och godkännandekön i Formal Approvals.',
  },
  {
    step: 6,
    code: 'STEG 06',
    group: 'Nivå 2 · Taktiskt genomförande',
    title: 'Skapa förbättringsinitiativ & SQDC-prioritering',
    shortTitle: 'Initiativ & SQDC',
    moduleName: 'Initiatives & Projects',
    targetRoute: 'projects',
    sopChapter: 6,
    whyNow:
      'Ett mål utan konkreta initiativ är bara en önskan. Här skapar du "Hur:et" kopplat till ett mål, prioriterar enligt SQDC (Safety, Quality, Delivery, Cost) och flaggar ev. TOC-flaskhals.',
    responsible: 'General director / Department director',
    moduleInstruction: 'Se ditt initiativ, SQDC-poäng och flaskhalsmarkering under Initiatives & Projects.',
  },
  {
    step: 7,
    code: 'STEG 07',
    group: 'Nivå 2 · Taktiskt genomförande',
    title: 'Koppla ihop 360° X-Matrix (Initiativ ↔ KPI ↔ Ägare)',
    shortTitle: '360° X-Matrix',
    moduleName: 'Hoshin 360° X-Matrix',
    targetRoute: 'matrix',
    sopChapter: 4,
    whyNow:
      'X-Matrix binder ihop Strategi → Årsmål → Initiativ → KPI → Tvärfunktionell ägare på en enda översikt så att inga strategiska glapp uppstår.',
    responsible: 'Administrator / General director / QMS auditor',
    moduleInstruction: 'Klicka på en nod i X-Matrix för att se hela din 360°-kedja lysa upp.',
  },
  {
    step: 8,
    code: 'STEG 08',
    group: 'Nivå 2 · Taktiskt genomförande',
    title: 'Project A3, 5-Why & Konkreta Project Tasks',
    shortTitle: 'Project A3 & Tasks',
    moduleName: 'Project A3 & 5-Why',
    targetRoute: 'projects',
    sopChapter: 6,
    whyNow:
      'Under initiativet dokumenterar teamet rotårsaken med A3/5-Why och bryter ner åtgärden i konkreta Project Tasks. När tasks bockas av räknas projekt- och initiativprocenten upp automatiskt.',
    responsible: 'Department director / Project Leader',
    moduleInstruction: 'Öppna Project A3-bladet och granska 5-Why samt projektuppgifterna.',
  },
  {
    step: 9,
    code: 'STEG 09',
    group: 'Nivå 3 · Daglig drift',
    title: 'Aktivera Daily Board (Safety Cross & Pulse Card)',
    shortTitle: 'Daily Board Tier 1–3',
    moduleName: 'Daily Management Board',
    targetRoute: 'daily',
    sopChapter: 7,
    whyNow:
      'Daglig styrning kopplar strategi till dagens skift. Logga dagens status i Safety Cross och skapa första Kanban Pulse Card så teamet jobbar med avvikelser direkt.',
    responsible: 'Alla roller (Team Leader / Department director)',
    moduleInstruction: 'Testa Safety Cross och dra-och-släpp på Kanban-korten i Daily Board Tier 1–3.',
  },
  {
    step: 10,
    code: 'STEG 10',
    group: 'Nivå 4 · Uppföljning & ISO',
    title: 'Registrera KPI-utfall i Bowling Chart',
    shortTitle: 'KPI-utfall',
    moduleName: 'KPIs & Bowling Chart',
    targetRoute: 'kpis',
    sopChapter: 8,
    whyNow:
      'Projektprocent (%) visar att åtgärder utförts — men KPI-utfallet i Bowling Chart visar om åtgärden faktiskt gav resultat och räknar automatiskt ut On track / At risk / Off track.',
    responsible: 'General director / Department director / QMS auditor',
    moduleInstruction: 'Granska trendkurvan och färgkodningen per månad i 12-månaders Bowling Chart.',
  },
  {
    step: 11,
    code: 'STEG 11',
    group: 'Nivå 4 · Uppföljning & ISO',
    title: 'Dokumentera PDCA Review & Åtgärdsbeslut',
    shortTitle: 'PDCA Review',
    moduleName: 'PDCA Reviews',
    targetRoute: 'reviews',
    sopChapter: 9,
    whyNow:
      'När en KPI avviker eller vid månadens uppföljning skapar ledningen en formell PDCA Review med spårbara beslut, ansvarig och slutdatum — det skapar en obruten förbättringsloop.',
    responsible: 'General director / QMS auditor / Department director',
    moduleInstruction: 'Granska Exception Queue och dina dokumenterade PDCA-beslut.',
  },
  {
    step: 12,
    code: 'STEG 12',
    group: 'Nivå 4 · Uppföljning & ISO',
    title: 'Management Review (ISO 9.3) & Audit Evidence Pack',
    shortTitle: 'ISO & Audit Evidence',
    moduleName: 'Management Review & Audit Pack',
    targetRoute: 'management',
    sopChapter: 10,
    whyNow:
      'Avsluta och slut cirkeln: sammanställ ledningsgenomgången (ISO 9.3), verifiera ISO 6.2-komplettheten och exportera ett komplett revisionsunderlag i Audit Evidence Pack.',
    responsible: 'General director / QMS auditor / Auditor',
    moduleInstruction: 'Granska Management Review-sammanfattningen och exportera Audit Evidence Pack.',
  },
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export const OnboardingWizardPage: React.FC = () => {
  const {
    activeWorkspace,
    workspaces,
    members,
    scope,
    year,
    setScope,
    setYear,
    actualRole,
    activeRole,
    isActualAdmin,
    setPreviewRole,
    routeId,
    goals,
    kpis,
    initiatives,
    projects,
    tasks,
    relations,
    kpiOwners,
    pulseCards,
    safetyCross,
    reviews,
    catchballs,
    approvals,
    isoStandards,
    navigate,
    switchWorkspace,
    createBlankWorkspace,
    createKpi,
    saveGoal,
    submitGoal,
    createCatchball,
    sendCatchball,
    alignCatchball,
    submitCatchballForApproval,
    decideApproval,
    createInitiative,
    setMatrixRelationStrength,
    setKpiOwnerStrength,
    createProjectA3,
    addProjectTask,
    toggleTaskStatus,
    toggleSafetyDay,
    createPulseCard,
    updateKpiMonth,
    createReview,
    addDecision,
    prepareManagementReview,
    toast,
  } = useWorkspace();

  const { setOnboardingBanner } = useWalkthrough();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [step1Confirmed, setStep1Confirmed] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  // Step 1: Blank Workspace Creation
  const [newCustomerName, setNewCustomerName] = useState('');

  // Step 2: Create KPI
  const [kpiName, setKpiName] = useState('');
  const [kpiUnit, setKpiUnit] = useState('%');
  const [kpiDir, setKpiDir] = useState<'higher' | 'lower' | 'range'>('higher');
  const [kpiTol, setKpiTol] = useState('2');
  const [kpiTarget, setKpiTarget] = useState('75');

  // Step 3: Org Goal
  const [orgTitle, setOrgTitle] = useState('');
  const [orgOwner, setOrgOwner] = useState('Executive Management');
  const [orgKpi, setOrgKpi] = useState('');
  const [orgBaseline, setOrgBaseline] = useState('55');
  const [orgTarget, setOrgTarget] = useState('75');
  const [orgWhat, setOrgWhat] = useState('');
  const [orgResources, setOrgResources] = useState('');
  const [orgDue, setOrgDue] = useState('2029-12-31');
  const [orgEval, setOrgEval] = useState('');
  const [orgIsoRef, setOrgIsoRef] = useState('req-9001-6.2');

  // Step 4: Cascade (Site + Department)
  const [siteLevel, setSiteLevel] = useState('Site: Uppsala');
  const [siteParent, setSiteParent] = useState('');
  const [siteTitle, setSiteTitle] = useState('');
  const [siteOwner, setSiteOwner] = useState('Site Manager');
  const [siteTarget, setSiteTarget] = useState('68');
  const [siteKpi, setSiteKpi] = useState('');

  const [deptLevel, setDeptLevel] = useState('Department: Production');
  const [deptParent, setDeptParent] = useState('');
  const [deptTitle, setDeptTitle] = useState('');
  const [deptOwner, setDeptOwner] = useState('Production Manager');
  const [deptTarget, setDeptTarget] = useState('30');
  const [deptKpi, setDeptKpi] = useState('');

  // Step 6: Initiative
  const [initTitle, setInitTitle] = useState('');
  const [initGoal, setInitGoal] = useState('');
  const [initOwner, setInitOwner] = useState('Production Manager');
  const [initValueStream, setInitValueStream] = useState('');
  const [initBudget, setInitBudget] = useState('150 000 kr');
  const [initBottleneck, setInitBottleneck] = useState(true);
  const [initSqdc, setInitSqdc] = useState<SqdcMatrix>({ S: 1, Q: 1, D: 2, C: 1 });

  // Step 7: X-Matrix Linker
  const [mxInitId, setMxInitId] = useState('');
  const [mxKpiId, setMxKpiId] = useState('');
  const [mxStrength, setMxStrength] = useState<0.5 | 1 | 2>(2);
  const [mxOwnerName, setMxOwnerName] = useState('Production Manager');
  const [mxOwnerStrength, setMxOwnerStrength] = useState<1 | 2>(2);

  // Step 8: Project A3 + Task
  const [projInit, setProjInit] = useState('');
  const [projTitle, setProjTitle] = useState('');
  const [projOwner, setProjOwner] = useState('Process Engineer');
  const [projTier, setProjTier] = useState<EscalationTier>('Full A3');
  const [projProblem, setProjProblem] = useState('');
  const [projCurrent, setProjCurrent] = useState('');
  const [projTargetText, setProjTargetText] = useState('');
  const [projRoot, setProjRoot] = useState('');
  const [projCounter, setProjCounter] = useState('');
  const [taskProjId, setTaskProjId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskOwner, setTaskOwner] = useState('Team Leader');

  // Step 9: Daily Board
  const [pulseTitle, setPulseTitle] = useState('');
  const [pulseRoute, setPulseRoute] = useState<PulseCard['routeType']>('Direct fix');
  const [pulseKpi, setPulseKpi] = useState('');
  const [pulseOwner, setPulseOwner] = useState('Team Leader');

  // Step 10: KPI Actuals
  const [actualKpiId, setActualKpiId] = useState('');
  const [actualMonthIdx, setActualMonthIdx] = useState(0);
  const [actualVal, setActualVal] = useState('');
  const [actualTargetVal, setActualTargetVal] = useState('');

  // Step 11: PDCA Review & Decision
  const [revTitle, setRevTitle] = useState('');
  const [revNotes, setRevNotes] = useState('');
  const [decRevId, setDecRevId] = useState('');
  const [decText, setDecText] = useState('');
  const [decOwner, setDecOwner] = useState('Production Manager');
  const [decDue, setDecDue] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));

  // Sync deep-link #onboarding/step-N
  useEffect(() => {
    if (!routeId) return;
    const match = routeId.match(/^step-(\d+)$/);
    if (match) {
      const n = Number(match[1]);
      if (n >= 1 && n <= ONBOARDING_STEPS.length) {
        setActiveStep(n);
      }
    }
  }, [routeId]);

  // Clear banner when user returns to onboarding studio
  useEffect(() => {
    setOnboardingBanner(null);
  }, [setOnboardingBanner]);

  // Derived domain slices for automatic live verification
  const orgGoals = useMemo(() => goals.filter((g) => g.level === 'Organization'), [goals]);
  const siteGoals = useMemo(() => goals.filter((g) => g.level.startsWith('Site:')), [goals]);
  const deptGoals = useMemo(() => goals.filter((g) => g.level.startsWith('Department:')), [goals]);
  const approvedGoals = useMemo(() => goals.filter((g) => g.approval === 'Approved'), [goals]);
  const initToKpiLinks = useMemo(
    () => relations.filter((r) => r.from.startsWith('I-') && r.to.startsWith('K-') && r.strength > 0),
    [relations]
  );
  const activeKpiOwners = useMemo(() => kpiOwners.filter((o) => o.strength > 0), [kpiOwners]);
  const hasSafetyEntry = useMemo(
    () => safetyCross.some((sc) => Object.keys(sc.days || {}).length > 0),
    [safetyCross]
  );
  const hasKpiActual = useMemo(
    () => kpis.some((k) => (k.values || []).some((v) => v !== null && v !== undefined)),
    [kpis]
  );
  const hasPdcaDecision = useMemo(
    () => reviews.some((r) => (r.decisions || []).length > 0),
    [reviews]
  );
  const hasMgmtReview = useMemo(
    () => reviews.some((r) => /management review/i.test(r.title) || /management/i.test(r.source || '')),
    [reviews]
  );

  // Sync default selectors when workspace collections grow
  useEffect(() => {
    if (kpis.length > 0) {
      if (!orgKpi || !kpis.some((k) => k.id === orgKpi)) setOrgKpi(kpis[0].id);
      if (!siteKpi || !kpis.some((k) => k.id === siteKpi)) setSiteKpi(kpis[0].id);
      if (!deptKpi || !kpis.some((k) => k.id === deptKpi)) setDeptKpi(kpis[kpis.length - 1].id);
      if (!mxKpiId || !kpis.some((k) => k.id === mxKpiId)) setMxKpiId(kpis[0].id);
      if (!pulseKpi || !kpis.some((k) => k.id === pulseKpi)) setPulseKpi(kpis[0].id);
      if (!actualKpiId || !kpis.some((k) => k.id === actualKpiId)) setActualKpiId(kpis[0].id);
    }
  }, [kpis, orgKpi, siteKpi, deptKpi, mxKpiId, pulseKpi, actualKpiId]);

  useEffect(() => {
    if (orgGoals.length > 0 && (!siteParent || !orgGoals.some((g) => g.id === siteParent))) {
      setSiteParent(orgGoals[0].id);
    }
  }, [orgGoals, siteParent]);

  useEffect(() => {
    if (siteGoals.length > 0 && (!deptParent || !siteGoals.some((g) => g.id === deptParent))) {
      setDeptParent(siteGoals[0].id);
    }
  }, [siteGoals, deptParent]);

  useEffect(() => {
    if (goals.length > 0 && (!initGoal || !goals.some((g) => g.id === initGoal))) {
      const preferred = deptGoals[0] || siteGoals[0] || orgGoals[0];
      if (preferred) setInitGoal(preferred.id);
    }
  }, [goals, deptGoals, siteGoals, orgGoals, initGoal]);

  useEffect(() => {
    if (initiatives.length > 0) {
      if (!mxInitId || !initiatives.some((i) => i.id === mxInitId)) setMxInitId(initiatives[0].id);
      if (!projInit || !initiatives.some((i) => i.id === projInit)) setProjInit(initiatives[0].id);
    }
  }, [initiatives, mxInitId, projInit]);

  useEffect(() => {
    if (projects.length > 0 && (!taskProjId || !projects.some((p) => p.id === taskProjId))) {
      setTaskProjId(projects[0].id);
    }
  }, [projects, taskProjId]);

  useEffect(() => {
    if (reviews.length > 0 && (!decRevId || !reviews.some((r) => r.id === decRevId))) {
      setDecRevId(reviews[0].id);
    }
  }, [reviews, decRevId]);

  // Live completion map for all 12 steps
  const stepDoneMap = useMemo<Record<number, boolean>>(() => {
    const isBlankCleanWs = activeWorkspace?.id.startsWith('ws_clean_') || false;
    return {
      1: step1Confirmed || isBlankCleanWs || members.length > 1 || kpis.length > 0,
      2: kpis.length >= 1,
      3: orgGoals.some((g) => goalPlanCheck(g, kpis).ready),
      4: siteGoals.length >= 1 && deptGoals.length >= 1,
      5: approvedGoals.length >= 1,
      6: initiatives.length >= 1,
      7: initToKpiLinks.length >= 1 && activeKpiOwners.length >= 1,
      8: projects.length >= 1 && tasks.length >= 1,
      9: pulseCards.length >= 1 || hasSafetyEntry,
      10: hasKpiActual,
      11: reviews.length >= 1 && hasPdcaDecision,
      12: hasMgmtReview && approvedGoals.length >= 1 && hasKpiActual,
    };
  }, [
    activeWorkspace?.id,
    step1Confirmed,
    members.length,
    kpis,
    orgGoals,
    siteGoals.length,
    deptGoals.length,
    approvedGoals.length,
    initiatives.length,
    initToKpiLinks.length,
    activeKpiOwners.length,
    projects.length,
    tasks.length,
    pulseCards.length,
    hasSafetyEntry,
    hasKpiActual,
    reviews.length,
    hasPdcaDecision,
    hasMgmtReview,
  ]);

  const completedCount = useMemo(
    () => ONBOARDING_STEPS.filter((s) => stepDoneMap[s.step]).length,
    [stepDoneMap]
  );
  const progressPct = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);
  const firstIncompleteStep =
    ONBOARDING_STEPS.find((s) => !stepDoneMap[s.step])?.step || 12;

  const currentStepDef =
    ONBOARDING_STEPS.find((s) => s.step === activeStep) || ONBOARDING_STEPS[0];

  const isBlankWorkspace = goals.length === 0 && kpis.length === 0 && initiatives.length === 0;
  const canLeadWrite = activeRole === 'Administratör' || leadershipRole(activeRole);
  const canGoalCreate = roleCan(activeRole, 'goalCreate', null, { goals, initiatives });
  const canApprove = roleCan(activeRole, 'approve', null, { goals, initiatives });

  const openModuleWithHandHold = (route: AppRoute, id?: string) => {
    setOnboardingBanner({
      step: currentStepDef.step,
      total: ONBOARDING_STEPS.length,
      title: currentStepDef.title,
      instruction: currentStepDef.moduleInstruction,
    });
    navigate(route, id);
  };

  // --- Handlers ---
  const handleCreateBlankWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || busy) return;
    setBusy(true);
    const wsId = await createBlankWorkspace(newCustomerName);
    setBusy(false);
    if (wsId) {
      setNewCustomerName('');
      setStep1Confirmed(true);
      setActiveStep(2);
    }
  };

  const handleCreateKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiName.trim() || busy) return;
    setBusy(true);
    const id = await createKpi({
      name: kpiName,
      unit: kpiUnit || '%',
      direction: kpiDir,
      tolerance: Number(kpiTol || 0),
      monthlyTarget: Number(kpiTarget || 0),
      source: 'Kunduppstart · SafeQMS',
    });
    setBusy(false);
    if (id) {
      setKpiName('');
      setOrgKpi(id);
      setSiteKpi(id);
    }
  };

  const handleCreateOrgGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgTitle.trim() || !orgKpi || busy) return;
    const kObj = kpiById(kpis, orgKpi);
    setBusy(true);
    const id = await saveGoal(undefined, {
      title: orgTitle.trim(),
      level: 'Organization',
      parent: '',
      owner: orgOwner.trim() || 'Executive Management',
      year: `${year}–${Number(year) + 2}`,
      kpi: orgKpi,
      baseline: Number(orgBaseline || 0),
      target: Number(orgTarget || 0),
      unit: kObj?.unit || '%',
      status: 'Active',
      description: orgWhat.trim(),
      planWhat: orgWhat.trim(),
      resources: orgResources.trim(),
      planDue: orgDue,
      evaluation: orgEval.trim(),
      isoRefs: [orgIsoRef],
      riskRefs: 'RISK-OPS-01',
      processRefs: 'PR-MANUF-01',
      evidenceRefs: 'DOC-STRAT-2027',
    });
    setBusy(false);
    if (id) {
      setOrgTitle('');
      setSiteParent(id);
    }
  };

  const handleCreateSiteGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteTitle.trim() || !siteParent || !siteKpi || busy) return;
    const kObj = kpiById(kpis, siteKpi);
    setBusy(true);
    const id = await saveGoal(undefined, {
      title: siteTitle.trim(),
      level: siteLevel,
      parent: siteParent,
      owner: siteOwner.trim() || 'Site Manager',
      year,
      kpi: siteKpi,
      baseline: Number(orgBaseline || 55),
      target: Number(siteTarget || 0),
      unit: kObj?.unit || '%',
      status: 'Active',
      description: `Årligt site-mål nedbrutet från ${siteParent}.`,
      planWhat: `Genomför lokala förbättringsinitiativ för att nå ${siteTarget} ${kObj?.unit || '%'} på ${siteLevel}.`,
      resources: 'Site-ledning, produktionsteknik och underhållsteam',
      planDue: `${year}-12-31`,
      evaluation: 'Månadsvis uppföljning i Bowling Chart och Tier 2 Scorecard',
      isoRefs: ['req-9001-6.2'],
      riskRefs: 'RISK-SITE-01',
      processRefs: 'PR-SITE-01',
      evidenceRefs: 'DOC-SITE-PLAN',
    });
    setBusy(false);
    if (id) {
      setSiteTitle('');
      setDeptParent(id);
    }
  };

  const handleCreateDeptGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptTitle.trim() || !deptParent || !deptKpi || busy) return;
    const kObj = kpiById(kpis, deptKpi);
    setBusy(true);
    const id = await saveGoal(undefined, {
      title: deptTitle.trim(),
      level: deptLevel,
      parent: deptParent,
      owner: deptOwner.trim() || 'Production Manager',
      year,
      kpi: deptKpi,
      baseline: 60,
      target: Number(deptTarget || 0),
      unit: kObj?.unit || '%',
      status: 'Active',
      description: `Avdelningsmål nedbrutet från ${deptParent}.`,
      planWhat: `Dagliga förbättringar, standardiserat arbetssätt och SMED/TPM inom ${deptLevel}.`,
      resources: 'Avdelningschef, teamledare och operatörer (2h/vecka)',
      planDue: `${year}-11-30`,
      evaluation: 'Veckovis skiftuppföljning och månadsvis KPI i Bowling Chart',
      isoRefs: ['req-9001-6.2', 'req-9001-8.5'],
      riskRefs: 'RISK-DEPT-01',
      processRefs: 'PR-PROD-01',
      evidenceRefs: 'DOC-DEPT-PLAN',
    });
    setBusy(false);
    if (id) {
      setDeptTitle('');
      setInitGoal(id);
    }
  };

  const handleCreateInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initTitle.trim() || !initGoal || busy) return;
    setBusy(true);
    const id = await createInitiative({
      title: initTitle.trim(),
      owner: initOwner.trim() || 'Production Manager',
      goal: initGoal,
      status: 'On track',
      progress: 0,
      budget: initBudget.trim() || '150 000 kr',
      description: `Förbättringsinitiativ kopplat till ${initGoal}.`,
      sqdc: initSqdc,
      valueStream: initValueStream.trim() || 'Huvudflöde / Flaskhals',
      isBottleneck: initBottleneck,
    });
    setBusy(false);
    if (id) {
      setInitTitle('');
      setMxInitId(id);
      setProjInit(id);
    }
  };

  const handleLinkXMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mxInitId || !mxKpiId || busy) return;
    setBusy(true);
    await setMatrixRelationStrength(mxInitId, mxKpiId, mxStrength, 'Kopplad via Ny kund-uppstart');
    if (mxOwnerName.trim()) {
      await setKpiOwnerStrength(mxKpiId, mxOwnerName.trim(), mxOwnerStrength, 'Huvudansvarig KPI-ägare');
    }
    setBusy(false);
  };

  const handleCreateProjectA3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim() || !projInit || busy) return;
    setBusy(true);
    const id = await createProjectA3({
      title: projTitle.trim(),
      initiative: projInit,
      owner: projOwner.trim() || 'Process Engineer',
      escalationTier: projTier,
      problem: projProblem.trim() || 'Långa ställtider och oplanerade stopp sänker tillgängligheten.',
      current: projCurrent.trim() || 'Genomsnittlig ställtid 60 min/byte.',
      target: projTargetText.trim() || 'Genomsnittlig ställtid ≤ 42 min (-30 %) inom Q3.',
      root: projRoot.trim() || 'Saknad standardiserad verktygsvagn och extern förberedelse före stopp.',
      fiveWhys: [
        { level: 1, question: 'Varför tar omställningen 60 minuter?', answer: 'Operatören letar verktyg och väntar på uppvärmning efter stopp.' },
        { level: 2, question: 'Varför saknas verktyg vid maskinen?', answer: 'Verktyg delas mellan linjer utan skuggtavla eller standardvagn.' },
        { level: 3, question: 'Varför finns ingen standardvagn?', answer: 'SMED-standard för externt förberedelsearbete saknas idag.' },
      ],
      counter: projCounter.trim() || 'Inför SMED-vagn, skuggtavla och standardiserad checklista före stopp.',
      learning: 'Standardisera arbetssättet och följ upp varje skift på Daily Board.',
    });
    setBusy(false);
    if (id) {
      setProjTitle('');
      setTaskProjId(id);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskProjId || !taskTitle.trim() || busy) return;
    setBusy(true);
    await addProjectTask(taskProjId, taskTitle.trim(), taskOwner.trim() || 'Team Leader', `${year}-06-30`);
    setBusy(false);
    setTaskTitle('');
  };

  const handleCreatePulseCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pulseTitle.trim() || busy) return;
    setBusy(true);
    await createPulseCard({
      title: pulseTitle.trim(),
      routeType: pulseRoute,
      kpi: pulseKpi || kpis[0]?.id || '',
      owner: pulseOwner.trim() || 'Team Leader',
      details: 'Skapad via daglig styrning under kunduppstart.',
      due: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
    setBusy(false);
    setPulseTitle('');
  };

  const handleSaveKpiMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualKpiId || actualVal === '' || busy) return;
    const k = kpiById(kpis, actualKpiId);
    const tNum = actualTargetVal !== '' ? Number(actualTargetVal) : (k?.targets[actualMonthIdx] ?? null);
    setBusy(true);
    await updateKpiMonth(actualKpiId, actualMonthIdx, Number(actualVal), tNum);
    setBusy(false);
    setActualVal('');
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revTitle.trim() || busy) return;
    setBusy(true);
    const id = await createReview({
      title: revTitle.trim(),
      date: new Date().toISOString().slice(0, 10),
      scope,
      notes: revNotes.trim() || 'Genomgång av KPI-utfall, projektstatus och korrigerande åtgärder.',
    });
    setBusy(false);
    if (id) {
      setRevTitle('');
      setDecRevId(id);
    }
  };

  const handleAddDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decRevId || !decText.trim() || busy) return;
    setBusy(true);
    await addDecision(decRevId, {
      text: decText.trim(),
      owner: decOwner.trim() || 'Production Manager',
      due: decDue,
    });
    setBusy(false);
    setDecText('');
  };

  const handlePrepareMgmt = async () => {
    if (busy) return;
    setBusy(true);
    await prepareManagementReview();
    setBusy(false);
  };

  // Helper to group the 12 steps in the left rail
  const groupedSteps = useMemo(() => {
    const groups: Array<{ name: string; items: OnboardingStepDef[] }> = [];
    for (const s of ONBOARDING_STEPS) {
      let g = groups.find((x) => x.name === s.group);
      if (!g) {
        g = { name: s.group, items: [] };
        groups.push(g);
      }
      g.items.push(s);
    }
    return groups;
  }, []);

  const selectedActualKpi = kpiById(kpis, actualKpiId);
  const selectedActualStatus = computeKpiStatus(selectedActualKpi);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Ny kund · Starta från noll (Guidad SOP-uppstart)"
        subtitle="Bygg upp en helt ny kunds målstyrning från tomt blad till färdigt, ISO-redo Hoshin Kanri-system i exakt rätt modulordning."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('sop')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Öppna SOP-handboken</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(firstIncompleteStep)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>
                {completedCount === ONBOARDING_STEPS.length
                  ? 'Alla 12 steg klara'
                  : `Gå till Steg ${firstIncompleteStep}`}
              </span>
            </button>
          </div>
        }
      />

      {/* Top Live Status + Clean Workspace Launcher */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-bold text-teal-700 dark:text-teal-300">AKTIV ARBETSYTA</span>
              <span className="font-bold text-[var(--ink)]">{activeWorkspace?.name || 'SafeQMS'}</span>
              <span className="text-[var(--muted)]">·</span>
              <span className="text-[var(--muted)]">
                {isBlankWorkspace
                  ? 'Tom kundarbetsyta (0 mål · redo från noll)'
                  : `${goals.length} mål · ${kpis.length} KPI:er · ${initiatives.length} initiativ`}
              </span>
            </div>
            <div className="text-xs text-[var(--muted)]">
              Framsteg i aktiv arbetsyta:{' '}
              <strong className="font-mono tabular-nums text-[var(--ink)]">
                {completedCount}/{ONBOARDING_STEPS.length} steg klara ({progressPct}%)
              </strong>{' '}
              · Verifieras automatiskt mot skarpt innehåll i databasen.
            </div>
          </div>

          {isActualAdmin && (
            <form onSubmit={handleCreateBlankWs} className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Nytt kundnamn (t.ex. Nordisk Industri AB)..."
                className="flex-1 lg:w-72 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--ink)]"
              />
              <button
                type="submit"
                disabled={busy || !newCustomerName.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Skapa tom arbetsyta (Från noll)</span>
              </button>
            </form>
          )}
        </div>

        <div className="h-1.5 w-full rounded-full bg-[var(--surface-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full bg-teal-700 dark:bg-teal-500 transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {!isBlankWorkspace && completedCount >= 8 && isActualAdmin && (
          <div className="text-[11px] text-[var(--muted)] flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border)]">
            <span>
              Tips: Du tittar just nu på en arbetsyta som redan har data. Skapa en <strong>ny tom arbetsyta</strong> ovan för att testa hela kundflödet från absolut noll — din befintliga arbetsyta ligger kvar orörd.
            </span>
          </div>
        )}
      </Card>

      {/* Main 2-Column Studio: Left 12-Step Rail + Right Active Hand-Holding Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Architecture Step Rail */}
        <aside className="xl:col-span-4 space-y-4">
          <Card className="p-3.5 space-y-4">
            <div className="px-1.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Modulordning (1–12)
              </span>
              <span className="font-mono text-[11px] font-semibold tabular-nums text-teal-700 dark:text-teal-300">
                {completedCount}/12
              </span>
            </div>

            {groupedSteps.map((grp) => (
              <div key={grp.name} className="space-y-1">
                <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  {grp.name}
                </div>
                {grp.items.map((item) => {
                  const done = stepDoneMap[item.step];
                  const isCurrent = activeStep === item.step;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setActiveStep(item.step)}
                      className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors flex items-center gap-2.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-teal-700 text-white dark:bg-teal-600'
                          : 'hover:bg-[var(--surface-subtle)] text-[var(--ink)]'
                      }`}
                    >
                      {done ? (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isCurrent ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        />
                      ) : (
                        <Circle
                          className={`w-4 h-4 shrink-0 ${
                            isCurrent ? 'text-white/80' : 'text-[var(--muted)] opacity-55'
                          }`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold truncate">
                            {item.step}. {item.shortTitle}
                          </span>
                          <span
                            className={`font-mono text-[10px] shrink-0 ${
                              isCurrent ? 'text-white/80' : 'text-[var(--muted)]'
                            }`}
                          >
                            {done ? 'Klar' : 'Väntar'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </Card>
        </aside>

        {/* Right Active Hand-Holding Step Panel */}
        <section className="xl:col-span-8 space-y-5">
          <Card className="p-5 sm:p-6 space-y-5">
            {/* Step Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
                    {currentStepDef.code} / 12
                  </span>
                  <span className="text-[var(--muted)]">·</span>
                  <span className="font-semibold text-[var(--muted)]">{currentStepDef.group}</span>
                  <span className="text-[var(--muted)]">·</span>
                  <StatusBadge
                    label={stepDoneMap[currentStepDef.step] ? 'Klar i arbetsytan' : 'Att göra nu'}
                    tone={stepDoneMap[currentStepDef.step] ? 'green' : 'amber'}
                  />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-[var(--ink)]">
                  {currentStepDef.title}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                  {currentStepDef.whyNow}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openModuleWithHandHold(currentStepDef.targetRoute)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] cursor-pointer whitespace-nowrap"
                >
                  <span>Öppna {currentStepDef.moduleName}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('sop', `chapter-${currentStepDef.sopChapter}`)}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>SOP Kap {currentStepDef.sopChapter}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
              <span>
                <strong className="text-[var(--ink)]">Ansvarig roll:</strong> {currentStepDef.responsible}
              </span>
              <span>·</span>
              <span>
                <strong className="text-[var(--ink)]">Din aktiva roll:</strong> {formatRoleLabel(activeRole)}
              </span>
            </div>

            {/* ================= STEP 1: WORKSPACE & TEAM ================= */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                      <Building2 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      <span>1A. Välj eller skapa tom kundarbetsyta</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Varje kund eller fabrik bör ha sin egen arbetsyta. Skapa en helt tom arbetsyta så slipper du exempeldata, eller byt mellan befintliga arbetsytor nedan.
                    </p>
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-[var(--muted)]">Aktiv arbetsyta</label>
                      <select
                        value={activeWorkspace?.id || ''}
                        onChange={(e) => switchWorkspace(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]"
                      >
                        {workspaces.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">
                      <Layers className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                      <span>1B. Scope, Horisont &amp; ISO-standarder</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Start-Scope</label>
                        <select
                          value={scope}
                          onChange={(e) => setScope(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold"
                        >
                          {ALL_SCOPES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">Planeringsår</label>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold tabular-nums"
                        >
                          {['2027', '2028', '2029'].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-[11px] text-[var(--muted)]">
                      Laddade ISO-standarder:{' '}
                      <strong className="text-[var(--ink)]">
                        {isoStandards.map((s) => s.code).join(' · ') || 'ISO 9001 · 14001 · 45001'}
                      </strong>{' '}
                      · Teammedlemmar: <strong className="font-mono text-[var(--ink)]">{members.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => openModuleWithHandHold('settings')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                  >
                    <span>Bjud in teammedlemmar i Settings</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep1Confirmed(true);
                      setActiveStep(2);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer"
                  >
                    <span>Bekräfta grundinställningar &amp; gå till Steg 2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: CREATE FIRST KPI ================= */}
            {activeStep === 2 && (
              <div className="space-y-4">
                <form onSubmit={handleCreateKpi} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-[var(--ink)]">Skapa ny KPI-definition (sparas direkt i Firestore)</div>
                    <button
                      type="button"
                      onClick={() => {
                        setKpiName('Overall Equipment Effectiveness (OEE)');
                        setKpiUnit('%');
                        setKpiDir('higher');
                        setKpiTol('2');
                        setKpiTarget('75');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Fyll i exempeldata (OEE %)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[var(--muted)] mb-1">KPI-namn *</label>
                      <input
                        type="text"
                        required
                        disabled={!canLeadWrite}
                        value={kpiName}
                        onChange={(e) => setKpiName(e.target.value)}
                        placeholder="t.ex. Overall Equipment Effectiveness (OEE) eller Ställtid Linje 3"
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--muted)] mb-1">Enhet</label>
                      <input
                        type="text"
                        disabled={!canLeadWrite}
                        value={kpiUnit}
                        onChange={(e) => setKpiUnit(e.target.value)}
                        placeholder="%, min, h, ppm, SEK"
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--muted)] mb-1">Riktning (vad är bra?)</label>
                      <select
                        disabled={!canLeadWrite}
                        value={kpiDir}
                        onChange={(e) => setKpiDir(e.target.value as 'higher' | 'lower' | 'range')}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                      >
                        <option value="higher">Högre är bättre (higher)</option>
                        <option value="lower">Lägre är bättre (lower)</option>
                        <option value="range">Nära målvärdet (range)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--muted)] mb-1">Månadsmål (Jan–Dec)</label>
                      <input
                        type="number"
                        step="any"
                        disabled={!canLeadWrite}
                        value={kpiTarget}
                        onChange={(e) => setKpiTarget(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-mono tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[var(--muted)] mb-1">Tolerans (± för gul At risk)</label>
                      <input
                        type="number"
                        step="any"
                        min={0}
                        disabled={!canLeadWrite}
                        value={kpiTol}
                        onChange={(e) => setKpiTol(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-mono tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!canLeadWrite || busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Skapa KPI i arbetsytan</span>
                    </button>
                  </div>
                </form>

                {/* Live created KPIs */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[var(--ink)]">
                    KPI:er i arbetsytan just nu ({kpis.length})
                  </div>
                  {kpis.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">
                      Inga KPI:er skapade ännu. Skapa minst en KPI ovan (tips: skapa gärna 1 topp-KPI t.ex. OEE och 1 avdelnings-KPI t.ex. Ställtid).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {kpis.map((k) => (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => openModuleWithHandHold('kpis', k.id)}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs hover:border-teal-600/50 cursor-pointer flex items-center gap-2"
                        >
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-300">{k.id}</span>
                          <span className="font-semibold text-[var(--ink)]">{k.name}</span>
                          <span className="text-[var(--muted)] font-mono">
                            ({k.unit} · {k.direction})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 3: ORGANIZATION STRATEGIC GOAL + ISO 6.2 ================= */}
            {activeStep === 3 && (
              <div className="space-y-4">
                {kpis.length === 0 ? (
                  <div className="rounded-xl border border-amber-600/25 bg-amber-500/8 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2 text-[var(--ink)]">
                      <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>Skapa först minst en KPI i Steg 2 så att ditt strategiska mål kan kopplas och bli ISO 6.2-redo.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white cursor-pointer"
                    >
                      Gå till Steg 2
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateOrgGoal} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-[var(--ink)]">
                        Skapa Organization-mål (Strategisk pelare · alla ISO 6.2-fält)
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOrgTitle('Operational Excellence 2027–2029');
                          setOrgOwner('Executive Management');
                          setOrgBaseline('55');
                          setOrgTarget('75');
                          setOrgWhat('Inför strukturerat förbättringsarbete (SMED, TPM och daglig styrning) i hela produktionen.');
                          setOrgResources('Ledningsgrupp, platschefer och förbättringsteam');
                          setOrgDue('2029-12-31');
                          setOrgEval('Månadsvis KPI-uppföljning i Bowling Chart samt kvartalsvis Management Review');
                          setOrgIsoRef('req-9001-6.2');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Fyll i exempeldata (OEE 55% → 75%)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[var(--muted)] mb-1">Strategiskt mål (Titel) *</label>
                        <input
                          type="text"
                          required
                          disabled={!canGoalCreate}
                          value={orgTitle}
                          onChange={(e) => setOrgTitle(e.target.value)}
                          placeholder="t.ex. Operational Excellence — Öka OEE från 55% till 75%"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--ink)]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Ansvarig ägare *</label>
                        <input
                          type="text"
                          required
                          value={orgOwner}
                          onChange={(e) => setOrgOwner(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Kopplad KPI *</label>
                        <select
                          value={orgKpi}
                          onChange={(e) => setOrgKpi(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        >
                          {kpis.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.id} · {k.name} ({k.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Nuläge (Baseline)</label>
                        <input
                          type="number"
                          step="any"
                          value={orgBaseline}
                          onChange={(e) => setOrgBaseline(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-mono tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Långsiktigt mål (Target)</label>
                        <input
                          type="number"
                          step="any"
                          value={orgTarget}
                          onChange={(e) => setOrgTarget(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-mono tabular-nums"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[var(--muted)] mb-1">ISO 6.2 · Vad ska göras? *</label>
                        <input
                          type="text"
                          required
                          value={orgWhat}
                          onChange={(e) => setOrgWhat(e.target.value)}
                          placeholder="Beskriv övergripande strategi och åtgärdsinriktning"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">ISO 6.2 · Resurser *</label>
                        <input
                          type="text"
                          required
                          value={orgResources}
                          onChange={(e) => setOrgResources(e.target.value)}
                          placeholder="t.ex. Ledningsgrupp och förbättringsteam"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">ISO 6.2 · Slutdatum *</label>
                        <input
                          type="date"
                          required
                          value={orgDue}
                          onChange={(e) => setOrgDue(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">ISO 6.2 · Hur utvärderas resultatet? *</label>
                        <input
                          type="text"
                          required
                          value={orgEval}
                          onChange={(e) => setOrgEval(e.target.value)}
                          placeholder="t.ex. Månadsvis Bowling Chart & Management Review"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">ISO-krav *</label>
                        <select
                          value={orgIsoRef}
                          onChange={(e) => setOrgIsoRef(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        >
                          {isoStandards.flatMap((std) =>
                            std.requirements.map((r) => (
                              <option key={r.id} value={r.id}>
                                {std.code} §{r.number} · {r.title}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={!canGoalCreate || busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Skapa strategiskt toppmål</span>
                      </button>
                    </div>
                  </form>
                )}

                {orgGoals.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[var(--ink)]">
                      Organization-mål i arbetsytan ({orgGoals.length})
                    </div>
                    <div className="space-y-1.5">
                      {orgGoals.map((g) => {
                        const ready = goalPlanCheck(g, kpis).ready;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => openModuleWithHandHold('goal', g.id)}
                            className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 hover:border-teal-600/50 cursor-pointer"
                          >
                            <div>
                              <span className="font-mono font-bold text-teal-700 dark:text-teal-300 mr-2">{g.id}</span>
                              <span className="font-semibold text-[var(--ink)]">{g.title}</span>
                              <span className="text-[var(--muted)] ml-2">
                                {g.baseline} → {g.target} {g.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <StatusBadge label={ready ? 'ISO Ready' : 'Incomplete'} tone={ready ? 'green' : 'amber'} />
                              <StatusBadge label={g.approval} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 4: GOAL CASCADE (SITE -> DEPARTMENT) ================= */}
            {activeStep === 4 && (
              <div className="space-y-4">
                {orgGoals.length === 0 ? (
                  <div className="rounded-xl border border-amber-600/25 bg-amber-500/8 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>Skapa först ett Organization-mål i Steg 3 innan du bryter ner till Site och Department.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white cursor-pointer"
                    >
                      Gå till Steg 3
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 4A: Site Goal */}
                    <form onSubmit={handleCreateSiteGoal} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--ink)]">4A. Skapa Site-mål (Nivå 2)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSiteTitle(`Nå 68% OEE under ${year}`);
                            setSiteOwner('Site Manager');
                            setSiteTarget('68');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Exempel</span>
                        </button>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Site</label>
                        <select
                          value={siteLevel}
                          onChange={(e) => setSiteLevel(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        >
                          {ALL_SCOPES.filter((s) => s.startsWith('Site:')).map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Primary Parent (Organization)</label>
                        <select
                          value={siteParent}
                          onChange={(e) => setSiteParent(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        >
                          {permittedParents(goals, siteLevel).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.id} · {p.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Site-målets titel *</label>
                        <input
                          type="text"
                          required
                          value={siteTitle}
                          onChange={(e) => setSiteTitle(e.target.value)}
                          placeholder="t.ex. Nå 68% OEE i Uppsala 2027"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-[var(--muted)] mb-1">Målvärde</label>
                          <input
                            type="number"
                            step="any"
                            value={siteTarget}
                            onChange={(e) => setSiteTarget(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[var(--muted)] mb-1">KPI</label>
                          <select
                            value={siteKpi}
                            onChange={(e) => setSiteKpi(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-xs"
                          >
                            {kpis.map((k) => (
                              <option key={k.id} value={k.id}>{k.id} · {k.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!canGoalCreate || busy}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Skapa Site-mål</span>
                      </button>
                    </form>

                    {/* 4B: Department Goal */}
                    <form onSubmit={handleCreateDeptGoal} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--ink)]">4B. Skapa Department-mål (Nivå 3)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setDeptTitle('Minska omställningsförluster med 30%');
                            setDeptOwner('Production Manager');
                            setDeptTarget('42');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Exempel</span>
                        </button>
                      </div>
                      {siteGoals.length === 0 ? (
                        <p className="text-xs text-[var(--muted)] py-6">
                          Skapa först ett Site-mål till vänster (4A) så kan du välja det som <strong>Primary Parent</strong> här.
                        </p>
                      ) : (
                        <>
                          <div>
                            <label className="block font-semibold text-[var(--muted)] mb-1">Avdelning</label>
                            <select
                              value={deptLevel}
                              onChange={(e) => setDeptLevel(e.target.value)}
                              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                            >
                              {ALL_SCOPES.filter((s) => s.startsWith('Department:')).map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-[var(--muted)] mb-1">Primary Parent (Site)</label>
                            <select
                              value={deptParent}
                              onChange={(e) => setDeptParent(e.target.value)}
                              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                            >
                              {permittedParents(goals, deptLevel).map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.id} · {p.title} ({p.level})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-[var(--muted)] mb-1">Avdelningsmålets titel *</label>
                            <input
                              type="text"
                              required
                              value={deptTitle}
                              onChange={(e) => setDeptTitle(e.target.value)}
                              placeholder="t.ex. Minska omställningsförluster med 30%"
                              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold text-[var(--muted)] mb-1">Målvärde</label>
                              <input
                                type="number"
                                step="any"
                                value={deptTarget}
                                onChange={(e) => setDeptTarget(e.target.value)}
                                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-[var(--muted)] mb-1">KPI</label>
                              <select
                                value={deptKpi}
                                onChange={(e) => setDeptKpi(e.target.value)}
                                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-xs"
                              >
                                {kpis.map((k) => (
                                  <option key={k.id} value={k.id}>{k.id} · {k.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={!canGoalCreate || busy}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Skapa Department-mål</span>
                          </button>
                        </>
                      )}
                    </form>
                  </div>
                )}

                {/* Mini Live Cascade Preview */}
                {goals.length > 0 && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-2 text-xs">
                    <div className="font-bold text-[var(--ink)]">Live Goal Cascade-träd ({goals.length} mål)</div>
                    <div className="space-y-1.5">
                      {orgGoals.map((og) => {
                        const sites = goals.filter((s) => s.parent === og.id);
                        return (
                          <div key={og.id} className="space-y-1">
                            <div className="font-semibold text-[var(--ink)]">
                              <span className="font-mono text-teal-700 dark:text-teal-300 mr-1.5">{og.id}</span>
                              {og.title} <span className="text-[var(--muted)] font-normal">(Organization)</span>
                            </div>
                            {sites.map((sg) => {
                              const depts = goals.filter((d) => d.parent === sg.id);
                              return (
                                <div key={sg.id} className="pl-5 border-l border-dashed border-[var(--border-strong)] ml-2 space-y-1">
                                  <div className="text-[var(--ink)]">
                                    <span className="font-mono text-[var(--muted)] mr-1.5">{sg.id}</span>
                                    {sg.title} <span className="text-[var(--muted)]">({sg.level})</span>
                                  </div>
                                  {depts.map((dg) => (
                                    <div key={dg.id} className="pl-5 border-l border-dashed border-[var(--border-strong)] ml-2 text-[var(--muted)]">
                                      <span className="font-mono mr-1.5">{dg.id}</span>
                                      <span className="text-[var(--ink)]">{dg.title}</span> ({dg.level})
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 5: CATCHBALL & FORMAL APPROVAL ================= */}
            {activeStep === 5 && (
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="rounded-xl border border-amber-600/25 bg-amber-500/8 p-4 flex items-center justify-between gap-3 text-xs">
                    <span>Skapa först mål i Steg 3–4 innan Catchball och formellt godkännande.</span>
                    <button type="button" onClick={() => setActiveStep(3)} className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white cursor-pointer">
                      Gå till Steg 3
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Separation of duties helper for Admin */}
                    {isActualAdmin && !canApprove && (
                      <div className="rounded-xl border border-amber-600/25 bg-amber-500/8 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-[var(--ink)]">
                          <strong>ISO Separation of Duties:</strong> Rollen <em>Administrator</em> bygger och konfigurerar systemet, men formellt godkännande (<em>Approve</em>) kräver rollen <strong>General director</strong> eller <strong>QMS auditor</strong>.
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewRole('General director')}
                          className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer whitespace-nowrap"
                        >
                          Växla till General director-vy
                        </button>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {goals.map((g) => {
                        const cb = catchballs.find((c) => c.goal === g.id && !['Approved', 'Cancelled'].includes(c.status));
                        const pendingAp = approvals.find((a) => a.goal === g.id && a.status === 'Pending');
                        return (
                          <div
                            key={g.id}
                            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-bold text-[var(--muted)]">{g.id}</span>
                                <span className="font-semibold text-[var(--ink)]">{g.title}</span>
                                <StatusBadge label={g.approval} />
                                {cb && <StatusBadge label={`Catchball: ${cb.status}`} tone="teal" />}
                              </div>
                              <div className="text-[11px] text-[var(--muted)]">
                                {g.level} · Mål: {g.target} {g.unit} · Revision v{g.revision}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {g.approval === 'Approved' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Officiellt godkänt
                                </span>
                              ) : pendingAp ? (
                                canApprove ? (
                                  <button
                                    type="button"
                                    onClick={() => decideApproval(pendingAp.id, 'Approved')}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                                  >
                                    Approve ({pendingAp.id})
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-[var(--muted)]">Väntar GD / QMS auditor</span>
                                )
                              ) : g.level === 'Organization' ? (
                                <button
                                  type="button"
                                  onClick={() => submitGoal(g.id)}
                                  className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-700 cursor-pointer"
                                >
                                  Skicka till Approvals
                                </button>
                              ) : !cb ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await createCatchball({
                                      goalId: g.id,
                                      target: Number(g.target || 0),
                                      resources: g.resources || 'Ordinarie teamresurser',
                                      due: g.planDue || `${year}-12-31`,
                                      reason: `Förslag på målnivå för ${g.title} enligt strategisk nedbrytning.`,
                                      recipientScope: g.level,
                                    });
                                  }}
                                  className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 cursor-pointer"
                                >
                                  1. Starta Catchball
                                </button>
                              ) : cb.status === 'Draft' && cbCanAct(cb, 'send', activeRole, goals, initiatives) ? (
                                <button
                                  type="button"
                                  onClick={() => sendCatchball(cb.id)}
                                  className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 cursor-pointer"
                                >
                                  2. Skicka förslag
                                </button>
                              ) : cbCanAct(cb, 'align', activeRole, goals, initiatives) ? (
                                <button
                                  type="button"
                                  onClick={() => alignCatchball(cb.id)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                                >
                                  3. Agree &amp; Align
                                </button>
                              ) : cb.status === 'Aligned' ? (
                                <button
                                  type="button"
                                  onClick={() => submitCatchballForApproval(cb.id)}
                                  className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white hover:bg-sky-700 cursor-pointer"
                                >
                                  4. Skicka till Approvals
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openModuleWithHandHold('catchballitem', cb.id)}
                                  className="rounded-lg border border-[var(--border-strong)] px-3 py-1.5 font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                                >
                                  Öppna {cb.id}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {isActualAdmin && activeRole !== actualRole && approvedGoals.length > 0 && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setPreviewRole(actualRole)}
                          className="text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                        >
                          Återgå till {formatRoleLabel(actualRole)}-roll
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ================= STEP 6: INITIATIVES & SQDC ================= */}
            {activeStep === 6 && (
              <div className="space-y-4">
                {goals.length === 0 ? (
                  <div className="rounded-xl border border-amber-600/25 bg-amber-500/8 p-4 flex items-center justify-between gap-3 text-xs">
                    <span>Skapa minst ett mål i Steg 3–4 innan du skapar ett förbättringsinitiativ.</span>
                    <button type="button" onClick={() => setActiveStep(3)} className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white cursor-pointer">
                      Gå till Steg 3
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateInitiative} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-[var(--ink)]">Skapa förbättringsinitiativ (länkas automatiskt ● Strong i X-Matrix)</div>
                      <button
                        type="button"
                        onClick={() => {
                          setInitTitle('SMED-pilot Linje 3 · Snabbare omställningar');
                          setInitOwner('Production Manager');
                          setInitValueStream('Linje 3 Förpackning · Flaskhals');
                          setInitBudget('120 000 kr');
                          setInitBottleneck(true);
                          setInitSqdc({ S: 1, Q: 1, D: 2, C: 2 });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Fyll i exempeldata (SMED)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[var(--muted)] mb-1">Initiativets namn *</label>
                        <input
                          type="text"
                          required
                          value={initTitle}
                          onChange={(e) => setInitTitle(e.target.value)}
                          placeholder="t.ex. SMED-pilot på Linje 3"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Stöttar mål *</label>
                        <select
                          value={initGoal}
                          onChange={(e) => setInitGoal(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        >
                          {goals.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.id} · {g.title} ({g.level})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Ansvarig</label>
                        <input
                          type="text"
                          value={initOwner}
                          onChange={(e) => setInitOwner(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Värdeflöde / Flaskhals</label>
                        <input
                          type="text"
                          value={initValueStream}
                          onChange={(e) => setInitValueStream(e.target.value)}
                          placeholder="t.ex. Linje 3 · Kapacitetsflaskhals"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Budgetuppskattning</label>
                        <input
                          type="text"
                          value={initBudget}
                          onChange={(e) => setInitBudget(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {(['S', 'Q', 'D', 'C'] as const).map((k) => (
                        <div key={k}>
                          <label className="block text-[11px] font-semibold text-[var(--muted)] mb-1">SQDC · {k}</label>
                          <select
                            value={initSqdc[k]}
                            onChange={(e) => setInitSqdc((p) => ({ ...p, [k]: Number(e.target.value) }))}
                            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-xs"
                          >
                            <option value={0}>0 · Ingen</option>
                            <option value={1}>1 · Sekundär</option>
                            <option value={2}>2 · Primär</option>
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={initBottleneck}
                          onChange={(e) => setInitBottleneck(e.target.checked)}
                        />
                        <span>Markera som TOC-systemflaskhals</span>
                      </label>
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Skapa initiativ</span>
                      </button>
                    </div>
                  </form>
                )}

                {initiatives.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {initiatives.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => openModuleWithHandHold('initiative', i.id)}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs hover:border-teal-600/50 cursor-pointer"
                      >
                        <span className="font-mono font-bold text-teal-700 dark:text-teal-300 mr-1.5">{i.id}</span>
                        <span className="font-semibold text-[var(--ink)]">{i.title}</span>
                        <span className="text-[var(--muted)] ml-1.5">→ {i.goal}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 7: X-MATRIX 360° ALIGNMENT ================= */}
            {activeStep === 7 && (
              <div className="space-y-4">
                {initiatives.length === 0 || kpis.length === 0 ? (
                  <div className="rounded-xl border border-amber-600/25 bg-amber-500/8 p-4 flex items-center justify-between gap-3 text-xs">
                    <span>Du behöver minst en KPI (Steg 2) och ett Initiativ (Steg 6) för att koppla ihop X-Matrix.</span>
                    <button type="button" onClick={() => setActiveStep(initiatives.length === 0 ? 6 : 2)} className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white cursor-pointer">
                      Gå till saknat steg
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLinkXMatrix} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                    <div className="font-bold text-[var(--ink)]">
                      Koppla Initiativ → KPI (Nordöstra kvadranten) &amp; KPI-ägare (Sydöstra vingen)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Initiativ</label>
                        <select
                          value={mxInitId}
                          onChange={(e) => setMxInitId(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-2 text-xs"
                        >
                          {initiatives.map((i) => (
                            <option key={i.id} value={i.id}>{i.id} · {i.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">KPI som påverkas</label>
                        <select
                          value={mxKpiId}
                          onChange={(e) => setMxKpiId(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-2 text-xs"
                        >
                          {kpis.map((k) => (
                            <option key={k.id} value={k.id}>{k.id} · {k.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Påverkansstyrka</label>
                        <select
                          value={mxStrength}
                          onChange={(e) => setMxStrength(Number(e.target.value) as 0.5 | 1 | 2)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-2 text-xs"
                        >
                          <option value={2}>● Strong (Primär påverkan)</option>
                          <option value={1}>◐ Medium (Stödjande)</option>
                          <option value={0.5}>○ Weak (Indirekt)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Tvärfunktionell KPI-ägare (SE-vingen)</label>
                        <input
                          type="text"
                          value={mxOwnerName}
                          onChange={(e) => setMxOwnerName(e.target.value)}
                          placeholder="t.ex. Production Manager"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Ägarskapsnivå</label>
                        <select
                          value={mxOwnerStrength}
                          onChange={(e) => setMxOwnerStrength(Number(e.target.value) as 1 | 2)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-2 text-xs"
                        >
                          <option value={2}>● Primary Owner</option>
                          <option value={1}>◐ Supporting Owner</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-[var(--muted)]">
                        Aktiva kopplingar: <strong>{initToKpiLinks.length}</strong> Init→KPI · <strong>{activeKpiOwners.length}</strong> KPI-ägare
                      </span>
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 cursor-pointer"
                      >
                        <span>Spara X-Matrix-koppling</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ================= STEP 8: PROJECT A3, 5-WHY & TASKS ================= */}
            {activeStep === 8 && (
              <div className="space-y-4">
                {initiatives.length === 0 ? (
                  <div className="rounded-xl border border-amber-600/25 bg-amber-500/8 p-4 flex items-center justify-between gap-3 text-xs">
                    <span>Skapa först ett initiativ i Steg 6 så kan Project A3 kopplas direkt under det.</span>
                    <button type="button" onClick={() => setActiveStep(6)} className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white cursor-pointer">
                      Gå till Steg 6
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 8A: Project A3 */}
                    <form onSubmit={handleCreateProjectA3} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--ink)]">8A. Skapa Project A3 + 5-Why</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProjTitle('SMED Linje 3 · Standardiserad omställning');
                            setProjOwner('Process Engineer');
                            setProjTier('Full A3');
                            setProjProblem('Omställningar på Linje 3 tar i snitt 60 minuter och orsakar 18% förlorad produktionstid.');
                            setProjCurrent('60 min/ställ · verktyg saknas vid linjen');
                            setProjTargetText('≤ 42 min/ställ (-30%) senast Q3');
                            setProjRoot('Externa förberedelser görs först efter maskinstopp.');
                            setProjCounter('Standardiserad verktygsvagn + SMED-checklista före stopp.');
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Exempel</span>
                        </button>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Initiativ</label>
                        <select
                          value={projInit}
                          onChange={(e) => setProjInit(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        >
                          {initiatives.map((i) => (
                            <option key={i.id} value={i.id}>{i.id} · {i.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Projekttitel *</label>
                        <input
                          type="text"
                          required
                          value={projTitle}
                          onChange={(e) => setProjTitle(e.target.value)}
                          placeholder="t.ex. SMED Linje 3"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-semibold text-[var(--muted)] mb-1">Projektledare</label>
                          <input
                            type="text"
                            value={projOwner}
                            onChange={(e) => setProjOwner(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[var(--muted)] mb-1">Djup (Tier)</label>
                          <select
                            value={projTier}
                            onChange={(e) => setProjTier(e.target.value as EscalationTier)}
                            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-xs"
                          >
                            <option value="Full A3">Full A3</option>
                            <option value="5-Why">5-Why</option>
                            <option value="Direct Fix">Direct Fix</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Problem &amp; Rotårsak</label>
                        <textarea
                          rows={2}
                          value={projProblem}
                          onChange={(e) => setProjProblem(e.target.value)}
                          placeholder="Vad är problemet och dess rotårsak?"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Skapa Project A3</span>
                      </button>
                    </form>

                    {/* 8B: Project Tasks */}
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                      <div className="font-bold text-[var(--ink)]">8B. Lägg till konkreta Project Tasks ({tasks.length})</div>
                      {projects.length === 0 ? (
                        <p className="text-xs text-[var(--muted)] py-6">
                          Skapa först ditt Project A3 till vänster (8A) så kan du lägga till uppgifter och se projektprocenten räknas upp automatiskt.
                        </p>
                      ) : (
                        <>
                          <form onSubmit={handleAddTask} className="space-y-2.5">
                            <div>
                              <label className="block font-semibold text-[var(--muted)] mb-1">Project A3</label>
                              <select
                                value={taskProjId}
                                onChange={(e) => setTaskProjId(e.target.value)}
                                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                              >
                                {projects.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.id} · {p.title} ({p.progress}%)
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                required
                                value={taskTitle}
                                onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="t.ex. Bygg SMED-vagn & märk verktyg"
                                className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                              />
                              <button
                                type="submit"
                                disabled={busy}
                                className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 cursor-pointer shrink-0"
                              >
                                + Task
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTaskTitle('Standardisera extern verktygsförberedelse på Linje 3')}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Fyll i exempel-task</span>
                            </button>
                          </form>

                          {tasks.length > 0 && (
                            <div className="space-y-1.5 pt-2 border-t border-[var(--border)] max-h-40 overflow-y-auto">
                              {tasks.slice(0, 6).map((t) => (
                                <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5">
                                  <span className="truncate font-medium text-[var(--ink)]">
                                    <span className="font-mono text-[var(--muted)] mr-1">{t.id}</span>
                                    {t.title}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskStatus(t.id)}
                                    className="cursor-pointer shrink-0"
                                  >
                                    <StatusBadge label={t.status} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 9: DAILY BOARD TIER 1-3 ================= */}
            {activeStep === 9 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                  <div className="font-bold text-[var(--ink)]">9A. Logga dagens Safety Cross</div>
                  <p className="text-[var(--muted)] leading-relaxed">
                    Klicka nedan för att registrera dagens status på Safety &amp; Quality Cross (Grön = OK · Gul = Tillbud · Röd = Olycka/Avvikelse).
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const day = Math.min(28, new Date().getDate());
                      await toggleSafetyDay(scope, `${year}-01`, day);
                      toast('Dagens Safety Cross-status uppdaterad', 'success');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Markera dag i Safety Cross ({scope})</span>
                  </button>
                  <div className="text-[11px] text-[var(--muted)]">
                    Status: {hasSafetyEntry ? 'Minst en dag registrerad ✓' : 'Ingen dag registrerad ännu'}
                  </div>
                </div>

                <form onSubmit={handleCreatePulseCard} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--ink)]">9B. Skapa dagligt Pulse Card (Kanban)</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPulseTitle('Sensorfel vid etikettering Linje 3 — snabbjustering');
                        setPulseRoute('Direct fix');
                        setPulseOwner('Team Leader');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Exempel</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={pulseTitle}
                    onChange={(e) => setPulseTitle(e.target.value)}
                    placeholder="Beskriv dagens avvikelse eller uppgift..."
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={pulseRoute}
                      onChange={(e) => setPulseRoute(e.target.value as PulseCard['routeType'])}
                      className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                    >
                      <option value="Direct fix">Direct fix</option>
                      <option value="A3">A3</option>
                      <option value="Escalate">Escalate</option>
                    </select>
                    <input
                      type="text"
                      value={pulseOwner}
                      onChange={(e) => setPulseOwner(e.target.value)}
                      placeholder="Ansvarig"
                      className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Skapa Pulse Card på Daily Board</span>
                  </button>
                </form>
              </div>
            )}

            {/* ================= STEP 10: KPI ACTUALS & BOWLING CHART ================= */}
            {activeStep === 10 && (
              <div className="space-y-4">
                {kpis.length === 0 ? (
                  <div className="rounded-xl border border-amber-600/25 bg-amber-500/8 p-4 flex items-center justify-between gap-3 text-xs">
                    <span>Skapa först en KPI i Steg 2 innan du registrerar månadsutfall.</span>
                    <button type="button" onClick={() => setActiveStep(2)} className="rounded-lg bg-teal-700 px-3 py-1.5 font-semibold text-white cursor-pointer">
                      Gå till Steg 2
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveKpiMonth} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[var(--ink)]">Mata in månadsutfall i Bowling Chart</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActualMonthIdx(0);
                          setActualTargetVal('56');
                          setActualVal('55');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Fyll i Jan-exempel (55 mot mål 56)</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[var(--muted)] mb-1">Välj KPI</label>
                        <select
                          value={actualKpiId}
                          onChange={(e) => setActualKpiId(e.target.value)}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-2 text-xs"
                        >
                          {kpis.map((k) => (
                            <option key={k.id} value={k.id}>{k.id} · {k.name} ({k.unit})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Månad ({year})</label>
                        <select
                          value={actualMonthIdx}
                          onChange={(e) => setActualMonthIdx(Number(e.target.value))}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-2 text-xs"
                        >
                          {MONTHS_SHORT.map((m, idx) => (
                            <option key={m} value={idx}>{m} {year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--muted)] mb-1">Månadsmål</label>
                        <input
                          type="number"
                          step="any"
                          value={actualTargetVal}
                          onChange={(e) => setActualTargetVal(e.target.value)}
                          placeholder={String(selectedActualKpi?.targets[actualMonthIdx] ?? '')}
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-2 text-xs font-mono tabular-nums"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="w-full sm:w-48">
                        <label className="block font-semibold text-[var(--muted)] mb-1">Faktiskt utfall (Actual) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={actualVal}
                          onChange={(e) => setActualVal(e.target.value)}
                          placeholder="Ange uppmätt värde"
                          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs font-mono tabular-nums"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 cursor-pointer"
                      >
                        <span>Spara månadsutfall</span>
                      </button>
                    </div>

                    {selectedActualKpi && (
                      <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[var(--muted)]">
                          Beräknad KPI-status:{' '}
                          <StatusBadge label={selectedActualStatus.label} />
                        </span>
                        <span className="font-mono text-[var(--ink)] tabular-nums">
                          Senaste utfall: {selectedActualStatus.actual ?? '—'} / Mål: {selectedActualStatus.target ?? '—'} {selectedActualKpi.unit}
                        </span>
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {/* ================= STEP 11: PDCA REVIEW & DECISION ================= */}
            {activeStep === 11 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <form onSubmit={handleCreateReview} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--ink)]">11A. Skapa PDCA Review-möte</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRevTitle(`Månadsuppföljning PDCA · ${scope}`);
                        setRevNotes('Genomgång av KPI-avvikelser och åtgärder för att säkra OEE-målet.');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Exempel</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={revTitle}
                    onChange={(e) => setRevTitle(e.target.value)}
                    placeholder="t.ex. Månadsuppföljning PDCA Q1"
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                  />
                  <textarea
                    rows={2}
                    value={revNotes}
                    onChange={(e) => setRevNotes(e.target.value)}
                    placeholder="Sammanfattning av avvikelser och orsaker..."
                    className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Skapa PDCA Review</span>
                  </button>
                </form>

                <form onSubmit={handleAddDecision} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--ink)]">11B. Dokumentera spårbart beslut</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDecText('Genomför extra SMED-workshop på Linje 3 och följ upp ställtid dagligen i 2 veckor.');
                        setDecOwner('Production Manager');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Exempel</span>
                    </button>
                  </div>
                  {reviews.length === 0 ? (
                    <p className="text-[var(--muted)] py-5">Skapa först en PDCA Review till vänster (11A).</p>
                  ) : (
                    <>
                      <select
                        value={decRevId}
                        onChange={(e) => setDecRevId(e.target.value)}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                      >
                        {reviews.map((r) => (
                          <option key={r.id} value={r.id}>{r.id} · {r.title}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={decText}
                        onChange={(e) => setDecText(e.target.value)}
                        placeholder="Korrigerande beslut..."
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={decOwner}
                          onChange={(e) => setDecOwner(e.target.value)}
                          placeholder="Ansvarig"
                          className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        />
                        <input
                          type="date"
                          value={decDue}
                          onChange={(e) => setDecDue(e.target.value)}
                          className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Lägg till PDCA-beslut</span>
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}

            {/* ================= STEP 12: MANAGEMENT REVIEW & ISO EVIDENCE ================= */}
            {activeStep === 12 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-1">
                    <div className="text-[11px] text-[var(--muted)] font-semibold uppercase">ISO 6.2 Planeringskompletta</div>
                    <div className="font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                      {goals.filter((g) => goalPlanCheck(g, kpis).ready).length} / {goals.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-1">
                    <div className="text-[11px] text-[var(--muted)] font-semibold uppercase">Godkända mål (Approved)</div>
                    <div className="font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                      {approvedGoals.length} / {goals.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3.5 space-y-1">
                    <div className="text-[11px] text-[var(--muted)] font-semibold uppercase">PDCA &amp; Management Reviews</div>
                    <div className="font-mono text-lg font-bold tabular-nums text-[var(--ink)]">
                      {reviews.length}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-3">
                  <div className="font-bold text-[var(--ink)]">Slut den strategiska loopen (ISO 9.3 &amp; Revision)</div>
                  <p className="text-[var(--muted)] leading-relaxed">
                    Sammanställ en formell <strong>Management Review</strong> direkt från arbetsytans live-data och öppna sedan <strong>Audit Evidence Pack</strong> för att inspektera eller exportera ett komplett revisionsunderlag i JSON/PDF.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      disabled={busy || !canLeadWrite}
                      onClick={handlePrepareMgmt}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 font-semibold text-white hover:bg-teal-800 disabled:opacity-50 dark:bg-teal-600 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Generera Management Review (ISO 9.3)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openModuleWithHandHold('iso')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                    >
                      <span>Öppna ISO Compliance</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openModuleWithHandHold('evidence')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 font-semibold hover:bg-[var(--surface-subtle)] cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Öppna Audit Evidence Pack</span>
                    </button>
                  </div>
                </div>

                {completedCount === ONBOARDING_STEPS.length && (
                  <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 p-4 flex items-start gap-3 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-[var(--ink)]">
                        Hela målstyrningskedjan är komplett (12 / 12 steg)!
                      </div>
                      <p className="text-[var(--muted)] leading-relaxed">
                        Arbetsytan <strong>{activeWorkspace?.name}</strong> har nu en komplett obruten spårbarhet från strategiska mål och Goal Cascade via X-Matrix, Catchball, Approvals, Initiativ, Project A3, Daily Board och KPI Bowling Chart hela vägen till PDCA och ISO Management Review.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step Bottom Navigation */}
            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={activeStep === 1}
                onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Föregående steg</span>
              </button>

              <span className="font-mono text-xs text-[var(--muted)] tabular-nums">
                Steg {activeStep} av {ONBOARDING_STEPS.length}
              </span>

              {activeStep < ONBOARDING_STEPS.length ? (
                <button
                  type="button"
                  onClick={() => setActiveStep((s) => Math.min(ONBOARDING_STEPS.length, s + 1))}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer"
                >
                  <span>Nästa steg ({activeStep + 1})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('overview')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gå till Overview</span>
                </button>
              )}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};
