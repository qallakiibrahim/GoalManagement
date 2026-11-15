import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Compass,
  FileCheck2,
  FileSpreadsheet,
  FolderKanban,
  GitBranch,
  Grid3X3,
  Kanban,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareMore,
  Moon,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  Upload,
  UserCog,
  X,
} from 'lucide-react';
import { AppRoute, SAFEQMS_ROLES, SafeQmsRole } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import { isLimitedRole, leadershipRole, roleCan } from '../../domain/syncEngine';
import { FirestoreErrorBanner, SkeletonView } from '../ui/SkeletonView';
import { ModalHost } from '../ui/ModalHost';
import { ToastHost } from '../ui/ToastHost';

interface NavItem {
  route: AppRoute;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hidden?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ROUTE_TITLES: Record<AppRoute, string> = {
  overview: 'Overview',
  daily: 'Daily Management Board',
  myfocus: 'Personal Obeya',
  pillars: 'Strategic Pillars',
  cascade: 'Goal Cascade',
  matrix: 'Hoshin X-Matrix',
  a3: 'Strategy A3',
  goal: 'Strategic Goal',
  newgoal: 'New Strategic Goal',
  projects: 'Initiatives & Projects',
  initiative: 'Initiative Detail',
  newinitiative: 'New Initiative',
  project: 'Project A3 & 5-Why',
  kpis: 'KPIs & Bowling Chart',
  import: 'CSV KPI Import',
  catchball: 'Catchball Alignment',
  catchballnew: 'New Catchball Thread',
  catchballitem: 'Catchball Negotiation',
  reviews: 'PDCA Reviews',
  newreview: 'New PDCA Review',
  review: 'PDCA Review Detail',
  approvals: 'Formal Approvals',
  iso: 'ISO Compliance Register',
  evidence: 'Audit Evidence Pack',
  management: 'Management Review Input',
  settings: 'Team & Workspace Settings',
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    authReady,
    user,
    loadingWorkspace,
    signInWithGoogle,
    signOutUser,
    activeWorkspace,
    workspaces,
    switchWorkspace,
    retryWorkspaceSetup,
    theme,
    toggleTheme,
    route,
    navigate,
    actualRole,
    activeRole,
    isActualAdmin,
    setPreviewRole,
    goals,
    initiatives,
    activities,
    markActivityRead,
  } = useWorkspace();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <SkeletonView />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[var(--ink)]">SafeQMS Goal Management</h1>
              <p className="text-xs text-[var(--muted)]">Hoshin Kanri · Daily Management · ISO Governance</p>
            </div>
          </div>

          <div className="space-y-2.5 border-y border-[var(--border)] py-4 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-2.5 text-[var(--ink)] font-medium">
              <Grid3X3 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>360° Interactive Hoshin X-Matrix &amp; Goal Cascade</span>
            </div>
            <div className="flex items-center gap-2.5 text-[var(--ink)] font-medium">
              <Kanban className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Tier 1–3 Daily Management, Safety Cross &amp; Escalation</span>
            </div>
            <div className="flex items-center gap-2.5 text-[var(--ink)] font-medium">
              <FileCheck2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>Project A3 + 5-Why Builder &amp; ISO 9001/14001/45001 Evidence</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700 transition-colors cursor-pointer"
          >
            <span>Sign in with Google</span>
          </button>

          <p className="text-[11px] text-center text-[var(--muted)]">
            Shared team workspaces sync in real time via Firebase Firestore.
          </p>
        </div>
        <ToastHost />
      </div>
    );
  }

  const isBasic = activeRole === 'Basic user';
  const canCreateGoal = roleCan(activeRole, 'goalCreate', null, { goals, initiatives });
  const canWriteKpi = roleCan(activeRole, 'kpiWrite', { id: 'K-002' }, { goals, initiatives });

  const sections: NavSection[] = [
    {
      title: 'Workspace',
      items: [{ route: 'overview', label: 'Overview', icon: LayoutDashboard }],
    },
    {
      title: 'Daily Operations',
      items: [
        { route: 'daily', label: 'Daily Board', icon: Kanban },
        { route: 'myfocus', label: 'My Focus (Obeya)', icon: Compass },
      ],
    },
    {
      title: 'Strategy Deployment',
      items: [
        { route: 'pillars', label: 'Strategic Pillars', icon: Layers },
        { route: 'cascade', label: 'Goal Cascade', icon: GitBranch },
        { route: 'matrix', label: 'X-Matrix', icon: Grid3X3 },
        { route: 'a3', label: 'Strategy A3', icon: Target },
      ],
    },
    {
      title: 'Execution & KPIs',
      items: [
        { route: 'projects', label: 'Initiatives & A3', icon: FolderKanban },
        { route: 'kpis', label: 'KPIs & Bowling Chart', icon: BarChart3 },
        { route: 'import', label: 'CSV KPI Import', icon: Upload, hidden: !canWriteKpi && isLimitedRole(activeRole) },
      ],
    },
    {
      title: 'Governance',
      items: [
        { route: 'catchball', label: 'Catchball Alignment', icon: MessageSquareMore, hidden: isBasic },
        { route: 'reviews', label: 'PDCA Reviews', icon: RefreshCw },
        { route: 'approvals', label: 'Formal Approvals', icon: CheckCircle2, hidden: isBasic },
      ],
    },
    {
      title: 'ISO Assurance',
      items: [
        { route: 'iso', label: 'ISO Compliance', icon: Award, hidden: isBasic },
        { route: 'evidence', label: 'Audit Evidence Pack', icon: ClipboardCheck, hidden: isBasic },
        { route: 'management', label: 'Management Review', icon: FileSpreadsheet, hidden: isBasic },
      ],
    },
    {
      title: 'Administration',
      items: [{ route: 'settings', label: 'Team & Settings', icon: Settings, hidden: !isActualAdmin }],
    },
  ];

  // Unread Catchball notifications for current role
  const cbUnread = activities.filter(
    (a) =>
      a.kind === 'cbNotification' &&
      !a.read &&
      (a.payload?.recipient === activeRole || (leadershipRole(activeRole) && leadershipRole(String(a.payload?.recipient || ''))))
  );

  // Director unread notifications
  const dirUnread =
    activeRole === 'General director'
      ? activities.filter((a) => a.kind === 'directorNotification' && !a.read)
      : [];

  const NavList = (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {workspaces.length > 1 && (
        <div className="px-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">
            Active Workspace
          </label>
          <select
            value={activeWorkspace?.id || ''}
            onChange={(e) => switchWorkspace(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]"
          >
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {sections.map((sec) => {
        const visibleItems = sec.items.filter((i) => !i.hidden);
        if (!visibleItems.length) return null;
        return (
          <div key={sec.title} className="space-y-1">
            <div className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {sec.title}
            </div>
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  route === item.route ||
                  (item.route === 'cascade' && (route === 'goal' || route === 'newgoal')) ||
                  (item.route === 'projects' && (route === 'initiative' || route === 'newinitiative' || route === 'project')) ||
                  (item.route === 'catchball' && (route === 'catchballnew' || route === 'catchballitem')) ||
                  (item.route === 'reviews' && (route === 'review' || route === 'newreview'));
                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => {
                      navigate(item.route);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      {/* 3-Zone Topbar */}
      <header className="sticky top-0 z-30 h-14 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between gap-4 no-print">
        {/* Zone 1: Left Brand + Workspace */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => navigate('overview')}
            className="flex items-center gap-2 text-left cursor-pointer whitespace-nowrap shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-[var(--ink)]">SafeQMS</span>
          </button>
          {activeWorkspace && (
            <span className="hidden sm:inline text-xs text-[var(--muted)] truncate max-w-[180px]">
              · {activeWorkspace.name}
            </span>
          )}
        </div>

        {/* Zone 2: Center Breadcrumb */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--muted)] whitespace-nowrap min-w-0">
          <span>SafeQMS</span>
          <span>/</span>
          <span className="font-semibold text-[var(--ink)] truncate">{ROUTE_TITLES[route] || route}</span>
        </div>

        {/* Zone 3: Right Actions */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          {canCreateGoal && (
            <button
              type="button"
              onClick={() => navigate('newgoal')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Goal
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-1.5 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            aria-label="Toggle color theme"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div ref={userMenuRef} className="relative pl-2 border-l border-[var(--border)]">
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              title="Account & Administration"
            >
              <div className="hidden sm:block text-right leading-tight">
                <div className="font-semibold text-xs text-[var(--ink)] max-w-[140px] truncate">
                  {user.displayName || user.email}
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  {activeRole}
                  {isActualAdmin ? ' · Administration' : ''}
                </div>
              </div>
              <span className="sm:hidden text-xs font-semibold text-[var(--ink)] max-w-[90px] truncate">
                {user.displayName?.split(' ')[0] || 'Account'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-lg py-2 z-50"
              >
                <div className="px-3.5 py-2 border-b border-[var(--border)] space-y-0.5">
                  <div className="text-xs font-bold text-[var(--ink)] truncate">
                    {user.displayName || user.email}
                  </div>
                  {user.email && (
                    <div className="text-[11px] text-[var(--muted)] truncate">{user.email}</div>
                  )}
                  <div className="pt-1 flex items-center justify-between text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                    <span>{actualRole}</span>
                    {activeWorkspace && (
                      <span className="text-[var(--muted)] font-normal truncate max-w-[120px]">
                        {activeWorkspace.name}
                      </span>
                    )}
                  </div>
                </div>

                {isActualAdmin && (
                  <div className="py-1.5 border-b border-[var(--border)]">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        navigate('settings');
                        setUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                        route === 'settings'
                          ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                          : 'text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <UserCog className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <div className="min-w-0">
                        <div>Administration</div>
                        <div className="text-[10px] font-normal text-[var(--muted)]">
                          Team, användarroller &amp; arbetsyta
                        </div>
                      </div>
                    </button>

                    <div className="px-3.5 pt-2 pb-1 space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        Role Preview
                      </label>
                      <select
                        value={activeRole}
                        onChange={(e) => setPreviewRole(e.target.value as SafeQmsRole)}
                        className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-1 text-xs font-semibold text-[var(--ink)]"
                      >
                        {SAFEQMS_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOutUser();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] no-print">
          {NavList}
          {isActualAdmin && (
            <div className="border-t border-[var(--border)] p-3.5 space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Admin Role Preview
              </label>
              <select
                value={activeRole}
                onChange={(e) => setPreviewRole(e.target.value as SafeQmsRole)}
                className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)]"
              >
                {SAFEQMS_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--muted)] leading-snug">
                Firestore rules authorize writes via your authenticated Admin UID.
              </p>
            </div>
          )}
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex no-print">
            <div className="fixed inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} />
            <aside className="relative z-10 w-64 max-w-[85vw] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
              <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--border)]">
                <span className="text-sm font-bold">SafeQMS Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {NavList}
            </aside>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <main className="flex-1 min-w-0 flex flex-col">
          <FirestoreErrorBanner />

          {/* Role Preview Strip */}
          {isActualAdmin && activeRole !== actualRole && (
            <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200 flex items-center justify-between gap-2 no-print">
              <span>
                Previewing UI perspective as <strong>{activeRole}</strong> (Actual role: {actualRole}).
              </span>
              <button
                type="button"
                onClick={() => setPreviewRole(actualRole)}
                className="font-semibold underline hover:no-underline cursor-pointer"
              >
                Reset to {actualRole}
              </button>
            </div>
          )}

          {/* Unread Catchball / Director Strips */}
          {(cbUnread.length > 0 || dirUnread.length > 0) && (
            <div className="mx-4 sm:mx-6 mt-4 space-y-2 no-print">
              {cbUnread.slice(0, 2).map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl border border-sky-200 bg-sky-50/70 px-4 py-2 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Activity className="w-3.5 h-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                    <span className="truncate">
                      <strong>Catchball:</strong> {String(act.payload?.text || '')} ({String(act.payload?.at || '')})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {act.payload?.catchballId && (
                      <button
                        type="button"
                        onClick={() => {
                          markActivityRead(act.id);
                          navigate('catchballitem', String(act.payload.catchballId));
                        }}
                        className="font-semibold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
                      >
                        Open
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => markActivityRead(act.id)}
                      className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
              {dirUnread.slice(0, 1).map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2 text-xs text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-200 flex items-center justify-between gap-3"
                >
                  <span>
                    <strong>Director Log:</strong> New approval event recorded ({String(act.payload?.at || '')}).
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        markActivityRead(act.id);
                        navigate('approvals');
                      }}
                      className="font-semibold hover:underline cursor-pointer"
                    >
                      View Decisions
                    </button>
                    <button
                      type="button"
                      onClick={() => markActivityRead(act.id)}
                      className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
            {loadingWorkspace ? (
              <SkeletonView />
            ) : !activeWorkspace ? (
              <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] p-6 max-w-lg mx-auto mt-8 space-y-3 text-center">
                <h2 className="text-sm font-bold text-[var(--ink)]">Workspace initialization needed</h2>
                <p className="text-xs text-[var(--muted)]">
                  Your SafeQMS workspace has not finished initializing yet. Click below to create or reload your shared workspace.
                </p>
                <button
                  type="button"
                  onClick={retryWorkspaceSetup}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Initialize Workspace
                </button>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      <ModalHost />
      <ToastHost />
    </div>
  );
};
