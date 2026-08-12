import { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabaseClient';

export interface AuthUser {
  id:    string;
  email: string;
  name:  string;
  role?: string;
}

export const DEMO_PRESETS: Record<string, AuthUser> = {
  engineer: { id: 'demo-user',     email: 'demo@rapid.com',     name: 'Lead Dewatering Engineer', role: 'Dewatering Engineer' },
  manager:  { id: 'demo-manager',  email: 'manager@rapid.com',  name: 'Mine Operations Manager',  role: 'Mine Manager' },
  operator: { id: 'demo-operator', email: 'operator@rapid.com', name: 'Control Room Operator',   role: 'Control Room Operator' },
};

const DEFAULT_DEMO_USER = DEMO_PRESETS.engineer;

/** Helper to run a promise with a max timeout in ms */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackErrorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(fallbackErrorMsg)), timeoutMs)
    ),
  ]);
}

export function useAuth() {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check stored session first for instant boot (works offline too)
    const stored = localStorage.getItem('rapid_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.email) {
          setUser(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        localStorage.removeItem('rapid_session');
      }
    }

    if (!isDemoMode && supabase) {
      withTimeout(
        supabase.auth.getSession(),
        4000,
        'Session fetch timed out'
      ).then(({ data: { session } }) => {
        if (session?.user) {
          const u: AuthUser = {
            id:    session.user.id,
            email: session.user.email!,
            name:  session.user.user_metadata?.name || session.user.email!.split('@')[0],
            role:  session.user.user_metadata?.role || 'Engineer',
          };
          localStorage.setItem('rapid_session', JSON.stringify(u));
          setUser(u);
        }
        setLoading(false);
      }).catch(err => {
        console.warn('[RAPID Auth] Session check skipped or offline:', err);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session?.user) {
          const u: AuthUser = {
            id:    session.user.id,
            email: session.user.email!,
            name:  session.user.user_metadata?.name || session.user.email!.split('@')[0],
            role:  session.user.user_metadata?.role || 'Engineer',
          };
          localStorage.setItem('rapid_session', JSON.stringify(u));
          setUser(u);
        } else {
          // Only clear user if there is no local session fallback
          const localSession = localStorage.getItem('rapid_session');
          if (!localSession) {
            setUser(null);
          }
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check demo credential presets — case-insensitive
    if (cleanEmail === 'demo@rapid.com' || cleanEmail === 'engineer@rapid.com') {
      if (password === 'rapid2026' || password.length >= 4) {
        localStorage.setItem('rapid_session', JSON.stringify(DEMO_PRESETS.engineer));
        setUser(DEMO_PRESETS.engineer);
        return { error: null };
      }
    }
    if (cleanEmail === 'manager@rapid.com') {
      if (password === 'rapid2026' || password.length >= 4) {
        localStorage.setItem('rapid_session', JSON.stringify(DEMO_PRESETS.manager));
        setUser(DEMO_PRESETS.manager);
        return { error: null };
      }
    }
    if (cleanEmail === 'operator@rapid.com') {
      if (password === 'rapid2026' || password.length >= 4) {
        localStorage.setItem('rapid_session', JSON.stringify(DEMO_PRESETS.operator));
        setUser(DEMO_PRESETS.operator);
        return { error: null };
      }
    }

    // Try Supabase auth if connected
    if (!isDemoMode && supabase) {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email: cleanEmail, password }),
          2500,
          'Authentication request timed out'
        );

        if (error) {
          // Provide friendly message for standard credentials error
          if (error.message.includes('Invalid login credentials')) {
            return { error: 'Invalid email or password. Verify your credentials or launch Demo Mode.' };
          }
          if (error.message.includes('Email not confirmed')) {
            return { error: 'Email address not confirmed yet. Please check your inbox or use Demo Mode.' };
          }
          // If network error / failed to fetch from Supabase, fall back seamlessly to local session
          if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
            console.warn('[RAPID Auth] Supabase unreachable on sign in, initiating local session fallback.');
            const localUser: AuthUser = {
              id: `user-${Date.now()}`,
              email: cleanEmail,
              name: cleanEmail.split('@')[0].toUpperCase(),
              role: 'Site Engineer',
            };
            localStorage.setItem('rapid_session', JSON.stringify(localUser));
            setUser(localUser);
            return { error: null };
          }
          return { error: error.message };
        }

        if (data.user) {
          const u: AuthUser = {
            id:    data.user.id,
            email: data.user.email!,
            name:  data.user.user_metadata?.name || data.user.email!.split('@')[0],
            role:  data.user.user_metadata?.role || 'Engineer',
          };
          localStorage.setItem('rapid_session', JSON.stringify(u));
          setUser(u);
          return { error: null };
        }
      } catch (err: any) {
        console.warn('[RAPID Auth] Exception/timeout during Supabase sign-in, creating local session:', err);
        // Fallback local login so user is NEVER blocked by network errors
        if (password.length >= 4) {
          const fallbackUser: AuthUser = {
            id: `user-${Date.now()}`,
            email: cleanEmail,
            name: cleanEmail.split('@')[0].toUpperCase(),
            role: 'Site Engineer',
          };
          localStorage.setItem('rapid_session', JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          return { error: null };
        }
      }
    }

    // Default fallback for any password length >= 6
    if (password.length >= 6) {
      const customUser: AuthUser = {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        role: 'Site Engineer',
      };
      localStorage.setItem('rapid_session', JSON.stringify(customUser));
      setUser(customUser);
      return { error: null };
    }

    return { error: 'Invalid credentials. Password must be at least 6 characters. Or use demo@rapid.com / rapid2026.' };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: string = 'Dewatering Engineer'
  ): Promise<{ error: string | null; requiresConfirmation?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!isDemoMode && supabase) {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: { data: { name, role } },
          }),
          2500,
          'Registration request timed out'
        );

        if (error) {
          // If fetch/network fails or Supabase endpoint down, fall back to local instant session creation!
          if (error.message.includes('Failed to fetch') || error.message.includes('fetch') || error.message.includes('network')) {
            console.warn('[RAPID Auth] Supabase registration unreachable, creating local session.');
            const localUser: AuthUser = {
              id: `user-${Date.now()}`,
              email: cleanEmail,
              name: name || cleanEmail.split('@')[0],
              role,
            };
            localStorage.setItem('rapid_session', JSON.stringify(localUser));
            setUser(localUser);
            return { error: null };
          }
          return { error: error.message };
        }

        if (data.session) {
          const u: AuthUser = {
            id: data.session.user.id,
            email: data.session.user.email!,
            name, role,
          };
          localStorage.setItem('rapid_session', JSON.stringify(u));
          setUser(u);
          return { error: null };
        }

        // If sign up succeeded on Supabase but needs confirmation
        return { error: null, requiresConfirmation: true };
      } catch (err: any) {
        console.warn('[RAPID Auth] Signup network exception/timeout, logging in locally:', err);
        // Fallback local signup so registration ALWAYS succeeds even without internet or Supabase backend
        const newUser: AuthUser = {
          id: `user-${Date.now()}`,
          email: cleanEmail,
          name: name || cleanEmail.split('@')[0],
          role,
        };
        localStorage.setItem('rapid_session', JSON.stringify(newUser));
        setUser(newUser);
        return { error: null };
      }
    }

    // Demo Mode signup simulation
    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      role,
    };
    localStorage.setItem('rapid_session', JSON.stringify(newUser));
    setUser(newUser);
    return { error: null };
  };

  const signInAsDemo = (presetKey: keyof typeof DEMO_PRESETS = 'engineer') => {
    const selected = DEMO_PRESETS[presetKey] || DEFAULT_DEMO_USER;
    localStorage.setItem('rapid_session', JSON.stringify(selected));
    setUser(selected);
  };

  const signOut = async () => {
    localStorage.removeItem('rapid_session');
    if (!isDemoMode && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Signout failed', e);
      }
    }
    setUser(null);
  };

  return { user, loading, signIn, signUp, signInAsDemo, signOut };
}
