import { z } from "zod";

export const recommendationSchema = z.object({
  supplierName: z.string().min(2, "Supplier name must be at least 2 characters"),
  category: z.string().min(2, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  websiteUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

export type RecommendationFormValues = z.infer<typeof recommendationSchema>;
