
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { KnowledgeNavigation } from '@/components/knowledge/KnowledgeNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, FileText, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArticleSubmissionDialog } from '@/components/knowledge/ArticleSubmissionDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/profile';
import { FEATURES } from '@/config/features';

const Knowledge = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const { user } = useAuth();
  const { userData } = useProfile();
  
  // Get the category from URL query params
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category');
  
  
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-unimog-800 dark:text-unimog-200 mb-2">
              Knowledge Base
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Access technical documentation, community guides, and official workshop resources for your Unimog.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-primary"
              onClick={() => setSubmissionDialogOpen(true)}
            >
              <BookOpen size={16} className="mr-2" />
              New Article
            </Button>
          </div>
        </div>

        {/* Three main sections as cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Community Recommendations */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Community Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                User-recommended guides, tips, and experiences from fellow Unimog owners worldwide
              </p>
              <Button asChild className="w-full">
                <Link to="/knowledge/recommendations">Browse Recommendations</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Technical Manuals */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="h-8 w-8 mb-2 text-military-green" />
              <CardTitle>Technical Manuals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Official ex-military documentation from the Australian Defence Force
              </p>
              <Button asChild variant="outline" className="w-full border-military-green text-military-green">
                <Link to="/knowledge/manuals">View Manuals</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Workshop Database */}
          {FEATURES.WIS_ENABLED && (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Wrench className="h-8 w-8 mb-2 text-orange-600" />
                <CardTitle>Workshop Database</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Mercedes official repair procedures and parts catalog (WIS)
                </p>
                <Button asChild variant="outline" className="w-full border-orange-600 text-orange-600">
                  <Link to="/knowledge/wis">Access Workshop</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-3">Browse Community Recommendations by Category</h2>
        </div>
        
        <KnowledgeNavigation />
      </div>

      {/* Article Submission Dialog */}
      <ArticleSubmissionDialog 
        open={submissionDialogOpen} 
        onOpenChange={setSubmissionDialogOpen} 
      />
    </Layout>
  );
};

export default Knowledge;
