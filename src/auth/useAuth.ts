import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import { UserAccount, UserTelemetry } from './authTypes.ts';
import { purgeLocalDataAndCookies } from '../utils/storagePurge.ts';
import { AVATAR_OPTIONS } from '../profile/profile.ts';

const OAUTH_CHANNEL_NAME = 'speedtype_auth_channel';
const OAUTH_CODE_KEY = 'speedtype_oauth_code_bridge';
const OAUTH_SESSION_KEY = 'speedtype_oauth_session_bridge';

export function useAuth() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Sync profile details from public.profiles table or auth metadata
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

      const meta = authUser?.user_metadata || {};
      const rawCandidate =
        meta.username ||
        meta.full_name ||
        authUser?.email?.split('@')[0] ||
        `pilot_${userId.slice(0, 6)}`;
      const sanitized = rawCandidate.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().slice(0, 20);
      const fallbackUsername = sanitized.length >= 3 ? sanitized : `pilot_${userId.slice(0, 6)}`;
      const fallbackAvatar = AVATAR_OPTIONS.includes(meta.avatar) ? meta.avatar : '⚡';

      if (profileErr || !data) {
        const fallbackAcc: UserAccount = {
          id: userId,
          email: authUser?.email || '',
          username: fallbackUsername,
          avatar: fallbackAvatar,
          displayName: meta.full_name || meta.displayName || undefined,
          callSign: 'PILOT',
          telemetry: undefined,
          onboardingComplete: Boolean(meta.onboarding_complete),
          provider: 'google',
          createdAt: Date.now(),
        };
        setUser(fallbackAcc);
        return fallbackAcc;
      }

      const acc: UserAccount = {
        id: data.id,
        email: authUser?.email || '',
        username: data.username || fallbackUsername,
        avatar: data.avatar || fallbackAvatar,
        displayName: data.display_name || undefined,
        callSign: data.call_sign || 'PILOT',
        telemetry: data.telemetry || undefined,
        onboardingComplete: Boolean(data.onboarding_complete || meta.onboarding_complete),
        provider: 'google',
        createdAt: new Date(data.created_at).getTime(),
      };
      setUser(acc);
      return acc;
    } catch (err) {
      console.error('[useAuth] Error fetching user profile:', err);
      return null;
    }
  }, []);

  // Exchange PKCE authorization code in the parent window holding the code_verifier
  const handleOAuthCode = useCallback(
    async (authCode: string) => {
      if (!isMountedRef.current || !isSupabaseConfigured || !supabase) return;
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: exErr } = await supabase.auth.exchangeCodeForSession(authCode);
        if (exErr) {
          console.error('[useAuth] exchangeCodeForSession failed:', exErr.message);
          setError(exErr.message);
          return;
        }
        if (data?.session?.user) {
          await fetchAndSetProfile(data.session.user.id, data.session.user);
        }
      } catch (err: any) {
        console.error('[useAuth] Error exchanging code for session:', err);
        setError(err?.message || 'Authentication code exchange failed');
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [fetchAndSetProfile]
  );

  // Apply already-obtained session tokens (e.g. implicit flow)
  const handleOAuthSession = useCallback(
    async (tokens: { access_token: string; refresh_token: string }) => {
      if (!isMountedRef.current || !isSupabaseConfigured || !supabase) return;
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: setErr } = await supabase.auth.setSession(tokens);
        if (!setErr && data?.session?.user) {
          await fetchAndSetProfile(data.session.user.id, data.session.user);
        } else if (setErr) {
          console.error('[useAuth] setSession error:', setErr.message);
        }
      } catch (err: any) {
        console.error('[useAuth] Error applying session tokens:', err);
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    },
    [fetchAndSetProfile]
  );

  // Initialize session & cross-window auth synchronization listeners
  useEffect(() => {
    isMountedRef.current = true;

    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // 1. Initial session check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMountedRef.current) return;
      if (session?.user) {
        fetchAndSetProfile(session.user.id, session.user).finally(() => {
          if (isMountedRef.current) setIsLoading(false);
        });
      } else {
        // Direct redirect callback
        if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
          return;
        }
        // Pending code bridge
        const codeBridgeStr = localStorage.getItem(OAUTH_CODE_KEY);
        if (codeBridgeStr) {
          try {
            const parsed = JSON.parse(codeBridgeStr);
            localStorage.removeItem(OAUTH_CODE_KEY);
            if (parsed?.code && Date.now() - (parsed.timestamp || 0) < 60000) {
              handleOAuthCode(parsed.code);
              return;
            }
          } catch {}
        }
        setUser(null);
        setIsLoading(false);
      }
    });

    // 2. BroadcastChannel listener (primary for same-origin tabs/windows)
    let authChannel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        authChannel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
        authChannel.onmessage = async (event: MessageEvent) => {
          if (event.data?.type === 'SPEEDTYPE_OAUTH_CODE' && event.data?.code) {
            await handleOAuthCode(event.data.code);
          } else if (event.data?.type === 'SPEEDTYPE_OAUTH_SESSION' && event.data?.session) {
            await handleOAuthSession(event.data.session);
          }
        };
      } catch (e) {
        console.warn('[useAuth] BroadcastChannel init error:', e);
      }
    }

    // 3. postMessage listener (fallback for window.opener)
    const handleWindowMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'SPEEDTYPE_OAUTH_CODE' && event.data?.code) {
        if (!isMountedRef.current) return;
        await handleOAuthCode(event.data.code);
      } else if (event.data?.type === 'SPEEDTYPE_OAUTH_SESSION' && event.data?.session) {
        if (!isMountedRef.current) return;
        await handleOAuthSession(event.data.session);
      }
    };
    window.addEventListener('message', handleWindowMessage);

    // 4. storage event listener (cross-tab fallback)
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === OAUTH_CODE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          localStorage.removeItem(OAUTH_CODE_KEY);
          if (parsed?.code) {
            await handleOAuthCode(parsed.code);
          }
        } catch (e) {
          console.warn('[useAuth] Storage code bridge parse error:', e);
        }
      } else if (event.key === OAUTH_SESSION_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          localStorage.removeItem(OAUTH_SESSION_KEY);
          if (parsed?.access_token && parsed?.refresh_token) {
            await handleOAuthSession(parsed);
          }
        } catch (e) {
          console.warn('[useAuth] Storage session bridge parse error:', e);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 5. Supabase Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMountedRef.current) return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
        setIsLoading(true);
        await fetchAndSetProfile(session.user.id, session.user);
        if (window.history?.replaceState && window.location.search.includes('code=')) {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState(null, '', cleanUrl);
        }
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('storage', handleStorageChange);
      authChannel?.close();
      subscription.unsubscribe();
    };
  }, [fetchAndSetProfile, handleOAuthCode, handleOAuthSession]);

  // Exclusive Google OAuth Sign-In with Dedicated Popup & Account Selection
  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      const msg = 'Cloud integration not configured. Google Sign-In unavailable.';
      setError(msg);
      return { success: false, error: msg };
    }

    try {
      const { data, error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });

      if (oauthErr) {
        setError(oauthErr.message);
        return { success: false, error: oauthErr.message };
      }

      if (!data?.url) {
        const msg = 'Failed to obtain Google authorization URL';
        setError(msg);
        return { success: false, error: msg };
      }

      // Open centered popup window
      const width = 520;
      const height = 650;
      const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
      const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

      const popup = window.open(
        data.url,
        'speedtype_google_oauth',
        `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Direct redirect fallback if browser blocks popups
        console.warn('[useAuth] Popup blocked by browser. Falling back to direct redirect.');
        window.location.assign(data.url);
        return { success: true };
      }

      popup.focus();

      // Poll popup closure as fallback synchronization
      const timer = setInterval(async () => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          // Check code bridge
          const codeStr = localStorage.getItem(OAUTH_CODE_KEY);
          if (codeStr) {
            try {
              const parsed = JSON.parse(codeStr);
              localStorage.removeItem(OAUTH_CODE_KEY);
              if (parsed?.code) {
                await handleOAuthCode(parsed.code);
                return;
              }
            } catch {}
          }
          // Check session bridge
          const sessionStr = localStorage.getItem(OAUTH_SESSION_KEY);
          if (sessionStr) {
            try {
              const parsed = JSON.parse(sessionStr);
              localStorage.removeItem(OAUTH_SESSION_KEY);
              if (parsed?.access_token && parsed?.refresh_token) {
                await handleOAuthSession(parsed);
                return;
              }
            } catch {}
          }
          // Fallback getSession
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await fetchAndSetProfile(session.user.id, session.user);
          }
        }
      }, 400);

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Failed to initialize Google sign-in';
      setError(msg);
      return { success: false, error: msg };
    }
  }, [fetchAndSetProfile, handleOAuthCode, handleOAuthSession]);

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

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Update Supabase Auth user_metadata directly (cloud-level, bypasses table dependencies)
        await supabase.auth.updateUser({
          data: {
            username: updatedUser.username,
            avatar: updatedUser.avatar,
            display_name: updatedUser.displayName || null,
            call_sign: updatedUser.callSign,
            onboarding_complete: true,
          },
        });

        // 2. Upsert public.profiles record
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
          console.warn('[useAuth] Supabase profile sync error:', upsertErr.message);
          const friendlyError = upsertErr.message.toLowerCase().includes('unique')
            ? 'That handle is already claimed by another pilot. Please choose another.'
            : upsertErr.message;
          return { success: false, error: friendlyError };
        }
      } catch (err: any) {
        console.error('[useAuth] Failed to push profile update to cloud:', err);
        return { success: false, error: err?.message || 'Failed to sync profile to cloud' };
      }
    }

    // Update user state upon confirmed persistence
    setUser(updatedUser);
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
        console.error('[useAuth] Error during signOut:', err);
      }
    }

    localStorage.removeItem(OAUTH_CODE_KEY);
    localStorage.removeItem(OAUTH_SESSION_KEY);
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
