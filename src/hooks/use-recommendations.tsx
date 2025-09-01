import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase-client';
import { useToast } from "@/hooks/use-toast";
import { type DateRange } from "react-day-picker";

export interface RecommendationData {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  recommendation_type?: string;
  business_name?: string;
  location?: string;
  rating?: number;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  cover_image?: string;
  is_published: boolean;
  is_featured?: boolean;
  is_verified?: boolean;
  tags?: string[];
  likes_count?: number;
  views_count?: number;
  saves_count?: number;
  created_at: string;
  published_at?: string | null;
  order?: number;
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days by default
    to: new Date(),
  });
  const { toast } = useToast();
  
  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("community_recommendations")
        .select("*")
        .order("is_published", { ascending: false }) // Published recommendations first
        .order("published_at", { ascending: false });

      if (dateRange.from) {
        query = query.gte("published_at", dateRange.from.toISOString());
      }
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("published_at", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching recommendations:", error);
        toast({
          title: "Error fetching recommendations",
          description: "Failed to load recommendations. Please try again.",
          variant: "destructive",
        });
      } else {
        setRecommendations(data || []);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({
        title: "Error fetching recommendations",
        description: "Failed to load recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange({
      from: newRange?.from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      to: newRange?.to || new Date(),
    });
  };

  const deleteRecommendation = async (recommendationId: string) => {
    try {
      // First, check if recommendation has an image to delete
      const { data: recommendationData } = await supabase
        .from("community_recommendations")
        .select("cover_image, title, category")
        .eq("id", recommendationId)
        .single();
      
      if (!recommendationData) {
        throw new Error("Recommendation not found");
      }
      
      // If recommendation has a cover image, delete it from storage
      if (recommendationData?.cover_image) {
        const filePath = recommendationData.cover_image.split('/').pop();
        if (filePath) {
          await supabase
            .storage
            .from('recommendations')
            .remove([filePath]);
        }
      }

      // Then delete the recommendation
      const { error } = await supabase
        .from("community_recommendations")
        .delete()
        .eq("id", recommendationId);

      if (error) {
        console.error("Error deleting recommendation:", error);
        toast({
          title: "Error deleting recommendation",
          description: "Failed to delete the recommendation. Please try again.",
          variant: "destructive",
        });
        return false;
      } else {
        setRecommendations((prevRecommendations) =>
          prevRecommendations.filter((rec) => rec.id !== recommendationId)
        );
        toast({
          title: "Recommendation deleted",
          description: "Recommendation deleted successfully."
        });
        
        return true;
      }
    } catch (error) {
      console.error("Error deleting recommendation:", error);
      toast({
        title: "Error deleting recommendation",
        description: "Failed to delete the recommendation. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateRecommendationOrder = async (recommendations: RecommendationData[]) => {
    try {
      for (const recommendation of recommendations) {
        const { error } = await supabase
          .from("community_recommendations")
          .update({ order: recommendation.order })
          .eq("id", recommendation.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Order updated",
        description: "Recommendation order has been saved successfully."
      });
      
      return true;
    } catch (error) {
      console.error("Error updating recommendation order:", error);
      toast({
        title: "Error updating order",
        description: "Failed to update the recommendation order. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const updateRecommendationStatus = async (recommendationId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from("community_recommendations")
        .update({ 
          is_published: isPublished,
          published_at: isPublished ? new Date().toISOString() : null
        })
        .eq("id", recommendationId);
        
      if (error) throw error;
      
      toast({
        title: isPublished ? "Recommendation published" : "Recommendation unpublished",
        description: `Recommendation has been ${isPublished ? 'published' : 'moved to drafts'}.`
      });
      
      // Update local state
      setRecommendations(recommendations.map(rec => 
        rec.id === recommendationId 
          ? {...rec, is_published: isPublished, published_at: isPublished ? new Date().toISOString() : null}
          : rec
      ));
      
      return true;
    } catch (error) {
      console.error("Error updating recommendation status:", error);
      toast({
        title: "Error updating recommendation",
        description: "Failed to update the recommendation status. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleFeatured = async (recommendationId: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from("community_recommendations")
        .update({ is_featured: isFeatured })
        .eq("id", recommendationId);
        
      if (error) throw error;
      
      toast({
        title: isFeatured ? "Recommendation featured" : "Recommendation unfeatured",
        description: `Recommendation has been ${isFeatured ? 'featured' : 'unfeatured'}.`
      });
      
      // Update local state
      setRecommendations(recommendations.map(rec => 
        rec.id === recommendationId 
          ? {...rec, is_featured: isFeatured}
          : rec
      ));
      
      return true;
    } catch (error) {
      console.error("Error updating recommendation featured status:", error);
      toast({
        title: "Error updating recommendation",
        description: "Failed to update the recommendation. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleVerified = async (recommendationId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from("community_recommendations")
        .update({ is_verified: isVerified })
        .eq("id", recommendationId);
        
      if (error) throw error;
      
      toast({
        title: isVerified ? "Recommendation verified" : "Recommendation unverified",
        description: `Recommendation has been ${isVerified ? 'verified' : 'unverified'}.`
      });
      
      // Update local state
      setRecommendations(recommendations.map(rec => 
        rec.id === recommendationId 
          ? {...rec, is_verified: isVerified}
          : rec
      ));
      
      return true;
    } catch (error) {
      console.error("Error updating recommendation verified status:", error);
      toast({
        title: "Error updating recommendation",
        description: "Failed to update the recommendation. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [dateRange]);

  const filteredRecommendations = recommendations.filter((rec) =>
    rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rec.business_name && rec.business_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (rec.location && rec.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return {
    recommendations: filteredRecommendations,
    isLoading,
    searchQuery,
    setSearchQuery,
    dateRange,
    handleDateRangeChange,
    fetchRecommendations,
    deleteRecommendation,
    updateRecommendationOrder,
    updateRecommendationStatus,
    toggleFeatured,
    toggleVerified
  };
}