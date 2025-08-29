
// Import needed components
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { FileText, Wrench } from 'lucide-react';
import { KnowledgeNavigation } from '@/components/knowledge/KnowledgeNavigation';
import { CommunityRecommendationsList } from '@/components/knowledge/CommunityRecommendationsList';
import { RecommendationSubmissionDialog } from '@/components/knowledge/RecommendationSubmissionDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/profile';
import { supabase } from '@/lib/supabase-client';

const MaintenancePage = () => {
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const { user } = useAuth();
  const { userData } = useProfile();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data } = await supabase.rpc("has_role", {
          _role: "admin",
        });
        setIsAdmin(!!data);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  // Prepare user data for Layout with proper avatar logic
  const layoutUser = userData ? {
    name: userData.name || user?.email?.split('@')[0] || 'User',
    avatarUrl: (userData.useVehiclePhotoAsProfile && userData.vehiclePhotoUrl) 
      ? userData.vehiclePhotoUrl 
      : userData.avatarUrl,
    unimogModel: userData.unimogModel || '',
    vehiclePhotoUrl: userData.vehiclePhotoUrl || '',
    useVehiclePhotoAsProfile: userData.useVehiclePhotoAsProfile || false
  } : undefined;
  
  return (
    <Layout isLoggedIn={!!user} user={layoutUser}>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-unimog-800 dark:text-unimog-200 flex items-center gap-2">
              <Wrench className="h-8 w-8" />
              Maintenance
            </h1>
            <p className="text-muted-foreground mt-2">
              Regular maintenance guides and tips to keep your Unimog in top condition.
            </p>
          </div>
          <Button onClick={() => setSubmissionDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Submit Maintenance Recommendation
          </Button>
        </div>
        
        <KnowledgeNavigation />
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Community Maintenance Recommendations</h2>
          <CommunityRecommendationsList 
            category="maintenance"
            isAdmin={isAdmin} 
          />
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Maintenance Schedules</h2>
          <div className="bg-muted rounded-lg p-8 text-center">
            <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
              We're developing detailed maintenance schedules for various Unimog models.
              In the meantime, check out the community recommendations above.
            </p>
          </div>
        </div>
        
        {/* Recommendation Submission Dialog */}
        <RecommendationSubmissionDialog
          open={submissionDialogOpen}
          onOpenChange={setSubmissionDialogOpen}
          category="maintenance"
        />
      </div>
    </Layout>
  );
};

export default MaintenancePage;
