
import React, { Suspense } from 'react';
import { lazyWithRetry, lazyImportWithRetry } from '@/utils/lazyWithRetry';
import { FEATURES } from '@/config/features';

// Create a loading component for suspense fallback
const RouteLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Wrap lazy loaded components with Suspense
const SuspenseWrapper = ({ component: Component }: { component: React.ComponentType<any> }) => {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Component />
    </Suspense>
  );
};

// Lazy load all knowledge pages with retry logic for production stability
const Knowledge = lazyWithRetry(() => import('@/pages/Knowledge'));
const { default: KnowledgeManuals } = lazyImportWithRetry(() => import('@/pages/KnowledgeManuals'), 'default');
const { default: CommunityRecommendationsPage } = lazyImportWithRetry(() => import('@/pages/knowledge/CommunityRecommendationsPage'), 'default');
const { default: RepairPage } = lazyImportWithRetry(() => import('@/pages/knowledge/RepairPage'), 'default');
const { default: MaintenancePage } = lazyImportWithRetry(() => import('@/pages/knowledge/MaintenancePage'), 'default');
const { default: ModificationsPage } = lazyImportWithRetry(() => import('@/pages/knowledge/ModificationsPage'), 'default');
const { default: TyresPage } = lazyImportWithRetry(() => import('@/pages/knowledge/TyresPage'), 'default');
const { default: AdventuresPage } = lazyImportWithRetry(() => import('@/pages/knowledge/AdventuresPage'), 'default');
const { default: BotpressAIPage } = lazyImportWithRetry(() => import('@/pages/knowledge/BotpressAIPage'), 'default');
const { default: SafetyPage } = lazyImportWithRetry(() => import('@/pages/knowledge/SafetyPage'), 'default');

// Conditionally import WIS System page with retry
const WISSystemPage = FEATURES.WIS_ENABLED 
  ? lazyImportWithRetry(() => import('@/pages/knowledge/WISSystemPage'), 'default').default
  : null;

// Export the routes as an array
export const knowledgeRoutes = [
  {
    path: "knowledge",
    element: <SuspenseWrapper component={Knowledge} />
  },
  {
    path: "knowledge/articles",
    element: <SuspenseWrapper component={CommunityRecommendationsPage} />
  },
  {
    path: "knowledge/manuals",
    element: <SuspenseWrapper component={KnowledgeManuals} />
  },
  {
    path: "knowledge/repair",
    element: <SuspenseWrapper component={RepairPage} />
  },
  {
    path: "knowledge/maintenance",
    element: <SuspenseWrapper component={MaintenancePage} />
  },
  {
    path: "knowledge/modifications",
    element: <SuspenseWrapper component={ModificationsPage} />
  },
  {
    path: "knowledge/tyres",
    element: <SuspenseWrapper component={TyresPage} />
  },
  {
    path: "knowledge/adventures",
    element: <SuspenseWrapper component={AdventuresPage} />
  },
  {
    path: "knowledge/ai-mechanic",
    element: <SuspenseWrapper component={BotpressAIPage} />
  },
  {
    path: "knowledge/safety",
    element: <SuspenseWrapper component={SafetyPage} />
  },
  // Conditionally add WIS route only if feature is enabled
  ...(FEATURES.WIS_ENABLED && WISSystemPage ? [{
    path: "knowledge/wis",
    element: <SuspenseWrapper component={WISSystemPage} />
  }] : [])
];
