/**
 * Trial Banner Component
 * 
 * Trust-building banner for promoting no-CC trial
 * Designed for 55+ audience
 */

import React from 'react';
import { Gift, ArrowRight, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTrial } from '@/hooks/useTrial';
import { useNavigate } from 'react-router-dom';

export const TrialBanner: React.FC = () => {
  const { user } = useAuth();
  const { trialStatus, startTrial } = useTrial();
  const navigate = useNavigate();

  // Don't show if user has active subscription or expired trial
  if (user && (trialStatus?.isActive || trialStatus?.nudgeType === 'expired')) {
    return null;
  }

  // Don't show if user is already premium
  if (user?.user_metadata?.subscription_tier === 'premium') {
    return null;
  }

  const handleStartTrial = async () => {
    if (!user) {
      // Redirect to sign up with trial intent
      navigate('/signup?intent=trial');
      return;
    }
    
    await startTrial();
  };

  return (
    <div className="bg-gradient-to-r from-military-green/10 via-khaki-tan/10 to-military-green/10 border-y border-military-green/20">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left content */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-military-green/20">
              <Gift className="h-6 w-6 text-military-green" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                Get 45 Days Free Access
                <span className="hidden sm:inline text-sm font-normal text-gray-600 dark:text-gray-400">
                  — No credit card required
                </span>
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Access all workshop manuals, wiring diagrams, and Barry AI support. 
                <span className="hidden md:inline"> Join 500+ Unimog owners.</span>
              </p>
            </div>
          </div>

          {/* Right content */}
          <div className="flex items-center gap-4">
            {/* Trust indicators */}
            <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Cancel anytime
              </span>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleStartTrial}
              size="lg"
              className="bg-military-green hover:bg-military-green/90 whitespace-nowrap"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};