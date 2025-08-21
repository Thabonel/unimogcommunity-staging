
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SUPPORTED_COUNTRIES, getCurrentCountry } from '@/lib/i18n';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { emailSchema, passwordSchema, PASSWORD_VALIDATION_MESSAGE } from '@/utils/auth-validation';

export interface SignupFormProps {
  onOAuthClick: () => Promise<void>;
  planType: "standard" | "lifetime" | "trial" | "free";
  onSignupSuccess?: () => void;
  onSignupError?: (error: string) => void;
}

// Form schema using centralized validation
const formSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  country: z.string().min(2, { message: "Please select your country" }),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const SignupForm = ({ onOAuthClick, planType, onSignupSuccess, onSignupError }: SignupFormProps) => {
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();
  
  // Initialize form with current country
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      country: getCurrentCountry(),
      agreeToTerms: false,
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true);
    
    try {
      const metadata = {
        preferred_plan: planType,
        signed_up_at: new Date().toISOString(),
        country: values.country,
        language: SUPPORTED_COUNTRIES[values.country]?.defaultLanguage || 'en',
      };
      
      const { data, error } = await signUp(values.email, values.password, metadata);
      
      if (!error) {
        // Save country to localStorage for immediate use
        localStorage.setItem('userCountry', values.country);
        
        if (onSignupSuccess) onSignupSuccess();
      } else {
        // Fixed the error handling to properly handle the error message
        const errorMessage = typeof error === 'string' ? error : (error as Error).message;
        if (onSignupError) onSignupError(errorMessage);
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (onSignupError) onSignupError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.password')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-sm text-muted-foreground mt-1">
                {PASSWORD_VALIDATION_MESSAGE}
              </p>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.confirm_password')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.country')}</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('country_selection')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(SUPPORTED_COUNTRIES).map(([code, country]) => (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="agreeToTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {t('I agree to the terms of service and privacy policy')}
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Creating Account...
            </>
          ) : (
            'Start 45-Day Free Trial'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignupForm;
