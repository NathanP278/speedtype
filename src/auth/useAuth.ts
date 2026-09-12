import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { UserAccount, UserTelemetry } from './authTypes.ts';
import { purgeLocalDataAndCookies } from '../utils/storagePurge.ts';

export function useAuth() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync profile details from public.profiles table
  const fetchAndSetProfile = useCallback(async (userId: string, authUser: any) => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        setUser(null);
        return null;
      }

      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr || !data) {
        // Fallback to auth metadata or pending onboarding state
        const meta = authUser?.user_metadata || {};
        const fallbackAcc: UserAccount = {
          id: userId,
          email: authUser?.email || '',
          username: meta.username || authUser?.email?.split('@')[0] || `pilot_${userId.slice(0, 6)}`,
          avatar: meta.avatar_url || '⚡',
          displayName: meta.displayName,
          callSign: 'PILOT',
          telemetry: undefined,
          onboardingComplete: false,
          provider: 'google',
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
        displayName: data.display_name || undefined,
        callSign: data.call_sign || 'PILOT',
        telemetry: data.telemetry || undefined,
        onboardingComplete: Boolean(data.onboarding_complete),
        provider: 'google',
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
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
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

  // Exclusive Google OAuth Sign-In
  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      const msg = 'Cloud integration not configured. Google Sign-In unavailable.';
      setError(msg);
      return { success: false, error: msg };
    }

    try {
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
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

  // Update profile from onboarding wizard or profile settings
  const updateProfile = useCallback(async (updates: {
    username: string;
    avatar: string;
    displayName?: string;
    callSign?: string;
    telemetry?: UserTelemetry;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active session' };

    const updatedUser: UserAccount = {
      ...user,
      username: updates.username.trim(),
      avatar: updates.avatar,
      displayName: updates.displayName?.trim() || undefined,
      callSign: updates.callSign || user.callSign || 'PILOT',
      telemetry: updates.telemetry || user.telemetry,
      onboardingComplete: true,
    };

    // Update local immediately
    setUser(updatedUser);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username: updatedUser.username,
            avatar: updatedUser.avatar,
            display_name: updatedUser.displayName || null,
            call_sign: updatedUser.callSign,
            telemetry: updatedUser.telemetry || {},
            onboarding_complete: true,
            provider: 'google',
            updated_at: new Date().toISOString(),
          });

        if (upsertErr) {
          console.warn('[useAuth] Supabase profile sync warning:', upsertErr.message);
        }
      } catch (err) {
        console.error('[useAuth] Failed to push profile update to cloud:', err);
      }
    }

    return { success: true };
  }, [user]);

  // Sign out & complete storage purge
  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setUser(null);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error during signOut:', err);
      }
    }

    purgeLocalDataAndCookies();
    setIsLoading(false);
    window.location.reload();
  }, []);

  return {
    user,
    isLoading,
    error,
    isCloudEnabled: isSupabaseConfigured,
    signInWithGoogle,
    updateProfile,
    signOut,
  };
}
