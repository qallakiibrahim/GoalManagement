export type SafeQmsRole =
  | 'Administratör'
  | 'General director'
  | 'Department director'
  | 'QMS auditor'
  | 'Auditor'
  | 'Basic user';

export const SAFEQMS_ROLES: SafeQmsRole[] = [
  'Administratör',
  'General director',
  'Department director',
  'QMS auditor',
  'Auditor',
  'Basic user'
];

export const ALL_SCOPES = [
  'Organization',
  'Site: Uppsala',
  'Site: Falkenberg',
  'Department: Production',
  'Department: Maintenance',
  'Department: Quality'
];

export const ASSIGNED_DEPARTMENT = 'Department: Production';
export const ASSIGNED_SITE = 'Site: Uppsala';

export type RouteGroup =
  | 'overview'
  | 'daily'
  | 'strategy'
  | 'execution'
  | 'performance'
  | 'alignment'
  | 'compliance'
  | 'settings';

export type AppRoute =
  | 'overview'
  | 'daily'
  | 'myfocus'
  | 'pillars'
  | 'cascade'
  | 'matrix'
  | 'a3'
  | 'goal'
  | 'newgoal'
  | 'projects'
  | 'initiative'
  | 'newinitiative'
  | 'project'
  | 'kpis'
  | 'import'
  | 'catchball'
  | 'catchballnew'
  | 'catchballitem'
  | 'reviews'
  | 'newreview'
  | 'review'
  | 'approvals'
  | 'iso'
  | 'evidence'
  | 'management'
  | 'settings';

export interface BaseWorkspaceDoc {
  workspaceId: string;
  ownerUid: string;
  memberUids: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  defaultWorkspaceId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface IsoRequirement {
  id: string;
  number: string;
  title: string;
}

export interface IsoStandard {
  id: string;
  code: string;
  edition: string;
  requirements: IsoRequirement[];
}

export interface WorkspaceDoc {
  id: string;
  name: string;
  ownerUid: string;
  memberUids: string[];
  scope: string;
  year: string;
  isoCatalogSource?: string;
  isoStandards?: IsoStandard[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface WorkspaceMember extends BaseWorkspaceDoc {
  uid: string;
  displayName: string;
  safeqmsRole: SafeQmsRole;
  assignedSite?: string;
  assignedDepartment?: string;
}

export interface StrategyPlan extends BaseWorkspaceDoc {
  id: string;
  scope: string;
  period: string;
  name: string;
  status: 'Draft' | 'Pending' | 'Approved';
  revision: number;
  owner: string;
}

export interface StrategicGoal extends BaseWorkspaceDoc {
  id: string;
  title: string;
  level: string;
  parent?: string;
  owner: string;
  year: string;
  kpi?: string;
  baseline?: number;
  target?: number;
  unit?: string;
  status: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  approval: 'Draft' | 'Pending' | 'Approved';
  performance: 'On track' | 'At risk' | 'Off track' | 'Not measured';
  iso?: string;
  description?: string;
  planWhat?: string;
  resources?: string;
  planDue?: string;
  evaluation?: string;
  isoRefs?: string[];
  riskRefs?: string;
  processRefs?: string;
  evidenceRefs?: string;
  revision: number;
}

export interface KpiMetric extends BaseWorkspaceDoc {
  id: string;
  name: string;
  unit: string;
  direction: 'higher' | 'lower' | 'range';
  tolerance: number;
  values: Array<number | null>;
  targets: Array<number | null>;
  source?: string;
  sourceUpdated?: string;
}

export interface SqdcMatrix {
  S: number;
  Q: number;
  D: number;
  C: number;
}

export interface Initiative extends BaseWorkspaceDoc {
  id: string;
  title: string;
  owner: string;
  goal: string;
  status: 'Planned' | 'On track' | 'At risk' | 'Completed';
  progress: number;
  budget?: string;
  description?: string;
  sqdc: SqdcMatrix;
  valueStream?: string;
  isBottleneck: boolean;
}

export interface FiveWhyStep {
  level: number;
  question: string;
  answer: string;
}

export type EscalationTier = 'Direct Fix' | '5-Why' | 'Full A3';

export interface ProjectA3 extends BaseWorkspaceDoc {
  id: string;
  title: string;
  initiative: string;
  owner: string;
  status: 'Planned' | 'On track' | 'At risk' | 'Completed';
  progress: number;
  escalationTier?: EscalationTier;
  problem?: string;
  current?: string;
  target?: string;
  root?: string;
  fiveWhys?: FiveWhyStep[];
  counter?: string;
  learning?: string;
}

export interface ProjectTask extends BaseWorkspaceDoc {
  id: string;
  project: string;
  title: string;
  owner: string;
  due?: string;
  status: 'Open' | 'In progress' | 'Done';
}

export interface MatrixRelation extends BaseWorkspaceDoc {
  id: string;
  from: string;
  to: string;
  strength: number;
  note?: string;
}

export interface KpiOwnerLink extends BaseWorkspaceDoc {
  id: string;
  kpi: string;
  owner: string;
  strength: number;
  note?: string;
}

export interface PulseComment {
  by: string;
  at: string;
  text: string;
}

export interface PulseCard extends BaseWorkspaceDoc {
  id: string;
  title: string;
  details?: string;
  due?: string;
  scope: string;
  routeType: 'Direct fix' | 'A3' | 'Escalate';
  owner: string;
  kpi?: string;
  initiative?: string;
  project?: string;
  blockerId?: string;
  status: 'Team action' | 'Escalated' | 'Done';
  delegatedBy?: string;
  delegatedAt?: string;
  delegationNote?: string;
  createdDate?: string;
  comments: PulseComment[];
}

export type SafetyDayState = 'green' | 'amber' | 'red';

export interface SafetyCrossMonth extends BaseWorkspaceDoc {
  id: string;
  scope: string;
  month: string; // YYYY-MM
  days: Record<string, SafetyDayState>;
}

export interface EscalatedBlocker extends BaseWorkspaceDoc {
  id: string;
  targetType: 'initiative' | 'project' | 'kpi' | 'goal';
  targetId: string;
  scope: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium';
  summary: string;
  neededAction: string;
  owner: string;
  raisedBy?: string;
  raisedAt?: string;
  status: 'Open' | 'In review' | 'Resolved';
  source?: string;
  reviewId?: string;
  decisionIndex?: number;
  resolvedAt?: string;
  resolutionNote?: string;
  isAuto?: boolean;
  hasManualBlocker?: boolean;
}

export interface PdcaDecision {
  text: string;
  owner: string;
  due: string;
  status: 'Open' | 'Done';
  blockerId?: string;
  linkedType?: string;
  linkedId?: string;
}

export interface PdcaReview extends BaseWorkspaceDoc {
  id: string;
  title: string;
  date: string;
  scope: string;
  notes?: string;
  decisions: PdcaDecision[];
  source?: string;
}

export interface CatchballMessage {
  id: string;
  at: string;
  by: string;
  kind: string;
  text: string;
  target?: number | null;
  resources?: string;
}

export interface CatchballProposal {
  target: number;
  resources: string;
  due?: string;
  reason?: string;
}

export interface CatchballThread extends BaseWorkspaceDoc {
  id: string;
  goal: string;
  status:
    | 'Draft'
    | 'Awaiting director'
    | 'Awaiting department'
    | 'Changes requested'
    | 'Aligned'
    | 'Pending approval'
    | 'Approved'
    | 'Rejected'
    | 'Cancelled';
  recipientScope?: string;
  recipientRole?: string;
  origin: string;
  turn?: string;
  proposal: CatchballProposal;
  messages: CatchballMessage[];
  createdDate?: string;
  updatedDate?: string;
}

export interface GoalApproval extends BaseWorkspaceDoc {
  id: string;
  goal: string;
  catchballId?: string;
  requester: string;
  approver: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Changes requested' | 'Superseded';
  comment?: string;
  date?: string;
  resolvedAt?: string;
  proposedTarget?: number;
  proposedResources?: string;
}

export type ActivityKind =
  | 'history'
  | 'cbNotification'
  | 'directorDecision'
  | 'directorNotification'
  | 'goalRevision'
  | 'csvImport';

export interface WorkspaceActivity extends BaseWorkspaceDoc {
  id: string;
  kind: ActivityKind;
  payload: Record<string, any>;
  read?: boolean;
}
