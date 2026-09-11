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
  // damageMultiplier is in interface but not used in UI anymore
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-3 select-none font-mono flex flex-col gap-2">
      {/* ROW 1: HP Bars */}
      <div className="grid grid-cols-2 gap-2 items-center">
        {/* PLAYER */}
        <div className="flex flex-col gap-1 bg-zinc-950/80 p-2 rounded border border-[var(--theme-border)]">
          <div className="flex justify-between items-end">
            <span className="text-[11px] text-zinc-300 font-bold">{player.name} [YOU]</span>
            <span className="text-[10px] text-zinc-500">{Math.round((player.health / player.maxHealth) * 100)}%</span>
          </div>
          <div className="relative h-2 w-full bg-zinc-900 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-150 ${player.health <= 20 ? 'bg-red-600 animate-pulse' : 'bg-[var(--theme-text)]'}`}
              style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
            />
            {player.shield > 0 && (
              <div
                className="absolute top-0 bottom-0 left-0 bg-cyan-400/60 border-r border-cyan-200 transition-all duration-150"
                style={{ width: `${Math.min(100, (player.shield / player.maxHealth) * 100)}%` }}
              />
            )}
          </div>
        </div>

        {/* OPPONENT */}
        <div className="flex flex-col gap-1 bg-zinc-950/80 p-2 rounded border border-zinc-800">
          <div className="flex justify-between items-end">
            <span className="text-[10px] text-zinc-500">{Math.round((opponent.health / opponent.maxHealth) * 100)}%</span>
            <span className="text-[11px] text-zinc-300 font-bold">{opponent.name} [RIVAL]</span>
          </div>
          <div className="relative h-2 w-full bg-zinc-900 rounded overflow-hidden flex justify-end">
            <div
              className={`h-full transition-all duration-150 ${opponent.health <= 20 ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}
              style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
            />
            {opponent.shield > 0 && (
              <div
                className="absolute top-0 bottom-0 right-0 bg-cyan-400/60 border-l border-cyan-200 transition-all duration-150"
                style={{ width: `${Math.min(100, (opponent.shield / opponent.maxHealth) * 100)}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ROW 2: Stance + Overclock */}
      <div className="flex items-center justify-between p-2 bg-black/90 border border-zinc-800 rounded">
        {/* Left: 3 compact stance pills */}
        <div className="flex flex-row gap-1 items-center">
          {(['strike', 'counter', 'disrupt'] as StanceType[]).map((st) => {
            const config = STANCE_CONFIGS[st];
            const isSelected = activeStance === st;
            const shortName = st === 'strike' ? 'STR' : st === 'counter' ? 'CTR' : 'DIS';
            return (
              <button
                key={st}
                type="button"
                onClick={() => onSelectStance(st)}
                className={`px-2 py-0.5 text-[11px] rounded-full border cursor-pointer transition-all ${
                  isSelected ? 'shadow-sm' : 'border-zinc-800 text-zinc-600'
                }`}
                style={{
                  backgroundColor: isSelected ? `${config.themeColor}1A` : 'transparent',
                  borderColor: isSelected ? config.themeColor : undefined,
                  color: isSelected ? config.themeColor : undefined,
                }}
              >
                {shortName}
              </button>
            );
          })}
        </div>

        {/* Right: Overclock gauge */}
        <div className="flex items-center gap-2">
          <span className={isOverclocked ? 'text-amber-400 font-bold text-[10px] animate-pulse' : 'text-zinc-500 text-[10px]'}>
            {isOverclocked ? 'OVERCLOCK' : `${overclockStreak}/30`}
          </span>
          <div className="w-24 h-1.5 bg-zinc-900 border border-zinc-800 rounded overflow-hidden relative">
            <div
              className={`h-full transition-all duration-100 ${
                isOverclocked ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-[var(--theme-text)]'
              }`}
              style={{ width: `${Math.min(100, (overclockStreak / 30) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
