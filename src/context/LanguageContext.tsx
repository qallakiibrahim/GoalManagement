import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppRoute, SafeQmsRole, formatRoleLabel } from '../types/safeqms';

export type AppLanguage = 'sv' | 'en';

const STORAGE_KEY = 'safeqms_lang';

const STATUS_SV: Record<string, string> = {
  Approved: 'Godkänd',
  'On track': 'I fas',
  Done: 'Klar',
  Completed: 'Slutförd',
  Aligned: 'Förankrad',
  Resolved: 'Löst',
  'At risk': 'I riskzon',
  Pending: 'Väntar',
  'Pending approval': 'Väntar på godkännande',
  'Awaiting director': 'Väntar på ledning',
  'Awaiting department': 'Väntar på avdelning',
  'In review': 'Under granskning',
  'In progress': 'Pågående',
  'In Progress': 'Pågående',
  Active: 'Aktiv',
  High: 'Hög',
  'Off track': 'Avvikelse',
  Critical: 'Kritisk',
  Rejected: 'Avslagen',
  'Changes requested': 'Ändring begärd',
  Escalated: 'Eskalerad',
  Open: 'Öppen',
  Draft: 'Utkast',
  Planned: 'Planerad',
  'Not measured': 'Ej mätt',
  Medium: 'Medel',
  Low: 'Låg',
  'Team action': 'Teamåtgärd',
  'Direct fix': 'Snabbåtgärd',
  'Direct Fix': 'Snabbåtgärd',
  'Quick Fix': 'Snabbåtgärd',
  '5-Why': '5-Why',
  'Full A3': 'Full A3',
  A3: 'A3',
  Escalate: 'Eskalera',
  Owner: 'Ägare',
  'Auto signal': 'Autosignal',
  Resource: 'Resurs',
  Budget: 'Budget',
  Technical: 'Teknisk',
  'Cross-functional': 'Tvärfunktionell',
  Safety: 'Säkerhet',
  Supplier: 'Leverantör',
  Quality: 'Kvalitet',
  Delivery: 'Leverans',
  Cost: 'Kostnad',
  'ISO Ready': 'ISO-redo',
  'Needs Plan': 'Plan saknas',
  'Evidence Ready': 'Bevis klara',
  'Evidence Gap': 'Bevis saknas',
  Compliant: 'Uppfyller',
  Partial: 'Delvis',
  Gap: 'Avvikelse',
  Strong: 'Stark',
  Weak: 'Svag',
  None: 'Ingen',
  Root: 'Rotmål',
  Proposed: 'Föreslagen',
  Countered: 'Motförslag',
  Cancelled: 'Avbruten',
  Blocked: 'Blockerad',
  ToDo: 'Att göra',
  'To Do': 'Att göra',
  Todo: 'Att göra',
  'Tier 1': 'Nivå 1',
  'Tier 2': 'Nivå 2',
  'Tier 3': 'Nivå 3',
  'No actuals': 'Inga utfall',
  'Higher is better': 'Högre är bättre',
  'Lower is better': 'Lägre är bättre',
  Ready: 'Redo',
  Complete: 'Komplett',
  Incomplete: 'Ofullständig',
  Measured: 'Mätt',
  Missing: 'Saknas',
  Proposal: 'Förslag',
  Counter: 'Motförslag',
  Counterproposal: 'Motförslag',
  Comment: 'Kommentar',
  Note: 'Notering',
  Alignment: 'Förankrad',
  Approval: 'Godkännande',
  'Changes requested by': 'Ändring begärd',
  'Awaiting approval': 'Väntar på godkännande',
};

const ROLE_SV: Record<SafeQmsRole, string> = {
  Administratör: 'Administratör',
  'General director': 'VD / General director',
  'Department director': 'Avdelningschef',
  'QMS auditor': 'Kvalitetschef (QMS)',
  'Basic user': 'Medarbetare (Basic)',
  Auditor: 'Revisor (Auditor)',
};

export const ROUTE_TITLES_BY_LANG: Record<AppLanguage, Record<AppRoute, string>> = {
  en: {
    overview: 'Overview',
    sop: 'SOP & User Guide',
    onboarding: 'New Customer · Start from Zero',
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
  },
  sv: {
    overview: 'Översikt',
    sop: 'SOP & Användarguide',
    onboarding: 'Ny kund · Starta från noll',
    daily: 'Daglig styrning (Daily Board)',
    myfocus: 'Mitt fokus (Obeya)',
    pillars: 'Strategiska målpelare',
    cascade: 'Målkaskad (Goal Cascade)',
    matrix: 'Hoshin X-Matrix',
    a3: 'Strategi-A3',
    goal: 'Strategiskt mål',
    newgoal: 'Nytt strategiskt mål',
    projects: 'Initiativ & Projekt',
    initiative: 'Initiativdetalj',
    newinitiative: 'Nytt initiativ',
    project: 'Projekt-A3 & 5-Why',
    kpis: 'KPI:er & Bowling Chart',
    import: 'CSV-import av KPI',
    catchball: 'Catchball-förankring',
    catchballnew: 'Ny Catchball-tråd',
    catchballitem: 'Catchball-förhandling',
    reviews: 'PDCA-genomgångar',
    newreview: 'Ny PDCA-genomgång',
    review: 'PDCA-detalj',
    approvals: 'Formella godkännanden',
    iso: 'ISO-efterlevnad',
    evidence: 'Revisionsbevis (Audit Pack)',
    management: 'Ledningens genomgång',
    settings: 'Team & Arbetsyteinställningar',
  },
};

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_SV = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

interface LanguageContextValue {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
  toggleLang: () => void;
  t: (en: string, sv?: string) => string;
  tStatus: (label: string) => string;
  tRole: (role: SafeQmsRole) => string;
  tScope: (scope: string) => string;
  tMonth: (month: number | string) => string;
  routeTitle: (route: AppRoute) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'sv') return saved;
    } catch {
      // ignore storage errors
    }
    return 'sv';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
  }, [lang]);

  const setLang = useCallback((next: AppLanguage) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'sv' ? 'en' : 'sv'));
  }, []);

  const t = useCallback(
    (en: string, sv?: string) => {
      if (lang === 'en') return en;
      return sv !== undefined ? sv : STATUS_SV[en] || en;
    },
    [lang]
  );

  const tStatus = useCallback(
    (label: string) => {
      if (lang === 'en') return label;
      return STATUS_SV[label] || label;
    },
    [lang]
  );

  const tRole = useCallback(
    (role: SafeQmsRole) => {
      if (lang === 'en') return formatRoleLabel(role);
      return ROLE_SV[role] || formatRoleLabel(role);
    },
    [lang]
  );

  const tScope = useCallback(
    (scope: string) => {
      if (lang === 'en') return scope;
      if (scope === 'Organization') return 'Organisation';
      if (scope.startsWith('Site: ')) return `Anläggning: ${scope.slice(6)}`;
      if (scope.startsWith('Department: ')) return `Avdelning: ${scope.slice(12)}`;
      return scope;
    },
    [lang]
  );

  const tMonth = useCallback(
    (month: number | string) => {
      const list = lang === 'sv' ? MONTHS_SV : MONTHS_EN;
      if (typeof month === 'number') {
        return list[month] ?? String(month);
      }
      const idx = MONTHS_EN.findIndex((m) => m.toLowerCase() === month.toLowerCase());
      if (idx >= 0) return list[idx];
      const svIdx = MONTHS_SV.findIndex((m) => m.toLowerCase() === month.toLowerCase());
      if (svIdx >= 0) return list[svIdx];
      return month;
    },
    [lang]
  );

  const routeTitle = useCallback(
    (route: AppRoute) => ROUTE_TITLES_BY_LANG[lang][route] || route,
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
      tStatus,
      tRole,
      tScope,
      tMonth,
      routeTitle,
    }),
    [lang, setLang, toggleLang, t, tStatus, tRole, tScope, tMonth, routeTitle]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
