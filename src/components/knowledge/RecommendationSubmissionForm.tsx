import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase-client';
import { Loader2, Link as LinkIcon } from "lucide-react";
import { recommendationSchema, RecommendationFormValues } from "./types/recommendation";

interface RecommendationSubmissionFormProps {
  onSuccess: () => void;
}

export function RecommendationSubmissionForm({ onSuccess }: RecommendationSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RecommendationFormValues>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      supplierName: "",
      category: "",
      description: "",
      location: "",
      websiteUrl: "",
    },
  });

  const onSubmit = async (values: RecommendationFormValues) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to submit a recommendation",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from('community_recommendations').insert({
        supplier_name: values.supplierName,
        category: values.category,
        description: values.description,
        location: values.location,
        website_url: values.websiteUrl || null,
        author_id: user.id,
        author_name: user.user_metadata.full_name || user.email,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Recommendation submitted successfully",
      });

      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Error submitting recommendation:", error);
      toast({
        title: "Error submitting recommendation",
        description: "There was a problem submitting your recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="supplierName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter supplier name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Parts">Parts</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Why do you recommend this supplier?"
                  className="h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="City, Country" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL (Optional)</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  <LinkIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                  <Input placeholder="https://example.com" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Recommendation"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
