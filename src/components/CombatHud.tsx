import React from 'react';
import { CombatantState, StanceType } from '../types/combat.ts';
import { STANCE_CONFIGS } from '../engine/dictionary.ts';

interface CombatHudProps {
  player: CombatantState;
  opponent: CombatantState;
  activeStance: StanceType;
  onSelectStance: (stance: StanceType) => void;
  overclockStreak: number;
  isOverclocked: boolean;
  damageMultiplier: number;
}

export const CombatHud: React.FC<CombatHudProps> = ({
  player,
  opponent,
  activeStance,
  onSelectStance,
  overclockStreak,
  isOverclocked,
  damageMultiplier,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-3 select-none font-mono">
      {/* Top Combatant Health & Shield Bars */}
      <div className="grid grid-cols-2 gap-8 items-center">
        {/* PLAYER 1 HUD */}
        <div className="flex flex-col gap-1.5 p-3 rounded bg-zinc-950/80 border border-[var(--theme-border)]">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--theme-text)] glow-subtle">
                {player.name} [YOU]
              </span>
              {player.shield > 0 && (
                <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] rounded">
                  SHIELD: +{Math.round(player.shield)}
                </span>
              )}
            </div>
            <span className="text-zinc-400 font-bold">
              {Math.round(player.health)} / {player.maxHealth} HP
            </span>
          </div>

          {/* Health Bar Track */}
          <div className="relative h-4 w-full bg-zinc-900 rounded overflow-hidden border border-zinc-800">
            {/* Base Health */}
            <div
              className={`h-full transition-all duration-150 ${
                player.health <= 20 ? 'bg-red-600 animate-pulse' : 'bg-[var(--theme-text)]'
              }`}
              style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
            />
            {/* Absorption Shield Overlay */}
            {player.shield > 0 && (
              <div
                className="absolute top-0 bottom-0 left-0 bg-cyan-400/60 border-r-2 border-cyan-200 transition-all duration-150"
                style={{ width: `${Math.min(100, (player.shield / player.maxHealth) * 100)}%` }}
              />
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
            <span>WPM: <strong className="text-[var(--theme-text)]">{player.stats.wpm}</strong></span>
            <span>ACC: <strong className="text-zinc-200">{player.stats.accuracy}%</strong></span>
            <span>PARRIES: <strong className="text-cyan-400">{player.stats.parriesCount}</strong></span>
            <span>WORDS: <strong className="text-zinc-200">{player.stats.wordsCompleted}</strong></span>
          </div>
        </div>

        {/* OPPONENT HUD */}
        <div className="flex flex-col gap-1.5 p-3 rounded bg-zinc-950/80 border border-zinc-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-bold">
              {Math.round(opponent.health)} / {opponent.maxHealth} HP
            </span>
            <div className="flex items-center gap-2">
              {opponent.shield > 0 && (
                <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] rounded">
                  SHIELD: +{Math.round(opponent.shield)}
                </span>
              )}
              <span className="font-bold text-red-400">
                {opponent.name} [RIVAL]
              </span>
            </div>
          </div>

          {/* Health Bar Track */}
          <div className="relative h-4 w-full bg-zinc-900 rounded overflow-hidden border border-zinc-800 flex justify-end">
            {/* Base Health */}
            <div
              className={`h-full transition-all duration-150 ${
                opponent.health <= 20 ? 'bg-red-600 animate-pulse' : 'bg-red-500'
              }`}
              style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
            />
            {/* Absorption Shield Overlay */}
            {opponent.shield > 0 && (
              <div
                className="absolute top-0 bottom-0 right-0 bg-cyan-400/60 border-l-2 border-cyan-200 transition-all duration-150"
                style={{ width: `${Math.min(100, (opponent.shield / opponent.maxHealth) * 100)}%` }}
              />
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
            <span>WORDS: <strong className="text-zinc-200">{opponent.stats.wordsCompleted}</strong></span>
            <span>STANCE: <strong className="text-red-400">{opponent.stance.toUpperCase()}</strong></span>
            <span>STATUS: <strong className={opponent.isDisrupted ? 'text-purple-400 animate-pulse' : 'text-zinc-400'}>
              {opponent.isDisrupted ? 'DISRUPTED' : 'ACTIVE'}
            </strong></span>
          </div>
        </div>
      </div>

      {/* Center Tactical Stance Selector & Overclock Gauge */}
      <div className="mt-3 p-2.5 bg-black/90 border border-zinc-800 rounded flex items-center justify-between gap-4">
        {/* Stance Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono">TACTICAL STANCE [TAB]:</span>
          {(['strike', 'counter', 'disrupt'] as StanceType[]).map((st, idx) => {
            const config = STANCE_CONFIGS[st];
            const isSelected = activeStance === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => onSelectStance(st)}
                className={`px-3 py-1 text-xs font-mono rounded border transition-all duration-150 flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-white text-white font-bold shadow-md'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
                style={{
                  backgroundColor: isSelected ? `${config.themeColor}33` : 'transparent',
                  borderColor: isSelected ? config.themeColor : undefined,
                  boxShadow: isSelected ? `0 0 10px ${config.glowColor}` : 'none',
                }}
              >
                <span className="text-[10px] text-zinc-500">[{idx + 1}]</span>
                <span style={{ color: isSelected ? config.themeColor : undefined }}>
                  {config.name.replace(' Stance', '')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Overclock Streak Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end text-xs">
            <span className={isOverclocked ? 'text-amber-400 font-bold glow-medium animate-pulse' : 'text-zinc-400'}>
              {isOverclocked ? `⚡ OVERCLOCK ACTIVE [${damageMultiplier.toFixed(1)}x DMG]` : `CLEAN STREAK: ${overclockStreak}/30`}
            </span>
            <span className="text-[10px] text-zinc-500">
              {isOverclocked ? 'TYPO DROPS MULTIPLIER' : '30 CONSECUTIVE CHARS TO ENGAGE'}
            </span>
          </div>

          {/* Gauge Meter */}
          <div className="w-28 h-3 bg-zinc-900 border border-zinc-700 rounded overflow-hidden relative">
            <div
              className={`h-full transition-all duration-100 ${
                isOverclocked ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]' : 'bg-[var(--theme-text)]'
              }`}
              style={{ width: `${Math.min(100, (overclockStreak / 30) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
