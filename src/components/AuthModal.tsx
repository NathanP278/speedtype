import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AVATAR_OPTIONS, validateUsername } from '../profile/profile.ts';
import { SignUpData, SignInData } from '../auth/authTypes.ts';

interface AuthModalProps {
  onSignInWithEmail: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  onSignUpWithEmail: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  onSignInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  serverError: string | null;
  isCloudEnabled: boolean;
}

type AuthTab = 'signin' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({
  onSignInWithEmail,
  onSignUpWithEmail,
  onSignInWithGoogle,
  isLoading,
  serverError,
  isCloudEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Register state
  const [username, setUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('⚡');

  // Validation state
  const [localError, setLocalError] = useState<string | null>(null);

  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailInputRef.current?.focus();
    setLocalError(null);
  }, [activeTab]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSignIn = useCallback(async () => {
    setLocalError(null);
    if (!signInEmail.trim() || !signInPassword) {
      setLocalError('Please enter both email and password');
      return;
    }
    if (!isValidEmail(signInEmail)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    const res = await onSignInWithEmail({
      email: signInEmail.trim(),
      password: signInPassword,
    });

    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  }, [signInEmail, signInPassword, onSignInWithEmail]);

  const handleSignUp = useCallback(async () => {
    setLocalError(null);
    const uErr = validateUsername(username);
    if (uErr) {
      setLocalError(uErr);
      return;
    }
    if (!isValidEmail(signUpEmail)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (signUpPassword.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    const res = await onSignUpWithEmail({
      username: username.trim(),
      email: signUpEmail.trim(),
      password: signUpPassword,
      avatar: selectedAvatar,
    });

    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  }, [username, signUpEmail, signUpPassword, selectedAvatar, onSignUpWithEmail]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (activeTab === 'signin') {
        handleSignIn();
      } else {
        handleSignUp();
      }
    }
  };

  const displayError = localError || serverError;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-4 font-mono select-none">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(var(--theme-text) 1px, transparent 1px), linear-gradient(90deg, var(--theme-text) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2 animate-bounce">⚡</div>
          <h1 className="text-2xl font-black text-white tracking-widest mb-1">SPEEDTYPE</h1>
          <p className="text-xs text-zinc-400 uppercase tracking-widest">
            {activeTab === 'signin' ? 'Fighter Authentication' : 'Create Fighter Account'}
          </p>

          {!isCloudEnabled && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/40 text-[10px] text-amber-300">
              <span>⚡</span>
              <span>Offline Demo Mode (Local Account)</span>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('signin')}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'signin'
                ? 'text-[var(--theme-text)] border-b-2 border-[var(--theme-text)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTab === 'register'
                ? 'text-[var(--theme-text)] border-b-2 border-[var(--theme-text)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 mb-6">
          {activeTab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Fighter Handle
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={20}
                placeholder="e.g. cyber_strike"
                autoComplete="off"
                spellCheck={false}
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-white font-mono text-sm placeholder-zinc-700 outline-none focus-ring focus:border-[var(--theme-text)]"
              />
              <p className="text-[10px] text-zinc-500 mt-1">3-20 chars • letters, numbers, underscores</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              ref={emailInputRef}
              type="email"
              value={activeTab === 'signin' ? signInEmail : signUpEmail}
              onChange={(e) =>
                activeTab === 'signin'
                  ? setSignInEmail(e.target.value)
                  : setSignUpEmail(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="pilot@speedtype.com"
              autoComplete="email"
              spellCheck={false}
              className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-white font-mono text-sm placeholder-zinc-700 outline-none focus-ring focus:border-[var(--theme-text)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={activeTab === 'signin' ? signInPassword : signUpPassword}
              onChange={(e) =>
                activeTab === 'signin'
                  ? setSignInPassword(e.target.value)
                  : setSignUpPassword(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="••••••••"
              autoComplete={activeTab === 'signin' ? 'current-password' : 'new-password'}
              className="w-full px-3.5 py-2.5 bg-black border border-zinc-800 rounded-xl text-white font-mono text-sm placeholder-zinc-700 outline-none focus-ring focus:border-[var(--theme-text)]"
            />
            {activeTab === 'register' && (
              <p className="text-[10px] text-zinc-500 mt-1">Minimum 6 characters</p>
            )}
          </div>

          {activeTab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Select Fighter Avatar
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`h-10 rounded-lg text-xl transition-all focus-ring ${
                      selectedAvatar === emoji
                        ? 'bg-[var(--theme-dim)] border-2 border-[var(--theme-text)] scale-105 shadow-[0_0_10px_var(--theme-glow)]'
                        : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayError && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-400 text-center">
              {displayError}
            </div>
          )}
        </div>

        {/* Primary Submit Button */}
        <button
          type="button"
          onClick={activeTab === 'signin' ? handleSignIn : handleSignUp}
          disabled={isLoading}
          className="w-full py-3 bg-[var(--theme-text)] text-black font-extrabold text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all tracking-wider uppercase shadow-[0_0_15px_var(--theme-dim)] disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
              AUTHENTICATING...
            </span>
          ) : activeTab === 'signin' ? (
            '[SIGN IN TO ARENA]'
          ) : (
            '[CREATE ACCOUNT & ENTER]'
          )}
        </button>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative px-3 bg-zinc-950 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            OR CONTINUE WITH
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={async () => {
            setLocalError(null);
            const res = await onSignInWithGoogle();
            if (!res.success && res.error) {
              setLocalError(res.error);
            }
          }}
          disabled={isLoading}
          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-3 shadow-md focus-ring cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
};
