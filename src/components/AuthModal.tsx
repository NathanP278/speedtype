import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AVATAR_OPTIONS, validateUsername } from '../profile/profile.ts';
import { UserAccount, CombatTelemetry } from '../auth/authTypes.ts';

interface AuthModalProps {
  currentUser: UserAccount | null;
  onSignInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  onUpdateProfile: (data: {
    username: string;
    avatar: string;
    displayName?: string;
    callSign?: string;
    telemetry?: CombatTelemetry;
  }) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  serverError: string | null;
  isCloudEnabled: boolean;
}

const CALL_SIGNS = [
  'VIPER',
  'GHOST',
  'RONIN',
  'CIPHER',
  'VOLT',
  'TITAN',
  'STRIKER',
  'APEX',
];

const TELEMETRY_QUESTIONS = {
  switchTypes: [
    { id: 'cherry_blue', label: 'Tactile Clicky (Blue)', desc: 'Sharp audible snap & tactile peak' },
    { id: 'cherry_brown', label: 'Tactile Silent (Brown)', desc: 'Smooth resistance bump, stealth typing' },
    { id: 'cherry_red', label: 'Linear Speed (Red)', desc: 'Zero bump, pure uninterrupted velocity' },
    { id: 'laptop_scissor', label: 'Scissor Switch (Laptop)', desc: 'Ultra-low travel, instant actuation' },
    { id: 'topre', label: 'Electro-Capacitive (Topre)', desc: 'Cushioned thock with gentle rebound' },
  ] as const,
  layouts: [
    { id: 'qwerty', label: 'QWERTY', desc: 'Standard battle layout' },
    { id: 'colemak', label: 'Colemak', desc: 'Ergonomic home row cluster' },
    { id: 'dvorak', label: 'Dvorak', desc: 'Alternate hand rhythm engine' },
    { id: 'ortholinear', label: 'Ortholinear / Split', desc: 'Column-staggered grid setup' },
  ] as const,
  combatGoals: [
    { id: 'speed_demon', label: 'Max Velocity (120+ WPM)', desc: 'Pure speed, overwhelming opponent APM' },
    { id: 'zero_typos', label: 'Absolute Accuracy (99%+)', desc: 'Laser precision, zero friction penalty' },
    { id: 'climb_ladder', label: 'Tournament Dominance', desc: 'Climbing global leaderboards & boss duels' },
    { id: 'flow_state', label: 'Deep Rhythm / Flow', desc: 'Hypnotic sensory immersion and keystroke zen' },
  ] as const,
};

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onSignInWithGoogle,
  onUpdateProfile,
  isLoading,
  serverError,
  isCloudEnabled,
}) => {
  // Determine current stage: if not logged in with Google -> Step 0; else start wizard at Step 1
  const [currentStep, setCurrentStep] = useState<WizardStep>(() => {
    return currentUser ? 1 : 0;
  });

  // Onboarding Form States
  const [username, setUsername] = useState<string>(() => currentUser?.username || '');
  const [avatar, setAvatar] = useState<string>(() => currentUser?.avatar || '⚡');
  const [callSign, setCallSign] = useState<string>(() => currentUser?.callSign || 'VIPER');
  const [displayName, setDisplayName] = useState<string>(() => currentUser?.displayName || '');
  const [telemetry, setTelemetry] = useState<CombatTelemetry>(() => ({
    switchType: 'cherry_blue',
    keyboardLayout: 'qwerty',
    combatGoal: 'speed_demon',
    preferredTier: 'equal',
  }));

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleInputRef = useRef<HTMLInputElement>(null);

  // Auto-advance to Step 1 once Google authentication completes
  useEffect(() => {
    if (currentUser && currentStep === 0) {
      setUsername(currentUser.username || '');
      setAvatar(currentUser.avatar || '⚡');
      setCurrentStep(1);
    }
  }, [currentUser, currentStep]);

  // Focus input when entering handle step
  useEffect(() => {
    if (currentStep === 1) {
      handleInputRef.current?.focus();
    }
    setLocalError(null);
  }, [currentStep]);

  // Step 1: Validate Handle
  const handleValidateStep1 = () => {
    setLocalError(null);
    const err = validateUsername(username);
    if (err) {
      setLocalError(err);
      return;
    }
    setCurrentStep(2);
  };

  // Final Step: Complete Onboarding & Save Profile
  const handleFinalize = useCallback(async () => {
    setLocalError(null);
    setIsSubmitting(true);

    const res = await onUpdateProfile({
      username: username.trim(),
      avatar,
      displayName: displayName.trim() || undefined,
      callSign,
      telemetry,
    });

    setIsSubmitting(false);
    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  }, [username, avatar, displayName, callSign, telemetry, onUpdateProfile]);

  const activeError = localError || serverError;

  // STEP NODE LABELS FOR TIMELINE
  const STAGES = [
    { step: 1, label: 'HANDLE' },
    { step: 2, label: 'AVATAR' },
    { step: 3, label: 'CALL-SIGN' },
    { step: 4, label: 'TELEMETRY' },
    { step: 5, label: 'DOSSIER' },
  ];

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

      <div className="relative z-10 w-full max-w-xl bg-zinc-950 border border-zinc-800/90 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Top Branding & Mode */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-pulse">⚡</span>
            <div>
              <h1 className="text-base font-black text-white tracking-widest leading-none">
                SPEEDTYPE <span className="text-[var(--theme-text)]">// PILOT TERMINAL</span>
              </h1>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                {currentStep === 0
                  ? 'Cloud Identity Gate'
                  : 'Interactive Combat Onboarding Wizard'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isCloudEnabled ? (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold tracking-wider">
                SECURE OAUTH 2.0
              </span>
            ) : (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-600/60 text-amber-300 font-bold tracking-wider">
                OFFLINE DEMO
              </span>
            )}
          </div>
        </div>

        {/* Cyberpunk Segmented Step Timeline (Visible once Google authenticated) */}
        {currentStep > 0 && (
          <div className="mb-6 px-2">
            <div className="flex items-center justify-between relative">
              {/* Circuit Track Connecting Lines */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-zinc-800 -z-0" />

              {STAGES.map((s) => {
                const isPassed = currentStep > s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <div key={s.step} className="flex flex-col items-center z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                        isPassed
                          ? 'bg-[var(--theme-text)] text-black shadow-[0_0_8px_var(--theme-glow)]'
                          : isCurrent
                          ? 'bg-zinc-950 border-2 border-[var(--theme-text)] text-[var(--theme-text)] shadow-[0_0_12px_var(--theme-dim)] ring-2 ring-[var(--theme-text)]/20'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-600'
                      }`}
                    >
                      {isPassed ? '✓' : `0${s.step}`}
                    </div>
                    <span
                      className={`text-[9px] tracking-wider font-bold mt-1.5 hidden sm:block ${
                        isCurrent
                          ? 'text-[var(--theme-text)]'
                          : isPassed
                          ? 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {activeError && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-400 text-center animate-shake">
            {activeError}
          </div>
        )}

        {/* ── STEP 0: EXCLUSIVE GOOGLE AUTHENTICATION ───────────────────────── */}
        {currentStep === 0 && (
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl mb-4 shadow-inner">
              🛡️
            </div>
            <h2 className="text-xl font-black text-white tracking-widest mb-2">
              AUTHORIZE PILOT ACCESS
            </h2>
            <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
              SpeedType enforces high-velocity cloud identity. Link your Google account for cross-device high scores, verified leaderboards, and zero password fatigue.
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
              disabled={isLoading}
              className="w-full max-w-sm py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[var(--theme-text)] text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] cursor-pointer focus-ring disabled:opacity-50"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'ESTABLISHING HANDSHAKE...' : 'SIGN IN WITH GOOGLE'}</span>
            </button>

            <div className="mt-8 flex items-center gap-4 text-[10px] text-zinc-600">
              <span>TLS 1.3 ENCRYPTION</span>
              <span>•</span>
              <span>OAUTH 2.0 PKCE</span>
              <span>•</span>
              <span>NO PASSWORDS STORED</span>
            </div>
          </div>
        )}

        {/* ── STEP 1: PILOT HANDLE SELECTION ─────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="py-2 space-y-4">
            <div>
              <h2 className="text-base font-black text-white tracking-widest mb-1 flex items-center gap-2">
                <span>[01]</span>
                <span>CHOOSE PILOT HANDLE</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Your combat tag shown on rival HUDs and the global Hall of Fighters.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Unique Username
              </label>
              <div className="relative">
                <input
                  ref={handleInputRef}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateStep1()}
                  maxLength={20}
                  placeholder="e.g. cyber_strike"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white font-mono text-sm tracking-wider placeholder-zinc-700 outline-none focus-ring focus:border-[var(--theme-text)]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-bold">
                  {username.length}/20
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">
                3 to 20 characters • alphanumeric and underscores only
              </p>
            </div>

            <div className="pt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleValidateStep1}
                className="px-6 py-2.5 bg-[var(--theme-text)] text-black font-black text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_var(--theme-dim)] cursor-pointer focus-ring"
              >
                PROCEED TO AVATAR [→]
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: AVATAR & COMBAT CALL-SIGN ──────────────────────────────── */}
        {currentStep === 2 && (
          <div className="py-2 space-y-5">
            <div>
              <h2 className="text-base font-black text-white tracking-widest mb-1 flex items-center gap-2">
                <span>[02]</span>
                <span>CHOOSE AVATAR & CALL-SIGN</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Customize your visual presence in combat duels.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Combat Insignia (Avatar)
              </label>
              <div className="grid grid-cols-5 gap-2.5">
                {AVATAR_OPTIONS.map((emoji) => {
                  const isSelected = avatar === emoji;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`h-11 rounded-xl text-2xl transition-all cursor-pointer focus-ring flex items-center justify-center ${
                        isSelected
                          ? 'bg-[var(--theme-dim)]/40 border-2 border-[var(--theme-text)] scale-105 shadow-[0_0_12px_var(--theme-glow)]'
                          : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Combat Call-Sign Prefix
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CALL_SIGNS.map((cs) => {
                  const active = callSign === cs;
                  return (
                    <button
                      key={cs}
                      type="button"
                      onClick={() => setCallSign(cs)}
                      className={`py-2 px-3 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer focus-ring ${
                        active
                          ? 'bg-zinc-800 border border-[var(--theme-text)] text-[var(--theme-text)] shadow-sm'
                          : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {cs}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer focus-ring"
              >
                [← BACK]
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-[var(--theme-text)] text-black font-black text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_var(--theme-dim)] cursor-pointer focus-ring"
              >
                PROCEED TO DISPLAY NAME [→]
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: OPTIONAL DISPLAY NAME ──────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="py-2 space-y-4">
            <div>
              <h2 className="text-base font-black text-white tracking-widest mb-1 flex items-center gap-2">
                <span>[03]</span>
                <span>DISPLAY NAME & CLAN TAG</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Optional alias or clan moniker displayed alongside your pilot ID (leave empty to use handle).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                placeholder="e.g. [NEXUS] Nathan Vance"
                className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white font-mono text-sm tracking-wider placeholder-zinc-700 outline-none focus-ring focus:border-[var(--theme-text)]"
              />
              <p className="text-[10px] text-zinc-500">
                Optional • Max 30 chars • Supports clan brackets and formal names
              </p>
            </div>

            <div className="p-3.5 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-3">
              <span className="text-2xl">{avatar}</span>
              <div>
                <p className="text-xs font-bold text-white">
                  {displayName.trim() || username || 'Pilot'}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {callSign} // @{username}
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer focus-ring"
              >
                [← BACK]
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDisplayName('');
                    setCurrentStep(4);
                  }}
                  className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-xs transition-colors cursor-pointer"
                >
                  SKIP STEP
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2.5 bg-[var(--theme-text)] text-black font-black text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_var(--theme-dim)] cursor-pointer focus-ring"
                >
                  PROCEED TO TELEMETRY [→]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: COMBAT TELEMETRY QUESTIONNAIRE ─────────────────────────── */}
        {currentStep === 4 && (
          <div className="py-2 space-y-5">
            <div>
              <h2 className="text-base font-black text-white tracking-widest mb-1 flex items-center gap-2">
                <span>[04]</span>
                <span>COMBAT TELEMETRY SURVEY</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Tune your profile telemetry to calibrate opponent matchmaking.
              </p>
            </div>

            {/* Switch Hardware Selector */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                1. PRIMARY MECHANICAL SWITCH RIG
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TELEMETRY_QUESTIONS.switchTypes.map((sw) => {
                  const active = telemetry.switchType === sw.id;
                  return (
                    <button
                      key={sw.id}
                      type="button"
                      onClick={() => setTelemetry((prev) => ({ ...prev, switchType: sw.id }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer focus-ring ${
                        active
                          ? 'bg-zinc-900 border-[var(--theme-text)] text-white shadow-sm'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <p className="font-bold text-xs flex items-center justify-between">
                        <span>{sw.label}</span>
                        {active && <span className="text-[var(--theme-text)] text-[10px]">●</span>}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{sw.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keyboard Layout */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                2. BATTLE MATRIX LAYOUT
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TELEMETRY_QUESTIONS.layouts.map((ly) => {
                  const active = telemetry.keyboardLayout === ly.id;
                  return (
                    <button
                      key={ly.id}
                      type="button"
                      onClick={() => setTelemetry((prev) => ({ ...prev, keyboardLayout: ly.id }))}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer focus-ring ${
                        active
                          ? 'bg-zinc-900 border-[var(--theme-text)] text-[var(--theme-text)] font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <p className="text-xs">{ly.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Combat Goal */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                3. COMBAT OBJECTIVE
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TELEMETRY_QUESTIONS.combatGoals.map((cg) => {
                  const active = telemetry.combatGoal === cg.id;
                  return (
                    <button
                      key={cg.id}
                      type="button"
                      onClick={() => setTelemetry((prev) => ({ ...prev, combatGoal: cg.id }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer focus-ring ${
                        active
                          ? 'bg-zinc-900 border-[var(--theme-text)] text-white shadow-sm'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <p className="font-bold text-xs flex items-center justify-between">
                        <span>{cg.label}</span>
                        {active && <span className="text-[var(--theme-text)] text-[10px]">●</span>}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{cg.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer focus-ring"
              >
                [← BACK]
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-6 py-2.5 bg-[var(--theme-text)] text-black font-black text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_var(--theme-dim)] cursor-pointer focus-ring"
              >
                PROCEED TO DOSSIER [→]
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: PILOT DOSSIER VERIFICATION & LAUNCH ────────────────────── */}
        {currentStep === 5 && (
          <div className="py-2 space-y-5">
            <div>
              <h2 className="text-base font-black text-white tracking-widest mb-1 flex items-center gap-2">
                <span>[05]</span>
                <span>DOSSIER VERIFICATION & LAUNCH</span>
              </h2>
              <p className="text-xs text-zinc-400">
                Confirm your pilot dossier before initializing arena access.
              </p>
            </div>

            {/* Holographic Dossier Card */}
            <div className="p-5 bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-700/80 rounded-2xl relative overflow-hidden shadow-2xl">
              <div className="absolute right-4 top-4 text-xs font-mono text-zinc-600 uppercase tracking-widest">
                SECTOR // 01
              </div>

              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-zinc-800">
                <span className="text-4xl p-2 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner">
                  {avatar}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white tracking-wide">
                      {displayName.trim() || username}
                    </h3>
                    <span className="text-[9px] px-1.5 py-0.5 bg-blue-950/80 border border-blue-800 text-blue-400 rounded font-bold">
                      VERIFIED PILOT
                    </span>
                  </div>
                  <p className="text-xs text-[var(--theme-text)] font-bold">
                    CALL-SIGN: {callSign} // @{username}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-850">
                  <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-0.5">
                    HARDWARE RIG
                  </span>
                  <span className="text-zinc-200 font-bold uppercase">
                    {telemetry.switchType.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-850">
                  <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-0.5">
                    MATRIX LAYOUT
                  </span>
                  <span className="text-zinc-200 font-bold uppercase">
                    {telemetry.keyboardLayout}
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-850 col-span-2">
                  <span className="text-zinc-500 block text-[9px] uppercase tracking-wider mb-0.5">
                    COMBAT DOCTRINE
                  </span>
                  <span className="text-[var(--theme-text)] font-bold uppercase">
                    {telemetry.combatGoal.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer focus-ring"
              >
                [← EDIT TELEMETRY]
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-[var(--theme-text)] text-black font-black text-xs sm:text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_var(--theme-glow)] cursor-pointer focus-ring disabled:opacity-50 tracking-wider uppercase flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>SYNCHRONIZING DOSSIER...</span>
                  </>
                ) : (
                  <span>[INITIALIZE PILOT & ENTER ARENA]</span>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
