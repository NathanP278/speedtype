import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TournamentBracket,
  TournamentMatch,
  TournamentContestant,
  TournamentRoundId,
  createTournamentBracket,
  advanceBracketWinner,
} from '../social/tournamentSimulator.ts';
import { WageringEngine, ActiveWager } from '../social/wageringEngine.ts';
import {
  CommentaryLine,
  generateCommentary,
} from '../social/tournamentCommentary.ts';
import { STANCE_CONFIGS, generateWord, generateBossWord } from '../engine/dictionary.ts';
import { AsciiReactionOverlay } from './AsciiReactionOverlay.tsx';

interface TournamentLoungeProps {
  isOpen: boolean;
  onClose: () => void;
  playerKp: number;
  onUpdateKp: (newBalanceDelta: number) => void;
}

type LoungeTab = 'bracket' | 'duel';

interface DuelSimState {
  matchId: string;
  c1Health: number;
  c2Health: number;
  beamPosition: number; // -100 to 100
  c1Word: string;
  c2Word: string;
  c1Typed: string;
  c2Typed: string;
  c1Wpm: number;
  c2Wpm: number;
  c1TypoFlash: boolean;
  c2TypoFlash: boolean;
  isSimulating: boolean;
}

export const TournamentLounge: React.FC<TournamentLoungeProps> = ({
  isOpen,
  onClose,
  playerKp,
  onUpdateKp,
}) => {
  // Core bracket & wager engine state
  const [bracket, setBracket] = useState<TournamentBracket>(() => createTournamentBracket());
  const [wagerEngine] = useState<WageringEngine>(() => new WageringEngine());
  const [activeWager, setActiveWager] = useState<ActiveWager | null>(null);
  const [wagerAmount, setWagerAmount] = useState<number>(100);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('qf-1');
  const [activeTab, setActiveTab] = useState<LoungeTab>('duel');
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 4>(1);
  const [wagerNotice, setWagerNotice] = useState<string>('');

  // Live commentary feed
  const [commentaryFeed, setCommentaryFeed] = useState<CommentaryLine[]>(() => [
    generateCommentary('system', { roundName: 'QUARTERFINALS' }),
  ]);
  const commentaryScrollRef = useRef<HTMLDivElement | null>(null);

  // Active duel simulation state
  const [duelState, setDuelState] = useState<DuelSimState>({
    matchId: 'qf-1',
    c1Health: 100,
    c2Health: 100,
    beamPosition: 0,
    c1Word: 'STRIKE',
    c2Word: 'BUFFER',
    c1Typed: '',
    c2Typed: '',
    c1Wpm: 124,
    c2Wpm: 68,
    c1TypoFlash: false,
    c2TypoFlash: false,
    isSimulating: false,
  });

  const simTimerRef = useRef<number | null>(null);
  const duelStateRef = useRef<DuelSimState>(duelState);
  duelStateRef.current = duelState;

  // Find currently selected match
  const selectedMatch = useMemo<TournamentMatch | null>(() => {
    for (const roundKey of ['QF', 'SF', 'GF'] as const) {
      const found = bracket.rounds[roundKey].find(m => m.id === selectedMatchId);
      if (found) return found;
    }
    return bracket.rounds.QF[0] || null;
  }, [bracket, selectedMatchId]);

  // Handle ESC close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-scroll commentary feed
  useEffect(() => {
    if (commentaryScrollRef.current) {
      commentaryScrollRef.current.scrollTop = commentaryScrollRef.current.scrollHeight;
    }
  }, [commentaryFeed]);

  // Clean up timers on unmount or modal close
  useEffect(() => {
    return () => {
      if (simTimerRef.current !== null) {
        window.clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
    };
  }, []);

  // Update duelState words when selected match changes (if idle)
  useEffect(() => {
    if (!selectedMatch || duelStateRef.current.isSimulating) return;

    const c1 = selectedMatch.contestant1;
    const c2 = selectedMatch.contestant2;

    const w1 = c1 ? (selectedMatch.round === 'GF' ? generateBossWord() : generateWord(c1.stance).text) : '---';
    const w2 = c2 ? (selectedMatch.round === 'GF' ? generateBossWord() : generateWord(c2.stance).text) : '---';

    setDuelState({
      matchId: selectedMatch.id,
      c1Health: c1 ? c1.health : 100,
      c2Health: c2 ? c2.health : 100,
      beamPosition: 0,
      c1Word: w1,
      c2Word: w2,
      c1Typed: '',
      c2Typed: '',
      c1Wpm: c1 ? Math.max(15, c1.baseWpm + Math.round(-20 + Math.random() * 25)) : 100,
      c2Wpm: c2 ? Math.max(15, c2.baseWpm + Math.round(-20 + Math.random() * 25)) : 100,
      c1TypoFlash: false,
      c2TypoFlash: false,
      isSimulating: false,
    });
  }, [selectedMatch]);

  if (!isOpen) return null;

  // Add commentary helper
  const addCommentary = (type: Parameters<typeof generateCommentary>[0], ctx?: Parameters<typeof generateCommentary>[1]): void => {
    const line = generateCommentary(type, ctx);
    setCommentaryFeed(prev => [...prev.slice(-40), line]);
  };

  // Place round wager handler
  const handlePlaceWager = (contestant: TournamentContestant): void => {
    if (!selectedMatch) return;
    const res = wagerEngine.placeRoundWager(
      selectedMatch.round,
      selectedMatch,
      contestant,
      wagerAmount,
      playerKp
    );
    if (res.success && res.wager) {
      setActiveWager(res.wager);
      onUpdateKp(-wagerAmount);
      setWagerNotice(`Wager placed: ${wagerAmount} KP on ${contestant.name} (${res.wager.odds}x)`);
      addCommentary('system', {
        roundName: selectedMatch.round,
        activeContestantName: contestant.name,
      });
    } else if (res.error) {
      setWagerNotice(`⚠️ ${res.error}`);
    }
  };

  // Resolve match winner helper
  const finalizeMatchWinner = (match: TournamentMatch, winner: TournamentContestant): void => {
    if (simTimerRef.current !== null) {
      window.clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }

    const c1 = match.contestant1;
    const c2 = match.contestant2;
    const loser = c1?.id === winner.id ? c2 : c1;

    // Advance bracket
    const adv = advanceBracketWinner(bracket, match.id, winner.id);
    setBracket(adv.bracket);

    // Settle wager immediately
    const resolution = wagerEngine.settleMatchWager(match.id, winner.id);
    if (resolution.settled) {
      setActiveWager(null);
      if (resolution.won && resolution.payout > 0) {
        onUpdateKp(resolution.payout);
        setWagerNotice(`🎉 WAGER WON! [${resolution.wager?.contestantName}] won! Received +${resolution.payout} KP!`);
      } else {
        setWagerNotice(`💀 Wager Lost. [${resolution.wager?.contestantName}] was knocked out.`);
      }
    }

    // Commentary
    addCommentary('ko', {
      winnerName: winner.name,
      loserName: loser?.name,
      matchName: match.name,
      roundName: match.round,
    });

    if (adv.isTournamentComplete) {
      addCommentary('champion', { winnerName: winner.name });
    } else if (adv.isRoundComplete) {
      addCommentary('system', { roundName: adv.bracket.currentRound });
    }

    // Update duel state to complete
    setDuelState(prev => ({
      ...prev,
      isSimulating: false,
      c1Health: winner.id === c1?.id ? 100 : 0,
      c2Health: winner.id === c2?.id ? 100 : 0,
    }));

    // Auto-focus next pending match if available
    if (adv.bracket.activeMatchId && adv.bracket.activeMatchId !== match.id) {
      setSelectedMatchId(adv.bracket.activeMatchId);
    }
  };

  // Fast forward / instant quick resolve
  const handleQuickResolve = (): void => {
    if (!selectedMatch || !selectedMatch.contestant1 || !selectedMatch.contestant2) return;
    if (selectedMatch.status === 'completed') return;

    if (simTimerRef.current !== null) {
      window.clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }

    const c1 = selectedMatch.contestant1;
    const c2 = selectedMatch.contestant2;

    const c1EffectiveWpm = Math.max(15, c1.baseWpm + Math.round(-20 + Math.random() * 25));
    const c2EffectiveWpm = Math.max(15, c2.baseWpm + Math.round(-20 + Math.random() * 25));

    // Probability weighted by WPM and accuracy
    const p1 = c1EffectiveWpm * c1.accuracy;
    const p2 = c2EffectiveWpm * c2.accuracy;
    const c1WinProb = p1 / (p1 + p2);
    const winner = Math.random() < c1WinProb ? c1 : c2;

    finalizeMatchWinner(selectedMatch, winner);
  };

  // Start real-time side-by-side keystroke simulation
  const startSimulation = (speedMultiplier: 1 | 2 | 4 = 1): void => {
    if (!selectedMatch || !selectedMatch.contestant1 || !selectedMatch.contestant2) return;
    if (selectedMatch.status === 'completed') return;

    const c1 = selectedMatch.contestant1;
    const c2 = selectedMatch.contestant2;

    const c1EffectiveWpm = Math.max(15, c1.baseWpm + Math.round(-20 + Math.random() * 25));
    const c2EffectiveWpm = Math.max(15, c2.baseWpm + Math.round(-20 + Math.random() * 25));

    if (simTimerRef.current !== null) {
      window.clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }

    setSimSpeed(speedMultiplier);
    setWagerNotice('');

    const initialWord1 = selectedMatch.round === 'GF' ? generateBossWord() : generateWord(c1.stance).text;
    const initialWord2 = selectedMatch.round === 'GF' ? generateBossWord() : generateWord(c2.stance).text;

    const freshState: DuelSimState = {
      matchId: selectedMatch.id,
      c1Health: 100,
      c2Health: 100,
      beamPosition: 0,
      c1Word: initialWord1,
      c2Word: initialWord2,
      c1Typed: '',
      c2Typed: '',
      c1Wpm: c1EffectiveWpm,
      c2Wpm: c2EffectiveWpm,
      c1TypoFlash: false,
      c2TypoFlash: false,
      isSimulating: true,
    };
    setDuelState(freshState);
    duelStateRef.current = freshState;

    addCommentary('intro', {
      contestant1Name: c1.name,
      contestant2Name: c2.name,
      roundName: selectedMatch.round,
      matchName: selectedMatch.name,
    });

    let c1AccProgress = 0;
    let c2AccProgress = 0;
    let c1TypoCooldown = 0;
    let c2TypoCooldown = 0;
    let lowHpNotified = false;

    // Tick interval in milliseconds
    const TICK_MS = 40;

    simTimerRef.current = window.setInterval(() => {
      const curr = duelStateRef.current;
      if (!curr.isSimulating) return;

      const deltaMs = TICK_MS * speedMultiplier;

      // Handle typo recovery cooldowns
      if (c1TypoCooldown > 0) c1TypoCooldown -= deltaMs;
      if (c2TypoCooldown > 0) c2TypoCooldown -= deltaMs;

      // Speed in chars/ms: (WPM * 5 chars per word) / 60,000 ms
      const c1CharsPerMs = (c1EffectiveWpm * 5) / 60000;
      const c2CharsPerMs = (c2EffectiveWpm * 5) / 60000;

      let nextC1Typed = curr.c1Typed;
      let nextC2Typed = curr.c2Typed;
      let nextC1Word = curr.c1Word;
      let nextC2Word = curr.c2Word;
      let nextC1Hp = curr.c1Health;
      let nextC2Hp = curr.c2Health;
      let nextBeam = curr.beamPosition;
      let c1Flash = false;
      let c2Flash = false;

      // Advance C1
      if (c1TypoCooldown <= 0) {
        c1AccProgress += c1CharsPerMs * deltaMs;
        if (c1AccProgress >= 1) {
          const charsToAdd = Math.floor(c1AccProgress);
          c1AccProgress -= charsToAdd;

          // Accuracy roll
          const rollOk = Math.random() < c1.accuracy;
          if (!rollOk) {
            // Simulated typo
            c1TypoCooldown = 280;
            c1Flash = true;
            nextBeam = Math.max(-95, nextBeam - 6);
            addCommentary('recoil', {
              activeContestantName: c1.name,
            });
          } else {
            const nextIndex = Math.min(nextC1Word.length, nextC1Typed.length + charsToAdd);
            nextC1Typed = nextC1Word.slice(0, nextIndex);

            // Check word completion
            if (nextC1Typed.length >= nextC1Word.length) {
              // Word finished! Deal damage & push beam
              const dmg = c1.stance === 'strike' ? 22 : c1.stance === 'counter' ? 14 : 16;
              const push = c1.stance === 'strike' ? 18 : c1.stance === 'counter' ? 10 : 12;
              nextC2Hp = Math.max(0, nextC2Hp - dmg);
              nextBeam = Math.min(100, nextBeam + push);

              if (c1.stance === 'counter') {
                nextC1Hp = Math.min(100, nextC1Hp + 8);
              }

              if (c1.baseWpm > 115) {
                addCommentary('surge', {
                  activeContestantName: c1.name,
                  wpm: c1.baseWpm + Math.round(Math.random() * 8),
                  word: nextC1Word,
                });
              }

              // Next word
              nextC1Word = selectedMatch.round === 'GF' ? generateBossWord() : generateWord(c1.stance).text;
              nextC1Typed = '';
            }
          }
        }
      }

      // Advance C2
      if (c2TypoCooldown <= 0) {
        c2AccProgress += c2CharsPerMs * deltaMs;
        if (c2AccProgress >= 1) {
          const charsToAdd = Math.floor(c2AccProgress);
          c2AccProgress -= charsToAdd;

          // Accuracy roll
          const rollOk = Math.random() < c2.accuracy;
          if (!rollOk) {
            c2TypoCooldown = 280;
            c2Flash = true;
            nextBeam = Math.min(95, nextBeam + 6);
            addCommentary('recoil', {
              activeContestantName: c2.name,
            });
          } else {
            const nextIndex = Math.min(nextC2Word.length, nextC2Typed.length + charsToAdd);
            nextC2Typed = nextC2Word.slice(0, nextIndex);

            if (nextC2Typed.length >= nextC2Word.length) {
              const dmg = c2.stance === 'strike' ? 22 : c2.stance === 'counter' ? 14 : 16;
              const push = c2.stance === 'strike' ? 18 : c2.stance === 'counter' ? 10 : 12;
              nextC1Hp = Math.max(0, nextC1Hp - dmg);
              nextBeam = Math.max(-100, nextBeam - push);

              if (c2.stance === 'counter') {
                nextC2Hp = Math.min(100, nextC2Hp + 8);
              }

              if (c2.baseWpm > 115) {
                addCommentary('surge', {
                  activeContestantName: c2.name,
                  wpm: c2.baseWpm + Math.round(Math.random() * 8),
                  word: nextC2Word,
                });
              }

              nextC2Word = selectedMatch.round === 'GF' ? generateBossWord() : generateWord(c2.stance).text;
              nextC2Typed = '';
            }
          }
        }
      }

      // Low HP alert
      if (!lowHpNotified && (nextC1Hp < 30 || nextC2Hp < 30)) {
        lowHpNotified = true;
        const lowContestant = nextC1Hp < 30 ? c1 : c2;
        addCommentary('low_hp', {
          activeContestantName: lowContestant.name,
          hp: Math.round(nextC1Hp < 30 ? nextC1Hp : nextC2Hp),
        });
      }

      // Check KO conditions
      if (nextC2Hp <= 0 || nextBeam >= 100) {
        finalizeMatchWinner(selectedMatch, c1);
        return;
      }
      if (nextC1Hp <= 0 || nextBeam <= -100) {
        finalizeMatchWinner(selectedMatch, c2);
        return;
      }

      // State update
      const updatedState: DuelSimState = {
        ...curr,
        c1Health: nextC1Hp,
        c2Health: nextC2Hp,
        beamPosition: nextBeam,
        c1Word: nextC1Word,
        c2Word: nextC2Word,
        c1Typed: nextC1Typed,
        c2Typed: nextC2Typed,
        c1TypoFlash: c1Flash,
        c2TypoFlash: c2Flash,
      };
      setDuelState(updatedState);
      duelStateRef.current = updatedState;
    }, TICK_MS);
  };

  const resetTournament = (): void => {
    if (simTimerRef.current !== null) {
      window.clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    wagerEngine.reset();
    setActiveWager(null);
    setWagerNotice('');
    const freshBracket = createTournamentBracket();
    setBracket(freshBracket);
    setSelectedMatchId('qf-1');
    setCommentaryFeed([generateCommentary('system', { roundName: 'QUARTERFINALS' })]);
  };

  // Render Bracket Tree helper
  const renderBracketRound = (
    roundKey: TournamentRoundId,
    title: string,
    matches: TournamentMatch[]
  ): React.ReactNode => (
    <div key={roundKey} data-round={roundKey} className="flex-1 min-w-[240px] flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
        <span className="text-xs font-bold text-amber-400 tracking-wider">{title}</span>
        <span className="text-[10px] text-zinc-500">
          {matches.filter(m => m.status === 'completed').length}/{matches.length} DONE
        </span>
      </div>

      <div className="flex flex-col justify-around gap-2.5 h-full">
        {matches.map(m => {
          const isSelected = selectedMatchId === m.id;
          const hasWager = activeWager?.matchId === m.id;
          const c1 = m.contestant1;
          const c2 = m.contestant2;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setSelectedMatchId(m.id);
                setActiveTab('duel');
              }}
              className={`text-left p-2.5 rounded border transition-all relative ${
                isSelected
                  ? 'border-amber-400 bg-zinc-900/90 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/60'
                  : 'border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/50'
              }`}
            >
              {/* Match Header */}
              <div className="flex justify-between items-center text-[10px] mb-1.5 pb-1 border-b border-zinc-900">
                <span className="font-bold text-zinc-400">{m.name.toUpperCase()}</span>
                <div className="flex items-center gap-1.5">
                  {hasWager && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-[9px]">
                      BET ACTIVE
                    </span>
                  )}
                  <span
                    className={`px-1 rounded text-[9px] font-bold ${
                      m.status === 'completed'
                        ? 'bg-green-950 text-green-400 border border-green-800'
                        : m.status === 'active'
                        ? 'bg-cyan-950 text-cyan-300 animate-pulse border border-cyan-800'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {m.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Contestant 1 row */}
              <div
                className={`flex items-center justify-between py-1 px-1.5 rounded text-xs transition-colors ${
                  m.winner?.id === c1?.id
                    ? 'bg-amber-500/15 font-bold text-amber-300'
                    : c1?.eliminated
                    ? 'text-zinc-600 line-through'
                    : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-zinc-500 font-mono">#{c1?.seed ?? '?'}</span>
                  <span className="truncate">{c1?.name || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  {c1 && <span className="text-zinc-500">{m.oddsC1.toFixed(1)}x</span>}
                  {m.winner?.id === c1?.id && <span className="text-amber-400 font-bold">✓</span>}
                </div>
              </div>

              {/* Contestant 2 row */}
              <div
                className={`flex items-center justify-between py-1 px-1.5 rounded text-xs transition-colors ${
                  m.winner?.id === c2?.id
                    ? 'bg-amber-500/15 font-bold text-amber-300'
                    : c2?.eliminated
                    ? 'text-zinc-600 line-through'
                    : 'text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] text-zinc-500 font-mono">#{c2?.seed ?? '?'}</span>
                  <span className="truncate">{c2?.name || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  {c2 && <span className="text-zinc-500">{m.oddsC2.toFixed(1)}x</span>}
                  {m.winner?.id === c2?.id && <span className="text-amber-400 font-bold">✓</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 font-mono select-none">
      <div
        className="w-full max-w-5xl bg-zinc-950 border-2 border-amber-500/70 rounded-lg shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(0, 0, 0, 0.95), 0 0 16px rgba(251, 191, 36, 0.25)' }}
      >
        {/* Header Bar */}
        <div className="px-5 py-3 bg-zinc-900/90 border-b border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏟️</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-amber-400 tracking-wider">
                  TOURNAMENT LOUNGE // 8-PLAYER BRACKET PIT
                </h3>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                  STAGE: {bracket.currentRound}
                </span>
                {bracket.isComplete && bracket.champion && (
                  <span className="px-2 py-0.5 text-[10px] rounded bg-yellow-500/20 text-yellow-300 border border-yellow-400 font-bold animate-pulse">
                    🏆 CHAMPION: {bracket.champion.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Quarterfinals &rarr; Semifinals &rarr; Grand Finals. Live keystroke clashes, dynamic odds, and round settlements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-zinc-500">KINETIC BALANCE</div>
              <div className="text-sm font-bold text-emerald-400">{playerKp} KP</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs border border-amber-800 hover:border-red-500 text-zinc-400 hover:text-red-400 rounded transition-colors focus:outline-none focus:ring-1 focus:ring-red-400"
            >
              [ESC / CLOSE]
            </button>
          </div>
        </div>

        {/* View Switcher & Action Ribbon */}
        <div className="px-5 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('duel')}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                activeTab === 'duel'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              ⚔️ LIVE DUEL VIEW
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bracket')}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                activeTab === 'bracket'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              📊 BRACKET TREE
            </button>

            {selectedMatch && (
              <span className="ml-2 text-zinc-400">
                SELECTED:{' '}
                <span className="text-amber-300 font-bold">
                  {selectedMatch.name} ({selectedMatch.contestant1?.name || 'TBD'} vs{' '}
                  {selectedMatch.contestant2?.name || 'TBD'})
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Match Simulation Controls */}
            {selectedMatch && selectedMatch.status !== 'completed' && selectedMatch.contestant1 && selectedMatch.contestant2 && (
              <>
                <button
                  type="button"
                  disabled={duelState.isSimulating}
                  onClick={() => startSimulation(1)}
                  className="px-3 py-1 font-bold bg-amber-500 hover:bg-amber-400 text-black rounded transition-colors disabled:opacity-50"
                >
                  {duelState.isSimulating ? `SIMULATING (${simSpeed}x)...` : '▶ PLAY MATCH'}
                </button>
                <button
                  type="button"
                  disabled={duelState.isSimulating}
                  onClick={() => startSimulation(2)}
                  className="px-2.5 py-1 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors disabled:opacity-50"
                  title="Fast forward simulation at 2x speed"
                >
                  ⏩ 2x
                </button>
                <button
                  type="button"
                  disabled={duelState.isSimulating}
                  onClick={() => startSimulation(4)}
                  className="px-2.5 py-1 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors disabled:opacity-50"
                  title="Fast forward simulation at 4x speed"
                >
                  ⏩ 4x
                </button>
                <button
                  type="button"
                  disabled={duelState.isSimulating}
                  onClick={handleQuickResolve}
                  className="px-2.5 py-1 text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-colors disabled:opacity-50"
                  title="Instantly resolve match"
                >
                  ⚡ QUICK
                </button>
              </>
            )}

            <button
              type="button"
              onClick={resetTournament}
              className="px-2.5 py-1 border border-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
            >
              RESET BRACKET
            </button>
          </div>
        </div>

        {/* Wager Settlement Alert Banner */}
        {wagerNotice && (
          <div className="px-5 py-1.5 bg-amber-950/40 border-b border-amber-600/40 flex items-center justify-between text-xs">
            <span className="text-amber-300 font-bold">{wagerNotice}</span>
            <button
              type="button"
              onClick={() => setWagerNotice('')}
              className="text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {activeTab === 'bracket' ? (
            /* 3-Stage Bracket Tree View */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
                {renderBracketRound('QF', 'QUARTERFINALS (4 MATCHES)', bracket.rounds.QF)}
                <div className="hidden md:flex items-center text-zinc-600 text-xl font-bold">&rarr;</div>
                {renderBracketRound('SF', 'SEMIFINALS (2 MATCHES)', bracket.rounds.SF)}
                <div className="hidden md:flex items-center text-zinc-600 text-xl font-bold">&rarr;</div>
                {renderBracketRound('GF', 'GRAND FINALS (CHAMPIONSHIP)', bracket.rounds.GF)}
              </div>

              {bracket.champion && (
                <div className="p-4 bg-amber-950/30 border border-amber-500/50 rounded-lg text-center flex flex-col items-center justify-center gap-1 shadow-lg">
                  <span className="text-2xl">🏆</span>
                  <h4 className="text-base font-bold text-amber-400 tracking-wider">
                    SPEEDTYPE TOURNAMENT CHAMPION
                  </h4>
                  <div className="text-lg font-bold text-white">
                    {bracket.champion.avatar} {bracket.champion.name}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Stance: {bracket.champion.stance.toUpperCase()} // Base Speed: {bracket.champion.baseWpm} WPM // Accuracy:{' '}
                    {Math.round(bracket.champion.accuracy * 100)}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Live Side-by-Side Duel Arena */
            <div className="flex flex-col gap-4">
              {selectedMatch && selectedMatch.contestant1 && selectedMatch.contestant2 ? (
                (() => {
                  const c1 = selectedMatch.contestant1;
                  const c2 = selectedMatch.contestant2;
                  const c1Stance = STANCE_CONFIGS[c1.stance];
                  const c2Stance = STANCE_CONFIGS[c2.stance];

                  return (
                    <div className="flex flex-col gap-3">
                      {/* Arena Visualizer Card */}
                      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col gap-4">
                        {/* Match Status Bar */}
                        <div className="flex justify-between items-center text-xs text-zinc-400 border-b border-zinc-800/80 pb-2">
                          <span className="font-bold text-amber-400">
                            {selectedMatch.name.toUpperCase()} // ROUND: {selectedMatch.round}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>ODDS: {selectedMatch.oddsC1.toFixed(1)}x vs {selectedMatch.oddsC2.toFixed(1)}x</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                selectedMatch.status === 'completed'
                                  ? 'bg-green-950 text-green-400 border border-green-700'
                                  : duelState.isSimulating
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500 animate-pulse'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {selectedMatch.status === 'completed'
                                ? `WINNER: ${selectedMatch.winner?.name}`
                                : duelState.isSimulating
                                ? 'LIVE DUEL IN PROGRESS'
                                : 'READY'}
                            </span>
                          </div>
                        </div>

                        {/* Side-by-Side Gladiators View */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Fighter 1 (Left) */}
                          <div
                            className={`p-3 rounded-lg border transition-all ${
                              duelState.c1TypoFlash
                                ? 'border-red-500 bg-red-950/30'
                                : 'border-zinc-800 bg-zinc-950/80'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                  #{c1.seed}
                                </span>
                                <span className="text-sm font-bold text-white">
                                  {c1.avatar} {c1.name}
                                </span>
                              </div>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                                style={{
                                  color: c1Stance.themeColor,
                                  backgroundColor: `${c1Stance.themeColor}22`,
                                  border: `1px solid ${c1Stance.themeColor}55`,
                                }}
                              >
                                {c1.stance}
                              </span>
                            </div>

                            {/* Health Bar */}
                            <div className="space-y-1 mb-3">
                              <div className="flex justify-between text-[11px] text-zinc-400">
                                <span>INTEGRITY: {Math.max(0, Math.round(duelState.c1Health))}%</span>
                                <span className="font-bold text-[var(--theme-text)]">{duelState.c1Wpm} WPM</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-900 rounded overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-100"
                                  style={{ width: `${Math.max(0, Math.round(duelState.c1Health))}%` }}
                                />
                              </div>
                            </div>

                            {/* Keystroke Display */}
                            <div className="p-2.5 bg-black rounded border border-zinc-900 font-mono">
                              <div className="text-[10px] text-zinc-500 mb-1">TARGET SYNTAX:</div>
                              <div className="text-sm tracking-wider break-all">
                                <span className="text-emerald-400 font-bold">{duelState.c1Typed}</span>
                                <span className="inline-block w-2 bg-amber-400 animate-pulse text-transparent">_</span>
                                <span className="text-zinc-600">
                                  {duelState.c1Word.slice(duelState.c1Typed.length)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Fighter 2 (Right) */}
                          <div
                            className={`p-3 rounded-lg border transition-all ${
                              duelState.c2TypoFlash
                                ? 'border-red-500 bg-red-950/30'
                                : 'border-zinc-800 bg-zinc-950/80'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                  #{c2.seed}
                                </span>
                                <span className="text-sm font-bold text-white">
                                  {c2.avatar} {c2.name}
                                </span>
                              </div>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase"
                                style={{
                                  color: c2Stance.themeColor,
                                  backgroundColor: `${c2Stance.themeColor}22`,
                                  border: `1px solid ${c2Stance.themeColor}55`,
                                }}
                              >
                                {c2.stance}
                              </span>
                            </div>

                            {/* Health Bar */}
                            <div className="space-y-1 mb-3">
                              <div className="flex justify-between text-[11px] text-zinc-400">
                                <span>INTEGRITY: {Math.max(0, Math.round(duelState.c2Health))}%</span>
                                <span className="font-bold text-[var(--theme-text)]">{duelState.c2Wpm} WPM</span>
                              </div>
                              <div className="h-2 w-full bg-zinc-900 rounded overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 transition-all duration-100"
                                  style={{ width: `${Math.max(0, Math.round(duelState.c2Health))}%` }}
                                />
                              </div>
                            </div>

                            {/* Keystroke Display */}
                            <div className="p-2.5 bg-black rounded border border-zinc-900 font-mono">
                              <div className="text-[10px] text-zinc-500 mb-1">TARGET SYNTAX:</div>
                              <div className="text-sm tracking-wider break-all">
                                <span className="text-emerald-400 font-bold">{duelState.c2Typed}</span>
                                <span className="inline-block w-2 bg-amber-400 animate-pulse text-transparent">_</span>
                                <span className="text-zinc-600">
                                  {duelState.c2Word.slice(duelState.c2Typed.length)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Kinetic Beam Tug-of-War Conduit */}
                        <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                          <div className="flex justify-between text-[11px] text-zinc-400">
                            <span className="text-amber-400">&larr; {c1.name} ADVANTAGE</span>
                            <span className="font-bold text-zinc-300">
                              KINETIC CONDUIT // {Math.round(duelState.beamPosition)}%
                            </span>
                            <span className="text-cyan-400">{c2.name} ADVANTAGE &rarr;</span>
                          </div>
                          <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800 flex relative">
                            {/* Center Marker */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-600 z-10" />
                            {/* Beam Progress Slider */}
                            <div
                              className="h-full rounded-full transition-all duration-100"
                              style={{
                                marginLeft: `${Math.max(0, Math.min(100, 50 + duelState.beamPosition / 2))}%`,
                                width: '12px',
                                transform: 'translateX(-50%)',
                                backgroundColor: duelState.beamPosition >= 0 ? '#FBBF24' : '#00E5FF',
                                boxShadow: `0 0 10px ${duelState.beamPosition >= 0 ? '#FBBF24' : '#00E5FF'}`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Per-Round Wagering Panel for this Match */}
                      <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400">WAGERING TERMINAL:</span>
                          {activeWager && activeWager.matchId === selectedMatch.id ? (
                            <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-500 text-amber-300 font-bold">
                              ACTIVE BET: {activeWager.amount} KP on {activeWager.contestantName} (Pays:{' '}
                              {activeWager.potentialPayout} KP)
                            </span>
                          ) : selectedMatch.status === 'completed' ? (
                            <span className="text-zinc-500">Match concluded. Wagering closed.</span>
                          ) : (
                            <span className="text-zinc-400">
                              Select a gladiator below to wager {wagerAmount} KP for the {selectedMatch.round} round:
                            </span>
                          )}
                        </div>

                        {selectedMatch.status === 'pending' && !activeWager && (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">STAKE:</span>
                            {[50, 100, 250, 500].map(amt => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setWagerAmount(amt)}
                                className={`px-2 py-0.5 rounded border transition-colors ${
                                  wagerAmount === amt
                                    ? 'border-amber-400 text-amber-400 bg-amber-950/40 font-bold'
                                    : 'border-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {amt} KP
                              </button>
                            ))}

                            <button
                              type="button"
                              onClick={() => handlePlaceWager(c1)}
                              className="ml-2 px-3 py-1 font-bold rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500 transition-colors"
                            >
                              BET {c1.name} ({selectedMatch.oddsC1.toFixed(1)}x)
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePlaceWager(c2)}
                              className="px-3 py-1 font-bold rounded bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500 transition-colors"
                            >
                              BET {c2.name} ({selectedMatch.oddsC2.toFixed(1)}x)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-lg">
                  Select an active match in the bracket tree to view the live duel.
                </div>
              )}
            </div>
          )}

          {/* Scrolling Live Commentary Feed */}
          <div className="bg-black/90 border border-zinc-800 rounded-lg p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center pb-1 border-b border-zinc-900 text-[10px] text-zinc-500">
              <span className="font-bold text-amber-400 tracking-wider">
                &gt;&gt;&gt; SPECTATOR TERMINAL // LIVE SHOUTCAST FEED
              </span>
              <span>SYNCHRONIZED</span>
            </div>

            <div
              ref={commentaryScrollRef}
              className="max-h-28 overflow-y-auto space-y-1 text-xs pr-1 font-mono"
            >
              {commentaryFeed.map(item => (
                <div key={item.id} className="flex items-start gap-2 leading-tight">
                  <span
                    className="px-1 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: item.speakerColor,
                      backgroundColor: `${item.speakerColor}15`,
                      border: `1px solid ${item.speakerColor}44`,
                    }}
                  >
                    [{item.speaker}]
                  </span>
                  <span className="text-zinc-300 flex-1">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live ASCII Reactions Bar */}
        <div className="p-2.5 bg-black border-t border-zinc-800/80">
          <AsciiReactionOverlay />
        </div>
      </div>
    </div>
  );
};
