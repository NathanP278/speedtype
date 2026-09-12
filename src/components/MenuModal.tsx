import React from 'react';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTournament: () => void;
  onOpenGhost: () => void;
  onOpenDossier: () => void;
  onOpenTrials: () => void;
  onOpenMarket: () => void;
  onOpenLeaderboard: () => void;
  onOpenChallenge: () => void;
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
  onOpenLeaderboard,
  onOpenChallenge,
  crtEnabled,
  onToggleCrt,
  scanlinesEnabled,
  onToggleScanlines,
  kpBalance,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 sm:pb-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[var(--theme-text)] font-black text-base sm:text-lg">⚡</span>
            <h3 className="text-sm sm:text-base font-black text-white tracking-widest">
              MODES & ARCHIVES
            </h3>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-xs text-[var(--theme-text)] font-bold bg-zinc-900 px-2.5 sm:px-3 py-1 rounded-full border border-zinc-800">
              ⚡ {kpBalance.toLocaleString()} KP
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors focus-ring min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2-Column Modes Grid (1-column on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          {/* Tournament Lounge */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTournament();
            }}
            className="flex flex-col text-left p-3.5 sm:p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/80 rounded-xl transition-all group focus-ring min-h-[44px] cursor-pointer"
          >
            <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 mb-1 flex items-center gap-2">
              <span>🏆</span> TOURNAMENT LOUNGE
            </span>
            <span className="text-[11px] text-zinc-400 leading-snug">
              8-player bracket simulation with live wagers & commentary.
            </span>
          </button>

          {/* Ghost Duels */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGhost();
            }}
            className="flex flex-col text-left p-3.5 sm:p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-cyan-500/80 rounded-xl transition-all group focus-ring min-h-[44px] cursor-pointer"
          >
            <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 mb-1 flex items-center gap-2">
              <span>👻</span> GHOST DUELS
            </span>
            <span className="text-[11px] text-zinc-400 leading-snug">
              Duel your Personal Best run or replay imported ghost runs.
            </span>
          </button>

          {/* Leaderboard */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLeaderboard();
            }}
            className="flex flex-col text-left p-3.5 sm:p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-yellow-500/80 rounded-xl transition-all group focus-ring min-h-[44px] cursor-pointer"
          >
            <span className="text-xs font-bold text-yellow-400 group-hover:text-yellow-300 mb-1 flex items-center gap-2">
              <span>📊</span> LEADERBOARD
            </span>
            <span className="text-[11px] text-zinc-400 leading-snug">
              Top typists ranked by Net WPM on this device.
            </span>
          </button>

          {/* 1v1 Challenge */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenChallenge();
            }}
            className="flex flex-col text-left p-3.5 sm:p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-pink-500/80 rounded-xl transition-all group focus-ring min-h-[44px] cursor-pointer"
          >
            <span className="text-xs font-bold text-pink-400 group-hover:text-pink-300 mb-1 flex items-center gap-2">
              <span>⚔️</span> 1v1 CHALLENGE
            </span>
            <span className="text-[11px] text-zinc-400 leading-snug">
              Generate & race asynchronous friend challenge codes.
            </span>
          </button>

          {/* Rivalry Dossier */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDossier();
            }}
            className="flex flex-col text-left p-3.5 sm:p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-emerald-500/80 rounded-xl transition-all group focus-ring min-h-[44px] cursor-pointer"
          >
            <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 mb-1 flex items-center gap-2">
              <span>📂</span> RIVALRY DOSSIER
            </span>
            <span className="text-[11px] text-zinc-400 leading-snug">
              Track lifetime records and dynamic nemesis word weaknesses.
            </span>
          </button>

          {/* Weekly Trials */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTrials();
            }}
            className="flex flex-col text-left p-3.5 sm:p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-purple-500/80 rounded-xl transition-all group focus-ring min-h-[44px] cursor-pointer"
          >
            <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300 mb-1 flex items-center gap-2">
              <span>⚡</span> WEEKLY TRIALS
            </span>
            <span className="text-[11px] text-zinc-400 leading-snug">
              Code Syntax, Blind Duel, and 1 HP Sudden Death.
            </span>
          </button>

          {/* The Black Market (Full-width) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMarket();
            }}
            className="sm:col-span-2 flex flex-col text-left p-3.5 sm:p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-[var(--theme-text)] rounded-xl transition-all group focus-ring min-h-[44px] cursor-pointer"
          >
            <span className="text-xs font-bold text-[var(--theme-text)] mb-1 flex items-center gap-2">
              <span>🛒</span> THE BLACK MARKET
            </span>
            <span className="text-[11px] text-zinc-400 leading-snug">
              Unlock mechanical keyboard soundboards, typing trails, and KO stamps.
            </span>
          </button>
        </div>

        {/* Display Settings Section */}
        <div className="border-t border-zinc-800/80 pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-2.5">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
            Display Filters:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCrt}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors focus-ring min-h-[38px] cursor-pointer ${
                crtEnabled
                  ? 'border-green-600 text-green-400 bg-green-950/30 font-bold'
                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              CRT Glass {crtEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              onClick={onToggleScanlines}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors focus-ring min-h-[38px] cursor-pointer ${
                scanlinesEnabled
                  ? 'border-green-600 text-green-400 bg-green-950/30 font-bold'
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
