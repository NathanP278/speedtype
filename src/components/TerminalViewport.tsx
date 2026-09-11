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
      {/* Spacious 56px Header */}
      <header className="h-14 px-4 md:px-8 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between text-xs z-50 backdrop-blur-md">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--theme-text)] text-lg font-black animate-pulse">⚡</span>
            <span className="font-black tracking-widest text-white text-base">
              SPEEDTYPE
            </span>
          </div>

          <span className="hidden sm:inline-block text-[10px] text-zinc-500 uppercase px-2 py-0.5 border border-zinc-800 rounded-full font-semibold">
            v2.0 // ADAPTIVE
          </span>
        </div>

        {/* Center: Player identity + Calibration Badge */}
        <div className="flex items-center gap-3">
          {playerProfile && (
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs shadow-inner">
              <span className="text-base leading-none">{playerProfile.avatar}</span>
              <span className="font-bold text-white tracking-wide">{playerProfile.username}</span>
            </div>
          )}
          {calibrationBadge}
        </div>

        {/* Right: Clean Controls */}
        <div className="flex items-center gap-3">
          {/* KP Wallet Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs font-bold text-[var(--theme-text)]">
            <span>⚡</span>
            <span>{kpBalance.toLocaleString()} KP</span>
          </div>

          {/* Palette Cycler */}
          <button
            type="button"
            onClick={handleNextPalette}
            className="px-3 py-1.5 border border-zinc-800 hover:border-[var(--theme-text)] rounded-lg text-xs text-zinc-300 hover:text-[var(--theme-text)] transition-colors uppercase focus-ring"
            title="Cycle theme palette"
          >
            🎨 {currentPaletteId}
          </button>

          {/* Menu / Modes button */}
          {(onOpenMenu || onOpenMarket) && (
            <button
              type="button"
              onClick={onOpenMenu || onOpenMarket}
              className="px-3.5 py-1.5 bg-[var(--theme-dim)] hover:bg-[var(--theme-text)] border border-[var(--theme-text)] rounded-lg text-xs font-bold text-[var(--theme-text)] hover:text-black transition-all shadow-sm focus-ring"
              title="Open Extra Game Modes & Settings"
            >
              [MODES ☰]
            </button>
          )}
        </div>
      </header>

      {/* Main Screen Body: p-0 so children have full breathing space */}
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

      {/* Clean, Subtle 32px Footer */}
      <footer className="h-8 px-4 md:px-8 bg-zinc-950/90 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500 z-50">
        <div className="flex items-center gap-3">
          <span className="text-zinc-600 font-medium">SPEEDTYPE ADAPTIVE DUEL ENGINE</span>
          <span className="hidden sm:inline text-zinc-800">•</span>
          <span className="hidden sm:inline text-zinc-500">TAB: STANCE</span>
          <span className="hidden sm:inline text-zinc-800">•</span>
          <span className="hidden sm:inline text-zinc-500">ESC: MENU</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-600">
          <span className="text-[var(--theme-text)] font-semibold">⚡ {kpBalance.toLocaleString()} KP</span>
        </div>
      </footer>
    </div>
  );
};
