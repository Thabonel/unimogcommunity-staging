import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Wrench, MapPin, Users } from 'lucide-react';

// Placeholder component - will be connected to database later
export function CommunityRecommendationsList() {
  // Placeholder data
  const recommendations = [
    {
      id: 1,
      title: "Best Off-Road Tire Pressure Settings",
      description: "Optimal tire pressure settings for different terrain types",
      category: "Maintenance",
      author: "John Smith",
      date: "2024-01-15",
      icon: Wrench
    },
    {
      id: 2,
      title: "Essential Tools for Unimog Adventures",
      description: "A comprehensive list of tools every Unimog owner should carry",
      category: "Guides",
      author: "Sarah Johnson",
      date: "2024-01-10",
      icon: BookOpen
    },
    {
      id: 3,
      title: "Top 10 Unimog Trails in Europe",
      description: "Discover the best off-road trails for your Unimog across Europe",
      category: "Adventures",
      author: "Mike Davis",
      date: "2024-01-05",
      icon: MapPin
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recommendations.map((rec) => {
        const Icon = rec.icon;
        return (
          <Card key={rec.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Icon className="h-8 w-8 text-primary" />
                <Badge variant="secondary">{rec.category}</Badge>
              </div>
              <CardTitle className="mt-4">{rec.title}</CardTitle>
              <CardDescription>{rec.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{rec.author}</span>
                <span>•</span>
                <span>{new Date(rec.date).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}