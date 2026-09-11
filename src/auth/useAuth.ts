import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { UserAccount, SignUpData, SignInData } from './authTypes.ts';

const LOCAL_FALLBACK_USER_KEY = 'speedtype_auth_local_user';

function getLocalFallbackUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(LOCAL_FALLBACK_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserAccount;
  } catch {
    return null;
  }
}

function setLocalFallbackUser(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(LOCAL_FALLBACK_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_FALLBACK_USER_KEY);
    }
  } catch (err) {
    console.error('Failed to update local user storage', err);
  }
}

export function useAuth() {
  const [user, setUser] = useState<UserAccount | null>(() => {
    if (!isSupabaseConfigured) {
      return getLocalFallbackUser();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync profile details from public.profiles table
  const fetchAndSetProfile = useCallback(async (userId: string, authUser: any) => {
    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr || !data) {
        // Fallback to auth metadata if database row is still generating
        const meta = authUser?.user_metadata || {};
        const fallbackAcc: UserAccount = {
          id: userId,
          email: authUser?.email || '',
          username: meta.username || authUser?.email?.split('@')[0] || 'pilot',
          avatar: meta.avatar || '⚡',
          provider: (authUser?.app_metadata?.provider as 'google' | 'email') || 'email',
          createdAt: Date.now(),
        };
        setUser(fallbackAcc);
        return fallbackAcc;
      }

      const acc: UserAccount = {
        id: data.id,
        email: authUser?.email || '',
        username: data.username,
        avatar: data.avatar || '⚡',
        provider: (data.provider as 'google' | 'email') || 'email',
        createdAt: new Date(data.created_at).getTime(),
      };
      setUser(acc);
      return acc;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }, []);

  // Initialize session & auth listener
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(getLocalFallbackUser());
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        fetchAndSetProfile(session.user.id, session.user).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Listen for auth state transitions (login, logout, oauth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        setIsLoading(true);
        await fetchAndSetProfile(session.user.id, session.user);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAndSetProfile]);

  // Sign up with Email + Password + Username + Avatar
  const signUpWithEmail = useCallback(async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      // Offline / Demo account creation
      const demoAccount: UserAccount = {
        id: `demo_${Date.now()}`,
        email: data.email.toLowerCase().trim(),
        username: data.username.trim(),
        avatar: data.avatar,
        provider: 'email',
        createdAt: Date.now(),
      };
      setLocalFallbackUser(demoAccount);
      setUser(demoAccount);
      setIsLoading(false);
      return { success: true };
    }

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            username: data.username.trim(),
            avatar: data.avatar,
          },
        },
      });

      if (authErr) {
        setError(authErr.message);
        setIsLoading(false);
        return { success: false, error: authErr.message };
      }

      if (authData.user) {
        await fetchAndSetProfile(authData.user.id, authData.user);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign up';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  }, [fetchAndSetProfile]);

  // Sign in with Email + Password
  const signInWithEmail = useCallback(async (data: SignInData): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setIsLoading(true);

    if (!isSupabaseConfigured) {
      // Check local demo account
      const existing = getLocalFallbackUser();
      if (existing && existing.email === data.email.toLowerCase().trim()) {
        setUser(existing);
        setIsLoading(false);
        return { success: true };
      }
      // Or auto-create demo user for smooth offline experience
      const demoUser: UserAccount = {
        id: `demo_${Date.now()}`,
        email: data.email.toLowerCase().trim(),
        username: data.email.split('@')[0],
        avatar: '⚡',
        provider: 'email',
        createdAt: Date.now(),
      };
      setLocalFallbackUser(demoUser);
      setUser(demoUser);
      setIsLoading(false);
      return { success: true };
    }

    try {
      const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (authErr) {
        setError(authErr.message);
        setIsLoading(false);
        return { success: false, error: authErr.message };
      }

      if (authData.user) {
        await fetchAndSetProfile(authData.user.id, authData.user);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to sign in';
      setError(msg);
      setIsLoading(false);
      return { success: false, error: msg };
    }
  }, [fetchAndSetProfile]);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    if (!isSupabaseConfigured) {
      // Offline demo mode Google sign in
      const googleDemo: UserAccount = {
        id: `google_demo_${Date.now()}`,
        email: 'pilot.google@example.com',
        username: 'google_pilot',
        avatar: '⚡',
        provider: 'google',
        createdAt: Date.now(),
      };
      setLocalFallbackUser(googleDemo);
      setUser(googleDemo);
      return { success: true };
    }

    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (oauthErr) {
        setError(oauthErr.message);
        return { success: false, error: oauthErr.message };
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to initialize Google sign-in';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setLocalFallbackUser(null);
    setUser(null);

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error during signOut:', err);
      }
    }

    setIsLoading(false);
  }, []);

  return {
    user,
    isLoading,
    error,
    isCloudEnabled: isSupabaseConfigured,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  };
}
