import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AVATAR_OPTIONS, validateUsername } from '../profile/profile.ts';

interface ProfileSetupModalProps {
  onComplete: (username: string, avatar: string) => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus username input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUsername(val);
    if (touched) {
      setUsernameError(validateUsername(val));
    }
  };

  const handleUsernameBlur = () => {
    setTouched(true);
    setUsernameError(validateUsername(username));
  };

  const isValid = validateUsername(username) === null && selectedAvatar !== null;

  const handleSubmit = useCallback(() => {
    if (!isValid || !selectedAvatar) return;
    onComplete(username.trim(), selectedAvatar);
  }, [isValid, username, selectedAvatar, onComplete]);

  // Enter key submits
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-4 font-mono">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            'linear-gradient(var(--theme-text) 1px, transparent 1px), linear-gradient(90deg, var(--theme-text) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-black text-white tracking-widest mb-1">SPEEDTYPE</h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Create Your Fighter Profile</p>
          <div className="w-16 h-px bg-zinc-800 mx-auto mt-4" />
        </div>

        {/* Username field */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Fighter Handle
          </label>
          <input
            ref={inputRef}
            type="text"
            value={username}
            onChange={handleUsernameChange}
            onBlur={handleUsernameBlur}
            onKeyDown={handleKeyDown}
            maxLength={20}
            placeholder="e.g. cyber_typist"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full px-4 py-3 bg-black border rounded-xl text-white font-mono text-sm placeholder-zinc-700 outline-none transition-all focus-visible:ring-2 focus-visible:ring-[var(--theme-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
              usernameError
                ? 'border-red-500/70'
                : username && !usernameError
                ? 'border-[var(--theme-text)]'
                : 'border-zinc-800'
            }`}
          />
          {usernameError && (
            <p className="text-red-400 text-xs mt-1.5">{usernameError}</p>
          )}
          {!usernameError && username.length > 0 && (
            <p className="text-zinc-600 text-xs mt-1.5">
              {username.length}/20 — visible on leaderboards and challenges
            </p>
          )}
          {!touched && username.length === 0 && (
            <p className="text-zinc-600 text-xs mt-1.5">
              3-20 characters · letters, numbers, underscores
            </p>
          )}
        </div>

        {/* Avatar picker */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Choose Avatar
          </label>
          <div className="grid grid-cols-5 gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedAvatar(emoji)}
                className={`h-12 rounded-xl text-2xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                  selectedAvatar === emoji
                    ? 'bg-[var(--theme-dim)] border-2 border-[var(--theme-text)] shadow-[0_0_12px_var(--theme-glow)] scale-105'
                    : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:scale-105'
                }`}
                title={`Select ${emoji} as avatar`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {!selectedAvatar && (
            <p className="text-zinc-600 text-xs mt-2">Select your fighter avatar</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            isValid
              ? 'bg-[var(--theme-text)] text-black hover:brightness-110 shadow-[0_0_20px_var(--theme-dim)] cursor-pointer'
              : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
          }`}
        >
          {isValid ? '[ENTER THE ARENA]' : 'Complete setup to continue'}
        </button>

        <p className="text-center text-zinc-700 text-xs mt-4">
          Profile saved locally · no account required
        </p>
      </div>
    </div>
  );
};
