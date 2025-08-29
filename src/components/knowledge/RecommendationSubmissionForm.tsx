import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface RecommendationSubmissionFormProps {
  onSuccess: () => void;
  defaultCategory?: string;
}

const CATEGORIES = [
  { value: 'repair', label: 'Repair' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'modifications', label: 'Modifications' },
  { value: 'tyres', label: 'Tyres' },
  { value: 'adventures', label: 'Adventures' },
  { value: 'general', label: 'General' },
];

const RECOMMENDATION_TYPES = [
  { value: 'supplier', label: 'Supplier', description: 'Parts supplier or vendor' },
  { value: 'service', label: 'Service', description: 'Mechanic, workshop, or service provider' },
  { value: 'guide', label: 'Guide', description: 'How-to guide or tutorial' },
  { value: 'tip', label: 'Tip', description: 'Quick tip or advice' },
];

export function RecommendationSubmissionForm({ 
  onSuccess, 
  defaultCategory = 'general' 
}: RecommendationSubmissionFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [recommendationType, setRecommendationType] = useState('tip');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [rating, setRating] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to submit a recommendation');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get user profile for author name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      const authorName = profile?.display_name || profile?.full_name || user.email?.split('@')[0] || 'Anonymous';

      // Prepare contact info JSON
      const contactInfo = {
        email: contactEmail || null,
        phone: contactPhone || null,
        website: website || null,
      };

      // Prepare recommendation data
      const recommendationData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 150),
        author_id: user.id,
        author_name: authorName,
        author_avatar: profile?.avatar_url,
        category,
        recommendation_type: recommendationType,
        business_name: businessName || null,
        location: location || null,
        contact_info: Object.values(contactInfo).some(v => v) ? contactInfo : null,
        rating: rating ? parseFloat(rating) : null,
        price_range: priceRange || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        is_published: true,
        published_at: new Date().toISOString(),
      };

      // Insert into database
      const { error: insertError } = await supabase
        .from('community_recommendations')
        .insert(recommendationData);

      if (insertError) throw insertError;

      toast({
        title: "Success!",
        description: "Your recommendation has been submitted successfully.",
      });

      onSuccess();
    } catch (err) {
      console.error('Error submitting recommendation:', err);
      setError('Failed to submit recommendation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Recommendation Type */}
      <div className="space-y-2">
        <Label>Type of Recommendation</Label>
        <RadioGroup value={recommendationType} onValueChange={setRecommendationType}>
          {RECOMMENDATION_TYPES.map((type) => (
            <div key={type.value} className="flex items-start space-x-2">
              <RadioGroupItem value={type.value} id={type.value} />
              <div className="flex-1">
                <Label htmlFor={type.value} className="font-medium cursor-pointer">
                  {type.label}
                </Label>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Excellent Unimog Parts Supplier in Sydney"
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Business/Service Fields (shown for supplier/service types) */}
      {(recommendationType === 'supplier' || recommendationType === 'service') && (
        <>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Unimog Parts Australia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Sydney, Australia"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+61 2 1234 5678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="5"
                step="0.5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="4.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange">Price Range</Label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">Budget ($)</SelectItem>
                  <SelectItem value="$$">Moderate ($$)</SelectItem>
                  <SelectItem value="$$$">Premium ($$$)</SelectItem>
                  <SelectItem value="$$$$">Luxury ($$$$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {/* Brief Description */}
      <div className="space-y-2">
        <Label htmlFor="excerpt">Brief Description</Label>
        <Textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="A short summary of your recommendation (optional)"
          rows={2}
        />
      </div>

      {/* Full Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Full Description *</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Provide detailed information about your recommendation..."
          rows={6}
          required
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Enter tags separated by commas (e.g., parts, sydney, reliable)"
        />
        <p className="text-sm text-muted-foreground">
          Add tags to help others find your recommendation
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || !title || !content || !category}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Recommendation'
          )}
        </Button>
      </div>
    </form>
  );
}