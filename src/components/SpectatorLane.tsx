import React from 'react';
import { TournamentContestant } from '../social/tournamentSimulator.ts';
import { STANCE_CONFIGS } from '../engine/dictionary.ts';

interface SpectatorLaneProps {
  contestant: TournamentContestant;
  isWageredOn: boolean;
  onWager: (contestant: TournamentContestant) => void;
  canWager: boolean;
}

export const SpectatorLane: React.FC<SpectatorLaneProps> = ({
  contestant,
  isWageredOn,
  onWager,
  canWager,
}) => {
  const stanceConfig = STANCE_CONFIGS[contestant.stance];

  return (
    <div
      className={`p-3 rounded border font-mono transition-all flex flex-col justify-between ${
        isWageredOn
          ? 'bg-amber-950/30 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
          : contestant.eliminated
          ? 'bg-zinc-950/30 border-zinc-900 opacity-40'
          : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              #{contestant.seed}
            </span>
            <span className="text-xs font-bold text-zinc-200">
              {contestant.avatar} {contestant.name}
            </span>
          </div>

          <span
            className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold"
            style={{
              color: stanceConfig.themeColor,
              backgroundColor: `${stanceConfig.themeColor}22`,
              border: `1px solid ${stanceConfig.themeColor}44`,
            }}
          >
            {contestant.stance}
          </span>
        </div>

        {/* Health & Beam Bar */}
        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span>HP: {contestant.health}%</span>
            <span>{contestant.currentWpm} WPM</span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-200"
              style={{ width: `${contestant.health}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Odds & Wager Action */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
        <div className="text-amber-400 font-bold">
          {contestant.odds.toFixed(1)}x PAYOUT
        </div>

        {canWager && !contestant.eliminated && (
          <button
            type="button"
            onClick={() => onWager(contestant)}
            className={`px-2.5 py-0.5 text-xs rounded border transition-colors ${
              isWageredOn
                ? 'bg-amber-400 text-black font-bold border-amber-400'
                : 'border-zinc-700 text-zinc-300 hover:border-amber-400 hover:text-amber-400'
            }`}
          >
            {isWageredOn ? 'WAGERED' : 'BET SHARDS'}
          </button>
        )}
      </div>
    </div>
  );
};
