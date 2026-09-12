import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AVATAR_OPTIONS, validateUsername } from '../profile/profile.ts';
import { UserAccount, UserTelemetry } from '../auth/authTypes.ts';

interface AuthModalProps {
  currentUser: UserAccount | null;
  onSignInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  onUpdateProfile: (data: {
    username: string;
    avatar: string;
    displayName?: string;
    callSign?: string;
    telemetry?: UserTelemetry;
  }) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  serverError: string | null;
  isCloudEnabled: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onSignInWithGoogle,
  onUpdateProfile,
  isLoading,
  serverError,
  isCloudEnabled,
}) => {
  const [username, setUsername] = useState<string>(() => currentUser?.username || '');
  const [avatar, setAvatar] = useState<string>(() => currentUser?.avatar || '⚡');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const handleInputRef = useRef<HTMLInputElement>(null);

  const activeError = localError || serverError;

  // Keep username & avatar populated when user state hydrates
  useEffect(() => {
    if (currentUser) {
      setUsername((prev) => prev || currentUser.username || '');
      setAvatar((prev) => (prev === '⚡' || !prev ? currentUser.avatar || '⚡' : prev));
      setTimeout(() => {
        handleInputRef.current?.focus();
      }, 50);
    }
  }, [currentUser]);

  const handleFinalize = useCallback(async () => {
    setLocalError(null);
    const err = validateUsername(username);
    if (err) {
      setLocalError(err);
      return;
    }

    setIsSubmitting(true);
    const res = await onUpdateProfile({
      username: username.trim(),
      avatar,
      displayName: undefined,
      callSign: 'PILOT',
      telemetry: undefined,
    });

    setIsSubmitting(false);
    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  }, [username, avatar, onUpdateProfile]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none animate-fadeIn">
      {/* Subtle CRT Phosphor Grid Background */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--theme-text) 1px, transparent 1px), linear-gradient(90deg, var(--theme-text) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-xl max-h-[92dvh] overflow-y-auto bg-zinc-950 border border-zinc-800/90 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
        {activeError && (
          <div className="w-full mb-4 sm:mb-6 p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-400 text-center animate-shake">
            {activeError}
          </div>
        )}

        {!currentUser ? (
          /* STATE A: Minimalist Homepage Landing */
          <div className="flex flex-col items-center w-full py-4 sm:py-8">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
              ⚡
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-widest text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] mb-2">
              SPEEDTYPE
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 mt-2 mb-6 sm:mb-10 tracking-widest uppercase">
              Zero-latency cyber combat typing engine.
            </p>

            <button
              type="button"
              onClick={async () => {
                setLocalError(null);
                const res = await onSignInWithGoogle();
                if (!res.success && res.error) {
                  setLocalError(res.error);
                }
              }}
              disabled={isLoading || !isCloudEnabled}
              className="w-full max-w-sm py-4 px-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[var(--theme-text)] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-4 shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer focus-ring disabled:opacity-50"
            >
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'ESTABLISHING HANDSHAKE...' : 'CONTINUE WITH GOOGLE'}</span>
            </button>

            {!isCloudEnabled && (
              <p className="text-xs text-amber-500 mt-4">
                ⚠️ Cloud integration not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
              </p>
            )}

            <div className="mt-8 flex items-center gap-3 text-[9px] sm:text-[10px] text-zinc-600 font-bold tracking-widest uppercase">
              <span>TLS 1.3</span>
              <span>•</span>
              <span>OAuth 2.0 PKCE</span>
              <span>•</span>
              <span>No passwords stored</span>
            </div>
          </div>
        ) : (
          /* STATE B: Authenticated but missing username/avatar (Onboarding) */
          <div className="flex flex-col w-full text-left py-4">
            <h2 className="text-xl font-black text-white tracking-widest mb-4 border-b border-zinc-800 pb-4 text-center">
              CHOOSE YOUR PILOT HANDLE
            </h2>

            {/* Confirmed Google Account Badge */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl mb-6 text-xs">
              <span className="text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                GOOGLE ACCOUNT
              </span>
              <span className="text-white font-mono font-semibold truncate max-w-[240px]">
                {currentUser?.email}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Pilot Username
                </label>
                <div className="relative">
                  <input
                    ref={handleInputRef}
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value.toLowerCase());
                      setLocalError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinalize()}
                    maxLength={20}
                    placeholder="e.g. cyber_strike"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full px-5 py-4 bg-black border border-zinc-800 rounded-xl text-white font-mono text-base tracking-wider placeholder-zinc-700 outline-none focus-ring focus:border-[var(--theme-text)] transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600 font-bold">
                    {username.length}/20
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  3-20 characters • alphanumeric and underscores only
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                  Select Avatar
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {AVATAR_OPTIONS.map((emoji) => {
                    const isSelected = avatar === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatar(emoji)}
                        className={`h-14 rounded-xl text-2xl transition-all cursor-pointer focus-ring flex items-center justify-center ${
                          isSelected
                            ? 'bg-[var(--theme-dim)]/40 border-2 border-[var(--theme-text)] scale-105 shadow-[0_0_15px_var(--theme-glow)]'
                            : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={isSubmitting || !username.trim()}
                  className="w-full py-4 bg-[var(--theme-text)] text-black font-black text-sm sm:text-base rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_var(--theme-dim)] cursor-pointer focus-ring disabled:opacity-50 tracking-widest uppercase flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>INITIALIZING...</span>
                    </>
                  ) : (
                    <span>[ENTER ARENA →]</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
