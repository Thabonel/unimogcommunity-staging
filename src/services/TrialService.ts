/**
 * Trial Management Service
 * 
 * Handles 45-day no-credit-card trials with strategic nudging
 * Designed for 55+ trust-sensitive Unimog community
 */

import { supabase } from '@/lib/supabase-client';
import { addDays, differenceInDays, isAfter } from 'date-fns';

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  trialStartDate: Date | null;
  trialEndDate: Date | null;
  nudgeType: 'none' | 'day7' | 'day21' | 'day40' | 'expired';
  showUpgradePrompt: boolean;
  canAccessPremium: boolean;
}

export interface TrialGuardrails {
  maxDownloadsPerDay: number;
  maxConcurrentDevices: number;
  requiresEmailVerification: boolean;
  requiresPhoneVerification: boolean;
  currentDownloads: number;
  currentDevices: number;
}

export class TrialService {
  private static instance: TrialService;
  private readonly TRIAL_DURATION_DAYS = 45;
  
  // Guardrail limits for free trial
  private readonly GUARDRAILS = {
    MAX_DOWNLOADS_PER_DAY: 10,
    MAX_CONCURRENT_DEVICES: 2,
    REQUIRE_EMAIL_VERIFICATION: true,
    REQUIRE_PHONE_VERIFICATION: false, // Optional for trust
  };

  // Nudge schedule (days from trial start)
  private readonly NUDGE_SCHEDULE = {
    EARLY: 7,   // "You're getting the hang of it!"
    MID: 21,    // "Look what you've accomplished"
    LATE: 40,   // "Your trial ends in 5 days"
    URGENT: 42, // "Only 3 days left!"
  };

  private constructor() {}

  static getInstance(): TrialService {
    if (!TrialService.instance) {
      TrialService.instance = new TrialService();
    }
    return TrialService.instance;
  }

  /**
   * Start a free trial without requiring credit card
   */
  async startFreeTrial(userId: string, email?: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user already has or had a trial
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_started_at, trial_ends_at, subscription_tier')
        .eq('id', userId)
        .single();

      if (profile?.trial_started_at) {
        return { 
          success: false, 
          message: 'You have already used your free trial. Please upgrade to continue.' 
        };
      }

      if (profile?.subscription_tier && profile.subscription_tier !== 'free') {
        return { 
          success: false, 
          message: 'You already have an active subscription.' 
        };
      }

      const trialStartDate = new Date();
      const trialEndDate = addDays(trialStartDate, this.TRIAL_DURATION_DAYS);

      // Start the trial
      const { error } = await supabase
        .from('profiles')
        .update({
          trial_started_at: trialStartDate.toISOString(),
          trial_ends_at: trialEndDate.toISOString(),
          subscription_tier: 'trial',
          trial_reminder_sent: false,
          email_verified: false,
        })
        .eq('id', userId);

      if (error) throw error;

      // Log trial start
      await this.logTrialEvent(userId, 'trial_started', {
        duration_days: this.TRIAL_DURATION_DAYS,
        email,
      });

      // Send welcome email if email provided
      if (email) {
        await this.sendTrialWelcomeEmail(email);
      }

      return { 
        success: true, 
        message: `Welcome! Your 45-day free trial has started. No credit card required. Explore all premium features until ${trialEndDate.toLocaleDateString()}.` 
      };
    } catch (error) {
      console.error('Error starting trial:', error);
      return { 
        success: false, 
        message: 'Unable to start trial. Please try again.' 
      };
    }
  }

  /**
   * Get current trial status for a user
   */
  async getTrialStatus(userId: string): Promise<TrialStatus> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_started_at, trial_ends_at, subscription_tier')
        .eq('id', userId)
        .single();

      if (!profile?.trial_started_at) {
        return {
          isActive: false,
          daysRemaining: 0,
          trialStartDate: null,
          trialEndDate: null,
          nudgeType: 'none',
          showUpgradePrompt: false,
          canAccessPremium: false,
        };
      }

      const trialStart = new Date(profile.trial_started_at);
      const trialEnd = new Date(profile.trial_ends_at);
      const now = new Date();
      const daysElapsed = differenceInDays(now, trialStart);
      const daysRemaining = Math.max(0, differenceInDays(trialEnd, now));
      const isExpired = isAfter(now, trialEnd);

      // Determine nudge type based on days elapsed
      let nudgeType: TrialStatus['nudgeType'] = 'none';
      if (isExpired) {
        nudgeType = 'expired';
      } else if (daysElapsed >= this.NUDGE_SCHEDULE.URGENT) {
        nudgeType = 'day40';
      } else if (daysElapsed >= this.NUDGE_SCHEDULE.LATE) {
        nudgeType = 'day40';
      } else if (daysElapsed >= this.NUDGE_SCHEDULE.MID) {
        nudgeType = 'day21';
      } else if (daysElapsed >= this.NUDGE_SCHEDULE.EARLY) {
        nudgeType = 'day7';
      }

      // Show upgrade prompt from day 30 onward
      const showUpgradePrompt = daysElapsed >= 30;

      return {
        isActive: !isExpired && profile.subscription_tier === 'trial',
        daysRemaining,
        trialStartDate: trialStart,
        trialEndDate: trialEnd,
        nudgeType,
        showUpgradePrompt,
        canAccessPremium: !isExpired && (profile.subscription_tier === 'trial' || profile.subscription_tier === 'premium'),
      };
    } catch (error) {
      console.error('Error getting trial status:', error);
      return {
        isActive: false,
        daysRemaining: 0,
        trialStartDate: null,
        trialEndDate: null,
        nudgeType: 'none',
        showUpgradePrompt: false,
        canAccessPremium: false,
      };
    }
  }

  /**
   * Get nudge message based on trial progress
   */
  getNudgeMessage(nudgeType: TrialStatus['nudgeType'], daysRemaining: number): string | null {
    switch (nudgeType) {
      case 'day7':
        return "🚀 You're getting the hang of it! You've explored manuals, found parts, and connected with the community. Keep discovering!";
      
      case 'day21':
        return "🎯 Look what you've accomplished! You've accessed technical guides, saved your favorite procedures, and helped fellow Unimog owners. The community is better with you here.";
      
      case 'day40':
        if (daysRemaining <= 3) {
          return `⏰ Only ${daysRemaining} days left in your trial! Don't lose access to workshop manuals, wiring diagrams, and expert support. Upgrade now to keep your Unimog running smoothly.`;
        }
        return `📅 Your trial ends in ${daysRemaining} days. Ready to continue? Join hundreds of Unimog owners who rely on our premium features daily.`;
      
      case 'expired':
        return "Your free trial has ended. Upgrade now to regain access to premium manuals, technical diagrams, and priority support. No long-term commitment required.";
      
      default:
        return null;
    }
  }

  /**
   * Check and enforce guardrails
   */
  async checkGuardrails(userId: string): Promise<TrialGuardrails> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check download count for today
      const { count: downloadCount } = await supabase
        .from('download_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      // Check active sessions/devices
      const { count: deviceCount } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('last_activity', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Active in last 30 min

      // Check email verification
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_verified, phone_verified')
        .eq('id', userId)
        .single();

      return {
        maxDownloadsPerDay: this.GUARDRAILS.MAX_DOWNLOADS_PER_DAY,
        maxConcurrentDevices: this.GUARDRAILS.MAX_CONCURRENT_DEVICES,
        requiresEmailVerification: this.GUARDRAILS.REQUIRE_EMAIL_VERIFICATION,
        requiresPhoneVerification: this.GUARDRAILS.REQUIRE_PHONE_VERIFICATION,
        currentDownloads: downloadCount || 0,
        currentDevices: deviceCount || 0,
      };
    } catch (error) {
      console.error('Error checking guardrails:', error);
      return {
        maxDownloadsPerDay: this.GUARDRAILS.MAX_DOWNLOADS_PER_DAY,
        maxConcurrentDevices: this.GUARDRAILS.MAX_CONCURRENT_DEVICES,
        requiresEmailVerification: this.GUARDRAILS.REQUIRE_EMAIL_VERIFICATION,
        requiresPhoneVerification: this.GUARDRAILS.REQUIRE_PHONE_VERIFICATION,
        currentDownloads: 0,
        currentDevices: 0,
      };
    }
  }

  /**
   * Record download for guardrail tracking
   */
  async recordDownload(userId: string, resource: string): Promise<boolean> {
    const guardrails = await this.checkGuardrails(userId);
    
    if (guardrails.currentDownloads >= guardrails.maxDownloadsPerDay) {
      throw new Error(`Daily download limit reached (${guardrails.maxDownloadsPerDay} per day). Upgrade for unlimited downloads.`);
    }

    const { error } = await supabase
      .from('download_logs')
      .insert({
        user_id: userId,
        resource,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
    return true;
  }

  /**
   * Log trial events for analytics
   */
  private async logTrialEvent(userId: string, event: string, metadata?: any) {
    try {
      await supabase
        .from('trial_events')
        .insert({
          user_id: userId,
          event,
          metadata,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging trial event:', error);
    }
  }

  /**
   * Send trial welcome email (stub for email service)
   */
  private async sendTrialWelcomeEmail(email: string) {
    // This would integrate with your email service
    console.log(`Sending welcome email to ${email}`);
    // Implementation would go here
  }

  /**
   * Convert trial to paid subscription
   */
  async convertToPaid(userId: string, paymentMethod?: string): Promise<{ success: boolean; message: string }> {
    try {
      const trialStatus = await this.getTrialStatus(userId);
      
      if (!trialStatus.trialStartDate) {
        return { 
          success: false, 
          message: 'No trial found. Please start a free trial first.' 
        };
      }

      // Update subscription status
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: 'premium',
          subscription_started_at: new Date().toISOString(),
          payment_method: paymentMethod,
        })
        .eq('id', userId);

      if (error) throw error;

      // Log conversion
      await this.logTrialEvent(userId, 'trial_converted', {
        days_used: differenceInDays(new Date(), trialStatus.trialStartDate),
        payment_method: paymentMethod,
      });

      return { 
        success: true, 
        message: 'Welcome to Premium! You now have unlimited access to all features.' 
      };
    } catch (error) {
      console.error('Error converting trial:', error);
      return { 
        success: false, 
        message: 'Unable to upgrade. Please try again.' 
      };
    }
  }
}

export default TrialService.getInstance();