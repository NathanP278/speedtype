import React, { useEffect } from 'react';
import { WEEKLY_TRIALS, TrialModifierId, WeeklyTrial } from '../trials/weeklyTrials.ts';

interface WeeklyTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModifier?: TrialModifierId | null;
  onSelectTrial: (trial: WeeklyTrial | null) => void;
}

export const WeeklyTrialModal: React.FC<WeeklyTrialModalProps> = ({
  isOpen,
  onClose,
  activeModifier,
  onSelectTrial,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      <div
        className="w-full max-w-3xl bg-zinc-950 border-2 border-purple-800 rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(176, 38, 255, 0.25)' }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-purple-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <div>
              <h3 className="text-sm font-bold text-purple-400 tracking-wider">
                WEEKLY THEMED TRIALS // ROTATING COMBAT MODIFIERS
              </h3>
              <p className="text-[11px] text-zinc-400">
                Rule-bending challenges with boosted Kinetic Point bounties.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs border border-purple-800 hover:border-red-500 text-zinc-400 hover:text-red-400 rounded transition-colors"
          >
            [ESC / CLOSE]
          </button>
        </div>

        {/* Trials List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {Object.values(WEEKLY_TRIALS).map(trial => {
            const isSelected = activeModifier === trial.id;
            return (
              <div
                key={trial.id}
                className={`p-4 rounded border transition-all ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_15px_rgba(176,38,255,0.3)]'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-bold text-purple-300 mr-2">{trial.badge}</span>
                    <h4 className="inline font-bold text-sm text-zinc-100">{trial.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{trial.description}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-xs font-bold text-amber-300">
                    +{trial.kpBounty} KP BOUNTY
                  </span>
                </div>

                {/* Rules */}
                <div className="my-3 p-2.5 bg-black/60 border border-zinc-800/80 rounded space-y-1 text-xs text-zinc-300">
                  {trial.rules.map(rule => (
                    <div key={rule} className="flex items-center gap-2">
                      <span className="text-purple-400 text-[10px]">▶</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>

                {/* Action button */}
                <div className="flex justify-end">
                  {isSelected ? (
                    <button
                      type="button"
                      onClick={() => onSelectTrial(null)}
                      className="px-4 py-1.5 text-xs font-bold rounded border border-zinc-700 text-zinc-400 hover:text-white"
                    >
                      DEACTIVATE MODIFIER
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTrial(trial);
                        onClose();
                      }}
                      className="px-5 py-1.5 text-xs font-bold rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                    >
                      ENGAGE TRIAL
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-black border-t border-purple-900/40 flex justify-between text-[11px] text-zinc-500">
          <span>TRIALS ROTATE WEEKLY // HIGH-RISK COMBAT PROTOCOLS</span>
          <span>COMPLETION AWARDS FULL BOUNTY DIRECTLY TO WALLET</span>
        </div>
      </div>
    </div>
  );
};
