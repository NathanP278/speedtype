import React from 'react';
import { KO_SIGNATURES } from '../cosmetics/koSignatures.ts';
import { MatchResult } from '../types/combat.ts';

interface KoSignatureStampProps {
  result: MatchResult | null;
  signatureId?: string;
  onRematch: () => void;
}

export const KoSignatureStamp: React.FC<KoSignatureStampProps> = ({
  result,
  signatureId = 'terminated',
  onRematch,
}) => {
  if (!result) return null;

  const isPlayerWinner = result.winner === 'player';
  const sig = KO_SIGNATURES[signatureId] || KO_SIGNATURES.terminated;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono select-none">
      <div
        className="w-full max-w-2xl bg-zinc-950 border-2 rounded-lg p-6 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200"
        style={{
          borderColor: isPlayerWinner ? 'var(--theme-text)' : '#ef4444',
          boxShadow: `0 0 30px ${isPlayerWinner ? 'var(--theme-glow)' : 'rgba(239, 68, 68, 0.4)'}`,
        }}
      >
        {/* Victory/Defeat Banner */}
        <div className="mb-4">
          <h2
            className={`text-3xl font-black tracking-widest ${
              isPlayerWinner ? 'text-[var(--theme-text)] glow-heavy' : 'text-red-500'
            }`}
          >
            {isPlayerWinner ? '⚡ VICTORY // MATCH TERMINATED ⚡' : '💀 DEFEAT // SYSTEM COMPROMISED 💀'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">
            REASON: {result.reason.replace(/_/g, ' ')} | DURATION: {Math.round(result.durationMs / 1000)}s
          </p>
        </div>

        {/* ASCII Signature Stamp */}
        <div className="w-full my-4 p-4 bg-black border border-zinc-800 rounded flex flex-col items-center">
          <pre
            className={`text-xs sm:text-sm font-mono leading-tight font-bold select-none ${
              isPlayerWinner ? 'text-[var(--theme-text)] glow-subtle' : 'text-red-400'
            }`}
          >
            {sig.art.join('\n')}
          </pre>
          <span className="text-[11px] text-zinc-500 mt-2 font-mono">
            {sig.subtitle}
          </span>
        </div>

        {/* Match Statistics & KP Earned */}
        <div className="grid grid-cols-4 gap-4 w-full my-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded text-xs font-mono">
          <div>
            <span className="text-zinc-500 block text-[10px]">YOUR WPM</span>
            <strong className="text-sm text-[var(--theme-text)]">{result.playerStats.wpm}</strong>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">ACCURACY</span>
            <strong className="text-sm text-zinc-200">{result.playerStats.accuracy}%</strong>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">PEAK STREAK</span>
            <strong className="text-sm text-amber-400">{result.playerStats.longestStreak}</strong>
          </div>
          <div>
            <span className="text-zinc-500 block text-[10px]">KP EARNED</span>
            <strong className="text-sm text-amber-300">+{result.kpEarned}</strong>
          </div>
        </div>

        {/* Rematch Button */}
        <button
          type="button"
          onClick={onRematch}
          className="mt-4 px-8 py-2.5 text-sm font-mono font-bold tracking-widest rounded border-2 border-[var(--theme-text)] text-[var(--theme-text)] hover:bg-[var(--theme-text)] hover:text-black transition-all shadow-[0_0_15px_var(--theme-dim)]"
        >
          [INITIATE NEXT DUEL]
        </button>
      </div>
    </div>
  );
};
