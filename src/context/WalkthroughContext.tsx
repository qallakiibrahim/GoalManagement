import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppRoute, SafeQmsRole } from '../types/safeqms';
import { useWorkspace } from './WorkspaceContext';

export interface WalkthroughStep {
  id: string;
  chapterId: number;
  route: AppRoute;
  selector: string;
  title: string;
  why: string;
  action: string;
  roleTip: string;
  skipForBasic?: boolean;
}

export const ALL_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'tour-search',
    chapterId: 1,
    route: 'overview',
    selector: '[data-tour="global-search"]',
    title: 'Snabbsökning (Ctrl+K / ⌘K)',
    why: 'Sidomenyn startar stängd för att ge dig en ren arbetsyta. Med snabbsökningen hoppar du direkt till valfri vy, mål-ID (t.ex. G-001), KPI (K-002), initiativ eller Project A3.',
    action: 'Klicka på Search... eller tryck Ctrl+K (⌘K på Mac) när du vill navigera snabbt utan att leta i menyer.',
    roleTip: 'Tillgänglig för alla 6 roller — sökresultaten filtreras automatiskt efter din behörighet.',
  },
  {
    id: 'tour-scope',
    chapterId: 1,
    route: 'overview',
    selector: '[data-tour="scope-bar"]',
    title: 'Scope & Horizon — styr vad du ser',
    why: 'Alla vyer i SafeQMS filtreras efter vald organisationsnivå (Organization, Site eller Department) och planeringsår (Horizon).',
    action: 'Kontrollera alltid Scope överst på sidan. Ser en lista tom ut beror det oftast på att Scope står på en annan avdelning.',
    roleTip: 'Department director, Auditor och Basic user ser enbart Organization samt sin tilldelade Site och avdelning.',
  },
  {
    id: 'tour-pillars',
    chapterId: 2,
    route: 'pillars',
    selector: '[data-tour="pillars-grid"]',
    title: 'Multi-Year Strategic Pillars (3–5 år)',
    why: 'Hela strategiarbetet börjar på nivån Organization. Här sätter ledningen långsiktiga genombrottsmål (t.ex. höja OEE från 55 % till 75 %).',
    action: 'Klicka på Open på valfri strategisk pelare för att se målbeskrivning, baslinje, målvärde och länkade ISO-krav.',
    roleTip: 'Skapas av General director, QMS auditor eller Administrator. Övriga roller läser riktningen här.',
  },
  {
    id: 'tour-cascade',
    chapterId: 3,
    route: 'cascade',
    selector: '[data-tour="cascade-tree"]',
    title: 'Goal Cascade — 3-nivåhierarkin',
    why: 'För att strategin ska få effekt bryts Organization-mål ner till Site-mål och vidare till Department-mål via Primary Parent Goal.',
    action: 'Växla mellan Tree och Table och klicka på ett mål för att se hur röd tråd och ISO 6.2-planering hänger ihop.',
    roleTip: 'Hierarkin visar ägarskap (förälder → barn) — skilj detta från påverkansstyrka i X-Matrix.',
  },
  {
    id: 'tour-xmatrix',
    chapterId: 4,
    route: 'matrix',
    selector: '[data-tour="xmatrix-board"]',
    title: 'Hoshin Kanri 360° X-Matrix',
    why: 'X-Matrix säkerställer att inga mål saknar initiativ och att inga initiativ saknar mätbara KPI:er eller ansvarig ägare.',
    action: 'Klicka på ett mål för att korsmarkera kopplade initiativ och KPI:er. Klicka på en punkt (●, ◐, ○, –) för att inspektera eller redigera styrkan.',
    roleTip: 'Behöriga chefer, QMS auditor och Administrator redigerar kopplingar direkt i inspektörspanelen nedanför matrisen.',
  },
  {
    id: 'tour-catchball',
    chapterId: 5,
    route: 'catchball',
    selector: '[data-tour="catchball-list"]',
    title: 'Catchball Alignment — tvåvägsdialog',
    why: 'Innan mål låses förhandlar ledning och avdelningschef om realistiska målvärden och resurser så att planen går att leverera.',
    action: 'Öppna en tråd för att se förslag, motförslag och vems tur det är. Kom ihåg: Aligned betyder överens, INTE formellt godkänt.',
    roleTip: 'Används av General director, QMS auditor och Department director (dold för Basic user).',
    skipForBasic: true,
  },
  {
    id: 'tour-approvals',
    chapterId: 5,
    route: 'approvals',
    selector: '[data-tour="approvals-list"]',
    title: 'Formal Approvals & revisionslås',
    why: 'Formellt godkännande gör målet styrande och synligt för Basic user. Senare ändringar på ett godkänt mål skapar automatiskt en ny Draft-revision (v1 → v2).',
    action: 'Granska väntande ärenden och se beslutshistoriken. Endast General director och QMS auditor kan klicka Approve.',
    roleTip: 'Dold för Basic user. Auditor ser hela historiken i läsläge för revision.',
    skipForBasic: true,
  },
  {
    id: 'tour-projects',
    chapterId: 6,
    route: 'projects',
    selector: '[data-tour="initiatives-table"]',
    title: 'Initiatives, SQDC & Project A3',
    why: 'Godkända mål omvandlas till konkreta förbättringsinitiativ (viktade efter Safety, Quality, Delivery, Cost) och Project A3 med 5-Why och Project Tasks.',
    action: 'Klicka på ett initiativ eller Project A3 i tabellen. Viktigt: 100 % klara projekttasks bevisar genomförd aktivitet — INTE att KPI-målet är uppnått.',
    roleTip: 'Avdelningschefer och ledning driver initiativ/A3; Basic user (Team Leader) kan checka av sina egna tasks.',
  },
  {
    id: 'tour-daily',
    chapterId: 7,
    route: 'daily',
    selector: '[data-tour="daily-tiers"]',
    title: 'Daily Management Board (Tier 1–3)',
    why: 'Kopplar det dagliga pulsmötet direkt till strategin via Safety Cross, Live KPI-kort, Kanban-avvikelser och eskalering från Tier 1 → Tier 2 → Tier 3.',
    action: 'Växla mellan Tier 1 · Team Pulse, Tier 2 · Site Scorecard och Tier 3 · Obeya. Klicka i Safety Cross för att logga dagens status.',
    roleTip: 'Här arbetar Basic user och Team Leader varje morgon tillsammans med produktionsledning.',
  },
  {
    id: 'tour-myfocus',
    chapterId: 7,
    route: 'myfocus',
    selector: '[data-tour="myfocus-header"]',
    title: 'My Focus (Personal Obeya)',
    why: 'Samlar dina egna mål, projektuppgifter, Pulse Cards och PDCA-beslut på en enda fokuserad vy så inget faller mellan stolarna.',
    action: 'Välj din roll/namn i ägarfiltret (t.ex. Production Manager eller Team Leader) för att se din personliga att-göra-lista.',
    roleTip: 'Öppen för alla roller och perfekt som personlig startsida före morgonmötet.',
  },
  {
    id: 'tour-kpis',
    chapterId: 8,
    route: 'kpis',
    selector: '[data-tour="kpi-bowling"]',
    title: 'KPIs & 12-Month Bowling Chart',
    why: 'Mäter verkligt utfall månad för månad mot måltal och tolerans. Här avgörs om målet faktiskt är On track, At risk eller Off track.',
    action: 'Klicka direkt på valfri månadscell (Jan–Dec) i Bowling Chart för att uppdatera Target eller Actual, eller använd CSV KPI Import.',
    roleTip: 'Röda KPI-utfall (Off track) eller 2+ månader i rad med At risk triggar automatiskt en signal till PDCA-kön.',
  },
  {
    id: 'tour-pdca',
    chapterId: 9,
    route: 'reviews',
    selector: '[data-tour="pdca-queue"]',
    title: 'PDCA Reviews & Exception Queue',
    why: 'Säkerställer att röda KPI:er och eskalerade problem blir analyserade och omvandlade till formella PDCA-beslut med ansvarig och datum.',
    action: 'Skilj mellan automatiska KPI-varningar i Exception Queue och formellt öppnade PDCA Review-protokoll nedanför.',
    roleTip: 'Chefer, QMS auditor och Administrator skapar PDCA Reviews och stänger beslut när effekten verifierats.',
  },
  {
    id: 'tour-iso',
    chapterId: 10,
    route: 'iso',
    selector: '[data-tour="iso-table"]',
    title: 'ISO Compliance (9001 · 14001 · 45001)',
    why: 'Visar vilka mål som uppfyller ISO 6.2-planeringsfälten och vilka som har kopplade risk-, process- och dokumentreferenser.',
    action: 'Klicka på ett mål i tabellen för att komplettera saknade fält. Kom ihåg: ISO Ready visar planeringskompletthet — inte verifierad revisionsefterlevnad.',
    roleTip: 'Tillgänglig för alla roller utom Basic user.',
    skipForBasic: true,
  },
  {
    id: 'tour-evidence',
    chapterId: 10,
    route: 'evidence',
    selector: '[data-tour="evidence-actions"]',
    title: 'Audit Evidence Pack & Management Review',
    why: 'Samlar mål, ISO-krav, 6.2-plan, KPI-utfall, godkännanden och PDCA-beslut i ett revisionsklart bevispaket som kan exporteras eller skrivas ut.',
    action: 'Använd filtret för att välja alla mål eller ett enskilt mål, och exportera JSON eller klicka Print Report inför intern/extern revision.',
    roleTip: 'Komplettera med Management Review (ISO 9.3) vid ledningens genomgång.',
    skipForBasic: true,
  },
];

const PROGRESS_STORAGE_KEY = 'safeqms_sop_training_v2';

export interface TrainingProgress {
  completedChapters: number[];
  chapterChecks: Record<string, boolean>;
  lastChapter: number;
  lastTourStepId: string | null;
  completedTourStepIds: string[];
}

const DEFAULT_PROGRESS: TrainingProgress = {
  completedChapters: [],
  chapterChecks: {},
  lastChapter: 1,
  lastTourStepId: null,
  completedTourStepIds: [],
};

function loadProgress(): TrainingProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      completedChapters: Array.isArray(parsed.completedChapters) ? parsed.completedChapters : [],
      chapterChecks: parsed.chapterChecks && typeof parsed.chapterChecks === 'object' ? parsed.chapterChecks : {},
      lastChapter: typeof parsed.lastChapter === 'number' ? parsed.lastChapter : 1,
      lastTourStepId: typeof parsed.lastTourStepId === 'string' ? parsed.lastTourStepId : null,
      completedTourStepIds: Array.isArray(parsed.completedTourStepIds) ? parsed.completedTourStepIds : [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveProgress(p: TrainingProgress) {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore storage quota errors
  }
}

export function getRoleTourSteps(role: SafeQmsRole): WalkthroughStep[] {
  const isBasic = role === 'Basic user';
  return ALL_WALKTHROUGH_STEPS.filter((s) => !(isBasic && s.skipForBasic));
}

export interface OnboardingGuideBanner {
  step: number;
  total: number;
  title: string;
  instruction: string;
}

interface WalkthroughContextValue {
  isActive: boolean;
  tourMode: 'full' | 'chapter';
  steps: WalkthroughStep[];
  currentIndex: number;
  currentStep: WalkthroughStep | null;
  progress: TrainingProgress;
  onboardingBanner: OnboardingGuideBanner | null;
  setOnboardingBanner: (banner: OnboardingGuideBanner | null) => void;
  startFullTour: (resume?: boolean) => void;
  startChapterTour: (chapterId: number) => boolean;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  exitTour: (returnToSop?: boolean) => void;
  setLastChapter: (chapterId: number) => void;
  toggleChapterCheck: (checkId: string, chapterId: number, allChapterCheckIds: string[]) => void;
  toggleChapterComplete: (chapterId: number, allChapterCheckIds: string[]) => void;
  resetTrainingProgress: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) throw new Error('useWalkthrough must be used inside WalkthroughProvider');
  return ctx;
}

export const WalkthroughProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeRole, navigate, toast } = useWorkspace();
  const [progress, setProgress] = useState<TrainingProgress>(loadProgress);
  const [isActive, setIsActive] = useState(false);
  const [tourMode, setTourMode] = useState<'full' | 'chapter'>('full');
  const [activeSteps, setActiveSteps] = useState<WalkthroughStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onboardingBanner, setOnboardingBanner] = useState<OnboardingGuideBanner | null>(null);

  const persist = useCallback((updater: (prev: TrainingProgress) => TrainingProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveProgress(next);
      return next;
    });
  }, []);

  const roleSteps = useMemo(() => getRoleTourSteps(activeRole), [activeRole]);

  // Keep active tour steps aligned with role if admin switches Role Preview mid-tour
  useEffect(() => {
    if (!isActive) return;
    const currentId = activeSteps[currentIndex]?.id;
    const filtered = activeSteps.filter((s) => !(activeRole === 'Basic user' && s.skipForBasic));
    if (filtered.length === 0) {
      setIsActive(false);
      return;
    }
    if (filtered.length !== activeSteps.length) {
      setActiveSteps(filtered);
      const nextIdx = Math.max(0, filtered.findIndex((s) => s.id === currentId));
      setCurrentIndex(nextIdx);
    }
  }, [activeRole, isActive, activeSteps, currentIndex]);

  const currentStep = isActive ? activeSteps[currentIndex] || null : null;

  const goToStep = useCallback(
    (stepsList: WalkthroughStep[], idx: number) => {
      const step = stepsList[idx];
      if (!step) return;
      setCurrentIndex(idx);
      navigate(step.route);
      persist((prev) => ({
        ...prev,
        lastChapter: step.chapterId,
        lastTourStepId: step.id,
      }));
    },
    [navigate, persist]
  );

  const startFullTour = useCallback(
    (resume = false) => {
      if (roleSteps.length === 0) return;
      let startIdx = 0;
      if (resume && progress.lastTourStepId) {
        const found = roleSteps.findIndex((s) => s.id === progress.lastTourStepId);
        if (found >= 0) startIdx = found;
      }
      setTourMode('full');
      setActiveSteps(roleSteps);
      setIsActive(true);
      goToStep(roleSteps, startIdx);
    },
    [roleSteps, progress.lastTourStepId, goToStep]
  );

  const startChapterTour = useCallback(
    (chapterId: number): boolean => {
      const chSteps = roleSteps.filter((s) => s.chapterId === chapterId);
      if (chSteps.length === 0) {
        toast('Det här kapitlets moduler är låsta för din aktiva roll — läs kapitlets översikt här i guiden.', 'info');
        return false;
      }
      setTourMode('chapter');
      setActiveSteps(chSteps);
      setIsActive(true);
      goToStep(chSteps, 0);
      return true;
    },
    [roleSteps, goToStep, toast]
  );

  const markStepVisited = useCallback(
    (stepId: string) => {
      persist((prev) => {
        if (prev.completedTourStepIds.includes(stepId)) return prev;
        return {
          ...prev,
          completedTourStepIds: [...prev.completedTourStepIds, stepId],
        };
      });
    },
    [persist]
  );

  const exitTour = useCallback(
    (returnToSop = false) => {
      const lastCh = currentStep?.chapterId;
      setIsActive(false);
      if (returnToSop) {
        navigate('sop', lastCh ? `chapter-${lastCh}` : undefined);
      }
    },
    [currentStep?.chapterId, navigate]
  );

  const nextStep = useCallback(() => {
    if (!currentStep) return;
    markStepVisited(currentStep.id);
    if (currentIndex + 1 < activeSteps.length) {
      goToStep(activeSteps, currentIndex + 1);
    } else {
      setIsActive(false);
      toast('Guidad genomgång slutförd! Din progress är sparad.', 'success');
      navigate('sop', `chapter-${currentStep.chapterId}`);
    }
  }, [currentStep, markStepVisited, currentIndex, activeSteps, goToStep, toast, navigate]);

  const prevStep = useCallback(() => {
    if (currentIndex > 0) {
      goToStep(activeSteps, currentIndex - 1);
    }
  }, [currentIndex, activeSteps, goToStep]);

  const skipStep = useCallback(() => {
    if (currentIndex + 1 < activeSteps.length) {
      goToStep(activeSteps, currentIndex + 1);
    } else {
      exitTour(true);
    }
  }, [currentIndex, activeSteps, goToStep, exitTour]);

  const setLastChapter = useCallback(
    (chapterId: number) => {
      persist((prev) => (prev.lastChapter === chapterId ? prev : { ...prev, lastChapter: chapterId }));
    },
    [persist]
  );

  const toggleChapterCheck = useCallback(
    (checkId: string, chapterId: number, allChapterCheckIds: string[]) => {
      persist((prev) => {
        const nextChecks = { ...prev.chapterChecks, [checkId]: !prev.chapterChecks[checkId] };
        const allDone = allChapterCheckIds.length > 0 && allChapterCheckIds.every((id) => nextChecks[id]);
        const completed = new Set(prev.completedChapters);
        if (allDone) completed.add(chapterId);
        else completed.delete(chapterId);
        return {
          ...prev,
          chapterChecks: nextChecks,
          completedChapters: [...completed].sort((a, b) => a - b),
          lastChapter: chapterId,
        };
      });
    },
    [persist]
  );

  const toggleChapterComplete = useCallback(
    (chapterId: number, allChapterCheckIds: string[]) => {
      persist((prev) => {
        const isDone = prev.completedChapters.includes(chapterId);
        const nextChecks = { ...prev.chapterChecks };
        for (const cid of allChapterCheckIds) {
          nextChecks[cid] = !isDone;
        }
        const completed = new Set(prev.completedChapters);
        if (isDone) completed.delete(chapterId);
        else completed.add(chapterId);
        return {
          ...prev,
          chapterChecks: nextChecks,
          completedChapters: [...completed].sort((a, b) => a - b),
          lastChapter: chapterId,
        };
      });
    },
    [persist]
  );

  const resetTrainingProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    saveProgress(DEFAULT_PROGRESS);
    toast('Utbildningsprogress har nollställts.', 'info');
  }, [toast]);

  const value = useMemo<WalkthroughContextValue>(
    () => ({
      isActive,
      tourMode,
      steps: activeSteps,
      currentIndex,
      currentStep,
      progress,
      onboardingBanner,
      setOnboardingBanner,
      startFullTour,
      startChapterTour,
      nextStep,
      prevStep,
      skipStep,
      exitTour,
      setLastChapter,
      toggleChapterCheck,
      toggleChapterComplete,
      resetTrainingProgress,
    }),
    [
      isActive,
      tourMode,
      activeSteps,
      currentIndex,
      currentStep,
      progress,
      onboardingBanner,
      startFullTour,
      startChapterTour,
      nextStep,
      prevStep,
      skipStep,
      exitTour,
      setLastChapter,
      toggleChapterCheck,
      toggleChapterComplete,
      resetTrainingProgress,
    ]
  );

  return <WalkthroughContext.Provider value={value}>{children}</WalkthroughContext.Provider>;
};
