
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
const { default: CommunityRecommendationsPage } = lazyImportWithRetry(
  () => import('@/pages/knowledge/CommunityRecommendationsPage'),
  'default'
);
const { default: BotpressAIPage } = lazyImportWithRetry(
  () => import('@/pages/knowledge/BotpressAIPage'),
  'default'
);
const { default: SafetyPage } = lazyImportWithRetry(
  () => import('@/pages/knowledge/SafetyPage'),
  'default'
);

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
    path: "knowledge/recommendations",
    element: <SuspenseWrapper component={CommunityRecommendationsPage} />
  },
  {
    path: "knowledge/recommendations/:category",
    element: <SuspenseWrapper component={CommunityRecommendationsPage} />
  },
  {
    path: "knowledge/manuals",
    element: <SuspenseWrapper component={KnowledgeManuals} />
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
