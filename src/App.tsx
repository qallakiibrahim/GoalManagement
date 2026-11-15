import React from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { AppShell } from './components/layout/AppShell';
import { OverviewPage } from './components/pages/OverviewPage';
import { DailyBoardPage } from './components/pages/DailyBoardPage';
import { MyFocusPage } from './components/pages/MyFocusPage';
import { CascadePage, GoalFormPage, PillarsPage, StrategyA3Page } from './components/pages/StrategyPages';
import { XMatrixPage } from './components/pages/XMatrixPage';
import { InitiativeDetailPage, InitiativeFormPage, ProjectA3Page, ProjectsListPage } from './components/pages/ExecutionPages';
import { CsvImportPage, KpisPage } from './components/pages/PerformancePages';
import {
  ApprovalsPage,
  CatchballCreatePage,
  CatchballDetailPage,
  CatchballListPage,
  NewReviewPage,
  ReviewDetailPage,
  ReviewsPage,
} from './components/pages/AlignmentPages';
import { EvidencePage, IsoPage, ManagementReviewPage } from './components/pages/CompliancePages';
import { SettingsPage } from './components/pages/SettingsPage';

const RouteView: React.FC = () => {
  const { route, activeRole, isActualAdmin } = useWorkspace();
  const isBasic = activeRole === 'Basic user';

  if (route === 'settings') {
    return isActualAdmin ? <SettingsPage /> : <OverviewPage />;
  }
  if (isBasic && ['catchball', 'catchballnew', 'catchballitem', 'approvals', 'iso', 'evidence', 'management'].includes(route)) {
    return <OverviewPage />;
  }

  switch (route) {
    case 'overview':
      return <OverviewPage />;
    case 'daily':
      return <DailyBoardPage />;
    case 'myfocus':
      return <MyFocusPage />;
    case 'pillars':
      return <PillarsPage />;
    case 'cascade':
      return <CascadePage />;
    case 'goal':
      return <GoalFormPage isNew={false} />;
    case 'newgoal':
      return <GoalFormPage isNew={true} />;
    case 'matrix':
      return <XMatrixPage />;
    case 'a3':
      return <StrategyA3Page />;
    case 'projects':
      return <ProjectsListPage />;
    case 'newinitiative':
      return <InitiativeFormPage />;
    case 'initiative':
      return <InitiativeDetailPage />;
    case 'project':
      return <ProjectA3Page />;
    case 'kpis':
      return <KpisPage />;
    case 'import':
      return <CsvImportPage />;
    case 'catchball':
      return <CatchballListPage />;
    case 'catchballnew':
      return <CatchballCreatePage />;
    case 'catchballitem':
      return <CatchballDetailPage />;
    case 'reviews':
      return <ReviewsPage />;
    case 'newreview':
      return <NewReviewPage />;
    case 'review':
      return <ReviewDetailPage />;
    case 'approvals':
      return <ApprovalsPage />;
    case 'iso':
      return <IsoPage />;
    case 'evidence':
      return <EvidencePage />;
    case 'management':
      return <ManagementReviewPage />;
    default:
      return <OverviewPage />;
  }
};

export default function App() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <RouteView />
      </AppShell>
    </WorkspaceProvider>
  );
}
