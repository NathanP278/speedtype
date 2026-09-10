import React, { useEffect } from 'react';
import { DossierData, getRankedNemesisWords } from '../social/rivalryDossier.ts';

interface RivalryDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: DossierData;
}

export const RivalryDossierModal: React.FC<RivalryDossierModalProps> = ({
  isOpen,
  onClose,
  dossier,
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

  const nemesisRankings = getRankedNemesisWords(dossier).slice(0, 6);
  const winRate =
    dossier.lifetimeMatches > 0
      ? Math.round((dossier.wins / dossier.lifetimeMatches) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      <div
        className="w-full max-w-3xl bg-zinc-950 border-2 border-cyan-800 rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.9), 0 0 15px rgba(0, 229, 255, 0.2)' }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-cyan-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">📁</span>
            <div>
              <h3 className="text-sm font-bold text-cyan-400 tracking-wider">
                THE RIVALRY DOSSIER // CLASSIFIED COMBAT ARCHIVE
              </h3>
              <p className="text-[11px] text-zinc-400">
                Lifetime telemetry, bot head-to-head matrices & Nemesis Words hit-list.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs border border-cyan-800 hover:border-red-500 text-zinc-400 hover:text-red-400 rounded transition-colors"
          >
            [ESC / CLOSE]
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Lifetime Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded">
              <span className="text-[10px] text-zinc-500 block">LIFETIME MATCHES</span>
              <strong className="text-lg text-white font-bold">{dossier.lifetimeMatches}</strong>
            </div>
            <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded">
              <span className="text-[10px] text-zinc-500 block">WIN RATE</span>
              <strong className="text-lg text-cyan-400 font-bold">{winRate}% ({dossier.wins}W / {dossier.losses}L)</strong>
            </div>
            <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded">
              <span className="text-[10px] text-zinc-500 block">PEAK SPEED</span>
              <strong className="text-lg text-amber-400 font-bold">{dossier.highestWpm} WPM</strong>
            </div>
            <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded">
              <span className="text-[10px] text-zinc-500 block">AVERAGE SPEED</span>
              <strong className="text-lg text-zinc-200 font-bold">{dossier.averageWpm} WPM</strong>
            </div>
          </div>

          {/* Head-to-Head Rival Matrices */}
          <div>
            <h4 className="text-xs font-bold text-zinc-300 mb-2.5 tracking-wider">
              HEAD-TO-HEAD BOT ARCHETYPES
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(dossier.rivals).map(rival => (
                <div key={rival.rivalName} className="p-3 bg-zinc-900/40 border border-zinc-800 rounded">
                  <span className="font-bold text-sm text-zinc-100 block">{rival.rivalName}</span>
                  <div className="mt-1 flex justify-between text-xs text-zinc-400">
                    <span>RECORD:</span>
                    <strong className="text-cyan-400">{rival.wins}W - {rival.losses}L</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nemesis Words Hit-List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-red-400 tracking-wider">
                ⚠️ NEMESIS WORDS // HIGHEST ERROR & KO FREQUENCY
              </h4>
              <span className="text-[10px] text-zinc-500">DYNAMIC WEAKNESS TARGETING</span>
            </div>

            <div className="border border-zinc-800 rounded overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 text-[10px]">
                  <tr>
                    <th className="p-2.5">TARGET WORD</th>
                    <th className="p-2.5">ATTEMPTS</th>
                    <th className="p-2.5">TYPOS</th>
                    <th className="p-2.5">ERROR %</th>
                    <th className="p-2.5">DEATHS CAUSED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 bg-black/60">
                  {nemesisRankings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-zinc-500 italic">
                        NO TELEMETRY RECORDED YET. ENGAGE IN COMBAT TO POPULATE WEAKNESS PROFILE.
                      </td>
                    </tr>
                  ) : (
                    nemesisRankings.map(stat => (
                      <tr key={stat.word} className="hover:bg-zinc-900/40">
                        <td className="p-2.5 font-bold text-red-400">{stat.word}</td>
                        <td className="p-2.5 text-zinc-300">{stat.attempts}</td>
                        <td className="p-2.5 text-amber-400">{stat.mistakes}</td>
                        <td className="p-2.5 text-zinc-300">{stat.errorRate}%</td>
                        <td className="p-2.5 text-red-500 font-bold">{stat.deathsCaused} KOs</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-black border-t border-cyan-900/40 flex justify-between text-[11px] text-zinc-500">
          <span>CLASSIFIED TELEMETRY ARCHIVE</span>
          <span>TIP: SWITCH TO COUNTER STANCE TO ABSORB NEMESIS WORD PRESSURE</span>
        </div>
      </div>
    </div>
  );
};
