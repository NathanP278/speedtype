import React from 'react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTournament: () => void;
  onOpenGhost: () => void;
  onOpenDossier: () => void;
  onOpenTrials: () => void;
  onOpenMarket: () => void;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  scanlinesEnabled: boolean;
  onToggleScanlines: () => void;
  kpBalance: number;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  isOpen,
  onClose,
  onOpenTournament,
  onOpenGhost,
  onOpenDossier,
  onOpenTrials,
  onOpenMarket,
  crtEnabled,
  onToggleCrt,
  scanlinesEnabled,
  onToggleScanlines,
  kpBalance,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono select-none">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-base">⚡</span>
            <h3 className="text-base font-bold text-white tracking-wider">
              EXTRA MODES & ARCHIVES
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--theme-text)] font-bold bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
              ⚡ {kpBalance.toLocaleString()} KP
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white text-sm px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTournament();
            }}
            className="flex flex-col text-left p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/60 rounded-lg transition-all group"
          >
            <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 mb-1 flex items-center gap-1.5">
              <span>🏆</span> TOURNAMENT LOUNGE
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight">
              8-player bracket simulation with live wagers and commentary.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGhost();
            }}
            className="flex flex-col text-left p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/60 rounded-lg transition-all group"
          >
            <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 mb-1 flex items-center gap-1.5">
              <span>👻</span> GHOST DUELS
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight">
              Duel your Personal Best run or replay imported ghost runs.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDossier();
            }}
            className="flex flex-col text-left p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 rounded-lg transition-all group"
          >
            <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 mb-1 flex items-center gap-1.5">
              <span>📂</span> RIVALRY DOSSIER
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight">
              Track lifetime records and dynamic nemesis word weaknesses.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTrials();
            }}
            className="flex flex-col text-left p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/60 rounded-lg transition-all group"
          >
            <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300 mb-1 flex items-center gap-1.5">
              <span>⚡</span> WEEKLY TRIALS
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight">
              Hardcore modifiers: Code Syntax, Blind Duel, and 1 HP Sudden Death.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMarket();
            }}
            className="sm:col-span-2 flex flex-col text-left p-3.5 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-[var(--theme-text)] rounded-lg transition-all group"
          >
            <span className="text-xs font-bold text-[var(--theme-text)] mb-1 flex items-center gap-1.5">
              <span>🛒</span> THE BLACK MARKET
            </span>
            <span className="text-[11px] text-zinc-400 leading-tight">
              Unlock mechanical keyboard soundboards, typing trails, and KO stamps.
            </span>
          </button>
        </div>

        {/* Display Settings Section */}
        <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500">
            Display Settings:
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleCrt}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors ${
                crtEnabled
                  ? 'border-green-600 text-green-400 bg-green-950/30'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              CRT Glass {crtEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={onToggleScanlines}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors ${
                scanlinesEnabled
                  ? 'border-green-600 text-green-400 bg-green-950/30'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Scanlines {scanlinesEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
