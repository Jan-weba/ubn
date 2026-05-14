import Cookies from 'js-cookie';

/**
 * Utility to check if patient-related features should be visible.
 * Features are enabled if:
 * 1. NEXT_PUBLIC_ENABLE_PATIENT_FEATURES is 'true' in .env
 * 2. OR 'dev_mode' cookie is set to 'true'
 */
export const isPatientEnabled = (): boolean => {
  // Check environment variable
  const envEnabled = process.env.NEXT_PUBLIC_ENABLE_PATIENT_FEATURES === 'true';
  // Diagnostic log (only in development)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // console.log('[Features] Patient features enabled:', envEnabled);
  }
  if (envEnabled) return true;


  // Check for dev_mode cookie
  const devMode = Cookies.get('dev_mode') === 'true';
  return devMode;
};

/**
 * Helper to check and set dev mode from URL parameters
 */
export const checkAndSetDevMode = () => {
  if (typeof window === 'undefined') return;
  
  const params = new URLSearchParams(window.location.search);
  if (params.get('dev_mode') === 'true') {
    Cookies.set('dev_mode', 'true', { expires: 7 }); // Set for 7 days
    // Refresh to apply changes if needed, or just let the app react
    window.location.reload();
  } else if (params.get('dev_mode') === 'false') {
    Cookies.remove('dev_mode');
    window.location.reload();
  }
};
