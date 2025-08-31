
import { useEffect, useState, Component, ErrorInfo, ReactNode } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useAdminStatus } from "@/hooks/use-admin-status";
import { useToast } from "@/hooks/use-toast";
import { AdminProvider } from "@/contexts/AdminContext";
import { logger } from '@/utils/logger';

// Lazy load admin components with retry logic
const retryImport = (importFn: () => Promise<any>) => {
  return new Promise((resolve, reject) => {
    importFn()
      .then(resolve)
      .catch((error) => {
        // Retry once after a small delay
        setTimeout(() => {
          importFn()
            .then(resolve)
            .catch(reject);
        }, 1000);
      });
  });
};

const AnalyticsDashboard = lazy(() => retryImport(() => import("@/components/admin/AnalyticsDashboard")));
const RecommendationsManagement = lazy(() => retryImport(() => import("@/components/admin/RecommendationsManagement")));
const ManualProcessingPage = lazy(() => retryImport(() => import("@/pages/admin/ManualProcessingPage")));
const UsersManagement = lazy(() => retryImport(() => import("@/components/admin/UsersManagement")));
const SiteConfiguration = lazy(() => retryImport(() => import("@/components/admin/SiteConfiguration")));

// Define admin tabs with icons for best practices
const adminTabs = [
  { id: "analytics", label: "Analytics" },
  { id: "recommendations", label: "Recommendations" },
  { id: "manuals", label: "Manuals" },
  { id: "users", label: "Users" },
  { id: "settings", label: "Settings" }
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading, error } = useAdminStatus(user);
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState("recommendations"); // Default to recommendations section
  
  useEffect(() => {
    logger.debug('Admin Dashboard rendered', { 
      component: 'AdminDashboard',
      action: 'dashboard_render',
      userId: user?.id,
      isAdmin, 
      isLoading, 
      hasError: !!error,
      currentSection
    });
    
    if (error) {
      toast({
        title: "Admin status check error",
        description: "There was an issue verifying admin status. Using backup verification.",
        variant: "destructive",
      });
    }
  }, [user, isAdmin, isLoading, error, toast, currentSection]);

  return (
    <Layout>
      <AdminLayout>
        <AdminProvider initialSection={currentSection} onSectionChange={setCurrentSection}>
          <AdminNavigation tabs={adminTabs} />
          
          {/* Use Tabs from UI library with suspense for lazy loading */}
          <Tabs value={currentSection} onValueChange={setCurrentSection} className="space-y-4">
            <TabsContent value="analytics" className="space-y-4">
              <LazyLoadErrorBoundary section="Analytics">
                <Suspense fallback={<LoadingState />}>
                  <AnalyticsDashboard />
                </Suspense>
              </LazyLoadErrorBoundary>
            </TabsContent>
            
            <TabsContent value="recommendations" className="space-y-4">
              <LazyLoadErrorBoundary section="Recommendations">
                <Suspense fallback={<LoadingState />}>
                  <RecommendationsManagement />
                </Suspense>
              </LazyLoadErrorBoundary>
            </TabsContent>
            
            <TabsContent value="manuals" className="space-y-4">
              <LazyLoadErrorBoundary section="Manuals">
                <Suspense fallback={<LoadingState />}>
                  <ManualProcessingPage />
                </Suspense>
              </LazyLoadErrorBoundary>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <LazyLoadErrorBoundary section="Users">
                <Suspense fallback={<LoadingState />}>
                  <UsersManagement />
                </Suspense>
              </LazyLoadErrorBoundary>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <LazyLoadErrorBoundary section="Settings">
                <Suspense fallback={<LoadingState />}>
                  <SiteConfiguration />
                </Suspense>
              </LazyLoadErrorBoundary>
            </TabsContent>
          </Tabs>
        </AdminProvider>
      </AdminLayout>
    </Layout>
  );
};

const LoadingState = () => (
  <div className="flex justify-center py-10">
    <div className="text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading section...</p>
    </div>
  </div>
);

// Error boundary for lazy loaded components
class LazyLoadErrorBoundary extends Component<
  { children: ReactNode; section: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; section: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Lazy load failed', error, { 
      component: 'AdminDashboard',
      section: this.props.section,
      errorInfo 
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error!} section={this.props.section} />;
    }
    return this.props.children;
  }
}

// Fallback component for failed lazy loads
const ErrorFallback = ({ error, section }: { error: Error; section: string }) => (
  <div className="flex justify-center py-10">
    <div className="text-center max-w-md">
      <p className="text-destructive font-semibold mb-2">Failed to load {section}</p>
      <p className="text-muted-foreground text-sm mb-4">
        This might be a temporary issue. Please try refreshing the page.
      </p>
      <Button onClick={() => window.location.reload()} variant="outline">
        Refresh Page
      </Button>
    </div>
  </div>
);

export default AdminDashboard;
