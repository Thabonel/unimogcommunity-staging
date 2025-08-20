/**
 * Trial Nudge Component
 * 
 * Trust-building nudges for 55+ Unimog community
 * No pressure, just helpful reminders
 */

import React, { useEffect, useState } from 'react';
import { X, Clock, Gift, Shield, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TrialService, { TrialStatus } from '@/services/TrialService';
import { useAuth } from '@/contexts/AuthContext';

export const TrialNudge: React.FC = () => {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (user && !isDismissed) {
      loadTrialStatus();
    }
  }, [user, isDismissed]);

  const loadTrialStatus = async () => {
    if (!user) return;
    
    const status = await TrialService.getTrialStatus(user.id);
    setTrialStatus(status);
    
    // Show nudge if appropriate
    if (status.nudgeType !== 'none' && !isDismissed) {
      // Delay showing nudge for better UX
      setTimeout(() => setIsVisible(true), 2000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    // Remember dismissal for this session
    sessionStorage.setItem('trial-nudge-dismissed', 'true');
  };

  const handleUpgrade = () => {
    // Navigate to upgrade page
    window.location.href = '/upgrade';
  };

  if (!trialStatus || !isVisible || trialStatus.nudgeType === 'none') {
    return null;
  }

  const nudgeMessage = TrialService.getNudgeMessage(
    trialStatus.nudgeType,
    trialStatus.daysRemaining
  );

  // Different styles based on urgency
  const getUrgencyStyles = () => {
    if (trialStatus.nudgeType === 'expired') {
      return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
    }
    if (trialStatus.daysRemaining <= 5) {
      return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
    }
    if (trialStatus.nudgeType === 'day21') {
      return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
    }
    return 'bg-military-green/5 border-military-green/20';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-md"
        >
          <Card className={`p-6 shadow-xl ${getUrgencyStyles()}`}>
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header with icon */}
            <div className="flex items-start gap-3 mb-4">
              {trialStatus.nudgeType === 'expired' ? (
                <Shield className="h-6 w-6 text-red-600 mt-1" />
              ) : trialStatus.daysRemaining <= 5 ? (
                <Clock className="h-6 w-6 text-orange-600 mt-1" />
              ) : (
                <Gift className="h-6 w-6 text-military-green mt-1" />
              )}
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">
                  {trialStatus.nudgeType === 'expired' 
                    ? 'Trial Ended' 
                    : trialStatus.daysRemaining <= 5
                    ? `${trialStatus.daysRemaining} Days Left`
                    : 'Your Free Trial'}
                </h3>
                
                {trialStatus.daysRemaining > 0 && (
                  <Badge variant="outline" className="mb-2">
                    {trialStatus.daysRemaining} days remaining
                  </Badge>
                )}
              </div>
            </div>

            {/* Nudge message */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              {nudgeMessage}
            </p>

            {/* Benefits reminder (trust-building) */}
            {trialStatus.nudgeType !== 'day7' && (
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium mb-2">What you'll keep with Premium:</p>
                <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                  <li>✓ Unlimited manual downloads</li>
                  <li>✓ All wiring diagrams & schematics</li>
                  <li>✓ Priority Barry AI support</li>
                  <li>✓ Ad-free experience</li>
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {trialStatus.showUpgradePrompt && (
                <Button
                  onClick={handleUpgrade}
                  className="flex-1 bg-military-green hover:bg-military-green/90"
                >
                  {trialStatus.nudgeType === 'expired' 
                    ? 'Upgrade Now' 
                    : 'Continue with Premium'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              
              {!trialStatus.showUpgradePrompt && trialStatus.nudgeType === 'day7' && (
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="flex-1"
                >
                  Thanks, I'm exploring!
                </Button>
              )}
              
              {trialStatus.showUpgradePrompt && trialStatus.nudgeType !== 'expired' && (
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="px-4"
                >
                  Maybe later
                </Button>
              )}
            </div>

            {/* Trust elements */}
            <div className="mt-4 pt-3 border-t border-black/10">
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                No credit card required • Cancel anytime • Your data is safe
              </p>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};