import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import RecommendationCard from '@/components/knowledge/RecommendationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RecommendationData {
  id: string;
  supplier_name: string;
  category: string;
  description: string;
  location: string;
  website_url?: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
}

interface CommunityRecommendationsListProps {
  category?: string;
}

export function CommunityRecommendationsList({ category }: CommunityRecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('community_recommendations')
          .select('*')
          .order('created_at', { ascending: false });

        if (category && category !== 'community') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;

        setRecommendations(data as RecommendationData[]);
      } catch (err) {
        console.error('Error fetching community recommendations:', err);
        setError('Failed to load recommendations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [category]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[160px] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No recommendations found</h3>
        <p className="text-muted-foreground">
          {category
            ? `There are no recommendations in the ${category} category yet.`
            : 'There are no community recommendations yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          supplierName={rec.supplier_name}
          category={rec.category}
          description={rec.description}
          location={rec.location}
          websiteUrl={rec.website_url}
          author={{
            id: rec.author_id,
            name: rec.author_name,
            avatarUrl: rec.author_avatar,
          }}
          createdAt={rec.created_at}
        />
      ))}
    </div>
  );
}
