import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Heart, 
  MapPin, 
  Star, 
  Building2, 
  CheckCircle2,
  Bookmark,
  Share2 
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface RecommendationCardProps {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  publishedAt: string;
  category: string;
  recommendationType?: string;
  businessName?: string;
  location?: string;
  rating?: number;
  likes: number;
  views: number;
  saves?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

const RecommendationCard = ({
  id,
  title,
  excerpt,
  coverImage,
  author,
  publishedAt,
  category,
  recommendationType,
  businessName,
  location,
  rating,
  likes: initialLikes,
  views,
  saves: initialSaves,
  isVerified,
  isFeatured,
  tags
}: RecommendationCardProps) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [saves, setSaves] = useState(initialSaves || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like recommendations",
        variant: "destructive"
      });
      return;
    }

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('recommendation_likes')
          .delete()
          .eq('recommendation_id', id)
          .eq('user_id', user.id);
        
        setLikes(likes - 1);
        setHasLiked(false);
      } else {
        // Like
        await supabase
          .from('recommendation_likes')
          .insert({
            recommendation_id: id,
            user_id: user.id
          });
        
        setLikes(likes + 1);
        setHasLiked(true);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save recommendations",
        variant: "destructive"
      });
      return;
    }

    // Toggle save state (would need backend implementation)
    setHasSaved(!hasSaved);
    setSaves(hasSaved ? saves - 1 : saves + 1);
    
    toast({
      title: hasSaved ? "Removed from saved" : "Saved",
      description: hasSaved 
        ? "Recommendation removed from your saved items" 
        : "Recommendation saved for later"
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/knowledge/recommendations/${id}`);
    toast({
      title: "Link copied",
      description: "Recommendation link copied to clipboard"
    });
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'supplier': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'service': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'guide': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'tip': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'repair': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'maintenance': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'modifications': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'tyres': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'adventures': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 h-full flex flex-col">
      {/* Cover Image or Category Banner */}
      {coverImage ? (
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <img 
            src={coverImage} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {isFeatured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              Featured
            </Badge>
          )}
          {isVerified && (
            <Badge className="absolute top-2 right-2 bg-green-500 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      ) : (
        <div className={`h-32 ${getCategoryColor(category)} rounded-t-lg flex items-center justify-center relative`}>
          <span className="text-4xl font-bold opacity-20">
            {category.charAt(0).toUpperCase()}
          </span>
          {isFeatured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              Featured
            </Badge>
          )}
          {isVerified && (
            <Badge className="absolute top-2 right-2 bg-green-500 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      )}
      
      <CardHeader className="pb-3">
        {/* Type and Category Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {recommendationType && (
            <Badge variant="secondary" className={`text-xs ${getTypeColor(recommendationType)}`}>
              {recommendationType}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
        </div>
        
        {/* Title */}
        <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary cursor-pointer">
          {title}
        </h3>
        
        {/* Business Info */}
        {businessName && (
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span className="truncate">{businessName}</span>
          </div>
        )}
        
        {/* Location */}
        {location && (
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{location}</span>
          </div>
        )}
        
        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating) 
                    ? 'fill-yellow-500 text-yellow-500' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              ({rating.toFixed(1)})
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow pb-3">
        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {excerpt}
        </p>
        
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col gap-3 pt-3 border-t">
        {/* Author Info */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              {author.avatarUrl && <AvatarImage src={author.avatarUrl} />}
              <AvatarFallback className="text-xs">
                {author.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium truncate max-w-[120px]">
                {author.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {publishedAt}
              </span>
            </div>
          </div>
        </div>
        
        {/* Engagement Stats and Actions */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 mr-1 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-xs">{likes}</span>
            </Button>
            
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-xs">{views}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSave}
            >
              <Bookmark className={`w-4 h-4 ${hasSaved ? 'fill-current' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;