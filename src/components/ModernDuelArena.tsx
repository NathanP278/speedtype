import React, { useRef, useEffect } from 'react';
import { RivalDifficultyLevel, RIVAL_DIFFICULTIES } from '../engine/adaptiveRival.ts';

interface ModernDuelArenaProps {
  playerStats: {
    wpm: number;
    accuracy: number;
    streak: number;
    completedCount: number;
    totalTargetWords: number;
  };
  rivalStats: {
    name: string;
    targetWpm: number;
    completedCount: number;
    activeWordText: string;
    totalTargetWords: number;
  };
  currentWordText: string;
  typedIndex: number;
  upcomingWords: string[];
  difficulty: RivalDifficultyLevel;
  onResetMatch: () => void;
  onRetestSpeed: () => void;
}

export const ModernDuelArena: React.FC<ModernDuelArenaProps> = ({
  playerStats,
  rivalStats,
  currentWordText,
  typedIndex,
  upcomingWords,
  difficulty,
  onResetMatch,
  onRetestSpeed,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const diffConfig = RIVAL_DIFFICULTIES[difficulty] || RIVAL_DIFFICULTIES.equal;

  const playerPercent = Math.min(
    100,
    Math.round((playerStats.completedCount / playerStats.totalTargetWords) * 100)
  );
  const rivalPercent = Math.min(
    100,
    Math.round((rivalStats.completedCount / rivalStats.totalTargetWords) * 100)
  );

  // Auto focus container for key capture
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-between items-center my-auto p-4 sm:p-6 outline-none select-none font-mono"
    >
      {/* Top Status & Match Progress */}
      <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg mb-6">
        {/* Combatants Header */}
        <div className="flex items-center justify-between mb-4">
          {/* Player Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-dim)] border border-[var(--theme-text)] flex items-center justify-center text-sm font-bold text-[var(--theme-text)] shadow-sm">
              YOU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">YOU</span>
                <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800">
                  {playerStats.streak > 0 ? `⚡ ${playerStats.streak} STREAK` : 'STEADY'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                <span className="text-[var(--theme-text)] font-extrabold">{playerStats.wpm} WPM</span>
                <span>•</span>
                <span>{playerStats.accuracy}% ACC</span>
              </div>
            </div>
          </div>

          {/* Center Target Indicator */}
          <div className="hidden sm:flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
              FIRST TO {playerStats.totalTargetWords} WORDS
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 mt-1">
              <span className="text-[var(--theme-text)]">{playerStats.completedCount}</span>
              <span className="text-zinc-600">VS</span>
              <span className="text-rose-400">{rivalStats.completedCount}</span>
            </div>
          </div>

          {/* Rival Info */}
          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800 uppercase">
                  {diffConfig.label} ({diffConfig.badge})
                </span>
                <span className="text-xs font-bold text-white tracking-wide">{rivalStats.name}</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs text-zinc-400 mt-0.5">
                <span className="text-rose-400 font-extrabold">{rivalStats.targetWpm} WPM TARGET</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-950/40 border border-rose-500/60 flex items-center justify-center text-sm font-bold text-rose-400 shadow-sm">
              AI
            </div>
          </div>
        </div>

        {/* Dual Progress Bars */}
        <div className="flex flex-col gap-2 pt-1 border-t border-zinc-900">
          {/* Player Progress Bar */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-12 text-[10px] font-bold text-zinc-400">YOU</span>
            <div className="relative flex-1 h-2.5 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--theme-text)] progress-bar-smooth rounded-full shadow-[0_0_10px_var(--theme-glow)]"
                style={{ width: `${playerPercent}%` }}
              />
            </div>
            <span className="w-10 text-[10px] text-right font-bold text-zinc-300">{playerPercent}%</span>
          </div>

          {/* Rival Progress Bar */}
          <div className="flex items-center gap-2 text-xs">
            <span className="w-12 text-[10px] font-bold text-zinc-500">RIVAL</span>
            <div className="relative flex-1 h-2.5 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 progress-bar-smooth rounded-full shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                style={{ width: `${rivalPercent}%` }}
              />
            </div>
            <span className="w-10 text-[10px] text-right font-bold text-zinc-400">{rivalPercent}%</span>
          </div>
        </div>
      </div>

      {/* Hero Typing Card */}
      <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col items-center justify-center text-center relative my-auto min-h-[260px]">
        {/* Target Word Tag */}
        <div className="absolute top-4 left-6 flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-[var(--theme-text)] animate-pulse" />
          <span>TYPE WORD TO ADVANCE</span>
        </div>

        {/* Word Display with Smooth Caret */}
        <div className="text-4xl sm:text-6xl font-mono tracking-widest font-black my-4 text-zinc-500 select-none">
          {currentWordText.split('').map((char, index) => {
            const isTyped = index < typedIndex;
            const isCurrent = index === typedIndex;

            let charStyle = 'text-zinc-600 opacity-60';
            if (isTyped) {
              charStyle = 'text-[var(--theme-text)] glow-wpm font-bold opacity-100';
            } else if (isCurrent) {
              charStyle = 'text-white font-bold opacity-100';
            }

            return (
              <span key={index} className={`relative inline-block transition-colors duration-75 ${charStyle}`}>
                {isCurrent && <span className="smooth-caret" />}
                {char}
              </span>
            );
          })}
        </div>

        {/* Look-Ahead Upcoming Word Ribbon */}
        {upcomingWords.length > 0 && (
          <div className="flex items-center gap-3 mt-4 text-xs sm:text-sm font-mono text-zinc-500 select-none overflow-hidden max-w-lg">
            <span className="text-[10px] uppercase text-zinc-600">UPCOMING:</span>
            {upcomingWords.slice(0, 4).map((w, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-zinc-900/60 border border-zinc-800/80 rounded text-zinc-400"
              >
                {w}
              </span>
            ))}
          </div>
        )}

        {/* Rival Activity Indicator */}
        <div className="absolute bottom-4 right-6 flex items-center gap-2 text-[11px] text-zinc-500">
          <span>RIVAL TYPING:</span>
          <span className="text-rose-400 font-bold">{rivalStats.activeWordText || '...'}</span>
        </div>
      </div>

      {/* Arena Footer Controls */}
      <div className="w-full flex items-center justify-between text-xs text-zinc-500 mt-4 px-2">
        <span>Type characters cleanly. Typos pause word momentum.</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onResetMatch}
            className="hover:text-zinc-300 underline transition-colors"
          >
            Restart Match
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onRetestSpeed}
            className="hover:text-zinc-300 underline transition-colors"
          >
            Recalibrate Speed
          </button>
        </div>
      </div>
    </div>
  );
};
