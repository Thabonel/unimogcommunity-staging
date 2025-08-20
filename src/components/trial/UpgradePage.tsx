/**
 * Upgrade Page Component
 * 
 * Trust-first upgrade experience for 55+ Unimog community
 * Clear benefits, no pressure, easy process
 */

import React, { useState, useEffect } from 'react';
import { Check, Shield, Clock, Download, Wrench, Users, ChevronRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import TrialService, { TrialStatus } from '@/services/TrialService';
import { toast } from 'sonner';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  savings?: string;
}

export const UpgradePage: React.FC = () => {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans: Record<'monthly' | 'annual', PricingPlan> = {
    monthly: {
      name: 'Premium Monthly',
      price: '$19',
      period: 'per month',
      description: 'Full access, cancel anytime',
      features: [
        'Unlimited manual downloads',
        'All technical diagrams & schematics',
        'Priority Barry AI support',
        'Marketplace seller tools',
        'Advanced trip planning',
        'Community badges',
        'No advertisements',
        'Email support'
      ]
    },
    annual: {
      name: 'Premium Annual',
      price: '$190',
      period: 'per year',
      description: 'Best value for dedicated owners',
      features: [
        'Everything in monthly, plus:',
        'Save $38 per year (2 months free)',
        'Early access to new features',
        'Exclusive member events',
        'Priority phone support',
        'Custom vehicle profiles',
        'Bulk download options',
        'API access for workshops'
      ],
      popular: true,
      savings: 'Save $38'
    }
  };

  useEffect(() => {
    if (user) {
      loadTrialStatus();
    }
  }, [user]);

  const loadTrialStatus = async () => {
    if (!user) return;
    const status = await TrialService.getTrialStatus(user.id);
    setTrialStatus(status);
  };

  const handleUpgrade = async (planType: 'monthly' | 'annual') => {
    if (!user) {
      toast.error('Please sign in to upgrade');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Here you would integrate with your payment processor
      // For now, we'll simulate the upgrade
      const result = await TrialService.convertToPaid(user.id, planType);
      
      if (result.success) {
        toast.success(result.message);
        // Redirect to success page or dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-khaki-tan/20 to-white dark:from-mud-black dark:to-gray-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="outline">
            {trialStatus?.daysRemaining 
              ? `${trialStatus.daysRemaining} days left in trial`
              : 'Special Offer'}
          </Badge>
          
          <h1 className="text-4xl font-bold mb-4">
            Upgrade to Premium
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Join hundreds of Unimog owners who trust our platform for maintenance, 
            repairs, and community support. No credit card required for trial.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-military-green" />
            <span className="text-sm font-medium">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-military-green" />
            <span className="text-sm font-medium">Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-military-green" />
            <span className="text-sm font-medium">500+ Happy Members</span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {Object.entries(plans).map(([key, plan]) => (
            <Card 
              key={key}
              className={`relative ${plan.popular ? 'ring-2 ring-military-green shadow-xl' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-military-green">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">{plan.period}</span>
                  {plan.savings && (
                    <Badge variant="secondary" className="ml-3">
                      {plan.savings}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-military-green mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button
                  className="w-full bg-military-green hover:bg-military-green/90"
                  size="lg"
                  onClick={() => handleUpgrade(key as 'monthly' | 'annual')}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Start ${plan.name}`}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Benefits section */}
        <Card className="max-w-4xl mx-auto mb-12 bg-military-green/5">
          <CardHeader>
            <CardTitle>Why Unimog Owners Choose Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Download className="h-5 w-5 text-military-green" />
                  Complete Workshop Access
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Download all 45+ official manuals, wiring diagrams, and technical bulletins. 
                  Save thousands compared to dealer prices.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-military-green" />
                  Barry AI Mechanic
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get instant answers to technical questions. Barry knows every bolt, 
                  wire, and specification across all Unimog models.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-military-green" />
                  Trusted Community
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect with experienced owners worldwide. Share knowledge, find parts, 
                  and get help when you need it most.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-military-green" />
                  Your Data is Safe
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We never sell your information. SSL encryption, secure payments, 
                  and Swiss-based servers protect your privacy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Common Questions</h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do I need a credit card for the trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No! Start your 45-day trial instantly without any payment information. 
                  We'll only ask for payment when you're ready to continue after the trial.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Absolutely. Cancel with one click from your account settings. 
                  No phone calls, no hassle. You'll keep access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens to my downloaded files?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Any manuals or documents you've downloaded are yours to keep forever. 
                  Premium gives you continued access to updates and new content.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer trust message */}
        <div className="text-center mt-12 py-8 border-t">
          <p className="text-sm text-gray-500">
            Trusted by Unimog owners in 47 countries • Est. 2019 • 
            <br />
            Questions? Email us at support@unimogcommunityhub.com
          </p>
        </div>
      </div>
    </div>
  );
};