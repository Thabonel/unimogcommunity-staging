/**
 * Trial Hook
 * 
 * Manages trial status and nudging throughout the app
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TrialService, { TrialStatus, TrialGuardrails } from '@/services/TrialService';
import { toast } from 'sonner';

export interface UseTrialReturn {
  trialStatus: TrialStatus | null;
  guardrails: TrialGuardrails | null;
  isLoading: boolean;
  startTrial: () => Promise<void>;
  checkDownloadLimit: () => Promise<boolean>;
  recordDownload: (resource: string) => Promise<void>;
  canAccessPremium: boolean;
  daysRemaining: number;
  showUpgradePrompt: boolean;
}

export const useTrial = (): UseTrialReturn => {
  const { user } = useAuth();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [guardrails, setGuardrails] = useState<TrialGuardrails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load trial status on mount and user change
  useEffect(() => {
    if (user) {
      loadTrialData();
    } else {
      setTrialStatus(null);
      setGuardrails(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadTrialData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [status, rails] = await Promise.all([
        TrialService.getTrialStatus(user.id),
        TrialService.checkGuardrails(user.id)
      ]);
      
      setTrialStatus(status);
      setGuardrails(rails);
    } catch (error) {
      console.error('Error loading trial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startTrial = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to start your free trial');
      return;
    }

    const result = await TrialService.startFreeTrial(user.id, user.email);
    
    if (result.success) {
      toast.success(result.message);
      await loadTrialData(); // Reload status
    } else {
      toast.error(result.message);
    }
  }, [user]);

  const checkDownloadLimit = useCallback(async (): Promise<boolean> => {
    if (!user || !guardrails) return false;
    
    // Premium users have no limits
    if (trialStatus?.canAccessPremium && 
        (trialStatus.isActive || user.user_metadata?.subscription_tier === 'premium')) {
      return true;
    }
    
    // Check if under limit
    if (guardrails.currentDownloads >= guardrails.maxDownloadsPerDay) {
      toast.error(
        `Daily download limit reached (${guardrails.maxDownloadsPerDay} per day). ` +
        `Upgrade for unlimited downloads.`,
        {
          action: {
            label: 'Upgrade Now',
            onClick: () => window.location.href = '/upgrade'
          }
        }
      );
      return false;
    }
    
    return true;
  }, [user, guardrails, trialStatus]);

  const recordDownload = useCallback(async (resource: string) => {
    if (!user) return;
    
    try {
      await TrialService.recordDownload(user.id, resource);
      // Reload guardrails to get updated count
      const rails = await TrialService.checkGuardrails(user.id);
      setGuardrails(rails);
      
      // Show remaining downloads if getting close to limit
      if (rails.currentDownloads >= rails.maxDownloadsPerDay - 2) {
        toast.info(
          `${rails.maxDownloadsPerDay - rails.currentDownloads} downloads remaining today`
        );
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to record download');
    }
  }, [user]);

  return {
    trialStatus,
    guardrails,
    isLoading,
    startTrial,
    checkDownloadLimit,
    recordDownload,
    canAccessPremium: trialStatus?.canAccessPremium || false,
    daysRemaining: trialStatus?.daysRemaining || 0,
    showUpgradePrompt: trialStatus?.showUpgradePrompt || false,
  };
};