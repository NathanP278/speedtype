import React, { useEffect } from 'react';
import { RivalDifficultyLevel, RIVAL_DIFFICULTIES } from '../engine/adaptiveRival.ts';

export interface DuelResultData {
  winner: 'player' | 'rival';
  playerWpm: number;
  playerRawWpm?: number;
  playerAccuracy: number;
  playerMistakes: number;
  rivalWpm: number;
  rivalName: string;
  difficulty: RivalDifficultyLevel;
  durationSeconds: number;
  streak: number;
}

interface ModernResultModalProps {
  result: DuelResultData | null;
  onRematch: () => void;
  onSelectDifficulty: (diff: RivalDifficultyLevel) => void;
  onRetest: () => void;
  onOpenChallenge?: () => void;
  onOpenLeaderboard?: () => void;
}

export const ModernResultModal: React.FC<ModernResultModalProps> = ({
  result,
  onRematch,
  onSelectDifficulty,
  onRetest,
  onOpenChallenge,
  onOpenLeaderboard,
}) => {
  // Listen for Enter key to trigger instant rematch
  useEffect(() => {
    if (!result) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onRematch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result, onRematch]);

  if (!result) return null;

  const isWin = result.winner === 'player';
  const diffConfig = RIVAL_DIFFICULTIES[result.difficulty] || RIVAL_DIFFICULTIES.equal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-mono select-none animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl text-center">
        {/* Outcome Header */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border ${
              isWin
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-400'
            }`}
          >
            {isWin ? '✓ MATCH VICTORY' : '✗ MATCH DEFEAT'}
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wider">
            {isWin ? 'RIVAL DEFEATED' : 'RIVAL SURPASSED YOU'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isWin
              ? `You outpaced ${result.rivalName} with superior cadence and accuracy.`
              : `${result.rivalName} crossed the completion threshold first.`}
          </p>
        </div>

        {/* Head-to-Head Comparison Card */}
        <div className="grid grid-cols-2 gap-3 my-6">
          {/* Player Card */}
          <div className="p-4 bg-zinc-900/60 border border-[var(--theme-border)] rounded-xl text-left">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">
              YOU (PLAYER)
            </span>
            <span className="text-3xl font-black text-[var(--theme-text)] block my-1">
              {result.playerWpm} <span className="text-xs font-normal text-zinc-400">NET WPM</span>
            </span>
            {result.playerRawWpm !== undefined && (
              <span className="text-[10px] text-zinc-500 block mb-1">
                Raw: {result.playerRawWpm} WPM (unpenalized)
              </span>
            )}
            <div className="flex justify-between text-[11px] text-zinc-400 mt-2 border-t border-zinc-800/80 pt-2">
              <span>Accuracy:</span>
              <strong className="text-white">{result.playerAccuracy}%</strong>
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
              <span>Best Streak:</span>
              <strong className="text-white">{result.streak}</strong>
            </div>
          </div>

          {/* Rival Card */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-left">
            <span className="text-[10px] text-zinc-500 block uppercase font-bold">
              {result.rivalName}
            </span>
            <span className="text-3xl font-black text-rose-400 block my-1">
              {result.rivalWpm} <span className="text-xs font-normal text-zinc-400">WPM</span>
            </span>
            <span className="text-[10px] text-zinc-500 block mb-1">
              Target tempo ({diffConfig.badge})
            </span>
            <div className="flex justify-between text-[11px] text-zinc-400 mt-2 border-t border-zinc-800/80 pt-2">
              <span>Difficulty:</span>
              <strong className="text-zinc-200">{diffConfig.label}</strong>
            </div>
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1">
              <span>Match Time:</span>
              <strong className="text-zinc-200">{result.durationSeconds}s</strong>
            </div>
          </div>
        </div>

        {/* Difficulty Quick Selector */}
        <div className="mb-6 text-left">
          <span className="text-[10px] text-zinc-500 block uppercase font-bold mb-2">
            Adjust Rival Intensity:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {(['relaxed', 'equal', 'challenger', 'boss'] as RivalDifficultyLevel[]).map((level) => {
              const conf = RIVAL_DIFFICULTIES[level];
              const isSelected = result.difficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onSelectDifficulty(level)}
                  className={`px-2 py-1.5 rounded-lg border text-center text-xs transition-all focus-ring ${
                    isSelected
                      ? 'border-[var(--theme-text)] bg-zinc-900 text-white font-bold shadow-sm'
                      : 'border-zinc-800/80 bg-zinc-950 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <span className="block text-[11px] leading-tight">{conf.label}</span>
                  <span className="text-[9px] opacity-70">{conf.badge}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <button
            type="button"
            onClick={onRematch}
            className="w-full sm:w-auto px-8 py-3 bg-[var(--theme-text)] text-black font-bold text-sm rounded-xl hover:brightness-110 active:scale-95 transition-all tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg focus-ring"
          >
            <span>[PLAY AGAIN]</span>
            <span className="text-[10px] opacity-80 border border-black/30 px-1.5 py-0.5 rounded">
              ENTER ↵
            </span>
          </button>

          <button
            type="button"
            onClick={onRetest}
            className="w-full sm:w-auto px-4 py-3 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white text-xs rounded-xl transition-colors focus-ring"
          >
            [RETEST SPEED]
          </button>
        </div>

        {/* Secondary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onOpenChallenge && (
            <button
              type="button"
              onClick={onOpenChallenge}
              className="w-full sm:w-auto px-4 py-2 border border-purple-500/30 hover:border-purple-500 bg-purple-950/20 text-purple-300 hover:text-white text-xs rounded-xl transition-colors focus-ring"
            >
              [⚔️ CHALLENGE FRIEND]
            </button>
          )}
          {onOpenLeaderboard && (
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="w-full sm:w-auto px-4 py-2 border border-blue-500/30 hover:border-blue-500 bg-blue-950/20 text-blue-300 hover:text-white text-xs rounded-xl transition-colors focus-ring"
            >
              [📊 HALL OF FIGHTERS]
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
