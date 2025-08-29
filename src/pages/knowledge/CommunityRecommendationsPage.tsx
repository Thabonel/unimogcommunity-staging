import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { CommunityRecommendationsList } from '@/components/knowledge/CommunityRecommendationsList';
import { RecommendationSubmissionDialog } from '@/components/knowledge/RecommendationSubmissionDialog';
import { DatabaseDiagnostic } from '@/components/knowledge/DatabaseDiagnostic';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/profile';

const CommunityRecommendationsPage = () => {
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const { user } = useAuth();
  const { userData } = useProfile();

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
              Discover suppliers and services recommended by fellow Unimog owners.
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

        {/* Temporary diagnostic component */}
        <DatabaseDiagnostic />

        <CommunityRecommendationsList category={category} />
      </div>

      <RecommendationSubmissionDialog
        open={submissionDialogOpen}
        onOpenChange={setSubmissionDialogOpen}
      />
    </Layout>
  );
};

export default CommunityRecommendationsPage;
