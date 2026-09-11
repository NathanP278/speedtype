import React from 'react';
import { BeamState } from '../types/combat.ts';
import { STANCE_CONFIGS } from '../engine/dictionary.ts';

interface KineticBeamDisplayProps {
  beamState: BeamState;
  isOverclocked?: boolean;
  playerName?: string;
  opponentName?: string;
}

export const KineticBeamDisplay: React.FC<KineticBeamDisplayProps> = ({
  beamState,
  isOverclocked = false,
  playerName = 'YOU',
  opponentName = 'RIVAL',
}) => {
  const { position, dominantStance, screenShake } = beamState;
  const stanceConfig = STANCE_CONFIGS[dominantStance];

  // Map position (-100 to 100) to percentage (0% to 100%)
  const beamPercent = ((position + 100) / 200) * 100;

  const isNearPlayerKo = position <= -75;
  const isNearOpponentKo = position >= 75;

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto my-4 p-3 bg-black/80 border border-[var(--theme-border)] rounded-lg transition-transform ${
        screenShake > 4 ? 'shake-heavy' : screenShake > 1 ? 'shake-light' : ''
      }`}
      style={{
        boxShadow: `0 0 15px var(--theme-dim)`,
      }}
    >
      {/* Beam Track */}
      <div className="relative h-6 w-full bg-zinc-950 rounded border border-zinc-800 overflow-hidden flex items-center">
        {/* Baseline Danger Zones */}
        <div className="absolute left-0 top-0 bottom-0 w-[15%] bg-red-950/40 border-r border-red-800/50" />
        <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-blue-950/40 border-l border-blue-800/50" />

        {/* Center Equilibrium Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-zinc-600 -translate-x-1/2 z-10 opacity-70" />

        {/* Dynamic Plasma Conduit (Left energy side) */}
        <div
          className="absolute top-0 bottom-0 left-0 transition-all duration-75"
          style={{
            width: `${beamPercent}%`,
            background: `linear-gradient(90deg, rgba(0, 255, 102, 0.15) 0%, ${stanceConfig.themeColor} 100%)`,
            opacity: 0.65,
          }}
        />

        {/* Dynamic Plasma Conduit (Right energy side) */}
        <div
          className="absolute top-0 bottom-0 right-0 transition-all duration-75"
          style={{
            width: `${100 - beamPercent}%`,
            background: `linear-gradient(270deg, rgba(255, 51, 51, 0.15) 0%, ${stanceConfig.themeColor} 100%)`,
            opacity: 0.65,
          }}
        />

        {/* Kinetic Energy Core / Focal Point */}
        <div
          className="absolute top-0 bottom-0 w-4 -translate-x-1/2 z-20 flex items-center justify-center transition-all duration-75"
          style={{ left: `${beamPercent}%` }}
        >
          {/* Outer glow flare */}
          <div
            className={`absolute w-8 h-8 rounded-full blur-sm transition-transform ${
              isOverclocked ? 'scale-150 animate-ping' : 'animate-pulse'
            }`}
            style={{ backgroundColor: stanceConfig.themeColor }}
          />

          {/* Solid core needle */}
          <div
            className="w-1.5 h-6 rounded-full shadow-lg z-30"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: `0 0 12px #FFF, 0 0 24px ${stanceConfig.themeColor}`,
            }}
          />
        </div>
      </div>

      {/* Name Labels */}
      <div className="flex justify-between text-[10px] font-mono mt-2 select-none px-1">
        <span className={isNearPlayerKo ? 'text-red-500 font-bold' : 'text-zinc-500'}>
          {playerName}
        </span>
        <span className={isNearOpponentKo ? 'text-green-400 font-bold' : 'text-zinc-500'}>
          {opponentName}
        </span>
      </div>
    </div>
  );
};
