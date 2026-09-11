import React, { useEffect } from 'react';
import { PaletteId, PHOSPHOR_PALETTES, applyPaletteToRoot } from '../styles/palettes.ts';
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
  // Optional legacy props for backwards compatibility
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
  onRetest,
  crtEnabled = false,
  scanlinesEnabled = false,
  playerProfile,
  onOpenMarket,
}) => {
  // Apply CSS variables whenever palette changes
  useEffect(() => {
    const palette = PHOSPHOR_PALETTES[currentPaletteId] || PHOSPHOR_PALETTES.lime;
    applyPaletteToRoot(palette);
  }, [currentPaletteId]);

  // Reactive Phosphor Glow scaling with WPM (calm and subtle)
  useEffect(() => {
    const bloom = Math.max(2, Math.min(16, Math.round(2 + currentWpm / 8)));
    document.documentElement.style.setProperty('--wpm-bloom', `${bloom}px`);
  }, [currentWpm]);

  const PALETTES: PaletteId[] = ['lime', 'amber', 'ice', 'magenta'];

  const handleNextPalette = () => {
    const nextIdx = (PALETTES.indexOf(currentPaletteId) + 1) % PALETTES.length;
    onSelectPalette(PALETTES[nextIdx]);
  };

  return (
    <div className="relative w-screen h-screen bg-black text-[var(--theme-text)] overflow-hidden select-none font-mono flex flex-col">
      {/* Streamlined Minimal Header */}
      <header className="h-12 px-4 md:px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs z-50">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--theme-text)] text-base font-bold">⚡</span>
            <span className="font-extrabold tracking-widest text-white text-sm">
              SPEEDTYPE
            </span>
          </div>

          <span className="hidden sm:inline-block text-[10px] text-zinc-500 uppercase px-1.5 py-0.5 border border-zinc-800 rounded">
            v2.0 // ADAPTIVE
          </span>
        </div>

        {/* Center: Player identity + Calibration Badge */}
        <div className="flex items-center gap-3">
          {playerProfile && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-full text-xs">
              <span className="text-base leading-none">{playerProfile.avatar}</span>
              <span className="font-bold text-white tracking-wide">{playerProfile.username}</span>
            </div>
          )}
          {calibrationBadge}
        </div>

        {/* Right: Clean Controls */}
        <div className="flex items-center gap-2.5">
          {onRetest && (
            <button
              type="button"
              onClick={onRetest}
              className="hidden md:inline-flex items-center px-2.5 py-1 border border-zinc-800 hover:border-zinc-600 rounded text-[11px] text-zinc-300 hover:text-white transition-colors"
              title="Retest your benchmark typing speed"
            >
              [RETEST SPEED]
            </button>
          )}

          {/* Compact Palette Cycler */}
          <button
            type="button"
            onClick={handleNextPalette}
            className="px-2.5 py-1 border border-zinc-800 hover:border-[var(--theme-text)] rounded text-[11px] text-zinc-300 hover:text-[var(--theme-text)] transition-colors uppercase"
            title="Cycle theme palette"
          >
            🎨 {currentPaletteId}
          </button>

          {/* KP Wallet Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-bold text-[var(--theme-text)]">
            <span>⚡</span>
            <span>{kpBalance.toLocaleString()}</span>
          </div>

          {/* Single clean Menu / More button */}
          {(onOpenMenu || onOpenMarket) && (
            <button
              type="button"
              onClick={onOpenMenu || onOpenMarket}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 rounded text-xs font-bold text-white transition-all shadow-sm"
              title="Open Extra Game Modes & Settings"
            >
              [MODES ☰]
            </button>
          )}
        </div>
      </header>

      {/* Main Screen Body */}
      <main
        className={`relative flex-1 flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden ${
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

      {/* Clean, Subtle Footer */}
      <footer className="h-7 px-4 md:px-6 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 z-50">
        <div className="flex items-center gap-3">
          <span>SPEEDTYPE ADAPTIVE DUEL ENGINE</span>
          <span className="hidden sm:inline text-zinc-700">•</span>
          <span className="hidden sm:inline text-zinc-600">0ms INPUT LATENCY</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-600">
          <span className="hidden md:inline">KEYSTROKES TRACKED REAL-TIME</span>
          <span className="text-zinc-500 font-semibold">TAB: STANCE</span>
        </div>
      </footer>
    </div>
  );
};
