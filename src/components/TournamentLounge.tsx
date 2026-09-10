import React, { useState, useEffect, useRef } from 'react';
import {
  TournamentContestant,
  createTournamentBracket,
} from '../social/tournamentSimulator.ts';
import { WageringEngine, ActiveWager } from '../social/wageringEngine.ts';
import { SpectatorLane } from './SpectatorLane.tsx';
import { AsciiReactionOverlay } from './AsciiReactionOverlay.tsx';

interface TournamentLoungeProps {
  isOpen: boolean;
  onClose: () => void;
  playerKp: number;
  onUpdateKp: (newBalanceDelta: number) => void;
}

export const TournamentLounge: React.FC<TournamentLoungeProps> = ({
  isOpen,
  onClose,
  playerKp,
  onUpdateKp,
}) => {
  const [contestants, setContestants] = useState<TournamentContestant[]>(createTournamentBracket());
  const [wagerEngine] = useState<WageringEngine>(() => new WageringEngine());
  const [activeWager, setActiveWager] = useState<ActiveWager | null>(null);
  const [wagerAmount, setWagerAmount] = useState<number>(100);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [roundName, setRoundName] = useState<string>('QUARTER-FINALS');
  const [wagerResult, setWagerResult] = useState<string>('');

  const simIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePlaceWager = (contestant: TournamentContestant) => {
    const res = wagerEngine.placeWager(contestant, wagerAmount, playerKp);
    if (res.success && res.wager) {
      setActiveWager(res.wager);
      onUpdateKp(-wagerAmount);
    }
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setWagerResult('');

    simIntervalRef.current = window.setInterval(() => {
      setContestants(prev => {
        const updated = prev.map(c => {
          if (c.eliminated) return c;
          const damage = Math.floor(Math.random() * 15);
          const nextHealth = Math.max(0, c.health - damage);
          return {
            ...c,
            health: nextHealth,
            eliminated: nextHealth === 0,
            currentWpm: Math.round(c.baseWpm + (Math.random() - 0.5) * 20),
          };
        });

        const activeCount = updated.filter(c => !c.eliminated).length;
        if (activeCount <= 1) {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          setIsSimulating(false);

          const winner = updated.find(c => !c.eliminated) || updated[0];
          setRoundName(`GRAND FINAL WINNER: ${winner.name}`);

          const resolution = wagerEngine.resolveWager(winner.id);
          setActiveWager(null);

          if (resolution.won) {
            onUpdateKp(resolution.payout);
            setWagerResult(`🎉 WAGER WON! Received +${resolution.payout} KP!`);
          } else if (activeWager) {
            setWagerResult(`💀 Wager Lost. Better luck next tournament!`);
          }
        }

        return updated;
      });
    }, 600);
  };

  const resetTournament = () => {
    setContestants(createTournamentBracket());
    setRoundName('QUARTER-FINALS');
    setWagerResult('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      <div
        className="w-full max-w-4xl bg-zinc-950 border-2 border-amber-500/70 rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ boxShadow: '0 0 35px rgba(0, 0, 0, 0.9), 0 0 15px rgba(251, 191, 36, 0.25)' }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🏟️</span>
            <div>
              <h3 className="text-sm font-bold text-amber-400 tracking-wider">
                TOURNAMENT LOUNGE // SPECTATOR PIT (4-8 LANES)
              </h3>
              <p className="text-[11px] text-zinc-400">
                Wager Kinetic Points on seeded gladiators, track live match progression, and spam ASCII reactions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs border border-amber-800 hover:border-red-500 text-zinc-400 hover:text-red-400 rounded transition-colors"
          >
            [ESC / CLOSE]
          </button>
        </div>

        {/* Toolbar & Wagering Controls */}
        <div className="p-4 bg-zinc-900/40 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-300 font-bold">ACTIVE ROUND: {roundName}</span>
            {activeWager && (
              <span className="text-xs px-2.5 py-0.5 rounded bg-amber-950/80 border border-amber-500 text-amber-300 font-bold">
                BET: {activeWager.amount} KP on {activeWager.contestantName} (Pays: {activeWager.potentialPayout} KP)
              </span>
            )}
            {wagerResult && (
              <span className="text-xs font-bold text-green-400 animate-pulse">{wagerResult}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">WAGER:</span>
            {[50, 100, 250, 500].map(amt => (
              <button
                key={amt}
                type="button"
                disabled={isSimulating}
                onClick={() => setWagerAmount(amt)}
                className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                  wagerAmount === amt
                    ? 'border-amber-400 text-amber-400 font-bold bg-amber-950/40'
                    : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {amt} KP
              </button>
            ))}

            <button
              type="button"
              disabled={isSimulating}
              onClick={isSimulating ? undefined : startSimulation}
              className="ml-2 px-4 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded transition-colors disabled:opacity-50"
            >
              {isSimulating ? 'SIMULATING...' : '▶ START MATCH'}
            </button>

            <button
              type="button"
              onClick={resetTournament}
              className="px-2.5 py-1 text-xs border border-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
            >
              RESET
            </button>
          </div>
        </div>

        {/* 6-Lane Competitor Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {contestants.map(c => (
            <SpectatorLane
              key={c.id}
              contestant={c}
              isWageredOn={activeWager?.contestantId === c.id}
              canWager={!isSimulating && !activeWager}
              onWager={handlePlaceWager}
            />
          ))}
        </div>

        {/* Live ASCII Reactions Bar */}
        <div className="p-3 bg-black border-t border-zinc-800">
          <AsciiReactionOverlay />
        </div>
      </div>
    </div>
  );
};
