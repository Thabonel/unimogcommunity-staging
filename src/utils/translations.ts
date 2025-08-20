/**
 * Translation utility to fix missing translations
 * Provides fallback text for any missing translation keys
 */

const translations: Record<string, string> = {
  // Auth translations
  'auth.sign_up': 'Sign Up',
  'auth.sign_in': 'Sign In',
  'auth.signup': 'Sign Up',
  'auth.signin': 'Sign In',
  'auth.login': 'Log In',
  'auth.logout': 'Log Out',
  'auth.register': 'Register',
  'auth.create_account': 'Create Account',
  'auth.start_trial': 'Start Free Trial',
  
  // Button translations
  'button.sign_up': 'Sign Up',
  'button.sign_in': 'Sign In',
  'button.start_trial': 'Start Free Trial',
  'button.get_started': 'Get Started',
  'button.try_free': 'Try Free for 45 Days',
  
  // Trial translations
  'trial.start': 'Start Your Free Trial',
  'trial.no_credit_card': 'No credit card required',
  'trial.45_days': '45 days free access',
  
  // Common
  'common.welcome': 'Welcome',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.loading': 'Loading...',
};

/**
 * Get translation for a key, with fallback to the key itself if not found
 */
export function t(key: string): string {
  // If translation exists, return it
  if (translations[key]) {
    return translations[key];
  }
  
  // If key contains dots, try to make it readable as fallback
  if (key.includes('.')) {
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];
    // Convert snake_case or camelCase to Title Case
    return lastPart
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Last resort: return the key itself
  return key;
}

/**
 * Hook to use translations in components
 */
export function useTranslation() {
  return { t };
}