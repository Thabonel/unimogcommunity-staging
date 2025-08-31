import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Lightbulb } from 'lucide-react';
import { CommunityRecommendationsList } from '@/components/knowledge/CommunityRecommendationsList';
import { RecommendationSubmissionDialog } from '@/components/knowledge/RecommendationSubmissionDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/profile';

const CommunityRecommendationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const { user } = useAuth();
  const { userData } = useProfile();
  
  // Extract category from URL path
  const pathParts = location.pathname.split('/');
  const category = pathParts[pathParts.length - 1] === 'articles' ? undefined : pathParts[pathParts.length - 1];
  
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
        {/* Header with Back Button */}
        <Button
          onClick={() => navigate('/knowledge')}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Knowledge Base
        </Button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-unimog-800 dark:text-unimog-200 mb-2">
              Community Recommendations
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Discover suppliers, services, and tips recommended by fellow Unimog owners worldwide.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-primary"
              onClick={() => setSubmissionDialogOpen(true)}
            >
              <Plus size={16} className="mr-2" />
              New Recommendation
            </Button>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Browse by Category</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!category ? "default" : "outline"}
              size="sm"
              onClick={() => navigate('/knowledge/articles')}
            >
              All Recommendations
            </Button>
            <Button
              variant={category === 'repair' ? "default" : "outline"}
              size="sm"
              onClick={() => navigate('/knowledge/repair')}
            >
              Repair
            </Button>
            <Button
              variant={category === 'maintenance' ? "default" : "outline"}
              size="sm"
              onClick={() => navigate('/knowledge/maintenance')}
            >
              Maintenance
            </Button>
            <Button
              variant={category === 'modifications' ? "default" : "outline"}
              size="sm"
              onClick={() => navigate('/knowledge/modifications')}
            >
              Modifications
            </Button>
            <Button
              variant={category === 'tyres' ? "default" : "outline"}
              size="sm"
              onClick={() => navigate('/knowledge/tyres')}
            >
              Tyres
            </Button>
            <Button
              variant={category === 'adventures' ? "default" : "outline"}
              size="sm"
              onClick={() => navigate('/knowledge/adventures')}
            >
              Adventures
            </Button>
          </div>
        </div>

        {/* Community Recommendations List Component */}
        <CommunityRecommendationsList category={category} />
      </div>

      {/* Recommendation Submission Dialog */}
      <RecommendationSubmissionDialog 
        open={submissionDialogOpen} 
        onOpenChange={setSubmissionDialogOpen} 
      />
    </Layout>
  );
};

export default CommunityRecommendationsPage;