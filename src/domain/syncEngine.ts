import {
  ASSIGNED_DEPARTMENT,
  ASSIGNED_SITE,
  CatchballThread,
  EscalatedBlocker,
  GoalApproval,
  Initiative,
  IsoStandard,
  KpiMetric,
  KpiOwnerLink,
  MatrixRelation,
  PdcaReview,
  ProjectA3,
  ProjectTask,
  SafeQmsRole,
  StrategicGoal,
  WorkspaceActivity,
} from '../types/safeqms';

export interface DomainSnapshot {
  scope: string;
  year: string;
  activeRole: SafeQmsRole;
  goals: StrategicGoal[];
  kpis: KpiMetric[];
  initiatives: Initiative[];
  projects: ProjectA3[];
  tasks: ProjectTask[];
  relations: MatrixRelation[];
  kpiOwners: KpiOwnerLink[];
  blockers: EscalatedBlocker[];
  reviews: PdcaReview[];
  catchballs: CatchballThread[];
  approvals: GoalApproval[];
  isoStandards: IsoStandard[];
  isoCatalogSource: string;
  activities: WorkspaceActivity[];
}

export const leadershipRole = (r: string) => r === 'General director' || r === 'QMS auditor';

export function isLimitedRole(r: SafeQmsRole): boolean {
  return r === 'Department director' || r === 'Auditor' || r === 'Basic user';
}

export function goalById(goals: StrategicGoal[], id?: string): StrategicGoal | undefined {
  return id ? goals.find((g) => g.id === id) : undefined;
}

export function kpiById(kpis: KpiMetric[], id?: string): KpiMetric | undefined {
  return id ? kpis.find((k) => k.id === id) : undefined;
}

export function initById(initiatives: Initiative[], id?: string): Initiative | undefined {
  return id ? initiatives.find((i) => i.id === id) : undefined;
}

export function isoRequirement(standards: IsoStandard[], id: string) {
  for (const s of standards) {
    for (const r of s.requirements || []) {
      if (r.id === id) {
        return { ...r, standard: s.code, edition: s.edition, standardId: s.id };
      }
    }
  }
  return null;
}

export function isoName(standards: IsoStandard[], id: string): string {
  const r = isoRequirement(standards, id);
  return r ? `${r.standard} · ${r.number} — ${r.title}` : 'Unknown requirement (relink needed)';
}

export function isoShort(standards: IsoStandard[], g?: StrategicGoal): string {
  if (!g) return 'Not linked';
  return (
    (g.isoRefs || [])
      .map((id) => {
        const r = isoRequirement(standards, id);
        return r ? `${r.standard} §${r.number}` : 'Missing ISO ID';
      })
      .join(' · ') || 'Not linked'
  );
}

export function computeKpiStatus(k?: KpiMetric): {
  label: 'On track' | 'At risk' | 'Off track' | 'Not measured';
  gap: number | null;
  actual?: number;
  target?: number;
  month?: number;
  unit?: string;
  direction?: string;
  tolerance?: number;
} {
  if (!k || !Array.isArray(k.values)) return { label: 'Not measured', gap: null };
  let n = -1;
  for (let i = k.values.length - 1; i >= 0; i--) {
    if (k.values[i] !== null && k.values[i] !== undefined && Number.isFinite(Number(k.values[i]))) {
      n = i;
      break;
    }
  }
  if (n < 0 || k.targets[n] === null || k.targets[n] === undefined || !Number.isFinite(Number(k.targets[n]))) {
    return { label: 'Not measured', gap: null };
  }
  const actual = Number(k.values[n]);
  const target = Number(k.targets[n]);
  const direction = k.direction || 'higher';
  const tolerance = Math.max(0, Number(k.tolerance) || 0);
  const gap = direction === 'lower' ? target - actual : direction === 'range' ? -Math.abs(actual - target) : actual - target;
  const label = gap >= 0 ? 'On track' : gap >= -tolerance ? 'At risk' : 'Off track';
  return { label, gap, actual, target, month: n, unit: k.unit, direction, tolerance };
}

export function computeKpiStreak(k?: KpiMetric): number {
  if (!k || !Array.isArray(k.values)) return 0;
  let streak = 0;
  for (let i = k.values.length - 1; i >= 0; i--) {
    const a = k.values[i];
    const t = k.targets?.[i];
    if (a === null || a === undefined || t === null || t === undefined) continue;
    const gap = (k.direction || 'higher') === 'lower' ? Number(t) - Number(a) : Number(a) - Number(t);
    if (gap < 0) streak++;
    else break;
  }
  return streak;
}

export function computeUpdatedKpiTargets(
  g: StrategicGoal,
  k: KpiMetric,
  allGoals: StrategicGoal[]
): Array<number | null> | null {
  if (!Number.isFinite(Number(g.target))) return null;
  const hasMoreSpecificGoal =
    g.level === 'Organization' &&
    allGoals.some((x) => x.id !== g.id && x.level !== 'Organization' && x.kpi === g.kpi);
  if (hasMoreSpecificGoal) return null;

  const nextTargets = Array.isArray(k.targets) ? [...k.targets] : [];
  while (nextTargets.length < 12) nextTargets.push(Number(g.target));

  let lastIdx = -1;
  if (Array.isArray(k.values)) {
    for (let i = k.values.length - 1; i >= 0; i--) {
      if (k.values[i] !== null && k.values[i] !== undefined && Number.isFinite(Number(k.values[i]))) {
        lastIdx = i;
        break;
      }
    }
  }
  const startIdx = lastIdx >= 0 ? lastIdx : 0;
  for (let i = startIdx; i < 12; i++) nextTargets[i] = Number(g.target);
  return nextTargets;
}

export function goalPlanCheck(g: StrategicGoal, kpis: KpiMetric[]) {
  const fields: Array<[string, string, unknown]> = [
    ['title', 'Goal defined', g.title],
    ['owner', 'Accountable owner', g.owner],
    ['kpi', 'Measurable KPI linked', kpiById(kpis, g.kpi)],
    ['isoRefs', 'ISO requirement reference', (g.isoRefs || []).length],
    ['planWhat', 'What will be done', g.planWhat],
    ['resources', 'Required resources', g.resources],
    ['planDue', 'When it will be completed', g.planDue],
    ['evaluation', 'How results will be evaluated', g.evaluation],
  ];
  if (g.level !== 'Organization') fields.push(['parent', 'Primary parent goal', g.parent]);
  return {
    checks: fields.map(([key, label, v]) => ({ key, label, ok: Boolean(v) })),
    ready: fields.every(([, , v]) => Boolean(v)),
  };
}

export function goalEvidenceCheck(g: StrategicGoal, kpis: KpiMetric[]) {
  const k = kpiById(kpis, g.kpi);
  return {
    riskLinked: Boolean((g.riskRefs || '').trim()),
    processLinked: Boolean((g.processRefs || '').trim()),
    evidenceLinked: Boolean((g.evidenceRefs || '').trim()),
    hasActual: k?.values?.some((v) => v !== null && v !== undefined) || false,
  };
}

export function xm4Ancestors(goals: StrategicGoal[], g?: StrategicGoal): StrategicGoal[] {
  const found: StrategicGoal[] = [];
  const visited = new Set<string>();
  let parent = g?.parent;
  while (parent && !visited.has(parent)) {
    visited.add(parent);
    const p = goalById(goals, parent);
    if (!p) break;
    found.push(p);
    parent = p.parent;
  }
  return found;
}

export function xm4OrgParent(goals: StrategicGoal[], g: StrategicGoal): StrategicGoal | null {
  return xm4Ancestors(goals, g).find((x) => x.level === 'Organization') || null;
}

export function visibleToRole(g: StrategicGoal | undefined, r: SafeQmsRole): boolean {
  if (!g) return false;
  if (!isLimitedRole(r)) return true;
  if (r === 'Department director' || r === 'Auditor') {
    return g.level === 'Organization' || g.level === ASSIGNED_SITE || g.level === ASSIGNED_DEPARTMENT;
  }
  return g.approval === 'Approved' && (g.level === 'Organization' || g.level === ASSIGNED_SITE || g.level === ASSIGNED_DEPARTMENT);
}

export function xm4ScopeIncludes(goals: StrategicGoal[], g: StrategicGoal, scope: string, r: SafeQmsRole): boolean {
  if (scope === 'Organization') return true;
  if (g.level === scope) return true;
  const ancestors = xm4Ancestors(goals, g);
  if (ancestors.some((p) => p.level === scope)) return true;
  if (scope.startsWith('Department:') && g.level.startsWith('Site:')) {
    return goals.some((x) => x.level === scope && visibleToRole(x, r) && xm4Ancestors(goals, x).some((p) => p.id === g.id));
  }
  return false;
}

export function roleVisibleGoals(goals: StrategicGoal[], scope: string, r: SafeQmsRole): StrategicGoal[] {
  const gs = goals.filter((g) => visibleToRole(g, r));
  if (scope === 'Organization') return gs;
  return gs.filter((g) => g.level === 'Organization' || xm4ScopeIncludes(goals, g, scope, r));
}

export function visibleInitiative(i: Initiative | undefined, goals: StrategicGoal[], r: SafeQmsRole): boolean {
  if (!i) return false;
  if (!isLimitedRole(r)) return true;
  const g = goalById(goals, i.goal);
  return visibleToRole(g, r) && (i.goal === 'G-003' || g?.level === 'Site: Uppsala' || g?.level === 'Organization');
}

export function visibleProject(
  p: ProjectA3 | undefined,
  initiatives: Initiative[],
  goals: StrategicGoal[],
  r: SafeQmsRole
): boolean {
  if (!p) return false;
  return visibleInitiative(initById(initiatives, p.initiative), goals, r);
}

export function roleCan(
  r: SafeQmsRole,
  verb: string,
  obj: any,
  ctx: { goals: StrategicGoal[]; initiatives: Initiative[] }
): boolean {
  const isAdmin = r === 'Administratör';
  const isLeadership = r === 'General director' || r === 'QMS auditor';
  const isDirector = r === 'Department director';
  const isBasic = r === 'Basic user';

  if (verb === 'config') return isAdmin;
  if (verb === 'approve') return isLeadership;
  if (verb === 'evidence') return !isBasic;
  if (verb === 'viewISO') return !isBasic;
  if (verb === 'reviewWrite') return isAdmin || isLeadership || isDirector;
  if (verb === 'reviewPrepare') return isAdmin || isLeadership;
  if (verb === 'goalCreate') return isAdmin || isLeadership || (isDirector && (!obj || obj.level === ASSIGNED_DEPARTMENT));
  if (verb === 'goalEdit') return isAdmin || isLeadership || (isDirector && obj?.level === ASSIGNED_DEPARTMENT);
  if (verb === 'matrixEdit') {
    if (isAdmin || isLeadership) return true;
    if (!isDirector) return false;
    const gid = obj?.from?.startsWith('G-') ? obj.from : initById(ctx.initiatives, obj?.from)?.goal;
    return Boolean(gid) && goalById(ctx.goals, gid)?.level === ASSIGNED_DEPARTMENT;
  }
  if (verb === 'initiativeWrite') {
    return isAdmin || isLeadership || (isDirector && (!obj || goalById(ctx.goals, obj.goal)?.level === ASSIGNED_DEPARTMENT));
  }
  if (verb === 'projectWrite') {
    return isAdmin || isLeadership || (isDirector && (!obj || roleCan(r, 'initiativeWrite', initById(ctx.initiatives, obj.initiative), ctx)));
  }
  if (verb === 'kpiWrite') return isAdmin || isLeadership || (isDirector && obj?.id === 'K-002');
  if (verb === 'taskOwn') return isBasic && obj?.owner === 'Team Leader';
  if (verb === 'readAll') return !isLimitedRole(r);
  return false;
}

export function permittedParents(goals: StrategicGoal[], level: string, id?: string): StrategicGoal[] {
  if (level === 'Organization') return [];
  const targetType = level.startsWith('Site:') ? 'Organization' : level.startsWith('Department:') ? 'Site:' : null;
  if (!targetType) return [];
  const descendants = new Set<string>(id ? [id] : []);
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of goals) {
      if (candidate.parent && descendants.has(candidate.parent) && !descendants.has(candidate.id)) {
        descendants.add(candidate.id);
        changed = true;
      }
    }
  }
  return goals.filter((g) => !descendants.has(g.id) && (targetType === 'Organization' ? g.level === 'Organization' : g.level.startsWith(targetType)));
}

export function sqdcScore(i?: Initiative) {
  const s = i?.sqdc || { S: 0, Q: 0, D: 0, C: 0 };
  const vals = [Number(s.S || 0), Number(s.Q || 0), Number(s.D || 0), Number(s.C || 0)];
  const pillars = vals.filter((v) => v > 0).length;
  const weighted = vals.reduce((a, b) => a + b, 0);
  const safetyPriority = Number(s.S || 0) === 2;
  const multiPillar = pillars >= 3;
  return { s, pillars, weighted, safetyPriority, multiPillar };
}

export function initiativeLinkedToGoal(i: Initiative | undefined, goalId: string, relations: MatrixRelation[]): boolean {
  return i?.goal === goalId || relations.some((r) => r.from === goalId && r.to === i?.id && r.strength > 0);
}

export function xm4HierarchyStrength(goals: StrategicGoal[], from: string, to: string): number {
  const g = goalById(goals, from);
  if (!g || !goalById(goals, to)) return 0;
  if (g.parent === to) return 2;
  return xm4OrgParent(goals, g)?.id === to ? 1 : 0;
}

export function xm3Impact(relations: MatrixRelation[], from: string, to: string): number {
  return Number(relations.find((r) => r.from === from && r.to === to)?.strength || 0);
}

export function xm3OwnerImpact(kpiOwners: KpiOwnerLink[], kpiId: string, ownerName: string): number {
  return Number(kpiOwners.find((r) => r.kpi === kpiId && r.owner === ownerName)?.strength || 0);
}

export function xm3Data(snap: DomainSnapshot) {
  const annual = snap.goals.filter(
    (g) => g.level !== 'Organization' && visibleToRole(g, snap.activeRole) && xm4ScopeIncludes(snap.goals, g, snap.scope, snap.activeRole)
  );
  const representedRoots = new Set(annual.map((g) => xm4OrgParent(snap.goals, g)?.id).filter(Boolean));
  const org = snap.goals.filter(
    (g) =>
      g.level === 'Organization' &&
      !g.parent &&
      visibleToRole(g, snap.activeRole) &&
      (snap.scope === 'Organization' || representedRoots.has(g.id))
  );
  const initiatives = snap.initiatives.filter(
    (i) =>
      visibleInitiative(i, snap.goals, snap.activeRole) &&
      (snap.scope === 'Organization' || annual.some((g) => initiativeLinkedToGoal(i, g.id, snap.relations)))
  );
  const linkedKpiIds = new Set([
    ...annual.map((g) => g.kpi).filter(Boolean),
    ...snap.relations
      .filter((r) => initiatives.some((i) => i.id === r.from) && r.to.startsWith('K-'))
      .map((r) => r.to),
  ]);
  const kpis = snap.kpis.filter(
    (k) => (snap.scope === 'Organization' && !isLimitedRole(snap.activeRole)) || linkedKpiIds.has(k.id)
  );
  const standardOwners = [
    'Executive Management',
    'Site Manager',
    'Production Manager',
    'Maintenance Manager',
    'Quality Manager',
    'EHS Manager',
  ];
  const activeOwnerSet = new Set([
    ...standardOwners,
    ...annual.map((g) => g.owner).filter(Boolean),
    ...initiatives.map((i) => i.owner).filter(Boolean),
  ]);
  const owners = [...activeOwnerSet]
    .filter(
      (name) =>
        snap.scope === 'Organization' ||
        kpis.some((k) => xm3OwnerImpact(snap.kpiOwners, k.id, name) > 0) ||
        initiatives.some((i) => i.owner === name) ||
        annual.some((g) => g.owner === name)
    )
    .map((name) => ({ id: name, name, title: name }));

  return { org, annual, initiatives, kpis, owners };
}

export function xm3Influence(
  snap: DomainSnapshot,
  data: ReturnType<typeof xm3Data>,
  type: string,
  id: string
): Record<'corp' | 'annual' | 'initiative' | 'kpi' | 'owner', Set<string>> {
  const marked: Record<'corp' | 'annual' | 'initiative' | 'kpi' | 'owner', Set<string>> = {
    corp: new Set(),
    annual: new Set(),
    initiative: new Set(),
    kpi: new Set(),
    owner: new Set(),
  };
  if (!type || !id || !(type in marked)) return marked;
  marked[type as keyof typeof marked].add(id);
  const belongs = (g: StrategicGoal, ancestorId: string) =>
    g.id === ancestorId || xm4Ancestors(snap.goals, g).some((x) => x.id === ancestorId);
  const initiativeSupports = (g: StrategicGoal, i: Initiative) =>
    i.goal === g.id || snap.relations.some((r) => r.from === g.id && r.to === i.id && r.strength > 0);

  if (type === 'owner') {
    data.kpis.filter((k) => xm3OwnerImpact(snap.kpiOwners, k.id, id) > 0).forEach((k) => marked.kpi.add(k.id));
    data.initiatives
      .filter((i) => i.owner === id || [...marked.kpi].some((kid) => xm3Impact(snap.relations, i.id, kid) > 0))
      .forEach((i) => marked.initiative.add(i.id));
    data.annual
      .filter(
        (g) =>
          g.owner === id ||
          (g.kpi ? marked.kpi.has(g.kpi) : false) ||
          [...marked.initiative].some((iid) => {
            const init = initById(snap.initiatives, iid);
            return init ? initiativeSupports(g, init) : false;
          })
      )
      .forEach((g) => marked.annual.add(g.id));
  }
  if (type === 'corp' || type === 'annual') {
    data.annual.filter((g) => belongs(g, id)).forEach((g) => marked.annual.add(g.id));
    data.initiatives
      .filter((i) =>
        [...marked.annual].some((gid) => {
          const g = goalById(snap.goals, gid);
          return g ? initiativeSupports(g, i) : false;
        })
      )
      .forEach((i) => marked.initiative.add(i.id));
  }
  if (type === 'initiative') {
    const init = initById(snap.initiatives, id);
    if (init) {
      data.annual.filter((g) => initiativeSupports(g, init)).forEach((g) => marked.annual.add(g.id));
    }
    marked.initiative.add(id);
  }
  if (type === 'kpi') {
    data.annual.filter((g) => g.kpi === id).forEach((g) => marked.annual.add(g.id));
    data.initiatives
      .filter((i) => xm3Impact(snap.relations, i.id, id) > 0)
      .forEach((i) => marked.initiative.add(i.id));
    data.annual
      .filter((g) =>
        [...marked.initiative].some((iid) => {
          const init = initById(snap.initiatives, iid);
          return init ? initiativeSupports(g, init) : false;
        })
      )
      .forEach((g) => marked.annual.add(g.id));
  }

  data.annual
    .filter((g) => marked.annual.has(g.id))
    .forEach((g) => {
      const root = xm4OrgParent(snap.goals, g);
      if (root) marked.corp.add(root.id);
    });
  data.kpis
    .filter(
      (k) =>
        [...marked.annual].some((gid) => goalById(snap.goals, gid)?.kpi === k.id) ||
        [...marked.initiative].some((iid) => xm3Impact(snap.relations, iid, k.id) > 0)
    )
    .forEach((k) => marked.kpi.add(k.id));

  if (type !== 'owner') {
    data.owners
      .filter((o) => [...marked.kpi].some((kid) => xm3OwnerImpact(snap.kpiOwners, kid, o.id) > 0))
      .forEach((o) => marked.owner.add(o.id));
  }
  return marked;
}

export function blockerTargetInfo(
  targetType: string,
  targetId: string,
  snap: Pick<DomainSnapshot, 'goals' | 'kpis' | 'initiatives' | 'projects'>
) {
  if (targetType === 'initiative') {
    const i = initById(snap.initiatives, targetId);
    const g = i ? goalById(snap.goals, i.goal) : undefined;
    return {
      title: i?.title || targetId,
      code: targetId,
      typeLabel: 'Initiative',
      scope: g?.level || 'Organization',
      owner: i?.owner || g?.owner || 'Initiative Owner',
      status: i?.status || 'Unknown',
      route: 'initiative' as const,
      routeId: targetId,
      goal: g,
    };
  }
  if (targetType === 'project') {
    const p = snap.projects.find((x) => x.id === targetId);
    const i = p ? initById(snap.initiatives, p.initiative) : undefined;
    const g = i ? goalById(snap.goals, i.goal) : undefined;
    return {
      title: p?.title || targetId,
      code: targetId,
      typeLabel: 'Project A3',
      scope: g?.level || 'Organization',
      owner: p?.owner || i?.owner || 'Project Leader',
      status: p?.status || 'Unknown',
      route: 'project' as const,
      routeId: targetId,
      goal: g,
    };
  }
  if (targetType === 'kpi') {
    const k = kpiById(snap.kpis, targetId);
    const linkedGoals = snap.goals.filter((g) => g.kpi === targetId);
    const primaryGoal = linkedGoals.find((g) => g.level !== 'Organization') || linkedGoals[0];
    const st = computeKpiStatus(k);
    return {
      title: k?.name || targetId,
      code: targetId,
      typeLabel: 'KPI',
      scope: primaryGoal?.level || 'Organization',
      owner: primaryGoal?.owner || 'KPI Owner',
      status: st.label,
      route: 'kpis' as const,
      routeId: targetId,
      goal: primaryGoal,
    };
  }
  const g = goalById(snap.goals, targetId);
  return {
    title: g?.title || targetId,
    code: targetId,
    typeLabel: 'Goal',
    scope: g?.level || 'Organization',
    owner: g?.owner || 'Goal Owner',
    status: g?.performance || 'Unknown',
    route: 'goal' as const,
    routeId: targetId,
    goal: g,
  };
}

export function blockerMatchesScope(scope: string, activeScope: string): boolean {
  if (!activeScope || activeScope === 'Organization') return true;
  if (scope === activeScope || scope === 'Organization') return true;
  if (activeScope.startsWith('Department:') && scope === ASSIGNED_SITE) return true;
  if (activeScope === ASSIGNED_SITE && scope.startsWith('Department:')) return true;
  return false;
}

export function blockerAllowedByRole(
  b: EscalatedBlocker,
  snap: Pick<DomainSnapshot, 'activeRole' | 'goals' | 'kpis' | 'initiatives' | 'projects'>
): boolean {
  if (!isLimitedRole(snap.activeRole)) return true;
  const info = blockerTargetInfo(b.targetType, b.targetId, snap);
  if (info.goal) return visibleToRole(info.goal, snap.activeRole);
  return [ASSIGNED_DEPARTMENT, ASSIGNED_SITE, 'Organization'].includes(b.scope);
}

export function canEscalateTarget(
  targetType: string,
  targetId: string,
  snap: Pick<DomainSnapshot, 'activeRole' | 'goals' | 'initiatives' | 'projects'>
): boolean {
  if (snap.activeRole === 'Administratör' || leadershipRole(snap.activeRole)) return true;
  if (snap.activeRole !== 'Department director') return false;
  if (targetType === 'initiative') return visibleInitiative(initById(snap.initiatives, targetId), snap.goals, snap.activeRole);
  if (targetType === 'project') {
    const p = snap.projects.find((x) => x.id === targetId);
    return visibleProject(p, snap.initiatives, snap.goals, snap.activeRole);
  }
  if (targetType === 'kpi') return snap.goals.some((g) => visibleToRole(g, snap.activeRole) && g.kpi === targetId);
  const g = goalById(snap.goals, targetId);
  return Boolean(g) && (g?.level === ASSIGNED_DEPARTMENT || g?.level === ASSIGNED_SITE);
}

export function detectAutoSignals(
  snap: DomainSnapshot,
  activeScope = snap.scope,
  respectScope = true
): EscalatedBlocker[] {
  const signals: EscalatedBlocker[] = [];
  const activeManualKeys = new Set(
    snap.blockers.filter((b) => b.status !== 'Resolved').map((b) => `${b.targetType}:${b.targetId}`)
  );

  const hasOpenReviewDecision = (targetType: string, targetId: string) => {
    for (const r of snap.reviews) {
      const idx = (r.decisions || []).findIndex(
        (d) => d.status === 'Open' && d.linkedType === targetType && d.linkedId === targetId
      );
      if (idx >= 0) return { reviewId: r.id, decisionIndex: idx };
    }
    return null;
  };

  for (const k of snap.kpis) {
    const st = computeKpiStatus(k);
    const streak = computeKpiStreak(k);
    if (st.label === 'Off track' || (st.label === 'At risk' && streak >= 2)) {
      const info = blockerTargetInfo('kpi', k.id, snap);
      if (isLimitedRole(snap.activeRole) && info.goal && !visibleToRole(info.goal, snap.activeRole)) continue;
      if (respectScope && !blockerMatchesScope(info.scope, activeScope)) continue;
      const linkedRev = hasOpenReviewDecision('kpi', k.id);
      signals.push({
        id: `AUTO-KPI-${k.id}`,
        workspaceId: k.workspaceId,
        ownerUid: k.ownerUid,
        memberUids: k.memberUids,
        isAuto: true,
        targetType: 'kpi',
        targetId: k.id,
        scope: info.scope,
        category: st.label === 'Off track' ? 'Off-track KPI' : 'Recurring KPI Risk',
        severity: st.label === 'Off track' ? 'Critical' : 'High',
        summary: `${k.name}: actual ${st.actual} ${k.unit} vs target ${st.target} ${k.unit} (gap ${st.gap !== null ? Number(st.gap).toFixed(1) : '—'}, ${streak} consecutive month${streak === 1 ? '' : 's'} adverse).`,
        neededAction: 'Investigate root cause and agree corrective countermeasures in PDCA Review.',
        owner: info.owner,
        status: linkedRev ? 'In review' : 'Open',
        reviewId: linkedRev?.reviewId,
        hasManualBlocker: activeManualKeys.has(`kpi:${k.id}`),
      });
    }
  }

  for (const i of snap.initiatives) {
    if (i.status === 'At risk' && visibleInitiative(i, snap.goals, snap.activeRole)) {
      const info = blockerTargetInfo('initiative', i.id, snap);
      if (respectScope && !blockerMatchesScope(info.scope, activeScope)) continue;
      if (activeManualKeys.has(`initiative:${i.id}`)) continue;
      const linkedRev = hasOpenReviewDecision('initiative', i.id);
      signals.push({
        id: `AUTO-INIT-${i.id}`,
        workspaceId: i.workspaceId,
        ownerUid: i.ownerUid,
        memberUids: i.memberUids,
        isAuto: true,
        targetType: 'initiative',
        targetId: i.id,
        scope: info.scope,
        category: 'At-risk Initiative',
        severity: 'High',
        summary: `${i.title} is flagged At risk (${i.progress}% executed) without a logged blocker escalation.`,
        neededAction: 'Verify delivery barriers or escalate specific resource needs to PDCA Review.',
        owner: i.owner,
        status: linkedRev ? 'In review' : 'Open',
        reviewId: linkedRev?.reviewId,
        hasManualBlocker: false,
      });
    }
  }

  return signals;
}

export function pdcaExceptionQueue(
  snap: DomainSnapshot,
  activeScope = snap.scope,
  respectScope = true
): EscalatedBlocker[] {
  const manual = snap.blockers
    .filter(
      (b) =>
        b.status !== 'Resolved' &&
        blockerAllowedByRole(b, snap) &&
        (!respectScope || blockerMatchesScope(b.scope, activeScope))
    )
    .map((b) => ({ ...b, isAuto: false }));
  const auto = detectAutoSignals(snap, activeScope, respectScope);
  const sevOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2 };
  return [...manual, ...auto].sort((a, b) => (sevOrder[a.severity] ?? 3) - (sevOrder[b.severity] ?? 3));
}

export function cbTurn(c: CatchballThread): string | null {
  return (
    c.turn ||
    (c.status === 'Awaiting department'
      ? 'Department director'
      : c.status === 'Awaiting director'
        ? 'General director'
        : c.status === 'Changes requested'
          ? leadershipRole(c.origin)
            ? c.origin
            : 'Department director'
          : null)
  );
}

export function cbCanRead(c: CatchballThread, goals: StrategicGoal[], r: SafeQmsRole): boolean {
  if (r === 'Basic user') return false;
  const g = goalById(goals, c.goal);
  return Boolean(g) && visibleToRole(g, r);
}

export function cbCanWrite(c: CatchballThread, goals: StrategicGoal[], r: SafeQmsRole): boolean {
  const g = goalById(goals, c.goal);
  if (!c || !g || !cbCanRead(c, goals, r)) return false;
  if (leadershipRole(r)) return true;
  if (r === 'Department director') {
    return c.recipientScope === ASSIGNED_DEPARTMENT && (leadershipRole(c.origin) || g.level === ASSIGNED_DEPARTMENT);
  }
  return false;
}

export function cbCanAct(
  c: CatchballThread,
  action: string,
  r: SafeQmsRole,
  goals: StrategicGoal[],
  initiatives: Initiative[]
): boolean {
  if (!cbCanWrite(c, goals, r)) return false;
  const st = c.status;
  const turn = cbTurn(c);
  const myTurn = turn === r || (leadershipRole(r) && Boolean(turn && leadershipRole(turn)));
  if (action === 'send') return (st === 'Draft' && c.origin === r) || (st === 'Changes requested' && myTurn);
  if (action === 'comment') return !['Approved', 'Rejected', 'Cancelled'].includes(st);
  if (['counter', 'align', 'changes'].includes(action)) {
    return (st === 'Awaiting director' || st === 'Awaiting department') && myTurn;
  }
  if (action === 'approval') {
    const g = goalById(goals, c.goal);
    return (
      st === 'Aligned' &&
      (leadershipRole(r) || (r === 'Department director' && roleCan(r, 'goalEdit', g, { goals, initiatives })))
    );
  }
  return false;
}

export function managementSummary(snap: DomainSnapshot) {
  const gs = roleVisibleGoals(snap.goals, snap.scope, snap.activeRole);
  const blockers = snap.blockers.filter(
    (b) => b.status !== 'Resolved' && blockerAllowedByRole(b, snap) && blockerMatchesScope(b.scope, snap.scope)
  );
  const atRiskInits = snap.initiatives.filter(
    (i) => i.status === 'At risk' && visibleInitiative(i, snap.goals, snap.activeRole)
  );
  const scopedReviews = snap.reviews.filter(
    (r) =>
      (!isLimitedRole(snap.activeRole) || blockerMatchesScope(r.scope, ASSIGNED_DEPARTMENT)) &&
      blockerMatchesScope(r.scope, snap.scope)
  );
  return {
    complete: gs.filter((g) => goalPlanCheck(g, snap.kpis).ready),
    gaps: gs.filter((g) => !goalPlanCheck(g, snap.kpis).ready),
    off: gs.filter((g) => g.performance === 'Off track'),
    risk: gs.filter((g) => g.performance === 'At risk'),
    on: gs.filter((g) => g.performance === 'On track'),
    notMeasured: gs.filter((g) => g.performance === 'Not measured'),
    open: scopedReviews.flatMap((r) => (r.decisions || []).filter((d) => d.status === 'Open')),
    pending: snap.approvals.filter(
      (a) => a.status === 'Pending' && visibleToRole(goalById(snap.goals, a.goal), snap.activeRole)
    ),
    blockers,
    atRiskInits,
    goals: gs,
  };
}

export function auditPacket(goals: StrategicGoal[], snap: DomainSnapshot) {
  const selected = goals.map((g) => {
    const k = kpiById(snap.kpis, g.kpi);
    const q = computeKpiStatus(k);
    const plan = goalPlanCheck(g, snap.kpis);
    const ev = goalEvidenceCheck(g, snap.kpis);
    return {
      goal: {
        id: g.id,
        title: g.title,
        level: g.level,
        owner: g.owner,
        period: g.year,
        approval: g.approval,
        revision: g.revision,
        status: g.status,
        performance: q.label,
        parent: g.parent,
      },
      isoRequirements: (g.isoRefs || []).map((r) => {
        const x = isoRequirement(snap.isoStandards, r);
        return x
          ? { id: x.id, standardId: x.standardId, standard: x.standard, edition: x.edition, clause: x.number, title: x.title }
          : { id: r, unresolved: true };
      }),
      planning: {
        what: g.planWhat,
        resources: g.resources,
        responsible: g.owner,
        due: g.planDue,
        evaluation: g.evaluation,
        readiness: plan.ready,
        missing: plan.checks.filter((x) => !x.ok).map((x) => x.label),
      },
      linkedRecords: {
        riskReferences: g.riskRefs,
        processReferences: g.processRefs,
        documentReferences: g.evidenceRefs,
        evidenceStatus: ev,
      },
      measurement: k
        ? {
            id: k.id,
            name: k.name,
            unit: k.unit,
            direction: k.direction,
            tolerance: k.tolerance,
            source: k.source,
            monthlyTargets: k.targets,
            monthlyActuals: k.values,
            latest: q,
          }
        : null,
      approvals: snap.approvals.filter((a) => a.goal === g.id),
      relatedInitiatives: snap.initiatives
        .filter((i) => initiativeLinkedToGoal(i, g.id, snap.relations))
        .map((i) => ({ id: i.id, title: i.title, owner: i.owner, progress: i.progress, status: i.status })),
    };
  });

  const scopedReviews = snap.reviews.filter(
    (r) =>
      (!isLimitedRole(snap.activeRole) || blockerMatchesScope(r.scope, ASSIGNED_DEPARTMENT)) &&
      blockerMatchesScope(r.scope, snap.scope)
  );

  return {
    title: 'SafeQMS Goal Management — Audit Evidence Pack',
    generatedAt: new Date().toISOString().slice(0, 10),
    scope: snap.scope,
    year: snap.year,
    catalogSource: snap.isoCatalogSource,
    goals: selected,
    reviewDecisions: scopedReviews.flatMap((r) => (r.decisions || []).map((d) => ({ ...d, review: r.id, reviewDate: r.date }))),
    history: snap.activities.filter((a) => a.kind === 'history').map((a) => a.payload),
    goalRevisions: snap.activities.filter((a) => a.kind === 'goalRevision').map((a) => a.payload),
  };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === delimiter && !quoted) {
      out.push(cell.trim());
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (quoted) throw new Error('Unclosed quoted CSV value');
  out.push(cell.trim());
  return out;
}

function monthIndex(m: string): number {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const v = String(m || '').trim().toLowerCase();
  const idx = months.indexOf(v.slice(0, 3));
  if (idx >= 0) return idx;
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return Number(v.slice(5)) - 1;
  if (/^(0?[1-9]|1[012])$/.test(v)) return Number(v) - 1;
  return -1;
}

export interface ParsedCsvRecord {
  key: string;
  index: number;
  actual: number;
  target: number | null;
  row: number;
}

export function parseCsvText(
  text: string,
  kpis: KpiMetric[]
): { errors: string[]; records: ParsedCsvRecord[] } {
  const lines = String(text || '')
    .replace(/^\ufeff/, '')
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const errors: string[] = [];
  const records: ParsedCsvRecord[] = [];
  if (lines.length < 2) return { errors: ['Expected CSV header and at least one data row'], records };
  const delimiter = (lines[0].match(/;/g) || []).length > (lines[0].match(/,/g) || []).length ? ';' : ',';
  const heads = parseCsvLine(lines[0], delimiter).map((x) => x.toLowerCase().replace(/[\s-]+/g, '_'));
  for (const c of ['kpi_id', 'month', 'actual']) {
    if (!heads.includes(c)) errors.push('Missing CSV column: ' + c);
  }
  if (errors.length) return { errors, records };

  for (let i = 1; i < lines.length; i++) {
    try {
      const cells = parseCsvLine(lines[i], delimiter);
      const obj = Object.fromEntries(heads.map((h, j) => [h, cells[j] ?? '']));
      const key = obj.kpi_id;
      const idx = monthIndex(obj.month);
      if (!kpiById(kpis, key)) throw new Error('Unknown KPI ID ' + key);
      if (idx < 0) throw new Error('Invalid month ' + obj.month);
      if (/^\d{4}-/.test(obj.month) && obj.month.slice(0, 4) !== '2027') {
        throw new Error('KPI series covers 2027 only in current template');
      }
      const num = (v: unknown) => Number(delimiter === ';' ? String(v).replace(',', '.') : v);
      if (!obj.actual || !Number.isFinite(num(obj.actual))) throw new Error('Invalid actual ' + obj.actual);
      if (obj.target && !Number.isFinite(num(obj.target))) throw new Error('Invalid target ' + obj.target);
      records.push({
        key,
        index: idx,
        actual: num(obj.actual),
        target: obj.target !== '' ? num(obj.target) : null,
        row: i + 1,
      });
    } catch (e: unknown) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const keys = new Set<string>();
  for (const r of records) {
    const key = r.key + ':' + r.index;
    if (keys.has(key)) errors.push(`Duplicate row for ${key}`);
    keys.add(key);
  }
  return { errors, records };
}

export function normalizeCatalog(v: any): IsoStandard[] {
  const items = Array.isArray(v) ? v : v?.standards;
  if (!Array.isArray(items) || !items.length) throw new Error('Expected a non-empty standards array');
  const seen = new Set<string>();
  return items.map((s: any) => {
    if (!s || typeof s.id !== 'string' || !/^[\w.:-]{2,90}$/.test(s.id) || !/^ISO\s*\d{4,5}$/i.test(s.code || '')) {
      throw new Error('Invalid standard: id and ISO code are required');
    }
    if (!Array.isArray(s.requirements) || !s.requirements.length) {
      throw new Error('Standard ' + s.code + ' has no requirement chapters');
    }
    const reqs = s.requirements.map((r: any) => {
      if (!r || typeof r.id !== 'string' || !/^[\w.:-]{2,100}$/.test(r.id) || !String(r.number || '').trim() || !String(r.title || '').trim()) {
        throw new Error('Invalid requirement in ' + s.code);
      }
      if (seen.has(r.id)) throw new Error('Duplicate requirement id ' + r.id);
      seen.add(r.id);
      return { id: r.id, number: String(r.number), title: String(r.title) };
    });
    return { id: s.id, code: s.code, edition: String(s.edition || 'Version managed in SafeQMS'), requirements: reqs };
  });
}
