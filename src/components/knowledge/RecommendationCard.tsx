import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Link as LinkIcon } from 'lucide-react';

interface RecommendationCardProps {
  supplierName: string;
  category: string;
  description: string;
  location: string;
  websiteUrl?: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

const RecommendationCard = ({
  supplierName,
  category,
  description,
  location,
  websiteUrl,
  author,
  createdAt,
}: RecommendationCardProps) => {
  return (
    <Card className="card-hover overflow-hidden border bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="mb-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>
        <h3 className="font-semibold text-lg mb-2">{supplierName}</h3>
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{description}</p>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          {location}
        </div>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-primary hover:underline"
          >
            <LinkIcon className="w-4 h-4 mr-1" />
            Visit Website
          </a>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t flex items-center">
        <div className="flex items-center">
          <div className="profile-image w-8 h-8 flex items-center justify-center text-xs font-medium text-primary-foreground bg-primary mr-2">
            {author.avatarUrl ? (
              <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" />
            ) : (
              author.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div className="text-sm">
            {author.name}
            <div className="text-xs text-muted-foreground">
              {new Date(createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecommendationCard;
