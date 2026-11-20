import React, { useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  FileSpreadsheet,
  Grid3X3,
  MessageSquareMore,
  Target,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { cbCanRead } from '../../domain/syncEngine';
import { XMatrixPage } from './XMatrixPage';
import { StrategyA3Page } from './StrategyPages';
import { ApprovalsPage, CatchballListPage } from './AlignmentPages';
import { EvidencePage, IsoPage, ManagementReviewPage } from './CompliancePages';

export type GovernanceTabId =
  | 'matrix'
  | 'a3'
  | 'catchball'
  | 'approvals'
  | 'iso'
  | 'evidence'
  | 'management';

interface GovernanceTabDef {
  id: GovernanceTabId;
  labelEn: string;
  labelSv: string;
  icon: React.ComponentType<{ className?: string }>;
  restrictedForBasic?: boolean;
  count?: number;
}

export const GovernanceHubPage: React.FC = () => {
  const { t } = useLanguage();
  const { routeId, navigate, activeRole, goals, catchballs, approvals } = useWorkspace();

  const isBasic = activeRole === 'Basic user';

  const openCatchballCount = useMemo(
    () =>
      catchballs.filter(
        (c) => cbCanRead(c, goals, activeRole) && c.status !== 'Approved' && c.status !== 'Aligned'
      ).length,
    [catchballs, goals, activeRole]
  );

  const pendingApprovalCount = useMemo(
    () => approvals.filter((a) => a.status === 'Pending').length,
    [approvals]
  );

  const tabs: GovernanceTabDef[] = useMemo(
    () =>
      [
        { id: 'matrix' as const, labelEn: 'X-Matrix', labelSv: 'X-Matrix', icon: Grid3X3 },
        { id: 'a3' as const, labelEn: 'Strategy A3', labelSv: 'Strategi-A3', icon: Target },
        {
          id: 'catchball' as const,
          labelEn: 'Catchball',
          labelSv: 'Catchball',
          icon: MessageSquareMore,
          restrictedForBasic: true,
          count: openCatchballCount,
        },
        {
          id: 'approvals' as const,
          labelEn: 'Approvals',
          labelSv: 'Godkännanden',
          icon: CheckCircle2,
          restrictedForBasic: true,
          count: pendingApprovalCount,
        },
        {
          id: 'iso' as const,
          labelEn: 'ISO Compliance',
          labelSv: 'ISO-efterlevnad',
          icon: Award,
          restrictedForBasic: true,
        },
        {
          id: 'evidence' as const,
          labelEn: 'Audit Evidence',
          labelSv: 'Revisionsbevis',
          icon: ClipboardCheck,
          restrictedForBasic: true,
        },
        {
          id: 'management' as const,
          labelEn: 'Management Review',
          labelSv: 'Ledningens genomgång',
          icon: FileSpreadsheet,
          restrictedForBasic: true,
        },
      ].filter((tab) => !(isBasic && tab.restrictedForBasic)),
    [isBasic, openCatchballCount, pendingApprovalCount]
  );

  const activeTab: GovernanceTabId = useMemo(() => {
    const requested = routeId as GovernanceTabId;
    if (tabs.some((tb) => tb.id === requested)) return requested;
    return tabs[0]?.id || 'matrix';
  }, [routeId, tabs]);

  return (
    <div className="space-y-5">
      {/* Unified Single-Line Tab Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] -mx-4 sm:-mx-6 px-4 sm:px-6 pt-1 no-print">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate('governance', tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-teal-700 text-white dark:bg-teal-600'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t(tab.labelEn, tab.labelSv)}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`font-mono tabular-nums text-[11px] ml-0.5 ${
                      isActive ? 'text-white/90' : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Embedded Existing Module View (zero duplicated business logic) */}
      <div>
        {activeTab === 'matrix' && <XMatrixPage />}
        {activeTab === 'a3' && <StrategyA3Page />}
        {activeTab === 'catchball' && <CatchballListPage />}
        {activeTab === 'approvals' && <ApprovalsPage />}
        {activeTab === 'iso' && <IsoPage />}
        {activeTab === 'evidence' && <EvidencePage />}
        {activeTab === 'management' && <ManagementReviewPage />}
      </div>
    </div>
  );
};
