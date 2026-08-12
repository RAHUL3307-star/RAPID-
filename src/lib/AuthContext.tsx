import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isDemoMode } from './supabaseClient';

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackErrorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(fallbackErrorMsg)), timeoutMs)
    ),
  ]);
}

interface AuthContextType {
  user:         AuthUser | null;
  loading:      boolean;
  signIn:       (email: string, password: string) => Promise<{ error: string | null }>;
  signUp:       (email: string, password: string, name: string, role?: string) => Promise<{ error: string | null; requiresConfirmation?: boolean }>;
  signInAsDemo: (presetKey?: keyof typeof DEMO_PRESETS) => void;
  signOut:      () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try reading stored session immediately (instant boot, works offline)
    const stored = localStorage.getItem('rapid_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id && parsed.email) {
          setUser(parsed);
          setLoading(false);
          // Still register the listener for future Supabase events
        }
      } catch (e) {
        localStorage.removeItem('rapid_session');
      }
    }

    if (!isDemoMode && supabase) {
      // 2. Validate against Supabase in background (does NOT block the UI)
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

      // 3. Listen for auth changes (login / logout from Supabase)
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
          const localSession = localStorage.getItem('rapid_session');
          if (!localSession) {
            setUser(null);
          }
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // Demo mode — just finish loading
      setLoading(false);
    }
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Demo credential shortcuts
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

    // Try Supabase
    if (!isDemoMode && supabase) {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.signInWithPassword({ email: cleanEmail, password }),
          2500,
          'Authentication request timed out'
        );

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            return { error: 'Invalid email or password. Verify your credentials or launch Demo Mode.' };
          }
          if (error.message.includes('Email not confirmed')) {
            return { error: 'Email address not confirmed yet. Please check your inbox or use Demo Mode.' };
          }
          if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
            console.warn('[RAPID Auth] Supabase unreachable, falling back to local session.');
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
        console.warn('[RAPID Auth] Exception/timeout during sign-in, creating local session:', err);
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

    // Final fallback for any password >= 6 chars
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
          if (error.message.includes('Failed to fetch') || error.message.includes('fetch') || error.message.includes('network')) {
            console.warn('[RAPID Auth] Supabase registration unreachable, creating local session.');
            const localUser: AuthUser = { id: `user-${Date.now()}`, email: cleanEmail, name: name || cleanEmail.split('@')[0], role };
            localStorage.setItem('rapid_session', JSON.stringify(localUser));
            setUser(localUser);
            return { error: null };
          }
          return { error: error.message };
        }

        if (data.session) {
          const u: AuthUser = { id: data.session.user.id, email: data.session.user.email!, name, role };
          localStorage.setItem('rapid_session', JSON.stringify(u));
          setUser(u);
          return { error: null };
        }

        return { error: null, requiresConfirmation: true };
      } catch (err: any) {
        console.warn('[RAPID Auth] Signup network exception/timeout, logging in locally:', err);
        const newUser: AuthUser = { id: `user-${Date.now()}`, email: cleanEmail, name: name || cleanEmail.split('@')[0], role };
        localStorage.setItem('rapid_session', JSON.stringify(newUser));
        setUser(newUser);
        return { error: null };
      }
    }

    const newUser: AuthUser = { id: `user-${Date.now()}`, email: cleanEmail, name: name || cleanEmail.split('@')[0], role };
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
      try { await supabase.auth.signOut(); } catch (e) { console.warn('Signout failed', e); }
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
