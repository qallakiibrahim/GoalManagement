import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
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
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sun,
  Target,
  Upload,
  UserCog,
  X,
} from 'lucide-react';
import { AppRoute, SAFEQMS_ROLES, SafeQmsRole, formatRoleLabel } from '../../types/safeqms';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useWalkthrough } from '../../context/WalkthroughContext';
import {
  cbCanRead,
  isLimitedRole,
  leadershipRole,
  roleCan,
  visibleInitiative,
  visibleProject,
  visibleToRole,
} from '../../domain/syncEngine';
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
  sop: 'SOP & User Guide',
  onboarding: 'Ny kund · Starta från noll',
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
    kpis,
    initiatives,
    projects,
    catchballs,
    activities,
    markActivityRead,
  } = useWorkspace();
  const { onboardingBanner, setOnboardingBanner } = useWalkthrough();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('safeqms_sidebar_collapsed') === '1';
    } catch {
      return false;
    }
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('safeqms_sidebar_open_sections');
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [quickSearchIdx, setQuickSearchIdx] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const quickSearchInputRef = useRef<HTMLInputElement | null>(null);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem('safeqms_sidebar_open_sections', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('safeqms_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen((prev) => {
          const next = !prev;
          if (next) {
            setQuickSearchQuery('');
            setQuickSearchIdx(0);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!quickSearchOpen) return;
    setTimeout(() => quickSearchInputRef.current?.focus(), 0);
  }, [quickSearchOpen]);

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

  const isBasic = activeRole === 'Basic user';
  const canCreateGoal = roleCan(activeRole, 'goalCreate', null, { goals, initiatives });
  const canWriteKpi = roleCan(activeRole, 'kpiWrite', { id: 'K-002' }, { goals, initiatives });

  const sections: NavSection[] = [
    {
      title: 'Workspace',
      items: [
        { route: 'overview', label: 'Overview', icon: LayoutDashboard },
        { route: 'sop', label: 'SOP & User Guide', icon: BookOpen },
        { route: 'onboarding', label: 'Starta från noll', icon: Rocket },
      ],
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
  ];

  const quickSearchItems = useMemo(() => {
    const list: Array<{
      key: string;
      category: string;
      code?: string;
      label: string;
      meta: string;
      route: AppRoute;
      id?: string;
    }> = [];

    for (const sec of sections) {
      for (const item of sec.items) {
        if (!item.hidden) {
          list.push({
            key: `nav-${item.route}`,
            category: 'View',
            label: item.label,
            meta: sec.title,
            route: item.route,
          });
        }
      }
    }
    if (isActualAdmin) {
      list.push({
        key: 'nav-settings',
        category: 'View',
        label: 'Team & Workspace Settings',
        meta: 'Administration',
        route: 'settings',
      });
    }

    for (const g of goals) {
      if (visibleToRole(g, activeRole)) {
        list.push({
          key: `goal-${g.id}`,
          category: 'Goal',
          code: g.id,
          label: g.title,
          meta: `${g.level} · ${g.owner}`,
          route: 'goal',
          id: g.id,
        });
      }
    }

    for (const k of kpis) {
      list.push({
        key: `kpi-${k.id}`,
        category: 'KPI',
        code: k.id,
        label: k.name,
        meta: `Unit: ${k.unit}`,
        route: 'kpis',
        id: k.id,
      });
    }

    for (const i of initiatives) {
      if (visibleInitiative(i, goals, activeRole)) {
        list.push({
          key: `init-${i.id}`,
          category: 'Initiative',
          code: i.id,
          label: i.title,
          meta: `${i.owner} · ${i.progress}%`,
          route: 'initiative',
          id: i.id,
        });
      }
    }

    for (const p of projects) {
      if (visibleProject(p, initiatives, goals, activeRole)) {
        list.push({
          key: `proj-${p.id}`,
          category: 'Project A3',
          code: p.id,
          label: p.title,
          meta: `${p.initiative} · ${p.owner}`,
          route: 'project',
          id: p.id,
        });
      }
    }

    for (const c of catchballs) {
      if (cbCanRead(c, goals, activeRole)) {
        list.push({
          key: `cb-${c.id}`,
          category: 'Catchball',
          code: c.id,
          label: `Goal ${c.goal} · Target ${c.proposal.target}`,
          meta: c.status,
          route: 'catchballitem',
          id: c.id,
        });
      }
    }

    return list;
  }, [activeRole, isActualAdmin, canWriteKpi, isBasic, goals, kpis, initiatives, projects, catchballs]);

  const filteredQuickResults = useMemo(() => {
    const q = quickSearchQuery.trim().toLowerCase();
    if (!q) return quickSearchItems.slice(0, 12);
    return quickSearchItems
      .filter((item) => {
        const hay = `${item.code || ''} ${item.label} ${item.meta} ${item.category}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 14);
  }, [quickSearchItems, quickSearchQuery]);

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
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-8 space-y-6 shadow-[var(--card-shadow)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 dark:bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[var(--ink)]">SafeQMS Goal Management</h1>
              <p className="text-xs text-[var(--muted)]">Hoshin Kanri · Daily Management · ISO Governance</p>
            </div>
          </div>

          <div className="space-y-2.5 border-y border-[var(--border)] py-4 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-2.5 text-[var(--ink)] font-medium">
              <Grid3X3 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>360° Interactive Hoshin X-Matrix &amp; Goal Cascade</span>
            </div>
            <div className="flex items-center gap-2.5 text-[var(--ink)] font-medium">
              <Kanban className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>Tier 1–3 Daily Management, Safety Cross &amp; Escalation</span>
            </div>
            <div className="flex items-center gap-2.5 text-[var(--ink)] font-medium">
              <FileCheck2 className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>Project A3 + 5-Why Builder &amp; ISO 9001/14001/45001 Evidence</span>
            </div>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
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

  const isNavItemActive = (itemRoute: AppRoute) =>
    route === itemRoute ||
    (itemRoute === 'cascade' && (route === 'goal' || route === 'newgoal')) ||
    (itemRoute === 'projects' && (route === 'initiative' || route === 'newinitiative' || route === 'project')) ||
    (itemRoute === 'catchball' && (route === 'catchballnew' || route === 'catchballitem')) ||
    (itemRoute === 'reviews' && (route === 'review' || route === 'newreview'));

  const renderNavList = (collapsed: boolean) => (
    <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2 py-3 space-y-3' : 'px-3 py-3 space-y-1.5'}`}>
      {!collapsed && workspaces.length > 1 && (
        <div className="px-2 pb-2">
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

      {sections
        .map((sec) => ({ ...sec, visibleItems: sec.items.filter((i) => !i.hidden) }))
        .filter((sec) => sec.visibleItems.length > 0)
        .map((sec, secIdx) => {
          const isOpen = !!openSections[sec.title];
          const hasActiveItem = sec.visibleItems.some((item) => isNavItemActive(item.route));
          const showItems = collapsed || isOpen;

          return (
            <div key={sec.title} className={collapsed ? 'space-y-1' : 'space-y-1'}>
              {!collapsed ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleSection(sec.title)}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    hasActiveItem && !isOpen
                      ? 'text-teal-700 bg-teal-600/8 dark:text-teal-300 dark:bg-teal-400/10'
                      : isOpen
                        ? 'text-[var(--ink)] bg-[var(--surface-subtle)]/60'
                        : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="truncate">{sec.title}</span>
                    {hasActiveItem && !isOpen && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : (
                secIdx > 0 && <div className="mx-2 my-1 border-t border-[var(--border)]" />
              )}

              {showItems && (
                <div className={`space-y-0.5 ${!collapsed ? 'pb-1.5' : ''}`}>
                  {sec.visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavItemActive(item.route);
                    return (
                      <button
                        key={item.route}
                        type="button"
                        title={collapsed ? item.label : undefined}
                        aria-label={item.label}
                        onClick={() => {
                          navigate(item.route);
                          setMobileOpen(false);
                        }}
                        className={`w-full flex items-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-2.5 py-2'
                        } ${
                          isActive
                            ? 'bg-teal-600/10 text-teal-800 ring-1 ring-inset ring-teal-700/15 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/20'
                            : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <Icon className={`${collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'} shrink-0`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 h-14 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md px-4 flex items-center justify-between gap-4 no-print">
        {/* Left: Navigation Toggle + Brand */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => navigate('overview')}
            className="flex items-center gap-2 text-left cursor-pointer whitespace-nowrap shrink-0 rounded-lg py-1 pr-1 hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-teal-700 dark:bg-teal-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-[var(--ink)]">SafeQMS</span>
          </button>
        </div>

        {/* Center: Active Page Title */}
        <div className="hidden md:flex items-center justify-center min-w-0">
          <span className="text-[13px] font-semibold tracking-tight text-[var(--ink)] truncate">
            {ROUTE_TITLES[route] || route}
          </span>
        </div>

        {/* Right: Quick Search, Primary Action, Theme & Account */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <button
            type="button"
            data-tour="global-search"
            onClick={() => {
              setQuickSearchQuery('');
              setQuickSearchIdx(0);
              setQuickSearchOpen(true);
            }}
            className="h-8 inline-flex items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-2.5 text-xs text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label="Quick search"
            title="Quick search (Ctrl+K / ⌘K)"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Search...</span>
            <kbd className="hidden lg:inline font-mono text-[10px] text-[var(--muted)]">⌘K</kbd>
          </button>
          {canCreateGoal && (
            <button
              type="button"
              onClick={() => navigate('newgoal')}
              className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Goal</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] transition-colors cursor-pointer"
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
              className="h-8 flex items-center gap-2 rounded-lg px-2 text-left hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              title="Account & Administration"
            >
              <div className="w-6 h-6 rounded-md bg-teal-700/12 text-teal-800 ring-1 ring-inset ring-teal-700/20 dark:bg-teal-400/12 dark:text-teal-300 dark:ring-teal-400/20 flex items-center justify-center text-[11px] font-bold shrink-0">
                {(user.displayName || user.email || 'U')
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() || '')
                  .join('')}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="font-semibold text-xs text-[var(--ink)] max-w-[130px] truncate">
                  {user.displayName || user.email}
                </div>
                <div className="text-[10px] text-[var(--muted)]">{formatRoleLabel(activeRole)}</div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[var(--muted)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-xl py-2 z-50"
              >
                <div className="px-3.5 py-2 border-b border-[var(--border)] space-y-0.5">
                  <div className="text-xs font-bold text-[var(--ink)] truncate">
                    {user.displayName || user.email}
                  </div>
                  {user.email && (
                    <div className="text-[11px] text-[var(--muted)] truncate">{user.email}</div>
                  )}
                  <div className="pt-1 flex items-center justify-between text-[10px] font-semibold text-teal-700 dark:text-teal-300">
                    <span>{formatRoleLabel(actualRole)}</span>
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
                          ? 'bg-teal-600/10 text-teal-800 dark:bg-teal-400/10 dark:text-teal-300'
                          : 'text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <UserCog className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                      <div className="min-w-0">
                        <div>Administration</div>
                        <div className="text-[10px] font-normal text-[var(--muted)]">
                          Team, roles &amp; workspace
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
                            {formatRoleLabel(r)}
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
        <aside
          className={`hidden lg:flex shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-200 ease-out no-print ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {renderNavList(sidebarCollapsed)}
          {isActualAdmin && !sidebarCollapsed && (
            <div className="border-t border-[var(--border)] p-3.5 space-y-1.5">
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
                    {formatRoleLabel(r)}
                  </option>
                ))}
              </select>
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
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderNavList(false)}
            </aside>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <main className="flex-1 min-w-0 flex flex-col">
          <FirestoreErrorBanner />

          {/* Cross-Module Onboarding Follow-Along Banner */}
          {onboardingBanner && route !== 'onboarding' && (
            <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-teal-600/30 bg-teal-600/10 px-4 py-2.5 text-xs text-teal-950 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-100 flex flex-wrap items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5 min-w-0">
                <Rocket className="w-4 h-4 shrink-0 text-teal-700 dark:text-teal-300" />
                <div className="min-w-0">
                  <span className="font-bold">
                    Guidad uppstart · Steg {onboardingBanner.step}/{onboardingBanner.total}: {onboardingBanner.title}
                  </span>
                  <span className="ml-2 text-[var(--ink)]/80 dark:text-teal-100/85">
                    {onboardingBanner.instruction}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('onboarding', `step-${onboardingBanner.step}`)}
                  className="rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors cursor-pointer"
                >
                  ← Tillbaka till Steg {onboardingBanner.step}
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardingBanner(null)}
                  aria-label="Stäng uppstartsbanner"
                  className="rounded-md p-1 text-teal-900/70 hover:bg-teal-600/15 hover:text-teal-950 dark:text-teal-200/70 dark:hover:text-teal-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Role Preview Strip */}
          {isActualAdmin && activeRole !== actualRole && (
            <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-amber-600/25 bg-amber-500/10 px-4 py-2 text-xs text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200 flex items-center justify-between gap-2 no-print">
              <span>
                Previewing UI perspective as <strong>{formatRoleLabel(activeRole)}</strong> (Actual role: {formatRoleLabel(actualRole)}).
              </span>
              <button
                type="button"
                onClick={() => setPreviewRole(actualRole)}
                className="font-semibold underline hover:no-underline cursor-pointer"
              >
                Reset to {formatRoleLabel(actualRole)}
              </button>
            </div>
          )}

          {/* Unread Catchball / Director Strips */}
          {(cbUnread.length > 0 || dirUnread.length > 0) && (
            <div className="mx-4 sm:mx-6 mt-4 space-y-2 no-print">
              {cbUnread.slice(0, 2).map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl border border-sky-600/20 bg-sky-500/10 px-4 py-2 text-xs text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Activity className="w-3.5 h-3.5 shrink-0 text-sky-700 dark:text-sky-400" />
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
                  className="rounded-xl border border-teal-600/20 bg-teal-500/10 px-4 py-2 text-xs text-teal-900 dark:border-teal-400/20 dark:bg-teal-400/10 dark:text-teal-200 flex items-center justify-between gap-3"
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
              <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--card-shadow)] p-6 max-w-lg mx-auto mt-8 space-y-3 text-center">
                <h2 className="text-sm font-bold text-[var(--ink)]">Workspace initialization needed</h2>
                <p className="text-xs text-[var(--muted)]">
                  Your SafeQMS workspace has not finished initializing yet. Click below to create or reload your shared workspace.
                </p>
                <button
                  type="button"
                  onClick={retryWorkspaceSetup}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 cursor-pointer"
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

      {quickSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 pt-[12vh] p-4 backdrop-blur-[2px] no-print"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setQuickSearchOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-label="Quick search"
            className="w-full max-w-xl rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border)]">
              <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
              <input
                ref={quickSearchInputRef}
                type="text"
                value={quickSearchQuery}
                onChange={(e) => {
                  setQuickSearchQuery(e.target.value);
                  setQuickSearchIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setQuickSearchOpen(false);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setQuickSearchIdx((prev) =>
                      filteredQuickResults.length ? (prev + 1) % filteredQuickResults.length : 0
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setQuickSearchIdx((prev) =>
                      filteredQuickResults.length
                        ? (prev - 1 + filteredQuickResults.length) % filteredQuickResults.length
                        : 0
                    );
                  } else if (e.key === 'Enter') {
                    const hit = filteredQuickResults[quickSearchIdx];
                    if (hit) {
                      e.preventDefault();
                      navigate(hit.route, hit.id);
                      setQuickSearchOpen(false);
                    }
                  }
                }}
                placeholder="Jump to a view, goal (G-001), KPI (K-002), initiative, or A3..."
                className="flex-1 bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuickSearchOpen(false)}
                className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Close quick search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto py-1.5">
              {filteredQuickResults.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-[var(--muted)]">
                  No matching views or workspace items found.
                </div>
              ) : (
                filteredQuickResults.map((item, idx) => {
                  const selected = idx === quickSearchIdx;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onMouseEnter={() => setQuickSearchIdx(idx)}
                      onClick={() => {
                        navigate(item.route, item.id);
                        setQuickSearchOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-teal-600/10 text-teal-800 dark:bg-teal-400/12 dark:text-teal-200'
                          : 'text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {item.code && (
                            <span className="font-mono text-[var(--muted)] mr-1.5">{item.code}</span>
                          )}
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[var(--muted)] truncate">{item.meta}</div>
                      </div>
                      <span className="text-[11px] font-medium text-[var(--muted)] shrink-0">
                        {item.category}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-subtle)]/50 flex items-center justify-between text-[11px] text-[var(--muted)]">
              <span>↑↓ Navigate · Enter Open</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}

      <ModalHost />
      <ToastHost />
    </div>
  );
};
