import React, { useState, useEffect } from 'react';
import { PaletteId, PHOSPHOR_PALETTES, applyPaletteToRoot } from '../styles/palettes.ts';
import '../styles/crt.css';

interface TerminalViewportProps {
  children: React.ReactNode;
  kpBalance: number;
  currentPaletteId: PaletteId;
  currentWpm?: number;
  onSelectPalette: (paletteId: PaletteId) => void;
  onOpenMarket: () => void;
  onOpenDossier: () => void;
  onOpenTournament: () => void;
  onOpenTrials: () => void;
}

export const TerminalViewport: React.FC<TerminalViewportProps> = ({
  children,
  kpBalance,
  currentPaletteId,
  currentWpm = 0,
  onSelectPalette,
  onOpenMarket,
  onOpenDossier,
  onOpenTournament,
  onOpenTrials,
}) => {
  const [crtEnabled, setCrtEnabled] = useState<boolean>(true);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(true);

  // Apply CSS variables whenever palette changes
  useEffect(() => {
    const palette = PHOSPHOR_PALETTES[currentPaletteId] || PHOSPHOR_PALETTES.lime;
    applyPaletteToRoot(palette);
  }, [currentPaletteId]);

  // Reactive Phosphor Glow scaling with WPM
  useEffect(() => {
    const bloom = Math.max(4, Math.min(24, Math.round(4 + currentWpm / 5.5)));
    document.documentElement.style.setProperty('--wpm-bloom', `${bloom}px`);
  }, [currentWpm]);

  return (
    <div className="relative w-screen h-screen bg-black text-[var(--theme-text)] overflow-hidden select-none font-mono flex flex-col">
      {/* Top Terminal Chassis Chrome */}
      <header className="h-10 px-4 bg-zinc-950 border-b border-[var(--theme-border)] flex items-center justify-between text-xs z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--theme-text)] animate-ping" />
            <span className="font-bold tracking-widest text-[var(--theme-text)] glow-subtle">
              SPEEDTYPE // COMBAT_V1.0
            </span>
          </div>

          {/* Quick Palette Swapper */}
          <div className="hidden sm:flex items-center gap-1.5 ml-4 text-[11px] text-zinc-400">
            <span>PALETTE:</span>
            {(['amber', 'lime', 'magenta', 'ice'] as PaletteId[]).map(id => (
              <button
                key={id}
                type="button"
                onClick={() => onSelectPalette(id)}
                className={`px-1.5 py-0.5 rounded text-[10px] uppercase border transition-colors ${
                  currentPaletteId === id
                    ? 'border-[var(--theme-text)] text-[var(--theme-text)] font-bold'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Toolbar & Wallet */}
        <div className="flex items-center gap-3">
          {/* Menu Buttons */}
          <button
            type="button"
            onClick={onOpenMarket}
            className="px-2 py-0.5 border border-zinc-800 hover:border-[var(--theme-text)] rounded text-[11px] text-zinc-300 hover:text-[var(--theme-text)] transition-colors"
          >
            [BLACK MARKET]
          </button>
          <button
            type="button"
            onClick={onOpenDossier}
            className="px-2 py-0.5 border border-zinc-800 hover:border-cyan-400 rounded text-[11px] text-zinc-300 hover:text-cyan-400 transition-colors"
          >
            [DOSSIER]
          </button>
          <button
            type="button"
            onClick={onOpenTournament}
            className="px-2 py-0.5 border border-zinc-800 hover:border-amber-400 rounded text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
          >
            [TOURNAMENT]
          </button>
          <button
            type="button"
            onClick={onOpenTrials}
            className="px-2 py-0.5 border border-zinc-800 hover:border-purple-400 rounded text-[11px] text-zinc-300 hover:text-purple-400 transition-colors"
          >
            [TRIALS]
          </button>

          {/* KP Wallet */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-900 border border-[var(--theme-border)] rounded text-xs font-bold text-[var(--theme-text)] glow-subtle">
            <span>⚡</span>
            <span>{kpBalance.toLocaleString()} KP</span>
          </div>

          {/* CRT Toggle */}
          <button
            type="button"
            onClick={() => setCrtEnabled(!crtEnabled)}
            title="Toggle CRT Curvature"
            className={`px-1.5 py-0.5 text-[10px] rounded border ${
              crtEnabled ? 'border-green-600 text-green-400' : 'border-zinc-800 text-zinc-600'
            }`}
          >
            CRT
          </button>
          <button
            type="button"
            onClick={() => setScanlinesEnabled(!scanlinesEnabled)}
            title="Toggle Scanlines"
            className={`px-1.5 py-0.5 text-[10px] rounded border ${
              scanlinesEnabled ? 'border-green-600 text-green-400' : 'border-zinc-800 text-zinc-600'
            }`}
          >
            LINES
          </button>
        </div>
      </header>

      {/* Main Terminal Body with CRT Curvature & Scanlines */}
      <main
        className={`relative flex-1 flex flex-col items-center justify-between p-4 overflow-hidden ${
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

      {/* Footer System Status Bar */}
      <footer className="h-6 px-4 bg-zinc-950 border-t border-[var(--theme-border)] flex items-center justify-between text-[11px] text-zinc-500 z-50">
        <span>MODE: KINETIC_COMBAT // 0ms_LATENCY_ENGINE</span>
        <div className="flex gap-4">
          <span>STANCE_SWITCH: [TAB / 1,2,3]</span>
          <span>DISRUPT_LOCK: 2.5s</span>
          <span>OVERCLOCK_STREAK: 30_HITS</span>
        </div>
      </footer>
    </div>
  );
};
