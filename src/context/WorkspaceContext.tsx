import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  stripUndefined,
  testConnection,
  toValidDocId,
} from '../lib/firebase';
import {
  ALL_SCOPES,
  ASSIGNED_DEPARTMENT,
  ASSIGNED_SITE,
  AppRoute,
  CatchballThread,
  EscalatedBlocker,
  EscalationTier,
  FiveWhyStep,
  GoalApproval,
  Initiative,
  IsoStandard,
  KpiMetric,
  KpiOwnerLink,
  MatrixRelation,
  PdcaReview,
  ProjectA3,
  ProjectTask,
  PulseCard,
  RouteGroup,
  SAFEQMS_ROLES,
  SafeQmsRole,
  SafetyCrossMonth,
  SafetyDayState,
  StrategicGoal,
  StrategyPlan,
  UserProfile,
  WorkspaceActivity,
  WorkspaceDoc,
  WorkspaceMember,
} from '../types/safeqms';
import {
  DomainSnapshot,
  ParsedCsvRecord,
  blockerTargetInfo,
  cbCanAct,
  cbTurn,
  computeKpiStatus,
  computeUpdatedKpiTargets,
  goalById,
  goalPlanCheck,
  initById,
  initiativeLinkedToGoal,
  isLimitedRole,
  isoName,
  isoShort,
  kpiById,
  leadershipRole,
  managementSummary,
  permittedParents,
  roleCan,
  visibleToRole,
} from '../domain/syncEngine';
import { ISO_EXAMPLE_CATALOG, createSeedDataset } from '../domain/seedData';

export interface ModalConfig {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'prompt' | 'counter' | 'escalate' | 'pdcaDecision';
  title: string;
  message: string;
  items?: string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  isNumber?: boolean;
  counterTarget?: number;
  counterResources?: string;
  itemLabel?: string;
  defaultCategory?: string;
  defaultSeverity?: string;
  reviewsList?: { id: string; label: string }[];
  defaultReviewId?: string;
  defaultOwner?: string;
  defaultDue?: string;
  resolve?: (value: any) => void;
}

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'info' | 'success' | 'error';
}

const ROUTE_GROUP_MAP: Record<AppRoute, RouteGroup> = {
  overview: 'overview',
  daily: 'daily',
  myfocus: 'daily',
  pillars: 'strategy',
  cascade: 'strategy',
  matrix: 'strategy',
  a3: 'strategy',
  goal: 'strategy',
  newgoal: 'strategy',
  projects: 'execution',
  initiative: 'execution',
  newinitiative: 'execution',
  project: 'execution',
  kpis: 'performance',
  import: 'performance',
  catchball: 'alignment',
  catchballnew: 'alignment',
  catchballitem: 'alignment',
  reviews: 'alignment',
  newreview: 'alignment',
  review: 'alignment',
  approvals: 'alignment',
  iso: 'compliance',
  evidence: 'compliance',
  management: 'compliance',
  settings: 'settings',
};

const ALL_SUBCOLLECTIONS = [
  'members',
  'plans',
  'goals',
  'kpis',
  'initiatives',
  'projects',
  'tasks',
  'relations',
  'kpiOwners',
  'pulseCards',
  'safetyCross',
  'blockers',
  'reviews',
  'catchballs',
  'approvals',
  'activities',
] as const;

function nextCode(ids: string[], prefix: string): string {
  const max = Math.max(0, ...ids.map((id) => Number(String(id).split('-')[1]) || 0));
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

async function commitBatchedOps(ops: Array<(batch: ReturnType<typeof writeBatch>) => void>) {
  const chunkSize = 380;
  for (let i = 0; i < ops.length; i += chunkSize) {
    const batch = writeBatch(db);
    const slice = ops.slice(i, i + chunkSize);
    for (const op of slice) op(batch);
    await batch.commit();
  }
}

interface WorkspaceContextValue {
  // Auth & Boot
  authReady: boolean;
  user: User | null;
  userProfile: UserProfile | null;
  loadingWorkspace: boolean;
  firestoreError: string | null;
  clearFirestoreError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;

  // Workspaces
  workspaces: WorkspaceDoc[];
  activeWorkspace: WorkspaceDoc | null;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  seedOrResetWorkspace: () => Promise<void>;
  retryWorkspaceSetup: () => Promise<void>;

  // Theme & Navigation
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  route: AppRoute;
  routeId: string;
  routeGroup: RouteGroup;
  navigate: (route: AppRoute, id?: string) => void;

  // Scope, Year, Role
  scope: string;
  year: string;
  setScope: (scope: string) => Promise<void>;
  setYear: (year: string) => Promise<void>;
  actualRole: SafeQmsRole;
  activeRole: SafeQmsRole;
  isActualAdmin: boolean;
  setPreviewRole: (role: SafeQmsRole) => void;
  myFocusOwner: string;
  setMyFocusOwner: (owner: string) => void;

  // Domain Collections
  members: WorkspaceMember[];
  plans: StrategyPlan[];
  goals: StrategicGoal[];
  kpis: KpiMetric[];
  initiatives: Initiative[];
  projects: ProjectA3[];
  tasks: ProjectTask[];
  relations: MatrixRelation[];
  kpiOwners: KpiOwnerLink[];
  pulseCards: PulseCard[];
  safetyCross: SafetyCrossMonth[];
  blockers: EscalatedBlocker[];
  reviews: PdcaReview[];
  catchballs: CatchballThread[];
  approvals: GoalApproval[];
  activities: WorkspaceActivity[];
  isoStandards: IsoStandard[];
  isoCatalogSource: string;
  domainSnapshot: DomainSnapshot;

  // Daily UI selection helpers
  dailyTier: 'tier1' | 'tier2' | 'tier3';
  setDailyTier: (t: 'tier1' | 'tier2' | 'tier3') => void;
  safetyMonth: string;
  setSafetyMonth: (m: string) => void;

  // Toast & Modal
  toasts: ToastMessage[];
  toast: (text: string, tone?: 'info' | 'success' | 'error') => void;
  modal: ModalConfig;
  showModal: (cfg: Omit<ModalConfig, 'isOpen' | 'resolve'>) => Promise<any>;
  closeModal: (result: any) => void;

  // Domain Mutations
  saveGoal: (id: string | undefined, data: Partial<StrategicGoal>) => Promise<string | null>;
  submitGoal: (id: string) => Promise<void>;
  decideApproval: (approvalId: string, status: 'Approved' | 'Changes requested') => Promise<void>;
  revisePlan: (planId: string) => Promise<void>;
  recordKpiActual: (kpiId: string) => Promise<void>;
  commitCsvImport: (records: ParsedCsvRecord[]) => Promise<boolean>;
  cycleMatrixRelation: (from: string, to: string) => Promise<void>;
  editMatrixNote: (from: string, to: string) => Promise<void>;
  cycleKpiOwner: (kpiId: string, ownerName: string) => Promise<void>;
  editKpiOwnerNote: (kpiId: string, ownerName: string) => Promise<void>;
  createInitiative: (data: Omit<Initiative, 'id' | 'workspaceId' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateInitiativeFocus: (id: string, patch: Pick<Initiative, 'progress' | 'status' | 'valueStream' | 'isBottleneck' | 'sqdc'>) => Promise<void>;
  saveProjectA3: (
    id: string,
    patch: {
      escalationTier: EscalationTier;
      problem: string;
      current: string;
      target: string;
      root: string;
      fiveWhys: FiveWhyStep[];
      counter: string;
      learning: string;
    }
  ) => Promise<void>;
  addProjectTask: (projectId: string, title?: string, owner?: string, due?: string) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  createPulseCard: (input: { title: string; routeType: PulseCard['routeType']; kpi: string; owner: string; details?: string; due?: string }) => Promise<void>;
  savePulseCardDetails: (cardId: string, patch: { title: string; details: string; due: string; routeType: PulseCard['routeType']; kpi: string }) => Promise<void>;
  movePulseCardStatus: (cardId: string, nextStatus: PulseCard['status']) => Promise<void>;
  togglePulseCardDone: (cardId: string) => Promise<void>;
  escalatePulseCard: (cardId: string) => Promise<void>;
  delegatePulseCard: (cardId: string, scope: string, owner: string, note: string) => Promise<void>;
  addPulseCardComment: (cardId: string, text: string) => Promise<void>;
  toggleSafetyDay: (scopeKey: string, month: string, day: number) => Promise<void>;
  escalateBlocker: (targetType: EscalatedBlocker['targetType'], targetId: string) => Promise<void>;
  resolveBlocker: (blockerId: string) => Promise<void>;
  reopenBlocker: (blockerId: string) => Promise<void>;
  convertToPdcaDecision: (blockerId: string, targetType: string, targetId: string, fixedReviewId?: string) => Promise<string | null>;
  createReview: (input: { title: string; date: string; scope: string; notes: string }) => Promise<string | null>;
  toggleDecision: (reviewId: string, idx: number) => Promise<void>;
  addDecision: (reviewId: string, decision: { text: string; owner: string; due: string }) => Promise<void>;
  prepareManagementReview: () => Promise<string | null>;
  createCatchball: (input: { goalId: string; target: number; resources: string; due: string; reason: string; recipientScope: string }) => Promise<string | null>;
  commentCatchball: (id: string, message: string) => Promise<void>;
  sendCatchball: (id: string) => Promise<void>;
  counterCatchball: (id: string) => Promise<void>;
  alignCatchball: (id: string) => Promise<void>;
  requestChangesCatchball: (id: string) => Promise<void>;
  submitCatchballForApproval: (id: string) => Promise<void>;
  decideCatchballApproval: (approvalId: string, decision: 'Approved' | 'Changes requested') => Promise<void>;
  markActivityRead: (activityId: string) => Promise<void>;
  importIsoCatalog: (standards: IsoStandard[], sourceLabel: string) => Promise<void>;
  restoreDemoIso: () => Promise<void>;
  addTeamMember: (uid: string, displayName: string, safeqmsRole: SafeQmsRole, assignedSite: string, assignedDepartment: string) => Promise<void>;
  updateTeamMember: (uid: string, patch: { displayName: string; safeqmsRole: SafeQmsRole; assignedSite: string; assignedDepartment: string }) => Promise<void>;
  removeTeamMember: (uid: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}

function parseHashRoute(): { route: AppRoute; routeId: string } {
  const raw = (window.location.hash.replace(/^#/, '') || 'overview').split('/');
  const routeName = (raw[0] || 'overview') as AppRoute;
  const aliases: Record<string, AppRoute> = {
    strategy: 'pillars',
    execution: 'projects',
    performance: 'kpis',
    alignment: 'reviews',
    compliance: 'iso',
  };
  const resolved = aliases[routeName] || routeName;
  const valid = resolved in ROUTE_GROUP_MAP ? resolved : 'overview';
  return { route: valid, routeId: raw[1] ? decodeURIComponent(raw[1]) : '' };
}

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<WorkspaceDoc[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('');

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [plans, setPlans] = useState<StrategyPlan[]>([]);
  const [goals, setGoals] = useState<StrategicGoal[]>([]);
  const [kpis, setKpis] = useState<KpiMetric[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [projects, setProjects] = useState<ProjectA3[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [relations, setRelations] = useState<MatrixRelation[]>([]);
  const [kpiOwners, setKpiOwners] = useState<KpiOwnerLink[]>([]);
  const [pulseCards, setPulseCards] = useState<PulseCard[]>([]);
  const [safetyCross, setSafetyCross] = useState<SafetyCrossMonth[]>([]);
  const [blockers, setBlockers] = useState<EscalatedBlocker[]>([]);
  const [reviews, setReviews] = useState<PdcaReview[]>([]);
  const [catchballs, setCatchballs] = useState<CatchballThread[]>([]);
  const [approvals, setApprovals] = useState<GoalApproval[]>([]);
  const [activities, setActivities] = useState<WorkspaceActivity[]>([]);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('safeqms_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [navState, setNavState] = useState<{ route: AppRoute; routeId: string }>(parseHashRoute);
  const [previewRole, setPreviewRoleState] = useState<SafeQmsRole | null>(null);
  const [localScope, setLocalScope] = useState<string>('');
  const [localYear, setLocalYear] = useState<string>('');
  const [myFocusOwner, setMyFocusOwner] = useState<string>('');
  const [dailyTier, setDailyTier] = useState<'tier1' | 'tier2' | 'tier3'>('tier1');
  const [safetyMonth, setSafetyMonth] = useState<string>('2027-07');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastCounter = useRef(1);
  const [modal, setModal] = useState<ModalConfig>({ isOpen: false, type: 'alert', title: '', message: '' });

  const today = new Date().toISOString().slice(0, 10);

  const toast = useCallback((text: string, tone: 'info' | 'success' | 'error' = 'info') => {
    const id = toastCounter.current++;
    setToasts((prev) => [...prev.slice(-3), { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const showModal = useCallback((cfg: Omit<ModalConfig, 'isOpen' | 'resolve'>): Promise<any> => {
    return new Promise<any>((resolve) => {
      setModal({ ...cfg, isOpen: true, resolve });
    });
  }, []);

  const closeModal = useCallback((result: any) => {
    setModal((prev) => {
      if (prev.resolve) prev.resolve(result);
      return { ...prev, isOpen: false, resolve: undefined };
    });
  }, []);

  // Theme sync
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem('safeqms_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Hash navigation
  useEffect(() => {
    const onHash = () => setNavState(parseHashRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((r: AppRoute, id?: string) => {
    const targetHash = id ? `#${r}/${encodeURIComponent(id)}` : `#${r}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setNavState({ route: r, routeId: id || '' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const seedWorkspaceIntoFirestore = useCallback(
    async (
      wsId: string,
      ownerUid: string,
      ownerName: string,
      wsName?: string,
      memberUids?: string[],
      mode: 'create' | 'reset' = 'create'
    ) => {
      const ds = createSeedDataset(wsId, ownerUid, ownerName, wsName, memberUids);
      const wsRef = doc(db, 'workspaces', wsId);
      const wsSnap = await getDoc(wsRef);

      // Step 1: Ensure parent workspace document exists in Firestore BEFORE any subcollection writes
      // (Firestore security rules check wsExists(workspaceId) / wsData(workspaceId) against committed docs).
      if (!wsSnap.exists()) {
        await setDoc(wsRef, {
          ...stripUndefined(ds.workspace),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(wsRef, {
          name: ds.workspace.name,
          scope: ds.workspace.scope,
          year: ds.workspace.year,
          isoCatalogSource: ds.workspace.isoCatalogSource,
          isoStandards: ds.workspace.isoStandards,
          updatedAt: serverTimestamp(),
        });
      }

      // Step 2: Ensure owner member record exists with Administratör role BEFORE seeding data collections
      const ownerMemberRef = doc(db, 'workspaces', wsId, 'members', ds.ownerMember.uid);
      const ownerMemberSnap = await getDoc(ownerMemberRef);
      if (!ownerMemberSnap.exists()) {
        await setDoc(ownerMemberRef, {
          ...stripUndefined(ds.ownerMember),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Step 3: Commit all 15 subcollections now that parent workspace & admin member exist
      const ops: Array<(batch: ReturnType<typeof writeBatch>) => void> = [];
      const existingBySub = new Map<string, Set<string>>();

      if (mode === 'reset') {
        const subNames = [
          'plans',
          'goals',
          'kpis',
          'initiatives',
          'projects',
          'tasks',
          'relations',
          'kpiOwners',
          'pulseCards',
          'safetyCross',
          'blockers',
          'reviews',
          'catchballs',
          'approvals',
          'activities',
        ] as const;
        await Promise.all(
          subNames.map(async (sub) => {
            const snap = await getDocs(collection(db, 'workspaces', wsId, sub));
            existingBySub.set(sub, new Set(snap.docs.map((d) => d.id)));
          })
        );
      }

      const enqueue = (sub: string, arr: any[], idKey = 'id') => {
        const existingIds = existingBySub.get(sub);
        for (const item of arr) {
          const docId = toValidDocId(String(item[idKey]));
          const docRef = doc(db, 'workspaces', wsId, sub, docId);
          if (existingIds?.has(docId)) {
            if (sub === 'activities') continue;
            const cleaned = stripUndefined({ ...item });
            delete cleaned.id;
            delete cleaned.workspaceId;
            delete cleaned.ownerUid;
            ops.push((b) =>
              b.update(docRef, {
                ...cleaned,
                updatedAt: serverTimestamp(),
              })
            );
          } else {
            ops.push((b) =>
              b.set(docRef, {
                ...stripUndefined(item),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
            );
          }
        }
      };

      enqueue('plans', ds.plans);
      enqueue('goals', ds.goals);
      enqueue('kpis', ds.kpis);
      enqueue('initiatives', ds.initiatives);
      enqueue('projects', ds.projects);
      enqueue('tasks', ds.tasks);
      enqueue('relations', ds.relations);
      enqueue('kpiOwners', ds.kpiOwners);
      enqueue('pulseCards', ds.pulseCards);
      enqueue('safetyCross', ds.safetyCross);
      enqueue('blockers', ds.blockers);
      enqueue('reviews', ds.reviews);
      enqueue('catchballs', ds.catchballs);
      enqueue('approvals', ds.approvals);
      enqueue('activities', ds.activities);

      if (ops.length > 0) {
        await commitBatchedOps(ops);
      }
    },
    []
  );

  const initializeWorkspaceForUser = useCallback(
    async (fbUser: User) => {
      setLoadingWorkspace(true);
      setFirestoreError(null);
      try {
        await testConnection();
        const userRef = doc(db, 'users', fbUser.uid);
        const userSnap = await getDoc(userRef);
        const displayName =
          (fbUser.displayName || fbUser.email?.split('@')[0] || 'SafeQMS User').trim().slice(0, 120) || 'SafeQMS User';
        const email = (fbUser.email || 'user@safeqms.local').trim().slice(0, 200);
        const isBootstrappedEmail = Boolean(
          fbUser.email && fbUser.email.toLowerCase() === 'ibrahim.qallaki@gmail.com' && fbUser.emailVerified
        );

        let profile: UserProfile;
        if (!userSnap.exists()) {
          const createdProfile = {
            uid: fbUser.uid,
            email,
            displayName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, createdProfile);
          profile = { uid: fbUser.uid, email, displayName };
        } else {
          profile = userSnap.data() as UserProfile;
          if (profile.displayName !== displayName) {
            await updateDoc(userRef, { displayName, updatedAt: serverTimestamp() });
            profile = { ...profile, displayName };
          }
        }
        setUserProfile(profile);

        // Discover workspaces this user is a member of
        const wsQuery = query(collection(db, 'workspaces'), where('memberUids', 'array-contains', fbUser.uid));
        const wsSnap = await getDocs(wsQuery);
        let list = wsSnap.docs.map((d) => d.data() as WorkspaceDoc);

        if (list.length === 0) {
          const newWsId = toValidDocId(`ws_${fbUser.uid.slice(0, 14)}`);
          await seedWorkspaceIntoFirestore(newWsId, fbUser.uid, displayName, undefined, undefined, 'create');
          await updateDoc(userRef, { defaultWorkspaceId: newWsId, updatedAt: serverTimestamp() });
          const createdSnap = await getDoc(doc(db, 'workspaces', newWsId));
          if (createdSnap.exists()) {
            list = [createdSnap.data() as WorkspaceDoc];
          }
        }

        const preferred =
          (profile.defaultWorkspaceId && list.find((w) => w.id === profile.defaultWorkspaceId)?.id) ||
          list[0]?.id ||
          '';

        // Self-heal owner/bootstrapped admin membership doc if missing
        const preferredWs = list.find((w) => w.id === preferred);
        if (preferredWs && (preferredWs.ownerUid === fbUser.uid || isBootstrappedEmail)) {
          const memRef = doc(db, 'workspaces', preferredWs.id, 'members', fbUser.uid);
          const memSnap = await getDoc(memRef);
          if (!memSnap.exists()) {
            await setDoc(memRef, {
              uid: fbUser.uid,
              workspaceId: preferredWs.id,
              ownerUid: preferredWs.ownerUid,
              memberUids: preferredWs.memberUids?.length ? preferredWs.memberUids : [fbUser.uid],
              displayName,
              safeqmsRole: 'Administratör',
              assignedSite: ASSIGNED_SITE,
              assignedDepartment: ASSIGNED_DEPARTMENT,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else if (isBootstrappedEmail && (memSnap.data() as WorkspaceMember).safeqmsRole !== 'Administratör') {
            await updateDoc(memRef, {
              safeqmsRole: 'Administratör',
              updatedAt: serverTimestamp(),
            });
          }
        }

        setWorkspaces(list);
        setActiveWorkspaceId(preferred);
      } catch (err) {
        setFirestoreError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoadingWorkspace(false);
        setAuthReady(true);
      }
    },
    [seedWorkspaceIntoFirestore]
  );

  // Firebase Auth listener & initial profile/workspace discovery
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (!fbUser) {
        setUserProfile(null);
        setWorkspaces([]);
        setActiveWorkspaceId('');
        setFirestoreError(null);
        setAuthReady(true);
        return;
      }
      await initializeWorkspaceForUser(fbUser);
    });
    return () => unsub();
  }, [initializeWorkspaceForUser]);

  const retryWorkspaceSetup = useCallback(async () => {
    if (!user) return;
    await initializeWorkspaceForUser(user);
  }, [user, initializeWorkspaceForUser]);

  // Real-time workspace & subcollection listeners (gated behind authReady && user && activeWorkspaceId)
  useEffect(() => {
    if (!authReady || !user || !activeWorkspaceId) return;

    const unsubs: Array<() => void> = [];
    const uid = user.uid;

    // Watch active workspace doc + all user workspaces
    unsubs.push(
      onSnapshot(
        query(collection(db, 'workspaces'), where('memberUids', 'array-contains', uid)),
        (snap) => {
          setWorkspaces(snap.docs.map((d) => d.data() as WorkspaceDoc));
        },
        (err) => {
          setFirestoreError(err.message);
        }
      )
    );

    const watchSub = <T,>(sub: string, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
      const q = query(collection(db, 'workspaces', activeWorkspaceId, sub), where('memberUids', 'array-contains', uid));
      const u = onSnapshot(
        q,
        (snap) => {
          setter(snap.docs.map((d) => d.data() as T));
        },
        (err) => {
          setFirestoreError(`${sub}: ${err.message}`);
        }
      );
      unsubs.push(u);
    };

    watchSub<WorkspaceMember>('members', setMembers);
    watchSub<StrategyPlan>('plans', setPlans);
    watchSub<StrategicGoal>('goals', setGoals);
    watchSub<KpiMetric>('kpis', setKpis);
    watchSub<Initiative>('initiatives', setInitiatives);
    watchSub<ProjectA3>('projects', setProjects);
    watchSub<ProjectTask>('tasks', setTasks);
    watchSub<MatrixRelation>('relations', setRelations);
    watchSub<KpiOwnerLink>('kpiOwners', setKpiOwners);
    watchSub<PulseCard>('pulseCards', setPulseCards);
    watchSub<SafetyCrossMonth>('safetyCross', setSafetyCross);
    watchSub<EscalatedBlocker>('blockers', setBlockers);
    watchSub<PdcaReview>('reviews', setReviews);
    watchSub<CatchballThread>('catchballs', setCatchballs);
    watchSub<GoalApproval>('approvals', setApprovals);
    watchSub<WorkspaceActivity>('activities', setActivities);

    return () => {
      for (const u of unsubs) u();
    };
  }, [authReady, user, activeWorkspaceId]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  );

  const isBootstrappedAdminEmail = Boolean(
    user?.email && user.email.toLowerCase() === 'ibrahim.qallaki@gmail.com' && user.emailVerified
  );

  const actualRole: SafeQmsRole = useMemo(() => {
    if (!user) return 'Basic user';
    if (isBootstrappedAdminEmail) return 'Administratör';
    if (!activeWorkspace) return 'Basic user';
    const member = members.find((m) => m.uid === user.uid);
    if (member) return member.safeqmsRole;
    if (activeWorkspace.ownerUid === user.uid) return 'Administratör';
    return 'Basic user';
  }, [user, isBootstrappedAdminEmail, activeWorkspace, members]);

  const isActualAdmin =
    actualRole === 'Administratör' ||
    isBootstrappedAdminEmail ||
    Boolean(user && activeWorkspace?.ownerUid === user.uid);
  const activeRole: SafeQmsRole = isActualAdmin && previewRole ? previewRole : actualRole;

  const scope = useMemo(() => {
    const candidate = localScope || activeWorkspace?.scope || 'Site: Uppsala';
    if (isLimitedRole(activeRole) && !['Organization', ASSIGNED_SITE, ASSIGNED_DEPARTMENT].includes(candidate)) {
      return ASSIGNED_DEPARTMENT;
    }
    return ALL_SCOPES.includes(candidate) ? candidate : 'Site: Uppsala';
  }, [localScope, activeWorkspace?.scope, activeRole]);

  const year = localYear || activeWorkspace?.year || '2027';

  const isoStandards = useMemo(
    () => (activeWorkspace?.isoStandards?.length ? activeWorkspace.isoStandards : ISO_EXAMPLE_CATALOG),
    [activeWorkspace?.isoStandards]
  );

  const isoCatalogSource = activeWorkspace?.isoCatalogSource || 'SafeQMS ISO Standards Registry';

  const domainSnapshot: DomainSnapshot = useMemo(
    () => ({
      scope,
      year,
      activeRole,
      goals,
      kpis,
      initiatives,
      projects,
      tasks,
      relations,
      kpiOwners,
      blockers,
      reviews,
      catchballs,
      approvals,
      isoStandards,
      isoCatalogSource,
      activities,
    }),
    [
      scope,
      year,
      activeRole,
      goals,
      kpis,
      initiatives,
      projects,
      tasks,
      relations,
      kpiOwners,
      blockers,
      reviews,
      catchballs,
      approvals,
      isoStandards,
      isoCatalogSource,
      activities,
    ]
  );

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast('Signed in with Google', 'success');
    } catch (err: any) {
      toast(err?.message || 'Google sign-in failed', 'error');
    }
  }, [toast]);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
    setPreviewRoleState(null);
    navigate('overview');
  }, [navigate]);

  const baseFields = useCallback(
    () => ({
      workspaceId: activeWorkspaceId,
      ownerUid: activeWorkspace?.ownerUid || user?.uid || '',
      memberUids: activeWorkspace?.memberUids?.length ? activeWorkspace.memberUids : user ? [user.uid] : [],
    }),
    [activeWorkspaceId, activeWorkspace?.ownerUid, activeWorkspace?.memberUids, user]
  );

  const addHistoryEntry = useCallback(
    (batch: ReturnType<typeof writeBatch>, text: string) => {
      if (!activeWorkspaceId) return;
      const id = `ACT-H-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', id), {
        ...baseFields(),
        id,
        kind: 'history',
        payload: { time: today, text: text.slice(0, 300) },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    [activeWorkspaceId, baseFields, today]
  );

  const setScope = useCallback(
    async (nextScope: string) => {
      setLocalScope(nextScope);
      if (!activeWorkspaceId || activeRole === 'Auditor') return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId), {
          scope: nextScope,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        // Non-blocking scope change
        console.warn(e);
      }
    },
    [activeWorkspaceId, activeRole]
  );

  const setYear = useCallback(
    async (nextYear: string) => {
      setLocalYear(nextYear);
      if (!activeWorkspaceId || activeRole === 'Auditor') return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId), {
          year: nextYear,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn(e);
      }
    },
    [activeWorkspaceId, activeRole]
  );

  const setPreviewRole = useCallback(
    (r: SafeQmsRole) => {
      if (!isActualAdmin) return;
      setPreviewRoleState(r === actualRole ? null : r);
      toast(`Role preview: ${r}`);
    },
    [isActualAdmin, actualRole, toast]
  );

  const switchWorkspace = useCallback(
    async (wsId: string) => {
      setActiveWorkspaceId(wsId);
      setPreviewRoleState(null);
      if (user) {
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            defaultWorkspaceId: wsId,
            updatedAt: serverTimestamp(),
          });
        } catch {
          // ignore
        }
      }
      navigate('overview');
    },
    [user, navigate]
  );

  const createWorkspace = useCallback(
    async (name: string) => {
      if (!user) return;
      const cleanName = name.trim();
      if (!cleanName) return;
      const wsId = toValidDocId(`ws_${Date.now().toString(36)}_${user.uid.slice(0, 6)}`);
      setLoadingWorkspace(true);
      try {
        await seedWorkspaceIntoFirestore(
          wsId,
          user.uid,
          userProfile?.displayName || user.displayName || 'Administrator',
          cleanName
        );
        await updateDoc(doc(db, 'users', user.uid), {
          defaultWorkspaceId: wsId,
          updatedAt: serverTimestamp(),
        });
        setActiveWorkspaceId(wsId);
        toast(`Workspace "${cleanName}" created`, 'success');
        navigate('overview');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${wsId}`);
      } finally {
        setLoadingWorkspace(false);
      }
    },
    [user, userProfile?.displayName, seedWorkspaceIntoFirestore, toast, navigate]
  );

  const seedOrResetWorkspace = useCallback(async () => {
    if (!user || !activeWorkspace) return;
    const ok = await showModal({
      type: 'confirm',
      title: 'Reset & Load Synchronized SafeQMS Data',
      message:
        'This will restore the complete synchronized Hoshin Kanri dataset (Organization, Sites, Departments, X-Matrix, KPIs, Daily Board, Catchball & A3s) inside this shared workspace while preserving existing team members.',
    });
    if (!ok) return;

    setLoadingWorkspace(true);
    try {
      const existingMemberUids = activeWorkspace.memberUids;
      await seedWorkspaceIntoFirestore(
        activeWorkspace.id,
        activeWorkspace.ownerUid,
        userProfile?.displayName || user.displayName || 'Administrator',
        activeWorkspace.name,
        existingMemberUids,
        'reset'
      );
      toast('Synchronized SafeQMS dataset loaded', 'success');
      navigate('overview');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspace.id}`);
    } finally {
      setLoadingWorkspace(false);
    }
  }, [user, activeWorkspace, showModal, seedWorkspaceIntoFirestore, userProfile?.displayName, toast, navigate]);

  const saveGoal = useCallback(
    async (id: string | undefined, data: Partial<StrategicGoal>): Promise<string | null> => {
      if (!activeWorkspaceId) return null;
      const existing = id ? goalById(goals, id) : undefined;
      if (existing ? !roleCan(activeRole, 'goalEdit', existing, { goals, initiatives }) : !roleCan(activeRole, 'goalCreate', { level: data.level }, { goals, initiatives })) {
        toast('Your role cannot create or modify a goal at this level', 'error');
        return null;
      }

      const level = String(data.level || existing?.level || 'Site: Uppsala');
      const parent = level === 'Organization' ? '' : String(data.parent || '');
      if (level !== 'Organization' && !parent) {
        toast('Select a Primary Parent Goal', 'error');
        return null;
      }
      if (parent && !permittedParents(goals, level, id).some((x) => x.id === parent)) {
        toast('Parent goal is not valid for this organizational level', 'error');
        return null;
      }
      if (existing) {
        const kids = goals.filter((x) => x.parent === existing.id);
        if (
          kids.some(
            (x) =>
              !(
                (x.level.startsWith('Site:') && level === 'Organization') ||
                (x.level.startsWith('Department:') && level.startsWith('Site:'))
              )
          )
        ) {
          toast('Reassign child goals before changing this level', 'error');
          return null;
        }
      }

      const isoRefs = Array.isArray(data.isoRefs) ? data.isoRefs : existing?.isoRefs || [];
      const isoStr = isoRefs.map((r) => isoName(isoStandards, r)).join(' | ');
      const kpiId = data.kpi !== undefined ? data.kpi : existing?.kpi || 'K-001';
      const kpiObj = kpiById(kpis, kpiId);
      const perfLabel = computeKpiStatus(kpiObj).label;
      const batch = writeBatch(db);
      const goalId = existing?.id || nextCode(goals.map((g) => g.id), 'G');
      const targetNum = Number(data.target ?? existing?.target ?? 0);
      const baselineNum = Number(data.baseline ?? existing?.baseline ?? 0);

      if (existing) {
        let nextRev = existing.revision || 1;
        let nextApproval = existing.approval;

        if (existing.approval === 'Approved') {
          const revActId = `ACT-REV-${Date.now().toString(36)}`;
          batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', revActId), {
            ...baseFields(),
            id: revActId,
            kind: 'goalRevision',
            payload: { goalId, at: today, approvedSnapshot: existing, revision: nextRev },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          nextRev += 1;
          nextApproval = 'Draft';
          addHistoryEntry(batch, `${goalId}: approved v${nextRev - 1} archived; new v${nextRev} draft created`);
        } else if (existing.approval === 'Pending') {
          nextApproval = 'Draft';
          for (const ap of approvals.filter((a) => a.goal === goalId && a.status === 'Pending')) {
            batch.update(doc(db, 'workspaces', activeWorkspaceId, 'approvals', ap.id), {
              status: 'Superseded',
              updatedAt: serverTimestamp(),
            });
          }
        }

        if (existing.parent !== parent) {
          addHistoryEntry(batch, `${goalId}: primary parent changed from ${existing.parent || 'none'} to ${parent || 'none'}`);
        }

        const updatePayload = stripUndefined({
          title: String(data.title ?? existing.title).trim(),
          level,
          parent,
          owner: String(data.owner ?? existing.owner).trim(),
          year: String(data.year ?? existing.year).trim(),
          kpi: kpiId,
          baseline: Number.isFinite(baselineNum) ? baselineNum : 0,
          target: Number.isFinite(targetNum) ? targetNum : 0,
          unit: String(data.unit ?? existing.unit ?? '%'),
          status: data.status ?? existing.status,
          approval: nextApproval,
          performance: perfLabel,
          iso: isoStr,
          description: String(data.description ?? existing.description ?? ''),
          planWhat: String(data.planWhat ?? existing.planWhat ?? ''),
          resources: String(data.resources ?? existing.resources ?? ''),
          planDue: String(data.planDue ?? existing.planDue ?? ''),
          evaluation: String(data.evaluation ?? existing.evaluation ?? ''),
          isoRefs,
          riskRefs: String(data.riskRefs ?? existing.riskRefs ?? ''),
          processRefs: String(data.processRefs ?? existing.processRefs ?? ''),
          evidenceRefs: String(data.evidenceRefs ?? existing.evidenceRefs ?? ''),
          revision: nextRev,
          updatedAt: serverTimestamp(),
        });

        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'goals', goalId), updatePayload);

        if (existing.target !== targetNum || existing.kpi !== kpiId) {
          const fakeNextGoal = { ...existing, ...updatePayload } as StrategicGoal;
          const nextTargets = kpiObj ? computeUpdatedKpiTargets(fakeNextGoal, kpiObj, goals) : null;
          if (kpiObj && nextTargets) {
            batch.update(doc(db, 'workspaces', activeWorkspaceId, 'kpis', kpiObj.id), {
              targets: nextTargets,
              updatedAt: serverTimestamp(),
            });
          }
        }
      } else {
        const newGoal: Omit<StrategicGoal, 'createdAt' | 'updatedAt'> = stripUndefined({
          ...baseFields(),
          id: goalId,
          title: String(data.title || '').trim(),
          level,
          parent,
          owner: String(data.owner || 'Site Manager').trim(),
          year: String(data.year || year),
          kpi: kpiId,
          baseline: Number.isFinite(baselineNum) ? baselineNum : 0,
          target: Number.isFinite(targetNum) ? targetNum : 0,
          unit: String(data.unit || '%'),
          status: (data.status as StrategicGoal['status']) || 'Planned',
          approval: 'Draft',
          performance: perfLabel,
          iso: isoStr,
          description: String(data.description || ''),
          planWhat: String(data.planWhat || ''),
          resources: String(data.resources || ''),
          planDue: String(data.planDue || '2027-12-31'),
          evaluation: String(data.evaluation || ''),
          isoRefs,
          riskRefs: String(data.riskRefs || ''),
          processRefs: String(data.processRefs || ''),
          evidenceRefs: String(data.evidenceRefs || ''),
          revision: 1,
        });

        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'goals', goalId), {
          ...newGoal,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        addHistoryEntry(batch, `New goal ${goalId} saved as draft`);

        const nextTargets = kpiObj ? computeUpdatedKpiTargets(newGoal as StrategicGoal, kpiObj, [...goals, newGoal as StrategicGoal]) : null;
        if (kpiObj && nextTargets) {
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'kpis', kpiObj.id), {
            targets: nextTargets,
            updatedAt: serverTimestamp(),
          });
        }
      }

      try {
        await batch.commit();
        toast('Goal saved — ISO references, KPI target & hierarchy synced', 'success');
        return goalId;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/goals/${goalId}`);
      }
    },
    [activeWorkspaceId, goals, initiatives, activeRole, isoStandards, kpis, baseFields, today, addHistoryEntry, approvals, year, toast]
  );

  const decideCatchballApproval = useCallback(
    async (approvalId: string, decision: 'Approved' | 'Changes requested') => {
      if (!activeWorkspaceId) return;
      const a = approvals.find((x) => x.id === approvalId);
      const c = catchballs.find((x) => x.id === a?.catchballId);
      const g = goalById(goals, a?.goal);
      if (!leadershipRole(activeRole) || !a || !c || !g || a.status !== 'Pending' || c.status !== 'Pending approval') {
        toast('Formal decision unavailable to this role', 'error');
        return;
      }
      if (decision === 'Approved') {
        const plan = goalPlanCheck(g, kpis);
        if (!plan.ready) {
          await showModal({
            type: 'alert',
            title: 'Approval Blocked',
            message: 'Goal plan is missing required ISO planning fields:',
            items: plan.checks.filter((x) => !x.ok).map((x) => x.label),
          });
          return;
        }
      }
      const note = await showModal({
        type: 'prompt',
        title: decision === 'Approved' ? 'Formal Goal Approval' : 'Request Changes',
        message: decision === 'Approved' ? 'Approval rationale / note:' : 'Why are changes requested? (required):',
        defaultValue: decision === 'Approved' ? 'Approved based on aligned Catchball negotiation and complete ISO planning.' : '',
        required: decision !== 'Approved',
      });
      if (note === null) return;
      if (decision !== 'Approved' && !String(note).trim()) return;

      const batch = writeBatch(db);
      const nextMsg = {
        id: nextCode(c.messages.map((m) => m.id), 'M'),
        at: today,
        by: activeRole,
        kind: decision === 'Approved' ? 'Approved' : 'Approval changes requested',
        text: String(note || 'Formal approval recorded'),
        target: decision === 'Approved' ? Number(c.proposal.target) : null,
        resources: decision === 'Approved' ? c.proposal.resources : '',
      };

      if (decision === 'Approved') {
        const revId = `ACT-REV-${Date.now().toString(36)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', revId), {
          ...baseFields(),
          id: revId,
          kind: 'goalRevision',
          payload: { goalId: g.id, at: today, approvedSnapshot: g, revision: g.revision || 1, reason: `Catchball alignment ${c.id}` },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const nextTarget = Number(c.proposal.target);
        const kObj = kpiById(kpis, g.kpi);
        const updatedGoal = { ...g, target: nextTarget, resources: c.proposal.resources, approval: 'Approved' as const, revision: (g.revision || 1) + 1 };

        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'goals', g.id), {
          target: nextTarget,
          resources: c.proposal.resources,
          approval: 'Approved',
          revision: updatedGoal.revision,
          updatedAt: serverTimestamp(),
        });

        if (kObj) {
          const nextTargets = computeUpdatedKpiTargets(updatedGoal, kObj, goals);
          if (nextTargets) {
            batch.update(doc(db, 'workspaces', activeWorkspaceId, 'kpis', kObj.id), {
              targets: nextTargets,
              updatedAt: serverTimestamp(),
            });
          }
        }

        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', c.id), {
          status: 'Approved',
          messages: [...c.messages, nextMsg],
          updatedDate: today,
          updatedAt: serverTimestamp(),
        });

        // Director log
        const dlId = `ACT-DL-${Date.now().toString(36)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', dlId), {
          ...baseFields(),
          id: dlId,
          kind: 'directorDecision',
          payload: {
            id: dlId,
            approvalId: a.id,
            goalId: g.id,
            goalTitle: g.title,
            isoLinks: isoShort(isoStandards, g),
            approvedBy: activeRole,
            at: today,
            revision: updatedGoal.revision,
            catchballId: c.id,
            kind: 'Goal approved',
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (activeRole !== 'General director') {
          const dnId = `ACT-DN-${Date.now().toString(36)}`;
          batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', dnId), {
            ...baseFields(),
            id: dnId,
            kind: 'directorNotification',
            read: false,
            payload: { id: dnId, eventId: dlId, recipient: 'General director', at: today },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'goals', g.id), {
          approval: 'Draft',
          updatedAt: serverTimestamp(),
        });
        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', c.id), {
          status: 'Changes requested',
          turn: leadershipRole(c.origin) ? c.origin : 'Department director',
          messages: [...c.messages, nextMsg],
          updatedDate: today,
          updatedAt: serverTimestamp(),
        });
      }

      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'approvals', a.id), {
        status: decision,
        comment: String(note || ''),
        resolvedAt: today,
        approvedBy: activeRole,
        updatedAt: serverTimestamp(),
      });

      const notifId = `ACT-CBN-${Date.now().toString(36)}`;
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', notifId), {
        ...baseFields(),
        id: notifId,
        kind: 'cbNotification',
        read: false,
        payload: {
          id: notifId,
          recipient: 'Department director',
          catchballId: c.id,
          text: decision === 'Approved' ? `Goal approved: ${g.title}` : `Formal changes requested: ${g.title}`,
          at: today,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      addHistoryEntry(batch, `${g.id} ${decision} by ${activeRole}`);

      try {
        await batch.commit();
        toast(decision === 'Approved' ? 'Goal formally approved' : 'Changes requested', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/approvals/${a.id}`);
      }
    },
    [activeWorkspaceId, approvals, catchballs, goals, activeRole, kpis, showModal, today, baseFields, isoStandards, addHistoryEntry, toast]
  );

  const submitCatchballForApproval = useCallback(
    async (id: string) => {
      if (!activeWorkspaceId) return;
      const c = catchballs.find((x) => x.id === id);
      if (!c || !cbCanAct(c, 'approval', activeRole, goals, initiatives)) {
        toast('Alignment is required before formal approval', 'error');
        return;
      }
      const g = goalById(goals, c.goal);
      if (!g) return;
      const plan = goalPlanCheck(g, kpis);
      if (!plan.ready) {
        await showModal({
          type: 'alert',
          title: 'Formal Submission Blocked',
          message: 'Complete ISO goal planning first before submitting:',
          items: plan.checks.filter((a) => !a.ok).map((a) => a.label),
        });
        return;
      }
      if (approvals.some((a) => a.goal === g.id && a.status === 'Pending')) {
        toast('An approval request already exists', 'error');
        return;
      }

      const aid = nextCode(approvals.map((a) => a.id), 'AP');
      const batch = writeBatch(db);
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'approvals', aid), {
        ...baseFields(),
        id: aid,
        goal: g.id,
        catchballId: id,
        requester: activeRole,
        approver: 'General director / QMS auditor',
        status: 'Pending',
        comment: `Catchball aligned. ISO planning complete. Proposed target ${c.proposal.target}`,
        date: today,
        proposedTarget: Number(c.proposal.target),
        proposedResources: String(c.proposal.resources || ''),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'goals', g.id), {
        approval: 'Pending',
        updatedAt: serverTimestamp(),
      });
      const nextMsg = {
        id: nextCode(c.messages.map((m) => m.id), 'M'),
        at: today,
        by: activeRole,
        kind: 'Approval submitted',
        text: `Aligned target ${c.proposal.target} ${g.unit || ''} submitted for formal approval; recorded target unchanged until approval.`,
      };
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', c.id), {
        status: 'Pending approval',
        messages: [...c.messages, nextMsg],
        updatedDate: today,
        updatedAt: serverTimestamp(),
      });
      for (const rec of ['General director', 'QMS auditor']) {
        const nid = `ACT-CBN-${Date.now().toString(36)}-${rec.slice(0, 2)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', nid), {
          ...baseFields(),
          id: nid,
          kind: 'cbNotification',
          read: false,
          payload: { id: nid, recipient: rec, catchballId: c.id, text: `Formal approval requested: ${g.title}`, at: today },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      addHistoryEntry(batch, `${c.id} submitted for formal approval`);
      try {
        await batch.commit();
        toast('Submitted for formal approval', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/catchballs/${c.id}`);
      }
    },
    [activeWorkspaceId, catchballs, activeRole, goals, initiatives, kpis, showModal, approvals, baseFields, today, addHistoryEntry, toast]
  );

  const submitGoal = useCallback(
    async (id: string) => {
      if (!activeWorkspaceId) return;
      const g = goalById(goals, id);
      if (!g) return;
      if (g.level !== 'Organization') {
        const c = catchballs.find((x) => x.goal === id && !['Approved', 'Cancelled'].includes(x.status));
        if (!c) {
          toast('Catchball alignment required before submitting this objective', 'error');
          navigate('catchball');
          return;
        }
        if (c.status !== 'Aligned') {
          toast('Complete Catchball alignment before formal approval', 'error');
          navigate('catchballitem', c.id);
          return;
        }
        await submitCatchballForApproval(c.id);
        return;
      }
      const v = goalPlanCheck(g, kpis);
      if (!v.ready) {
        await showModal({
          type: 'alert',
          title: 'Goal Plan Incomplete',
          message: 'Goal not ready for approval. Complete these required items:',
          items: v.checks.filter((x) => !x.ok).map((x) => x.label),
        });
        return;
      }
      if (g.approval === 'Pending') {
        toast('This goal already has a pending approval');
        return;
      }

      const aid = nextCode(approvals.map((a) => a.id), 'AP');
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'goals', id), {
        approval: 'Pending',
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'approvals', aid), {
        ...baseFields(),
        id: aid,
        goal: id,
        requester: g.owner,
        approver: 'General director / QMS auditor',
        status: 'Pending',
        comment: 'Please review planned activities, resources, ISO requirements and alignment.',
        date: today,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addHistoryEntry(batch, `${id} submitted for formal approval`);
      try {
        await batch.commit();
        toast(`${id} submitted for formal approval`, 'success');
        navigate('approvals');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/approvals/${aid}`);
      }
    },
    [activeWorkspaceId, goals, catchballs, navigate, submitCatchballForApproval, kpis, showModal, approvals, baseFields, today, addHistoryEntry, toast]
  );

  const decideApproval = useCallback(
    async (approvalId: string, status: 'Approved' | 'Changes requested') => {
      if (!activeWorkspaceId) return;
      const a = approvals.find((x) => x.id === approvalId);
      if (!a) return;
      if (a.catchballId) {
        await decideCatchballApproval(approvalId, status);
        return;
      }
      const g = goalById(goals, a.goal);
      if (!roleCan(activeRole, 'approve', g, { goals, initiatives })) {
        toast('Formal approval requires General director or QMS auditor authority', 'error');
        return;
      }
      if (!g || a.status !== 'Pending') {
        toast('Approval request is no longer pending');
        return;
      }
      if (status === 'Approved') {
        const v = goalPlanCheck(g, kpis);
        if (!v.ready) {
          await showModal({
            type: 'alert',
            title: 'Approval Blocked',
            message: `Approval blocked for ${g.id}. Missing required fields:`,
            items: v.checks.filter((c) => !c.ok).map((c) => c.label),
          });
          return;
        }
      }
      const comment = await showModal({
        type: 'prompt',
        title: status === 'Approved' ? 'Approve Goal' : 'Request Changes',
        message: status === 'Approved' ? 'Approval comment (optional):' : 'Reason / changes requested (required):',
        defaultValue: '',
        required: status !== 'Approved',
      });
      if (comment === null) return;
      if (status !== 'Approved' && !String(comment).trim()) return;

      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'approvals', a.id), {
        status,
        comment: String(comment || ''),
        resolvedAt: today,
        approvedBy: activeRole,
        updatedAt: serverTimestamp(),
      });
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'goals', g.id), {
        approval: status === 'Approved' ? 'Approved' : 'Draft',
        updatedAt: serverTimestamp(),
      });
      if (status === 'Approved') {
        const dlId = `ACT-DL-${Date.now().toString(36)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', dlId), {
          ...baseFields(),
          id: dlId,
          kind: 'directorDecision',
          payload: {
            id: dlId,
            approvalId: a.id,
            goalId: g.id,
            goalTitle: g.title,
            isoLinks: isoShort(isoStandards, g),
            approvedBy: activeRole,
            at: today,
            revision: g.revision || 1,
            kind: 'Goal approved',
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (activeRole !== 'General director') {
          const dnId = `ACT-DN-${Date.now().toString(36)}`;
          batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', dnId), {
            ...baseFields(),
            id: dnId,
            kind: 'directorNotification',
            read: false,
            payload: { id: dnId, eventId: dlId, recipient: 'General director', at: today },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      addHistoryEntry(batch, `${g.id} ${status} by ${activeRole}`);
      try {
        await batch.commit();
        toast(`${g.id} ${status}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/approvals/${a.id}`);
      }
    },
    [activeWorkspaceId, approvals, decideCatchballApproval, goals, activeRole, initiatives, kpis, showModal, today, baseFields, isoStandards, addHistoryEntry, toast]
  );

  const revisePlan = useCallback(
    async (planId: string) => {
      if (!activeWorkspaceId) return;
      if (!roleCan(activeRole, 'config', null, { goals, initiatives }) && !roleCan(activeRole, 'approve', null, { goals, initiatives })) {
        toast('Your role cannot create strategy plan revisions', 'error');
        return;
      }
      const p = plans.find((x) => x.id === planId);
      if (!p) return;
      const ok = await showModal({
        type: 'confirm',
        title: 'Create Revision',
        message: `Create a draft revision of ${p.name}?`,
      });
      if (!ok) return;

      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'plans', planId), {
        revision: (p.revision || 1) + 1,
        status: 'Draft',
        updatedAt: serverTimestamp(),
      });
      addHistoryEntry(batch, `${p.name} revision ${(p.revision || 1) + 1} created as draft`);
      try {
        await batch.commit();
        toast(`Revision ${(p.revision || 1) + 1} created`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/plans/${planId}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, plans, showModal, addHistoryEntry, toast]
  );

  const recordKpiActual = useCallback(
    async (kpiId: string) => {
      if (!activeWorkspaceId) return;
      const k = kpiById(kpis, kpiId);
      if (!k) return;
      if (!roleCan(activeRole, 'kpiWrite', k, { goals, initiatives })) {
        toast('Your role cannot update this KPI', 'error');
        return;
      }
      const n = k.values.length;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      if (n >= 12) {
        toast('All 12 months have been entered');
        return;
      }
      const val = await showModal({
        type: 'prompt',
        title: 'Record KPI Actual',
        message: `Enter ${months[n]} actual (${k.unit}):`,
        defaultValue: '',
        required: true,
        isNumber: true,
      });
      if (val === null) return;
      if (String(val).trim() === '' || !Number.isFinite(Number(val))) {
        toast('Enter a valid number', 'error');
        return;
      }

      const nextValues = [...k.values, Number(val)];
      const nextKpi = { ...k, values: nextValues };
      const nextPerf = computeKpiStatus(nextKpi).label;

      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'kpis', k.id), {
        values: nextValues,
        source: `Manual entry (${activeRole})`,
        sourceUpdated: today,
        updatedAt: serverTimestamp(),
      });
      for (const g of goals.filter((x) => x.kpi === k.id && x.performance !== nextPerf)) {
        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'goals', g.id), {
          performance: nextPerf,
          updatedAt: serverTimestamp(),
        });
      }
      try {
        await batch.commit();
        toast('KPI saved & goal performance updated', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/kpis/${k.id}`);
      }
    },
    [activeWorkspaceId, kpis, activeRole, goals, initiatives, showModal, today, toast]
  );

  const commitCsvImport = useCallback(
    async (records: ParsedCsvRecord[]): Promise<boolean> => {
      if (!activeWorkspaceId || !records.length) return false;
      if (activeRole === 'Department director' && records.some((r) => !roleCan(activeRole, 'kpiWrite', kpiById(kpis, r.key), { goals, initiatives }))) {
        toast('Import blocked: only KPIs assigned to your department may be updated', 'error');
        return false;
      }
      const batch = writeBatch(db);
      const updatedKpis = new Map<string, KpiMetric>();

      for (const r of records) {
        const base = updatedKpis.get(r.key) || kpiById(kpis, r.key);
        if (!base) continue;
        const nextValues = [...base.values];
        const nextTargets = [...base.targets];
        while (nextValues.length <= r.index) nextValues.push(null);
        nextValues[r.index] = r.actual;
        while (nextTargets.length <= r.index) nextTargets.push(null);
        if (r.target !== null) nextTargets[r.index] = r.target;
        updatedKpis.set(r.key, { ...base, values: nextValues, targets: nextTargets });
      }

      for (const [kId, uk] of updatedKpis.entries()) {
        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'kpis', kId), {
          values: uk.values,
          targets: uk.targets,
          source: 'CSV import',
          sourceUpdated: today,
          updatedAt: serverTimestamp(),
        });
        const nextPerf = computeKpiStatus(uk).label;
        for (const g of goals.filter((x) => x.kpi === kId && x.performance !== nextPerf)) {
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'goals', g.id), {
            performance: nextPerf,
            updatedAt: serverTimestamp(),
          });
        }
      }

      const csvActId = `ACT-CSV-${Date.now().toString(36)}`;
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', csvActId), {
        ...baseFields(),
        id: csvActId,
        kind: 'csvImport',
        payload: { date: today, count: records.length, source: 'CSV paste/upload' },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addHistoryEntry(batch, `KPI import: ${records.length} CSV rows`);

      try {
        await batch.commit();
        toast('KPI values imported & goals recalculated', 'success');
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/kpis`);
      }
    },
    [activeWorkspaceId, activeRole, kpis, goals, initiatives, today, baseFields, addHistoryEntry, toast]
  );

  const cycleMatrixRelation = useCallback(
    async (from: string, to: string) => {
      if (!activeWorkspaceId) return;
      if (!roleCan(activeRole, 'matrixEdit', { from, to }, { goals, initiatives })) {
        toast('Only an authorized goal owner can edit this relationship', 'error');
        return;
      }
      const existing = relations.find((r) => r.from === from && r.to === to);
      const cur = Number(existing?.strength || 0);
      const next = cur === 0 ? 0.5 : cur === 0.5 ? 1 : cur === 1 ? 2 : 0;
      const docId = existing?.id || toValidDocId(`${from}__${to}`);
      const ref = doc(db, 'workspaces', activeWorkspaceId, 'relations', docId);
      try {
        if (next === 0 && existing) {
          await deleteDoc(ref);
        } else if (existing) {
          await updateDoc(ref, { strength: next, updatedAt: serverTimestamp() });
        } else if (next > 0) {
          await setDoc(ref, {
            ...baseFields(),
            id: docId,
            from,
            to,
            strength: next,
            note: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        toast(`Relationship set to ${next === 2 ? 'Strong' : next === 1 ? 'Medium' : next === 0.5 ? 'Weak' : 'None'}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/relations/${docId}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, relations, baseFields, toast]
  );

  const editMatrixNote = useCallback(
    async (from: string, to: string) => {
      if (!activeWorkspaceId) return;
      if (!roleCan(activeRole, 'matrixEdit', { from, to }, { goals, initiatives })) {
        toast('Editing not allowed', 'error');
        return;
      }
      const r = relations.find((x) => x.from === from && x.to === to);
      if (!r || r.strength <= 0) {
        toast('Set a relationship strength before adding rationale');
        return;
      }
      const note = await showModal({
        type: 'prompt',
        title: 'Relationship Rationale',
        message: 'Why does this item influence the other?',
        defaultValue: r.note || '',
      });
      if (note === null) return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId, 'relations', r.id), {
          note: String(note).trim(),
          updatedAt: serverTimestamp(),
        });
        toast('Rationale saved', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/relations/${r.id}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, relations, showModal, toast]
  );

  const cycleKpiOwner = useCallback(
    async (kpiId: string, ownerName: string) => {
      if (!activeWorkspaceId) return;
      if (!(activeRole === 'Administratör' || leadershipRole(activeRole) || activeRole === 'Department director')) {
        toast('Only leadership or department directors can edit ownership', 'error');
        return;
      }
      const existing = kpiOwners.find((x) => x.kpi === kpiId && x.owner === ownerName);
      const cur = Number(existing?.strength || 0);
      const next = cur === 0 ? 1 : cur === 1 ? 2 : 0;
      const docId = existing?.id || toValidDocId(`${kpiId}__${ownerName}`);
      const ref = doc(db, 'workspaces', activeWorkspaceId, 'kpiOwners', docId);
      try {
        if (next === 0 && existing) {
          await deleteDoc(ref);
        } else if (existing) {
          await updateDoc(ref, { strength: next, updatedAt: serverTimestamp() });
        } else if (next > 0) {
          await setDoc(ref, {
            ...baseFields(),
            id: docId,
            kpi: kpiId,
            owner: ownerName,
            strength: next,
            note: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        toast(`${ownerName}: ${next === 2 ? 'Primary Owner' : next === 1 ? 'Cross-Functional Support' : 'Removed'}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/kpiOwners/${docId}`);
      }
    },
    [activeWorkspaceId, activeRole, kpiOwners, baseFields, toast]
  );

  const editKpiOwnerNote = useCallback(
    async (kpiId: string, ownerName: string) => {
      if (!activeWorkspaceId) return;
      if (!(activeRole === 'Administratör' || leadershipRole(activeRole) || activeRole === 'Department director')) {
        toast('Editing not allowed', 'error');
        return;
      }
      const r = kpiOwners.find((x) => x.kpi === kpiId && x.owner === ownerName);
      if (!r || r.strength <= 0) {
        toast('Assign Primary or Support accountability first');
        return;
      }
      const note = await showModal({
        type: 'prompt',
        title: 'Cross-Functional Accountability Note',
        message: `Role of ${ownerName} on ${kpiId}:`,
        defaultValue: r.note || '',
      });
      if (note === null) return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId, 'kpiOwners', r.id), {
          note: String(note).trim(),
          updatedAt: serverTimestamp(),
        });
        toast('Accountability note saved', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/kpiOwners/${r.id}`);
      }
    },
    [activeWorkspaceId, activeRole, kpiOwners, showModal, toast]
  );

  const createInitiative = useCallback(
    async (
      data: Omit<Initiative, 'id' | 'workspaceId' | 'ownerUid' | 'memberUids' | 'createdAt' | 'updatedAt'>
    ): Promise<string | null> => {
      if (!activeWorkspaceId) return null;
      if (!roleCan(activeRole, 'initiativeWrite', { goal: data.goal }, { goals, initiatives })) {
        toast('Your role cannot create an initiative for this goal', 'error');
        return null;
      }
      const id = nextCode(initiatives.map((i) => i.id), 'I');
      const relId = toValidDocId(`${data.goal}__${id}`);
      const batch = writeBatch(db);
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'initiatives', id), {
        ...baseFields(),
        ...stripUndefined(data),
        id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'relations', relId), {
        ...baseFields(),
        id: relId,
        from: data.goal,
        to: id,
        strength: 2,
        note: 'Direct goal assignment',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      try {
        await batch.commit();
        toast(`Initiative ${id} created`, 'success');
        return id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/initiatives/${id}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, baseFields, toast]
  );

  const updateInitiativeFocus = useCallback(
    async (
      id: string,
      patch: Pick<Initiative, 'progress' | 'status' | 'valueStream' | 'isBottleneck' | 'sqdc'>
    ) => {
      if (!activeWorkspaceId) return;
      const i = initById(initiatives, id);
      if (!i || !roleCan(activeRole, 'initiativeWrite', i, { goals, initiatives })) {
        toast('Your role cannot update this initiative', 'error');
        return;
      }
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId, 'initiatives', id), {
          progress: Math.max(0, Math.min(100, Math.round(Number(patch.progress || 0)))),
          status: patch.status,
          valueStream: patch.valueStream || '',
          isBottleneck: Boolean(patch.isBottleneck),
          sqdc: patch.sqdc,
          updatedAt: serverTimestamp(),
        });
        toast('Initiative execution & SQDC updated', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/initiatives/${id}`);
      }
    },
    [activeWorkspaceId, initiatives, activeRole, goals, toast]
  );

  const saveProjectA3 = useCallback(
    async (
      id: string,
      patch: {
        escalationTier: EscalationTier;
        problem: string;
        current: string;
        target: string;
        root: string;
        fiveWhys: FiveWhyStep[];
        counter: string;
        learning: string;
      }
    ) => {
      if (!activeWorkspaceId) return;
      const p = projects.find((x) => x.id === id);
      if (!p || !roleCan(activeRole, 'projectWrite', p, { goals, initiatives })) {
        toast('Your role cannot edit this Project A3', 'error');
        return;
      }
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId, 'projects', id), {
          escalationTier: patch.escalationTier,
          problem: patch.problem.slice(0, 3000),
          current: patch.current.slice(0, 2000),
          target: patch.target.slice(0, 2000),
          root: patch.root.slice(0, 3000),
          fiveWhys: patch.fiveWhys.slice(0, 5),
          counter: patch.counter.slice(0, 3000),
          learning: patch.learning.slice(0, 3000),
          updatedAt: serverTimestamp(),
        });
        toast('Project A3 & 5-Why saved', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/projects/${id}`);
      }
    },
    [activeWorkspaceId, projects, activeRole, goals, initiatives, toast]
  );

  const syncProjectAndInitiativeBatch = useCallback(
    (
      batch: ReturnType<typeof writeBatch>,
      projectId: string,
      overrideTasks: ProjectTask[]
    ) => {
      if (!activeWorkspaceId) return;
      const p = projects.find((x) => x.id === projectId);
      if (!p) return;
      const ts = overrideTasks.filter((t) => t.project === projectId);
      let nextProjProgress = p.progress;
      let nextProjStatus = p.status;
      if (ts.length) {
        const score = ts.reduce((acc, t) => acc + (t.status === 'Done' ? 1 : t.status === 'In progress' ? 0.5 : 0), 0);
        nextProjProgress = Math.round((score / ts.length) * 100);
        if (nextProjProgress === 100 && nextProjStatus !== 'Completed') nextProjStatus = 'Completed';
        else if (nextProjProgress < 100 && nextProjStatus === 'Completed') nextProjStatus = 'On track';
        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'projects', projectId), {
          progress: nextProjProgress,
          status: nextProjStatus,
          updatedAt: serverTimestamp(),
        });
      }
      if (p.initiative) {
        const init = initById(initiatives, p.initiative);
        const siblingProjs = projects.filter((x) => x.initiative === p.initiative);
        if (init && siblingProjs.length) {
          const sum = siblingProjs.reduce(
            (acc, sp) => acc + (sp.id === projectId ? nextProjProgress : Number(sp.progress || 0)),
            0
          );
          const nextInitProgress = Math.round(sum / siblingProjs.length);
          let nextInitStatus = init.status;
          if (nextInitProgress === 100 && nextInitStatus !== 'Completed') nextInitStatus = 'Completed';
          else if (nextInitProgress < 100 && nextInitStatus === 'Completed') nextInitStatus = 'On track';
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'initiatives', init.id), {
            progress: nextInitProgress,
            status: nextInitStatus,
            updatedAt: serverTimestamp(),
          });
        }
      }
    },
    [activeWorkspaceId, projects, initiatives]
  );

  const addProjectTask = useCallback(
    async (projectId: string, providedTitle?: string, providedOwner?: string, providedDue?: string) => {
      if (!activeWorkspaceId) return;
      const p = projects.find((x) => x.id === projectId);
      if (!p || !roleCan(activeRole, 'projectWrite', p, { goals, initiatives })) {
        toast('Your role cannot add activities to this project', 'error');
        return;
      }
      let title = providedTitle;
      if (!title) {
        title = await showModal({ type: 'prompt', title: 'New Activity', message: 'Activity title:', required: true });
      }
      if (!title?.trim()) return;
      let owner = providedOwner;
      if (!owner) {
        owner = (await showModal({ type: 'prompt', title: 'Responsible Person', message: 'Responsible person:', defaultValue: 'Project Leader' })) || 'Project Leader';
      }
      const id = nextCode(tasks.map((t) => t.id), 'T');
      const newTask: Omit<ProjectTask, 'createdAt' | 'updatedAt'> = {
        ...baseFields(),
        id,
        project: projectId,
        title: title.trim(),
        owner: (owner || 'Project Leader').trim(),
        due: providedDue || today,
        status: 'Open',
      };
      const batch = writeBatch(db);
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'tasks', id), {
        ...newTask,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      syncProjectAndInitiativeBatch(batch, projectId, [...tasks, newTask as ProjectTask]);
      try {
        await batch.commit();
        toast('Activity added & progress synced', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/tasks/${id}`);
      }
    },
    [activeWorkspaceId, projects, activeRole, goals, initiatives, showModal, tasks, baseFields, today, syncProjectAndInitiativeBatch, toast]
  );

  const toggleTaskStatus = useCallback(
    async (taskId: string) => {
      if (!activeWorkspaceId) return;
      const t = tasks.find((x) => x.id === taskId);
      const p = t ? projects.find((x) => x.id === t.project) : undefined;
      if (!t || !p || activeRole === 'Auditor') {
        toast('Read-only role cannot update tasks', 'error');
        return;
      }
      if (activeRole === 'Basic user' && !roleCan(activeRole, 'taskOwn', t, { goals, initiatives })) {
        toast('Basic user can only update tasks assigned to Team Leader', 'error');
        return;
      }
      if (activeRole !== 'Basic user' && !roleCan(activeRole, 'projectWrite', p, { goals, initiatives })) {
        toast('Your role cannot update tasks on this project', 'error');
        return;
      }
      const nextStatus: ProjectTask['status'] = t.status === 'Open' ? 'In progress' : t.status === 'In progress' ? 'Done' : 'Open';
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'tasks', t.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      const updatedTasks = tasks.map((x) => (x.id === t.id ? { ...x, status: nextStatus } : x));
      syncProjectAndInitiativeBatch(batch, p.id, updatedTasks);
      try {
        await batch.commit();
        toast(`Task ${t.id} → ${nextStatus}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/tasks/${t.id}`);
      }
    },
    [activeWorkspaceId, tasks, projects, activeRole, goals, initiatives, syncProjectAndInitiativeBatch, toast]
  );

  const createPulseCard = useCallback(
    async (input: { title: string; routeType: PulseCard['routeType']; kpi: string; owner: string; details?: string; due?: string }) => {
      if (!activeWorkspaceId || activeRole === 'Auditor') {
        toast('Read-only role cannot add pulse cards', 'error');
        return;
      }
      const cleanTitle = input.title.trim();
      if (!cleanTitle) return;
      const id = nextCode(pulseCards.map((c) => c.id), 'PC');
      const linkedKpiId = input.kpi || '';
      const matchedGoal = linkedKpiId ? goals.find((g) => g.kpi === linkedKpiId && visibleToRole(g, activeRole)) : undefined;
      const matchedInit = matchedGoal ? initiatives.find((i) => initiativeLinkedToGoal(i, matchedGoal.id, relations)) : undefined;
      const matchedProj = matchedInit ? projects.find((p) => p.initiative === matchedInit.id) : undefined;

      let blockerId = '';
      let status: PulseCard['status'] = 'Team action';
      const batch = writeBatch(db);

      if (input.routeType === 'Escalate') {
        blockerId = nextCode(blockers.map((b) => b.id), 'BL');
        const targetType = matchedInit ? 'initiative' : linkedKpiId ? 'kpi' : 'goal';
        const targetId = matchedInit?.id || linkedKpiId || matchedGoal?.id || 'G-002';
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'blockers', blockerId), {
          ...baseFields(),
          id: blockerId,
          targetType,
          targetId,
          scope,
          category: 'Technical',
          severity: 'High',
          summary: cleanTitle,
          neededAction: 'Review escalated Tier 1 daily board issue in Tier 2 / PDCA meeting.',
          owner: input.owner || activeRole,
          raisedBy: activeRole,
          raisedAt: today,
          status: 'Open',
          source: 'Daily Board',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        status = 'Escalated';
      }

      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', id), {
        ...baseFields(),
        id,
        title: cleanTitle,
        details: (input.details || '').trim(),
        due: input.due || '',
        scope,
        routeType: input.routeType,
        owner: input.owner || activeRole,
        kpi: linkedKpiId,
        initiative: matchedInit?.id || '',
        project: matchedProj?.id || '',
        blockerId,
        status,
        createdDate: today,
        comments: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        toast(blockerId ? `Added ${id} and escalated ${blockerId}` : `Added ${id} to Daily Board`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/pulseCards/${id}`);
      }
    },
    [activeWorkspaceId, activeRole, pulseCards, goals, initiatives, relations, projects, blockers, baseFields, scope, today, toast]
  );

  const savePulseCardDetails = useCallback(
    async (
      cardId: string,
      patch: { title: string; details: string; due: string; routeType: PulseCard['routeType']; kpi: string }
    ) => {
      if (!activeWorkspaceId || activeRole === 'Auditor') return;
      const c = pulseCards.find((x) => x.id === cardId);
      if (!c) return;
      const linkedKpiId = patch.kpi || '';
      const matchedGoal = linkedKpiId ? goals.find((g) => g.kpi === linkedKpiId && visibleToRole(g, activeRole)) : undefined;
      const matchedInit = matchedGoal ? initiatives.find((i) => initiativeLinkedToGoal(i, matchedGoal.id, relations)) : undefined;
      const matchedProj = matchedInit ? projects.find((p) => p.initiative === matchedInit.id) : undefined;

      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', cardId), {
        title: patch.title.trim() || c.title,
        details: patch.details.trim(),
        due: patch.due || '',
        routeType: patch.routeType,
        kpi: linkedKpiId,
        initiative: matchedInit?.id || (!linkedKpiId ? '' : c.initiative || ''),
        project: matchedProj?.id || (!linkedKpiId ? '' : c.project || ''),
        updatedAt: serverTimestamp(),
      });

      if (c.blockerId) {
        const b = blockers.find((x) => x.id === c.blockerId);
        if (b) {
          const nextTargetId = matchedInit?.id || linkedKpiId || matchedGoal?.id || b.targetId;
          const nextTargetType = matchedInit ? 'initiative' : linkedKpiId ? 'kpi' : 'goal';
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'blockers', b.id), {
            summary: patch.title.trim() || c.title,
            targetType: nextTargetType,
            targetId: nextTargetId,
            updatedAt: serverTimestamp(),
          });
        }
      }

      try {
        await batch.commit();
        toast(`Saved ${c.id} details`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/pulseCards/${cardId}`);
      }
    },
    [activeWorkspaceId, activeRole, pulseCards, goals, initiatives, relations, projects, blockers, toast]
  );

  const togglePulseCardDone = useCallback(
    async (cardId: string) => {
      if (!activeWorkspaceId || activeRole === 'Auditor') return;
      const c = pulseCards.find((x) => x.id === cardId);
      if (!c) return;
      const nextDone = c.status !== 'Done';
      const nextStatus: PulseCard['status'] = nextDone ? 'Done' : c.blockerId ? (c.delegatedBy ? 'Team action' : 'Escalated') : 'Team action';
      const nextComments = [...(c.comments || []), { by: activeRole, at: today, text: nextDone ? '✓ Marked Done' : 'Reopened card' }];

      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', c.id), {
        status: nextStatus,
        comments: nextComments,
        updatedAt: serverTimestamp(),
      });

      if (c.blockerId) {
        const b = blockers.find((x) => x.id === c.blockerId);
        if (b) {
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'blockers', b.id), {
            status: nextDone ? 'Resolved' : b.reviewId ? 'In review' : 'Open',
            resolvedAt: nextDone ? today : '',
            resolutionNote: nextDone ? b.resolutionNote || `Closed via Daily Board (${c.id})` : b.resolutionNote || '',
            updatedAt: serverTimestamp(),
          });
          if (b.reviewId && typeof b.decisionIndex === 'number') {
            const rev = reviews.find((r) => r.id === b.reviewId);
            if (rev?.decisions?.[b.decisionIndex]) {
              const decs = rev.decisions.map((d, idx) =>
                idx === b.decisionIndex ? { ...d, status: nextDone ? ('Done' as const) : ('Open' as const) } : d
              );
              batch.update(doc(db, 'workspaces', activeWorkspaceId, 'reviews', rev.id), {
                decisions: decs,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      }

      try {
        await batch.commit();
        toast(nextDone ? `${c.id} completed` : `${c.id} reopened`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/pulseCards/${c.id}`);
      }
    },
    [activeWorkspaceId, activeRole, pulseCards, today, blockers, reviews, toast]
  );

  const escalatePulseCard = useCallback(
    async (cardId: string) => {
      if (!activeWorkspaceId || activeRole === 'Auditor') return;
      const c = pulseCards.find((x) => x.id === cardId);
      if (!c) return;
      const batch = writeBatch(db);
      let blockerId = c.blockerId || '';
      const nextComments = [...(c.comments || [])];

      if (!blockerId) {
        blockerId = nextCode(blockers.map((b) => b.id), 'BL');
        const targetType = c.initiative ? 'initiative' : c.kpi ? 'kpi' : 'goal';
        const targetId = c.initiative || c.kpi || goals.find((g) => g.level === c.scope)?.id || 'G-002';
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'blockers', blockerId), {
          ...baseFields(),
          id: blockerId,
          targetType,
          targetId,
          scope: c.scope,
          category: 'Cross-functional',
          severity: 'High',
          summary: c.title,
          neededAction: 'Escalated from Daily Tier 1 Pulse Board for Tier 2/3 leadership support.',
          owner: c.owner || activeRole,
          raisedBy: activeRole,
          raisedAt: today,
          status: 'Open',
          source: 'Daily Board',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        nextComments.push({ by: activeRole, at: today, text: `↑ Escalated to Tier 2/3 & PDCA Queue as ${blockerId}` });
        addHistoryEntry(batch, `${blockerId} escalated from Daily Board (${c.id}): ${c.title}`);
      } else {
        const b = blockers.find((x) => x.id === blockerId);
        if (b) {
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'blockers', b.id), {
            status: b.reviewId ? 'In review' : 'Open',
            raisedBy: activeRole,
            raisedAt: today,
            resolvedAt: '',
            updatedAt: serverTimestamp(),
          });
          if (b.reviewId && typeof b.decisionIndex === 'number') {
            const rev = reviews.find((r) => r.id === b.reviewId);
            if (rev?.decisions?.[b.decisionIndex]) {
              const decs = rev.decisions.map((d, idx) => (idx === b.decisionIndex ? { ...d, status: 'Open' as const } : d));
              batch.update(doc(db, 'workspaces', activeWorkspaceId, 'reviews', rev.id), {
                decisions: decs,
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
        nextComments.push({ by: activeRole, at: today, text: `↑ Re-escalated to Tier 2/3 (${blockerId})` });
      }

      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', c.id), {
        status: 'Escalated',
        routeType: 'Escalate',
        blockerId,
        comments: nextComments,
        updatedAt: serverTimestamp(),
      });

      try {
        await batch.commit();
        toast(`Escalated ${c.id} as ${blockerId}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/pulseCards/${c.id}`);
      }
    },
    [activeWorkspaceId, activeRole, pulseCards, blockers, goals, baseFields, today, addHistoryEntry, reviews, toast]
  );

  const movePulseCardStatus = useCallback(
    async (cardId: string, nextStatus: PulseCard['status']) => {
      if (!activeWorkspaceId || activeRole === 'Auditor') return;
      const c = pulseCards.find((x) => x.id === cardId);
      if (!c || c.status === nextStatus) return;
      if (nextStatus === 'Escalated') {
        await escalatePulseCard(cardId);
        return;
      }
      if (nextStatus === 'Done' || c.status === 'Done') {
        await togglePulseCardDone(cardId);
        return;
      }
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', c.id), {
          status: nextStatus,
          comments: [...(c.comments || []), { by: activeRole, at: today, text: `Moved to ${nextStatus}` }],
          updatedAt: serverTimestamp(),
        });
        toast(`${c.id} moved to ${nextStatus}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/pulseCards/${c.id}`);
      }
    },
    [activeWorkspaceId, activeRole, pulseCards, escalatePulseCard, togglePulseCardDone, today, toast]
  );

  const delegatePulseCard = useCallback(
    async (cardId: string, targetScope: string, targetOwner: string, note: string) => {
      if (!activeWorkspaceId || activeRole === 'Auditor') return;
      const c = pulseCards.find((x) => x.id === cardId);
      if (!c) return;
      const cleanNote = note.trim();
      const nextComments = [
        ...(c.comments || []),
        { by: activeRole, at: today, text: `↳ Delegated to ${targetOwner} (${targetScope})${cleanNote ? ': ' + cleanNote : ''}` },
      ];
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', c.id), {
        scope: targetScope,
        owner: targetOwner.trim() || c.owner,
        status: 'Team action',
        delegatedBy: activeRole,
        delegatedAt: today,
        delegationNote: cleanNote,
        comments: nextComments,
        updatedAt: serverTimestamp(),
      });
      if (c.blockerId) {
        const b = blockers.find((x) => x.id === c.blockerId);
        if (b) {
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'blockers', b.id), {
            scope: targetScope,
            owner: targetOwner.trim() || b.owner,
            status: 'In review',
            resolvedAt: '',
            neededAction: cleanNote ? `Delegated by ${activeRole} to ${targetOwner} (${targetScope}): ${cleanNote}` : `Delegated by ${activeRole} to ${targetOwner} (${targetScope})`,
            updatedAt: serverTimestamp(),
          });
        }
      }
      addHistoryEntry(batch, `${c.id} delegated by ${activeRole} to ${targetOwner} (${targetScope})`);
      try {
        await batch.commit();
        toast(`Delegated ${c.id} to ${targetOwner}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/pulseCards/${c.id}`);
      }
    },
    [activeWorkspaceId, activeRole, pulseCards, today, blockers, addHistoryEntry, toast]
  );

  const addPulseCardComment = useCallback(
    async (cardId: string, text: string) => {
      if (!activeWorkspaceId || activeRole === 'Auditor') return;
      const c = pulseCards.find((x) => x.id === cardId);
      if (!c || !text.trim()) return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', c.id), {
          comments: [...(c.comments || []), { by: activeRole, at: today, text: text.trim() }],
          updatedAt: serverTimestamp(),
        });
        toast('Stand-up note added', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/pulseCards/${c.id}`);
      }
    },
    [activeWorkspaceId, activeRole, pulseCards, today, toast]
  );

  const toggleSafetyDay = useCallback(
    async (scopeKey: string, month: string, day: number) => {
      if (!activeWorkspaceId || activeRole === 'Auditor') {
        toast('Read-only role cannot update Safety Cross', 'error');
        return;
      }
      const docId = toValidDocId(`${scopeKey}__${month}`);
      const existing = safetyCross.find((x) => x.id === docId || (x.scope === scopeKey && x.month === month));
      const days = { ...(existing?.days || {}) };
      const cur = (days[String(day)] ?? '') as SafetyDayState | '';
      const next: SafetyDayState | '' = cur === '' ? 'green' : cur === 'green' ? 'amber' : cur === 'amber' ? 'red' : '';
      if (next) days[String(day)] = next;
      else delete days[String(day)];

      const ref = doc(db, 'workspaces', activeWorkspaceId, 'safetyCross', existing?.id || docId);
      try {
        if (existing) {
          await updateDoc(ref, { days, updatedAt: serverTimestamp() });
        } else {
          await setDoc(ref, {
            ...baseFields(),
            id: docId,
            scope: scopeKey,
            month,
            days,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/safetyCross/${docId}`);
      }
    },
    [activeWorkspaceId, activeRole, safetyCross, baseFields, toast]
  );

  const escalateBlocker = useCallback(
    async (targetType: EscalatedBlocker['targetType'], targetId: string) => {
      if (!activeWorkspaceId) return;
      const info = blockerTargetInfo(targetType, targetId, { goals, kpis, initiatives, projects });
      const res = await showModal({
        type: 'escalate',
        title: 'Escalate Blocker to PDCA Review',
        message: 'Flag an implementation obstacle that requires management support, resources or cross-functional decision.',
        itemLabel: `${info.typeLabel} ${info.code} · ${info.title} (${info.scope})`,
        defaultCategory: targetType === 'kpi' ? 'Technical' : 'Resource',
        defaultSeverity: info.status === 'Off track' || info.status === 'At risk' ? 'High' : 'Medium',
      });
      if (!res) return;
      const id = nextCode(blockers.map((b) => b.id), 'BL');
      const batch = writeBatch(db);
      batch.set(doc(db, 'workspaces', activeWorkspaceId, 'blockers', id), {
        ...baseFields(),
        id,
        targetType,
        targetId,
        scope: info.scope,
        category: res.category,
        severity: res.severity,
        summary: res.summary,
        neededAction: res.neededAction,
        owner: info.owner,
        raisedBy: activeRole,
        raisedAt: today,
        status: 'Open',
        source: 'Manual',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addHistoryEntry(batch, `${id} escalated on ${info.code} (${info.title}): ${res.summary}`);
      try {
        await batch.commit();
        toast(`${id} escalated to PDCA Review queue`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/blockers/${id}`);
      }
    },
    [activeWorkspaceId, goals, kpis, initiatives, projects, showModal, blockers, baseFields, activeRole, today, addHistoryEntry, toast]
  );

  const resolveBlocker = useCallback(
    async (blockerId: string) => {
      if (!activeWorkspaceId) return;
      if (!roleCan(activeRole, 'reviewWrite', null, { goals, initiatives })) {
        toast('Review write access required to resolve blockers', 'error');
        return;
      }
      const b = blockers.find((x) => x.id === blockerId);
      if (!b) return;
      const note = await showModal({
        type: 'prompt',
        title: 'Resolve Escalated Blocker',
        message: `Resolution note for ${b.id}:`,
        defaultValue: b.resolutionNote || 'Root cause addressed and resources confirmed.',
        required: true,
      });
      if (!note) return;

      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'blockers', b.id), {
        status: 'Resolved',
        resolvedAt: today,
        resolutionNote: String(note).trim(),
        updatedAt: serverTimestamp(),
      });
      if (b.reviewId && typeof b.decisionIndex === 'number') {
        const rev = reviews.find((r) => r.id === b.reviewId);
        if (rev?.decisions?.[b.decisionIndex]) {
          const decs = rev.decisions.map((d, idx) => (idx === b.decisionIndex ? { ...d, status: 'Done' as const } : d));
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'reviews', rev.id), {
            decisions: decs,
            updatedAt: serverTimestamp(),
          });
        }
      }
      for (const pc of pulseCards.filter((c) => c.blockerId === b.id && c.status !== 'Done')) {
        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', pc.id), {
          status: 'Done',
          comments: [...(pc.comments || []), { by: 'PDCA / Blocker Sync', at: today, text: `✓ Closed via Blocker ${b.id}: ${String(note).trim()}` }],
          updatedAt: serverTimestamp(),
        });
      }
      addHistoryEntry(batch, `${b.id} resolved: ${String(note).trim()}`);
      try {
        await batch.commit();
        toast(`${b.id} marked resolved`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/blockers/${b.id}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, blockers, showModal, today, reviews, pulseCards, addHistoryEntry, toast]
  );

  const reopenBlocker = useCallback(
    async (blockerId: string) => {
      if (!activeWorkspaceId) return;
      if (!roleCan(activeRole, 'reviewWrite', null, { goals, initiatives })) return;
      const b = blockers.find((x) => x.id === blockerId);
      if (!b) return;
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'blockers', b.id), {
        status: b.reviewId ? 'In review' : 'Open',
        resolvedAt: '',
        updatedAt: serverTimestamp(),
      });
      if (b.reviewId && typeof b.decisionIndex === 'number') {
        const rev = reviews.find((r) => r.id === b.reviewId);
        if (rev?.decisions?.[b.decisionIndex]) {
          const decs = rev.decisions.map((d, idx) => (idx === b.decisionIndex ? { ...d, status: 'Open' as const } : d));
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'reviews', rev.id), {
            decisions: decs,
            updatedAt: serverTimestamp(),
          });
        }
      }
      try {
        await batch.commit();
        toast(`${b.id} reopened`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/blockers/${b.id}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, blockers, reviews, toast]
  );

  const convertToPdcaDecision = useCallback(
    async (blockerId: string, targetType: string, targetId: string, fixedReviewId?: string): Promise<string | null> => {
      if (!activeWorkspaceId) return null;
      if (!roleCan(activeRole, 'reviewWrite', null, { goals, initiatives })) {
        toast('Only management or department directors can log PDCA decisions', 'error');
        return null;
      }
      const b = blockerId ? blockers.find((x) => x.id === blockerId) : undefined;
      const info = blockerTargetInfo(targetType, targetId, { goals, kpis, initiatives, projects });
      const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      const defaultText = b ? b.neededAction : `Address ${info.typeLabel} ${info.code} (${info.title}) gap and verify countermeasures`;
      const scopedMatch = fixedReviewId ? reviews.find((r) => r.id === fixedReviewId) : reviews.find((r) => r.scope === info.scope) || reviews[0];
      const reviewsList = (fixedReviewId ? reviews.filter((r) => r.id === fixedReviewId) : [...reviews].reverse()).map((r) => ({
        id: r.id,
        label: `${r.id} · ${r.title} (${r.scope})`,
      }));

      const res = await showModal({
        type: 'pdcaDecision',
        title: 'Convert to PDCA Decision',
        message: 'Create a tracked management decision tied directly to this escalated blocker or red KPI signal.',
        itemLabel: b ? `${b.id} · ${info.code} (${info.title}) — ${b.summary}` : `${info.typeLabel} ${info.code} · ${info.title}`,
        reviewsList,
        defaultReviewId: scopedMatch?.id || '__new__',
        defaultValue: defaultText,
        defaultOwner: b?.owner || info.owner,
        defaultDue,
      });
      if (!res) return null;

      const batch = writeBatch(db);
      let rev = reviews.find((x) => x.id === res.reviewId);
      let targetRevId = rev?.id;
      const newDecision = {
        text: res.text,
        owner: res.owner,
        due: res.due,
        status: 'Open' as const,
        ...(blockerId ? { blockerId } : {}),
        linkedType: targetType,
        linkedId: targetId,
      };
      let decisionIndex = 0;

      if (!rev) {
        targetRevId = nextCode(reviews.map((r) => r.id), 'R');
        decisionIndex = 0;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'reviews', targetRevId), {
          ...baseFields(),
          id: targetRevId,
          title: `PDCA Review · ${scope}`,
          date: today,
          scope: info.scope || scope,
          notes: 'Created from Escalated Blocker & Exception Queue.',
          decisions: [newDecision],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        decisionIndex = rev.decisions.length;
        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'reviews', rev.id), {
          decisions: [...rev.decisions, newDecision],
          updatedAt: serverTimestamp(),
        });
      }

      if (blockerId && b) {
        batch.update(doc(db, 'workspaces', activeWorkspaceId, 'blockers', b.id), {
          status: 'In review',
          reviewId: targetRevId,
          decisionIndex,
          updatedAt: serverTimestamp(),
        });
      }
      addHistoryEntry(batch, `PDCA decision added in ${targetRevId} for ${blockerId || targetId}: ${res.text}`);

      try {
        await batch.commit();
        toast(`Decision added to ${targetRevId}`, 'success');
        return targetRevId || null;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/reviews`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, blockers, kpis, projects, reviews, showModal, baseFields, scope, today, addHistoryEntry, toast]
  );

  const createReview = useCallback(
    async (input: { title: string; date: string; scope: string; notes: string }): Promise<string | null> => {
      if (!activeWorkspaceId) return null;
      if (!roleCan(activeRole, 'reviewWrite', null, { goals, initiatives })) {
        toast('Your role cannot create PDCA reviews', 'error');
        return null;
      }
      const id = nextCode(reviews.map((r) => r.id), 'R');
      try {
        await setDoc(doc(db, 'workspaces', activeWorkspaceId, 'reviews', id), {
          ...baseFields(),
          id,
          title: input.title.trim(),
          date: input.date || today,
          scope: input.scope || scope,
          notes: input.notes || '',
          decisions: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast(`Review ${id} created`, 'success');
        return id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/reviews/${id}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, reviews, baseFields, today, scope, toast]
  );

  const toggleDecision = useCallback(
    async (reviewId: string, idx: number) => {
      if (!activeWorkspaceId) return;
      if (!roleCan(activeRole, 'reviewWrite', null, { goals, initiatives })) return;
      const rev = reviews.find((r) => r.id === reviewId);
      const dec = rev?.decisions?.[idx];
      if (!rev || !dec) return;
      const nextStatus = dec.status === 'Open' ? ('Done' as const) : ('Open' as const);
      const nextDecs = rev.decisions.map((d, i) => (i === idx ? { ...d, status: nextStatus } : d));

      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'reviews', rev.id), {
        decisions: nextDecs,
        updatedAt: serverTimestamp(),
      });
      if (dec.blockerId) {
        const b = blockers.find((x) => x.id === dec.blockerId);
        if (b) {
          batch.update(doc(db, 'workspaces', activeWorkspaceId, 'blockers', b.id), {
            status: nextStatus === 'Done' ? 'Resolved' : 'In review',
            resolvedAt: nextStatus === 'Done' ? today : '',
            resolutionNote: nextStatus === 'Done' ? b.resolutionNote || `Closed via PDCA decision in ${rev.id}` : b.resolutionNote || '',
            updatedAt: serverTimestamp(),
          });
          if (nextStatus === 'Done') {
            addHistoryEntry(batch, `${b.id} auto-resolved upon completing decision in ${rev.id}`);
            for (const pc of pulseCards.filter((c) => c.blockerId === b.id && c.status !== 'Done')) {
              batch.update(doc(db, 'workspaces', activeWorkspaceId, 'pulseCards', pc.id), {
                status: 'Done',
                comments: [...(pc.comments || []), { by: 'PDCA / Blocker Sync', at: today, text: `✓ Closed via PDCA decision in ${rev.id}` }],
                updatedAt: serverTimestamp(),
              });
            }
          }
        }
      }
      try {
        await batch.commit();
        toast(dec.blockerId && nextStatus === 'Done' ? `Decision done — blocker ${dec.blockerId} auto-resolved` : `Decision → ${nextStatus}`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/reviews/${reviewId}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, reviews, blockers, today, addHistoryEntry, pulseCards, toast]
  );

  const addDecision = useCallback(
    async (reviewId: string, decision: { text: string; owner: string; due: string }) => {
      if (!activeWorkspaceId) return;
      if (!roleCan(activeRole, 'reviewWrite', null, { goals, initiatives })) return;
      const rev = reviews.find((r) => r.id === reviewId);
      if (!rev) return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId, 'reviews', rev.id), {
          decisions: [...rev.decisions, { ...decision, status: 'Open' }],
          updatedAt: serverTimestamp(),
        });
        toast('PDCA action added', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/reviews/${reviewId}`);
      }
    },
    [activeWorkspaceId, activeRole, goals, initiatives, reviews, toast]
  );

  const prepareManagementReview = useCallback(async (): Promise<string | null> => {
    if (!activeWorkspaceId) return null;
    if (!roleCan(activeRole, 'reviewPrepare', null, { goals, initiatives })) {
      toast('Your role cannot create Management Review drafts', 'error');
      return null;
    }
    const m = managementSummary(domainSnapshot);
    const id = nextCode(reviews.map((r) => r.id), 'R');
    const blockerLines = m.blockers.map((b) => `- ${b.id} [${b.severity}/${b.category}]: ${b.summary} (Need: ${b.neededAction})`).join('\n');
    const notes = `SafeQMS Goal Management automated input (${today}):\nGoals on track: ${m.on.length}; at risk: ${m.risk.length}; off track: ${m.off.length}; not measured: ${m.notMeasured.length}.\nEscalated blockers (${m.blockers.length}):\n${blockerLines || 'none'}\nGoals with incomplete plans: ${m.gaps.map((g) => g.id).join(', ') || 'none'}.\nOpen actions: ${m.open.length}.`;

    try {
      await setDoc(doc(db, 'workspaces', activeWorkspaceId, 'reviews', id), {
        ...baseFields(),
        id,
        title: 'Strategy and Management Review — Auto Draft',
        date: today,
        scope,
        notes,
        decisions: [],
        source: 'Management Review Inputs',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast('Draft review created with live KPI & blocker queue', 'success');
      return id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/reviews/${id}`);
    }
  }, [activeWorkspaceId, activeRole, goals, initiatives, domainSnapshot, reviews, today, baseFields, scope, toast]);

  const createCatchball = useCallback(
    async (input: { goalId: string; target: number; resources: string; due: string; reason: string; recipientScope: string }): Promise<string | null> => {
      if (!activeWorkspaceId) return null;
      const g = goalById(goals, input.goalId);
      if (!g || !roleCan(activeRole, 'goalEdit', g, { goals, initiatives })) {
        toast('Your role cannot negotiate this goal', 'error');
        return null;
      }
      if (catchballs.some((c) => c.goal === g.id && !['Approved', 'Cancelled'].includes(c.status))) {
        toast('An active Catchball thread already exists for this goal', 'error');
        return null;
      }
      const id = nextCode(catchballs.map((c) => c.id), 'CB');
      const thread: Omit<CatchballThread, 'createdAt' | 'updatedAt'> = {
        ...baseFields(),
        id,
        goal: g.id,
        status: 'Draft',
        createdDate: today,
        updatedDate: today,
        origin: activeRole,
        recipientRole: leadershipRole(activeRole) ? 'Department director' : 'General director',
        recipientScope: input.recipientScope || ASSIGNED_DEPARTMENT,
        turn: activeRole,
        proposal: { target: Number(input.target), resources: input.resources, due: input.due, reason: input.reason },
        messages: [
          {
            id: 'M-001',
            at: today,
            by: activeRole,
            kind: 'Draft',
            text: input.reason,
            target: Number(input.target),
            resources: input.resources,
          },
        ],
      };
      try {
        await setDoc(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', id), {
          ...thread,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast(`Catchball thread ${id} created`, 'success');
        return id;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspaceId}/catchballs/${id}`);
      }
    },
    [activeWorkspaceId, goals, activeRole, initiatives, catchballs, baseFields, today, toast]
  );

  const commentCatchball = useCallback(
    async (id: string, message: string) => {
      if (!activeWorkspaceId) return;
      const c = catchballs.find((x) => x.id === id);
      if (!c || !cbCanAct(c, 'comment', activeRole, goals, initiatives) || !message.trim()) return;
      const msg = { id: nextCode(c.messages.map((m) => m.id), 'M'), at: today, by: activeRole, kind: 'Comment', text: message.trim() };
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', c.id), {
        messages: [...c.messages, msg],
        updatedDate: today,
        updatedAt: serverTimestamp(),
      });
      const recips = leadershipRole(activeRole) ? ['Department director'] : ['General director', 'QMS auditor'];
      for (const rec of recips) {
        const nid = `ACT-CBN-${Date.now().toString(36)}-${rec.slice(0, 2)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', nid), {
          ...baseFields(),
          id: nid,
          kind: 'cbNotification',
          read: false,
          payload: { id: nid, recipient: rec, catchballId: c.id, text: `New Catchball comment on ${goalById(goals, c.goal)?.title || c.goal}`, at: today },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      try {
        await batch.commit();
        toast('Comment added', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/catchballs/${id}`);
      }
    },
    [activeWorkspaceId, catchballs, activeRole, goals, initiatives, today, baseFields, toast]
  );

  const sendCatchball = useCallback(
    async (id: string) => {
      if (!activeWorkspaceId) return;
      const c = catchballs.find((x) => x.id === id);
      if (!c || !cbCanAct(c, 'send', activeRole, goals, initiatives)) return;
      const nextStatus: CatchballThread['status'] = activeRole === 'Department director' ? 'Awaiting director' : 'Awaiting department';
      const nextTurn = activeRole === 'Department director' ? 'General director' : 'Department director';
      const msg = {
        id: nextCode(c.messages.map((m) => m.id), 'M'),
        at: today,
        by: activeRole,
        kind: 'Proposal submitted',
        text: 'Submitted goal and resource proposal for alignment.',
        target: c.proposal.target,
        resources: c.proposal.resources,
      };
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', c.id), {
        status: nextStatus,
        turn: nextTurn,
        messages: [...c.messages, msg],
        updatedDate: today,
        updatedAt: serverTimestamp(),
      });
      const recips = activeRole === 'Department director' ? ['General director', 'QMS auditor'] : ['Department director'];
      for (const rec of recips) {
        const nid = `ACT-CBN-${Date.now().toString(36)}-${rec.slice(0, 2)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', nid), {
          ...baseFields(),
          id: nid,
          kind: 'cbNotification',
          read: false,
          payload: { id: nid, recipient: rec, catchballId: c.id, text: `Catchball proposal: ${goalById(goals, c.goal)?.title || c.goal}`, at: today },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      try {
        await batch.commit();
        toast('Proposal sent', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/catchballs/${id}`);
      }
    },
    [activeWorkspaceId, catchballs, activeRole, goals, initiatives, today, baseFields, toast]
  );

  const counterCatchball = useCallback(
    async (id: string) => {
      if (!activeWorkspaceId) return;
      const c = catchballs.find((x) => x.id === id);
      if (!c || !cbCanAct(c, 'counter', activeRole, goals, initiatives)) return;
      const res = await showModal({
        type: 'counter',
        title: 'Send Counterproposal',
        message: 'Revise the proposed target, discuss resources, and provide a clear rationale.',
        counterTarget: c.proposal.target,
        counterResources: c.proposal.resources || '',
      });
      if (!res) return;
      const nextStatus: CatchballThread['status'] = leadershipRole(activeRole) ? 'Awaiting department' : 'Awaiting director';
      const nextTurn = leadershipRole(activeRole) ? 'Department director' : 'General director';
      const msg = {
        id: nextCode(c.messages.map((m) => m.id), 'M'),
        at: today,
        by: activeRole,
        kind: 'Counterproposal',
        text: res.reason,
        target: res.target,
        resources: res.resources,
      };
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', c.id), {
        status: nextStatus,
        turn: nextTurn,
        proposal: { ...c.proposal, target: res.target, resources: res.resources },
        messages: [...c.messages, msg],
        updatedDate: today,
        updatedAt: serverTimestamp(),
      });
      const recips = leadershipRole(activeRole) ? ['Department director'] : ['General director', 'QMS auditor'];
      for (const rec of recips) {
        const nid = `ACT-CBN-${Date.now().toString(36)}-${rec.slice(0, 2)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', nid), {
          ...baseFields(),
          id: nid,
          kind: 'cbNotification',
          read: false,
          payload: { id: nid, recipient: rec, catchballId: c.id, text: `Counterproposal to review: ${goalById(goals, c.goal)?.title || c.goal}`, at: today },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      try {
        await batch.commit();
        toast('Counterproposal sent', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/catchballs/${id}`);
      }
    },
    [activeWorkspaceId, catchballs, activeRole, goals, initiatives, showModal, today, baseFields, toast]
  );

  const alignCatchball = useCallback(
    async (id: string) => {
      if (!activeWorkspaceId) return;
      const c = catchballs.find((x) => x.id === id);
      if (!c || !cbCanAct(c, 'align', activeRole, goals, initiatives)) return;
      const note = await showModal({
        type: 'prompt',
        title: 'Agree & Align',
        message: 'Alignment note:',
        defaultValue: 'Target and resources agreed for formal approval.',
        required: true,
      });
      if (!note || !String(note).trim()) return;
      const msg = {
        id: nextCode(c.messages.map((m) => m.id), 'M'),
        at: today,
        by: activeRole,
        kind: 'Alignment',
        text: String(note).trim(),
        target: c.proposal.target,
        resources: c.proposal.resources,
      };
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', c.id), {
        status: 'Aligned',
        turn: '',
        messages: [...c.messages, msg],
        updatedDate: today,
        updatedAt: serverTimestamp(),
      });
      const recips = leadershipRole(activeRole) ? ['Department director'] : ['General director', 'QMS auditor'];
      for (const rec of recips) {
        const nid = `ACT-CBN-${Date.now().toString(36)}-${rec.slice(0, 2)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', nid), {
          ...baseFields(),
          id: nid,
          kind: 'cbNotification',
          read: false,
          payload: { id: nid, recipient: rec, catchballId: c.id, text: `Goal aligned, pending formal submission: ${goalById(goals, c.goal)?.title || c.goal}`, at: today },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      try {
        await batch.commit();
        toast('Catchball thread aligned', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/catchballs/${id}`);
      }
    },
    [activeWorkspaceId, catchballs, activeRole, goals, initiatives, showModal, today, baseFields, toast]
  );

  const requestChangesCatchball = useCallback(
    async (id: string) => {
      if (!activeWorkspaceId) return;
      const c = catchballs.find((x) => x.id === id);
      if (!c || !cbCanAct(c, 'changes', activeRole, goals, initiatives)) return;
      const reason = await showModal({
        type: 'prompt',
        title: 'Request Changes',
        message: 'What must be changed? (required):',
        defaultValue: '',
        required: true,
      });
      if (!reason || !String(reason).trim()) return;
      const msg = { id: nextCode(c.messages.map((m) => m.id), 'M'), at: today, by: activeRole, kind: 'Changes requested', text: String(reason).trim() };
      const batch = writeBatch(db);
      batch.update(doc(db, 'workspaces', activeWorkspaceId, 'catchballs', c.id), {
        status: 'Changes requested',
        turn: leadershipRole(activeRole) ? 'Department director' : 'General director',
        messages: [...c.messages, msg],
        updatedDate: today,
        updatedAt: serverTimestamp(),
      });
      const recips = leadershipRole(activeRole) ? ['Department director'] : ['General director', 'QMS auditor'];
      for (const rec of recips) {
        const nid = `ACT-CBN-${Date.now().toString(36)}-${rec.slice(0, 2)}`;
        batch.set(doc(db, 'workspaces', activeWorkspaceId, 'activities', nid), {
          ...baseFields(),
          id: nid,
          kind: 'cbNotification',
          read: false,
          payload: { id: nid, recipient: rec, catchballId: c.id, text: `Changes requested: ${goalById(goals, c.goal)?.title || c.goal}`, at: today },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      try {
        await batch.commit();
        toast('Changes requested', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/catchballs/${id}`);
      }
    },
    [activeWorkspaceId, catchballs, activeRole, goals, initiatives, showModal, today, baseFields, toast]
  );

  const markActivityRead = useCallback(
    async (activityId: string) => {
      if (!activeWorkspaceId) return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId, 'activities', activityId), {
          read: true,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}/activities/${activityId}`);
      }
    },
    [activeWorkspaceId]
  );

  const importIsoCatalog = useCallback(
    async (standards: IsoStandard[], sourceLabel: string) => {
      if (!activeWorkspaceId || !isActualAdmin) return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspaceId), {
          isoStandards: standards.slice(0, 20),
          isoCatalogSource: sourceLabel.slice(0, 300),
          updatedAt: serverTimestamp(),
        });
        toast('ISO requirement references imported', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspaceId}`);
      }
    },
    [activeWorkspaceId, isActualAdmin, toast]
  );

  const restoreDemoIso = useCallback(async () => {
    await importIsoCatalog(ISO_EXAMPLE_CATALOG, 'SafeQMS ISO Standards Registry (Restored)');
  }, [importIsoCatalog]);

  const propagateMemberUids = useCallback(
    async (wsId: string, nextMemberUids: string[], extraOps: Array<(b: ReturnType<typeof writeBatch>) => void> = []) => {
      const ops: Array<(b: ReturnType<typeof writeBatch>) => void> = [...extraOps];
      ops.push((b) =>
        b.update(doc(db, 'workspaces', wsId), {
          memberUids: nextMemberUids,
          updatedAt: serverTimestamp(),
        })
      );
      for (const sub of ALL_SUBCOLLECTIONS) {
        const snap = await getDocs(collection(db, 'workspaces', wsId, sub));
        snap.docs.forEach((d) => {
          ops.push((b) =>
            b.update(d.ref, {
              memberUids: nextMemberUids,
              updatedAt: serverTimestamp(),
            })
          );
        });
      }
      await commitBatchedOps(ops);
    },
    []
  );

  const addTeamMember = useCallback(
    async (
      uid: string,
      displayName: string,
      safeqmsRole: SafeQmsRole,
      assignedSite: string,
      assignedDepartment: string
    ) => {
      if (!activeWorkspace || !isActualAdmin) {
        toast('Only workspace administrators can add members', 'error');
        return;
      }
      const cleanUid = toValidDocId(uid.trim());
      if (!cleanUid || !displayName.trim()) {
        toast('Valid Firebase User UID and display name required', 'error');
        return;
      }
      if (activeWorkspace.memberUids.length >= 50 && !activeWorkspace.memberUids.includes(cleanUid)) {
        toast('Workspace member limit (50) reached', 'error');
        return;
      }
      const nextUids = [...new Set([...activeWorkspace.memberUids, cleanUid])];
      try {
        await propagateMemberUids(activeWorkspace.id, nextUids, [
          (b) =>
            b.set(doc(db, 'workspaces', activeWorkspace.id, 'members', cleanUid), {
              uid: cleanUid,
              workspaceId: activeWorkspace.id,
              ownerUid: activeWorkspace.ownerUid,
              memberUids: nextUids,
              displayName: displayName.trim().slice(0, 120),
              safeqmsRole,
              assignedSite,
              assignedDepartment,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }),
        ]);
        toast(`Added ${displayName.trim()} (${safeqmsRole}) to workspace`, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `workspaces/${activeWorkspace.id}/members/${cleanUid}`);
      }
    },
    [activeWorkspace, isActualAdmin, propagateMemberUids, toast]
  );

  const updateTeamMember = useCallback(
    async (
      uid: string,
      patch: { displayName: string; safeqmsRole: SafeQmsRole; assignedSite: string; assignedDepartment: string }
    ) => {
      if (!activeWorkspace || !isActualAdmin) return;
      try {
        await updateDoc(doc(db, 'workspaces', activeWorkspace.id, 'members', uid), {
          displayName: patch.displayName.trim().slice(0, 120),
          safeqmsRole: patch.safeqmsRole,
          assignedSite: patch.assignedSite,
          assignedDepartment: patch.assignedDepartment,
          updatedAt: serverTimestamp(),
        });
        toast('Member role updated', 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `workspaces/${activeWorkspace.id}/members/${uid}`);
      }
    },
    [activeWorkspace, isActualAdmin, toast]
  );

  const removeTeamMember = useCallback(
    async (uid: string) => {
      if (!activeWorkspace || !isActualAdmin) return;
      if (uid === activeWorkspace.ownerUid) {
        toast('Cannot remove the workspace owner', 'error');
        return;
      }
      const nextUids = activeWorkspace.memberUids.filter((id) => id !== uid);
      try {
        await propagateMemberUids(activeWorkspace.id, nextUids, [
          (b) => b.delete(doc(db, 'workspaces', activeWorkspace.id, 'members', uid)),
        ]);
        toast('Member removed from workspace', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `workspaces/${activeWorkspace.id}/members/${uid}`);
      }
    },
    [activeWorkspace, isActualAdmin, propagateMemberUids, toast]
  );

  const value: WorkspaceContextValue = {
    authReady,
    user,
    userProfile,
    loadingWorkspace,
    firestoreError,
    clearFirestoreError: () => setFirestoreError(null),
    signInWithGoogle,
    signOutUser,
    workspaces,
    activeWorkspace,
    switchWorkspace,
    createWorkspace,
    seedOrResetWorkspace,
    retryWorkspaceSetup,
    theme,
    toggleTheme,
    route: navState.route,
    routeId: navState.routeId,
    routeGroup: ROUTE_GROUP_MAP[navState.route] || 'overview',
    navigate,
    scope,
    year,
    setScope,
    setYear,
    actualRole,
    activeRole,
    isActualAdmin,
    setPreviewRole,
    myFocusOwner,
    setMyFocusOwner,
    members,
    plans,
    goals,
    kpis,
    initiatives,
    projects,
    tasks,
    relations,
    kpiOwners,
    pulseCards,
    safetyCross,
    blockers,
    reviews,
    catchballs,
    approvals,
    activities,
    isoStandards,
    isoCatalogSource,
    domainSnapshot,
    dailyTier,
    setDailyTier,
    safetyMonth,
    setSafetyMonth,
    toasts,
    toast,
    modal,
    showModal,
    closeModal,
    saveGoal,
    submitGoal,
    decideApproval,
    revisePlan,
    recordKpiActual,
    commitCsvImport,
    cycleMatrixRelation,
    editMatrixNote,
    cycleKpiOwner,
    editKpiOwnerNote,
    createInitiative,
    updateInitiativeFocus,
    saveProjectA3,
    addProjectTask,
    toggleTaskStatus,
    createPulseCard,
    savePulseCardDetails,
    movePulseCardStatus,
    togglePulseCardDone,
    escalatePulseCard,
    delegatePulseCard,
    addPulseCardComment,
    toggleSafetyDay,
    escalateBlocker,
    resolveBlocker,
    reopenBlocker,
    convertToPdcaDecision,
    createReview,
    toggleDecision,
    addDecision,
    prepareManagementReview,
    createCatchball,
    commentCatchball,
    sendCatchball,
    counterCatchball,
    alignCatchball,
    requestChangesCatchball,
    submitCatchballForApproval,
    decideCatchballApproval,
    markActivityRead,
    importIsoCatalog,
    restoreDemoIso,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
