import React, { useState, useEffect, useRef } from 'react';
import { PaletteId, PHOSPHOR_PALETTES, applyPaletteToRoot } from '../styles/palettes.ts';
import { UserAccount } from '../auth/authTypes.ts';
import { useDeviceProfile } from '../engine/useDeviceProfile.ts';
import { DeviceBadge } from './DeviceBadge.tsx';
import '../styles/crt.css';

interface TerminalViewportProps {
  children: React.ReactNode;
  kpBalance: number;
  currentPaletteId: PaletteId;
  currentWpm?: number;
  onSelectPalette: (paletteId: PaletteId) => void;
  onOpenMenu?: () => void;
  calibrationBadge?: React.ReactNode;
  onRetest?: () => void;
  crtEnabled?: boolean;
  scanlinesEnabled?: boolean;
  playerProfile?: { username: string; avatar: string };
  currentUser?: UserAccount | null;
  onSignOut?: () => void;
  onOpenMarket?: () => void;
  onOpenDossier?: () => void;
  onOpenTournament?: () => void;
  onOpenTrials?: () => void;
}

export const TerminalViewport: React.FC<TerminalViewportProps> = ({
  children,
  kpBalance,
  currentPaletteId,
  currentWpm = 0,
  onSelectPalette,
  onOpenMenu,
  calibrationBadge,
  crtEnabled = false,
  scanlinesEnabled = false,
  playerProfile,
  currentUser,
  onSignOut,
  onOpenMarket,
}) => {
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const device = useDeviceProfile();

  // Apply CSS variables whenever palette changes
  useEffect(() => {
    const palette = PHOSPHOR_PALETTES[currentPaletteId] || PHOSPHOR_PALETTES.lime;
    applyPaletteToRoot(palette);
  }, [currentPaletteId]);

  // Reactive Phosphor Glow scaling with WPM
  useEffect(() => {
    const bloom = Math.max(2, Math.min(16, Math.round(2 + currentWpm / 8)));
    document.documentElement.style.setProperty('--wpm-bloom', `${bloom}px`);
  }, [currentWpm]);

  // Click outside to close account popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAccountPopoverOpen(false);
      }
    };
    if (accountPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountPopoverOpen]);

  const PALETTES: PaletteId[] = ['lime', 'amber', 'ice', 'magenta'];

  const handleNextPalette = () => {
    const nextIdx = (PALETTES.indexOf(currentPaletteId) + 1) % PALETTES.length;
    onSelectPalette(PALETTES[nextIdx]);
  };

  const displayUsername = currentUser?.username || playerProfile?.username;
  const displayAvatar = currentUser?.avatar || playerProfile?.avatar;

  const isKeyboardOpen = device.isKeyboardOpen;

  return (
    <div
      className="relative w-full bg-black text-[var(--theme-text)] overflow-hidden select-none font-mono flex flex-col"
      style={{
        height: 'var(--visual-viewport-height, 100dvh)',
        maxHeight: 'var(--visual-viewport-height, 100dvh)',
      }}
    >
      {/* Dynamic Responsive Header — collapses when mobile virtual keyboard opens */}
      <header
        className={`px-3 sm:px-4 md:px-8 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between text-xs z-50 backdrop-blur-md transition-all duration-150 pt-[env(safe-area-inset-top)] ${
          isKeyboardOpen ? 'h-9 text-[10px]' : 'h-14'
        }`}
      >
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[var(--theme-text)] text-base sm:text-lg font-black animate-pulse">⚡</span>
            <span className="font-black tracking-widest text-white text-sm sm:text-base">
              SPEEDTYPE
            </span>
          </div>

          {!isKeyboardOpen && (
            <span className="hidden md:inline-block text-[10px] text-zinc-500 uppercase px-2 py-0.5 border border-zinc-800 rounded-full font-semibold">
              v2.0 // ADAPTIVE
            </span>
          )}
        </div>

        {/* Center: Device Badge + Player identity + Calibration Badge (hidden when virtual keyboard active) */}
        {!isKeyboardOpen && (
          <div className="flex items-center gap-1.5 sm:gap-3 relative" ref={popoverRef}>
            {/* Anti-Spoof Hardware Device Badge */}
            <DeviceBadge device={device} />

            {displayUsername && (
              <button
                type="button"
                onClick={() => setAccountPopoverOpen((prev) => !prev)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-full text-xs shadow-inner cursor-pointer transition-colors focus-ring"
                title="Click for account details & sign out"
              >
                <span className="text-sm sm:text-base leading-none">{displayAvatar}</span>
                <span className="hidden xs:inline font-bold text-white tracking-wide truncate max-w-[90px] sm:max-w-[130px]">
                  {currentUser?.displayName || displayUsername}
                </span>
                <span className="text-[9px] px-1 bg-blue-950/80 text-blue-400 border border-blue-800/80 rounded font-bold">
                  G
                </span>
              </button>
            )}

            {/* Account Popover Menu */}
            {accountPopoverOpen && (
              <div className="absolute top-11 left-0 sm:left-auto sm:right-0 w-72 sm:w-80 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 text-left animate-fadeIn">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-3">
                  <span className="text-3xl p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                    {displayAvatar}
                  </span>
                  <div className="truncate">
                    <p className="font-black text-white text-sm truncate">
                      {currentUser?.displayName || displayUsername}
                    </p>
                    <p className="text-[10px] text-[var(--theme-text)] font-bold truncate">
                      {currentUser?.callSign || 'PILOT'} // @{displayUsername}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {currentUser?.email || 'authenticated_pilot'}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-400 space-y-1.5 mb-4 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">AUTH PROVIDER:</span>
                    <span className="text-blue-400 font-bold">GOOGLE OAUTH</span>
                  </div>
                  {currentUser?.telemetry?.referralSource && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">DISCOVERY:</span>
                      <span className="text-zinc-300 font-bold uppercase">
                        {currentUser.telemetry.referralSource.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  {currentUser?.telemetry?.typingExperience && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">EXPERIENCE:</span>
                      <span className="text-zinc-300 font-bold uppercase">
                        {currentUser.telemetry.typingExperience}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">STATUS:</span>
                    <span className="text-emerald-400 font-bold">VERIFIED FIGHTER</span>
                  </div>
                </div>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={() => {
                      setAccountPopoverOpen(false);
                      onSignOut();
                    }}
                    className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 font-bold text-xs rounded-xl transition-colors focus-ring cursor-pointer"
                  >
                    [SIGN OUT]
                  </button>
                )}
              </div>
            )}

            {calibrationBadge}
          </div>
        )}

        {/* Right: Clean Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* KP Wallet Badge */}
          {!isKeyboardOpen && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs font-bold text-[var(--theme-text)]">
              <span>⚡</span>
              <span>{kpBalance.toLocaleString()} KP</span>
            </div>
          )}

          {/* Palette Cycler */}
          {!isKeyboardOpen && (
            <button
              type="button"
              onClick={handleNextPalette}
              className="px-2 sm:px-2.5 py-1 border border-zinc-800 hover:border-[var(--theme-text)] rounded-lg text-xs text-zinc-300 hover:text-[var(--theme-text)] transition-colors uppercase focus-ring"
              title="Cycle theme palette"
            >
              🎨 <span className="hidden sm:inline">{currentPaletteId}</span>
            </button>
          )}

          {/* Menu / Modes button */}
          {(onOpenMenu || onOpenMarket) && (
            <button
              type="button"
              onClick={onOpenMenu || onOpenMarket}
              className="px-2.5 sm:px-3 py-1 bg-[var(--theme-dim)] hover:bg-[var(--theme-text)] border border-[var(--theme-text)] rounded-lg text-xs font-bold text-[var(--theme-text)] hover:text-black transition-all shadow-sm focus-ring"
              title="Open Extra Game Modes & Settings"
            >
              {isKeyboardOpen ? '☰' : '[MODES ☰]'}
            </button>
          )}
        </div>
      </header>

      {/* Main Screen Body */}
      <main
        className={`relative flex-1 flex flex-col items-center justify-center p-0 overflow-y-auto overflow-x-hidden ${
          crtEnabled ? 'crt-screen crt-curvature' : 'crt-screen'
        }`}
      >
        {crtEnabled && <div className="crt-glass-glare" />}

        {scanlinesEnabled && (
          <>
            <div className="scanlines" />
            <div className="scanline-beam" />
          </>
        )}

        {/* Viewport Content */}
        <div className="relative z-30 w-full h-full flex flex-col items-center justify-between">
          {children}
        </div>
      </main>

      {/* Clean Footer — auto-hidden when virtual keyboard is open */}
      {!isKeyboardOpen && (
        <footer className="h-8 px-4 md:px-8 bg-zinc-950/90 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500 z-50 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            <span className="text-zinc-600 font-medium">SPEEDTYPE ADAPTIVE ENGINE</span>
            {!device.isTouchPrimary && (
              <>
                <span className="hidden sm:inline text-zinc-800">•</span>
                <span className="hidden sm:inline text-zinc-500">TAB: STANCE</span>
                <span className="hidden sm:inline text-zinc-800">•</span>
                <span className="hidden sm:inline text-zinc-500">ESC: MENU</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4 text-zinc-600 text-[11px] sm:text-xs">
            <span className="text-[var(--theme-text)] font-semibold">⚡ {kpBalance.toLocaleString()} KP</span>
          </div>
        </footer>
      )}
    </div>
  );
};
