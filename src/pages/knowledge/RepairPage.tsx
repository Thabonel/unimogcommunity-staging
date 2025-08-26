
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { FileText, Hammer } from 'lucide-react';
import { ArticleSubmissionDialog } from '@/components/knowledge/ArticleSubmissionDialog';
import { CategoryArticlesList } from '@/components/admin/CategoryArticlesList';
import { KnowledgeNavigation } from '@/components/knowledge/KnowledgeNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/profile';
import { supabase } from '@/lib/supabase-client';

const RepairPage = () => {
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
              <Hammer className="h-8 w-8" />
              Repair Guides
            </h1>
            <p className="text-muted-foreground mt-2">
              Troubleshooting, repair guides, and restoration tips for your Unimog.
            </p>
          </div>
          <Button onClick={() => setSubmissionDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Submit Repair Article
          </Button>
        </div>
        
        <KnowledgeNavigation />
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Community Repair Articles</h2>
          <CategoryArticlesList 
            category="Repair"
            isAdmin={isAdmin} 
          />
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Common Repair Issues</h2>
          <div className="bg-muted rounded-lg p-8 text-center">
            <Hammer className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Coming Soon</h3>
            <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
              We're compiling a database of common Unimog repair issues and solutions.
              In the meantime, check out the community articles above.
            </p>
          </div>
        </div>
        
        {/* Article Submission Dialog */}
        <ArticleSubmissionDialog
          open={submissionDialogOpen}
          onOpenChange={setSubmissionDialogOpen}
          category="Repair"
        />
      </div>
    </Layout>
  );
};

export default RepairPage;
