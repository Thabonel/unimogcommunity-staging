import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import RecommendationCard from '@/components/knowledge/RecommendationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RecommendationData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  published_at: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  
  // Recommendation specific fields
  recommendation_type?: string; // 'supplier', 'service', 'guide', 'tip'
  business_name?: string;
  location?: string;
  contact_info?: any;
  rating?: number;
  price_range?: string;
  
  // Engagement metrics
  likes: number;
  views: number;
  saves?: number;
  
  // Status
  is_featured?: boolean;
  is_verified?: boolean;
  cover_image?: string;
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
        // Start building query
        let query = supabase
          .from('community_recommendations')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });
        
        // Filter by category if provided
        if (category && category !== 'all') {
          query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Supabase error:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        console.log('Fetched recommendations:', data);
        setRecommendations(data as RecommendationData[] || []);
      } catch (err) {
        console.error('Error fetching community recommendations:', err);
        if (err instanceof Error) {
          console.error('Error message:', err.message);
          console.error('Full error:', err);
        }
        setError('Failed to load recommendations. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [category]);

  // Render loading skeletons
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Render error message
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Render empty state
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No recommendations found</h3>
        <p className="text-muted-foreground">
          {category && category !== 'all'
            ? `There are no recommendations in the ${category} category yet.` 
            : 'Be the first to share a recommendation with the community!'}
        </p>
      </div>
    );
  }

  // Render recommendations list
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((recommendation) => (
        <RecommendationCard
          key={recommendation.id}
          id={recommendation.id}
          title={recommendation.title}
          excerpt={recommendation.excerpt || recommendation.content.substring(0, 120) + '...'}
          coverImage={recommendation.cover_image}
          author={{
            id: recommendation.author_id,
            name: recommendation.author_name,
            avatarUrl: recommendation.author_avatar,
          }}
          publishedAt={new Date(recommendation.published_at).toLocaleDateString()}
          category={recommendation.category}
          recommendationType={recommendation.recommendation_type}
          businessName={recommendation.business_name}
          location={recommendation.location}
          rating={recommendation.rating}
          likes={recommendation.likes}
          views={recommendation.views}
          saves={recommendation.saves}
          isVerified={recommendation.is_verified}
          isFeatured={recommendation.is_featured}
          tags={recommendation.tags}
        />
      ))}
    </div>
  );
}