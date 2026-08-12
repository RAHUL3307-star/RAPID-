/**
 * useAuth — thin wrapper around AuthContext.
 * All components that call useAuth() now share the SAME auth state
 * because it reads from React Context instead of local component state.
 */
export { DEMO_PRESETS } from '../lib/AuthContext';
export type { AuthUser } from '../lib/AuthContext';
export { useAuthContext as useAuth } from '../lib/AuthContext';
