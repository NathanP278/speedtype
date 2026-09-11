import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  CombatantState,
  StanceType,
  WordTarget,
  MatchStatus,
  MatchResult,
  CombatStats,
} from '../types/combat.ts';
import { generateWord } from './dictionary.ts';
import { useKineticBeam } from './useKineticBeam.ts';
import { useOverclock } from './useOverclock.ts';
import { useFinisherDuel } from './useFinisherDuel.ts';
import { BotSimulator } from './botOpponent.ts';
import type { BotProfile } from './botOpponent.ts';
import { GhostPlaybackEngine } from '../social/ghostPlayer.ts';
import type { GhostRunData } from '../social/ghostRecorder.ts';
import { NemesisTelemetryTracker } from './nemesisTelemetry.ts';

interface UseCombatCoordinatorOptions {
  botProfileId?: string;
  trialModifier?: string;
  onMatchEnd?: (result: MatchResult) => void;
  onWordExplode?: (word: string, x: number, y: number, color: string) => void;
  onPlayKeystrokeSound?: (isMistype: boolean, streak: number) => void;
}

const INITIAL_STATS: CombatStats = {
  wpm: 0,
  peakWpm: 0,
  accuracy: 100,
  totalKeystrokes: 0,
  totalMistakes: 0,
  longestStreak: 0,
  wordsCompleted: 0,
  parriesCount: 0,
  overclockCount: 0,
};

export function useCombatCoordinator({
  botProfileId = 'shinobi',
  trialModifier,
  onMatchEnd,
  onWordExplode,
  onPlayKeystrokeSound,
}: UseCombatCoordinatorOptions = {}) {
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('idle');
  const [matchStartTime, setMatchStartTime] = useState<number>(0);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // Combatant States
  const [player, setPlayer] = useState<CombatantState>({
    id: 'player',
    name: 'ROOT_USER',
    health: 100,
    maxHealth: 100,
    shield: 0,
    superMeter: 0,
    stance: 'strike',
    activeWord: null,
    typedText: '',
    cleanStreak: 0,
    isOverclocked: false,
    isDisrupted: false,
    disruptionRemainingMs: 0,
    stats: { ...INITIAL_STATS },
  });

  const [opponent, setOpponent] = useState<CombatantState>({
    id: 'opponent',
    name: 'RIVAL_AI',
    health: 100,
    maxHealth: 100,
    shield: 0,
    superMeter: 0,
    stance: 'strike',
    activeWord: null,
    typedText: '',
    cleanStreak: 0,
    isOverclocked: false,
    isDisrupted: false,
    disruptionRemainingMs: 0,
    stats: { ...INITIAL_STATS },
  });

  const botRef = useRef<BotSimulator | null>(null);
  const ghostRef = useRef<GhostPlaybackEngine | null>(null);
  const matchResultRef = useRef<MatchResult | null>(null);
  const telemetryRef = useRef<NemesisTelemetryTracker>(new NemesisTelemetryTracker());

  // Subsystems
  const handleBaselineKnockout = useCallback((winner: 'player' | 'opponent') => {
    endMatch(winner, 'beam_baseline_ko');
  }, []);

  const {
    beamState,
    applyCorrectKeystroke,
    applyWordBurst,
    applyMistypeRecoil,
    decayScreenShake,
    resetBeam,
  } = useKineticBeam({ onBaselineKnockout: handleBaselineKnockout });

  const {
    isOverclocked,
    streak: overclockStreak,
    damageMultiplier,
    ghostTrailIntensity,
    handleCorrectChar: triggerOverclockChar,
    handleTypo: triggerOverclockTypo,
    resetOverclock,
  } = useOverclock({
    streakThreshold: 30,
  });

  const handleFinisherAttackerKo = useCallback((attackerId: 'player' | 'opponent') => {
    endMatch(attackerId, 'finisher_boss_ko');
  }, []);

  const handleFinisherDefenderClutch = useCallback((defenderId: 'player' | 'opponent') => {
    // Clutch rebound: +25% HP and 100% Super Meter
    if (defenderId === 'player') {
      setPlayer(prev => ({
        ...prev,
        health: Math.min(prev.maxHealth, prev.health + 25),
        superMeter: 100,
      }));
    } else {
      setOpponent(prev => ({
        ...prev,
        health: Math.min(prev.maxHealth, prev.health + 25),
        superMeter: 100,
      }));
    }
    setMatchStatus('in_progress');
    resetFinisher();
  }, []);

  const {
    finisherState,
    triggerFinisher,
    advanceProgress: advanceFinisherProgress,
    resetFinisher,
  } = useFinisherDuel({
    onFinisherAttackerKo: handleFinisherAttackerKo,
    onFinisherDefenderClutch: handleFinisherDefenderClutch,
  });

  // End match logic
  const endMatch = useCallback((winner: 'player' | 'opponent', reason: MatchResult['reason']) => {
    if (matchResultRef.current) return;

    if (botRef.current) {
      botRef.current.stop();
      botRef.current = null;
    }
    if (ghostRef.current) {
      ghostRef.current.stop();
      ghostRef.current = null;
    }

    const duration = Date.now() - (matchStartTime || Date.now());
    const isPlayerWin = winner === 'player';

    // KP Calculation formula
    const wpmBonus = player.stats.wpm * 1.5;
    const accBonus = player.stats.accuracy * 2.0;
    const streakBonus = player.stats.longestStreak * 3;
    const parryBonus = player.stats.parriesCount * 15;
    const winBonus = isPlayerWin ? 250 : 50;
    const totalKpEarned = Math.round(wpmBonus + accBonus + streakBonus + parryBonus + winBonus);

    const fatalWordCandidate = winner === 'opponent'
      ? (telemetryRef.current.getActiveWord() || (matchStatus === 'finisher' ? finisherState.bossWord : player.activeWord?.text) || undefined)
      : undefined;

    if (fatalWordCandidate) {
      telemetryRef.current.recordFatalDefeat(fatalWordCandidate);
    }

    const finalResult: MatchResult = {
      winner,
      reason,
      durationMs: duration,
      playerStats: { ...player.stats },
      opponentStats: { ...opponent.stats },
      kpEarned: totalKpEarned,
      timestamp: Date.now(),
      failedWords: telemetryRef.current.getFailedWords(),
      fatalWord: fatalWordCandidate,
    };

    matchResultRef.current = finalResult;
    setMatchResult(finalResult);
    setMatchStatus('game_over');

    if (onMatchEnd) {
      onMatchEnd(finalResult);
    }
  }, [matchStartTime, player.stats, opponent.stats, matchStatus, finisherState.bossWord, player.activeWord?.text, onMatchEnd]);

  // Check for Finisher condition (HP < 10%)
  const checkFinisherTrigger = useCallback((pHealth: number, oHealth: number) => {
    if (finisherState.active || matchStatus !== 'in_progress') return;
    if (trialModifier === '1hp_sudden_death') return; // Gate finisher in 1 HP Sudden Death

    if (pHealth > 0 && pHealth <= 10) {
      setMatchStatus('finisher');
      triggerFinisher('opponent', 'player');
    } else if (oHealth > 0 && oHealth <= 10) {
      setMatchStatus('finisher');
      triggerFinisher('player', 'opponent');
    }
  }, [finisherState.active, matchStatus, trialModifier, triggerFinisher]);

  // Player Correct Keystroke
  const handlePlayerKeystroke = useCallback((_char: string, streak: number, wpm: number) => {
    if (matchStatus === 'finisher') {
      advanceFinisherProgress('player');
      if (onPlayKeystrokeSound) onPlayKeystrokeSound(false, streak);
      return;
    }

    if (matchStatus !== 'in_progress') return;

    triggerOverclockChar(streak);
    applyCorrectKeystroke('player', player.stance, isOverclocked);

    setPlayer(prev => ({
      ...prev,
      cleanStreak: streak,
      isOverclocked,
      stats: {
        ...prev.stats,
        wpm,
        totalKeystrokes: prev.stats.totalKeystrokes + 1,
        longestStreak: Math.max(prev.stats.longestStreak, streak),
      },
    }));

    if (onPlayKeystrokeSound) onPlayKeystrokeSound(false, streak);
  }, [
    matchStatus,
    player.stance,
    isOverclocked,
    triggerOverclockChar,
    applyCorrectKeystroke,
    advanceFinisherProgress,
    onPlayKeystrokeSound,
  ]);

  // Player Mistype
  const handlePlayerMistype = useCallback(() => {
    if (matchStatus !== 'in_progress' && matchStatus !== 'finisher') return;

    const currentWordText =
      matchStatus === 'finisher'
        ? finisherState.bossWord
        : (player.activeWord?.text || telemetryRef.current.getActiveWord() || undefined);

    if (currentWordText) {
      telemetryRef.current.recordMistype(currentWordText);
      telemetryRef.current.recordRecoil(currentWordText);
    }

    triggerOverclockTypo();
    applyMistypeRecoil('player');

    setPlayer(prev => {
      const updatedMistakes = prev.stats.totalMistakes + 1;
      if (trialModifier === '1hp_sudden_death') {
        if (prev.shield > 0) {
          // Absorption shield absorbs mistype recoil
          return {
            ...prev,
            shield: Math.max(0, prev.shield - 20),
            cleanStreak: 0,
            isOverclocked: false,
            stats: {
              ...prev.stats,
              totalMistakes: updatedMistakes,
            },
          };
        } else {
          // Instant fatality on unshielded mistype recoil
          endMatch('opponent', 'sudden_death');
          return {
            ...prev,
            health: 0,
            cleanStreak: 0,
            isOverclocked: false,
            stats: {
              ...prev.stats,
              totalMistakes: updatedMistakes,
            },
          };
        }
      }

      return {
        ...prev,
        cleanStreak: 0,
        isOverclocked: false,
        stats: {
          ...prev.stats,
          totalMistakes: updatedMistakes,
        },
      };
    });

    if (onPlayKeystrokeSound) onPlayKeystrokeSound(true, 0);
  }, [
    matchStatus,
    trialModifier,
    finisherState.bossWord,
    player.activeWord?.text,
    triggerOverclockTypo,
    applyMistypeRecoil,
    endMatch,
    onPlayKeystrokeSound,
  ]);

  // Player Word Complete
  const handlePlayerWordComplete = useCallback((word: WordTarget, stats: CombatStats) => {
    if (matchStatus !== 'in_progress') return;

    const pushMultiplier = trialModifier === 'code_syntax' ? 1.5 : 1.0;
    applyWordBurst('player', word.text.length, player.stance, isOverclocked, pushMultiplier);

    // Stance Effects:
    if (player.stance === 'strike') {
      // Direct damage to opponent
      const damage = Math.round(word.damage * (isOverclocked ? 2.0 : 1.0));
      setOpponent(prev => {
        let remainingDmg = damage;
        let newShield = prev.shield;
        if (newShield > 0) {
          const absorbed = Math.min(newShield, damage);
          newShield -= absorbed;
          remainingDmg -= absorbed;
        }
        const nextHealth = Math.max(0, prev.health - remainingDmg);
        if (nextHealth === 0) {
          endMatch('player', trialModifier === '1hp_sudden_death' ? 'sudden_death' : 'health_depleted_ko');
        }
        checkFinisherTrigger(player.health, nextHealth);
        return { ...prev, shield: newShield, health: nextHealth };
      });
    } else if (player.stance === 'counter') {
      // Build shield and parry buffer
      setPlayer(prev => ({
        ...prev,
        shield: Math.min(100, prev.shield + 20),
        stats: { ...prev.stats, parriesCount: prev.stats.parriesCount + 1 },
      }));
    } else if (player.stance === 'disrupt') {
      // Disrupt opponent UI
      setOpponent(prev => ({
        ...prev,
        isDisrupted: true,
        disruptionRemainingMs: 2500,
      }));
    }

    if (onWordExplode) {
      onWordExplode(word.text, window.innerWidth * 0.25, window.innerHeight * 0.45, '#00FF66');
    }

    // Spawn new word for player
    const nextWord = generateWord(player.stance, trialModifier);
    telemetryRef.current.setActiveWord(nextWord.text);
    setPlayer(prev => ({
      ...prev,
      activeWord: nextWord,
      stats: {
        ...prev.stats,
        ...stats,
        wordsCompleted: prev.stats.wordsCompleted + 1,
      },
    }));
  }, [
    matchStatus,
    player.stance,
    player.health,
    isOverclocked,
    trialModifier,
    applyWordBurst,
    checkFinisherTrigger,
    endMatch,
    onWordExplode,
  ]);

  // Start match
  const startMatch = useCallback((opponentParam: string | GhostRunData | BotProfile = botProfileId) => {
    resetBeam();
    resetOverclock();
    resetFinisher();
    matchResultRef.current = null;
    setMatchResult(null);

    if (botRef.current) {
      botRef.current.stop();
      botRef.current = null;
    }
    if (ghostRef.current) {
      ghostRef.current.stop();
      ghostRef.current = null;
    }

    const initialPlayerWord = generateWord('strike', trialModifier);
    const now = Date.now();
    setMatchStartTime(now);
    telemetryRef.current.reset();
    telemetryRef.current.setActiveWord(initialPlayerWord.text);

    const isGhost = typeof opponentParam === 'object' && opponentParam !== null && 'events' in opponentParam;

    if (isGhost) {
      const ghostRun = opponentParam as GhostRunData;
      const ghost = new GhostPlaybackEngine(ghostRun, {
        onCharTyped: (_char, isCorrect, stance) => {
          if (matchStatus === 'finisher') {
            if (isCorrect) advanceFinisherProgress('opponent');
            return;
          }

          if (isCorrect) {
            applyCorrectKeystroke('opponent', stance, false);
          } else {
            applyMistypeRecoil('opponent');
          }
        },
        onWordCompleted: (wordText, stance) => {
          const pushMultiplier = trialModifier === 'code_syntax' ? 1.5 : 1.0;
          applyWordBurst('opponent', wordText.length, stance, false, pushMultiplier);

          if (stance === 'strike') {
            const dmg = 15;
            setPlayer(prev => {
              let remainingDmg = dmg;
              let currentShield = prev.shield;
              let currentHealth = prev.health;

              if (currentShield > 0) {
                const absorb = Math.min(currentShield, dmg);
                currentShield -= absorb;
                remainingDmg -= absorb;
                currentHealth = Math.min(prev.maxHealth, currentHealth + Math.round(absorb * 0.5));
              }

              const nextHealth = Math.max(0, currentHealth - remainingDmg);
              if (nextHealth === 0) {
                endMatch('opponent', trialModifier === '1hp_sudden_death' ? 'sudden_death' : 'health_depleted_ko');
              }
              checkFinisherTrigger(nextHealth, opponent.health);
              return { ...prev, shield: currentShield, health: nextHealth };
            });
          } else if (stance === 'disrupt') {
            setPlayer(prev => ({
              ...prev,
              isDisrupted: true,
              disruptionRemainingMs: 2500,
            }));
          }

          if (onWordExplode) {
            onWordExplode(wordText, window.innerWidth * 0.75, window.innerHeight * 0.45, '#FF3333');
          }

          setOpponent(prev => ({
            ...prev,
            activeWord: {
              id: `ghost_word_${Date.now()}`,
              text: ghost.getActiveWord(),
              stance: ghost.getStance(),
              damage: ghost.getStance() === 'strike' ? 15 : ghost.getStance() === 'counter' ? 8 : 12,
            },
            stats: {
              ...prev.stats,
              wordsCompleted: prev.stats.wordsCompleted + 1,
            },
          }));
        },
        onStanceChanged: newStance => {
          setOpponent(prev => ({
            ...prev,
            stance: newStance,
            activeWord: {
              id: `ghost_word_${Date.now()}`,
              text: ghost.getActiveWord(),
              stance: newStance,
              damage: newStance === 'strike' ? 15 : newStance === 'counter' ? 8 : 12,
            },
          }));
        },
        onPlaybackComplete: () => {
          // Playback finished, ghost remains idle
        },
      });

      ghostRef.current = ghost;
      ghost.start();

      const ghostProf = ghost.getProfile();
      const initialOpponentWord: WordTarget = {
        id: `ghost_word_${now}`,
        text: ghost.getActiveWord() || 'SYNCHRONIZING...',
        stance: ghost.getStance(),
        damage: ghost.getStance() === 'strike' ? 15 : ghost.getStance() === 'counter' ? 8 : 12,
      };

      setPlayer({
        id: 'player',
        name: 'ROOT_USER',
        health: trialModifier === '1hp_sudden_death' ? 1 : 100,
        maxHealth: trialModifier === '1hp_sudden_death' ? 1 : 100,
        shield: 0,
        superMeter: 0,
        stance: 'strike',
        activeWord: initialPlayerWord,
        typedText: '',
        cleanStreak: 0,
        isOverclocked: false,
        isDisrupted: false,
        disruptionRemainingMs: 0,
        stats: { ...INITIAL_STATS },
      });

      setOpponent({
        id: 'opponent',
        name: ghostProf.name,
        health: trialModifier === '1hp_sudden_death' ? 1 : 100,
        maxHealth: trialModifier === '1hp_sudden_death' ? 1 : 100,
        shield: 0,
        superMeter: 0,
        stance: ghostProf.preferredStance,
        activeWord: initialOpponentWord,
        typedText: '',
        cleanStreak: 0,
        isOverclocked: false,
        isDisrupted: false,
        disruptionRemainingMs: 0,
        stats: {
          ...INITIAL_STATS,
          wpm: ghostRun.wpm,
          accuracy: ghostRun.accuracy,
        },
      });

      setMatchStatus('in_progress');
    } else {
      const profileOrId = opponentParam as string | BotProfile;
      const bot = new BotSimulator(
        profileOrId,
        {
          onCharTyped: (_char, isCorrect, stance) => {
            if (matchStatus === 'finisher') {
              if (isCorrect) advanceFinisherProgress('opponent');
              return;
            }

            if (isCorrect) {
              applyCorrectKeystroke('opponent', stance, false);
            } else {
              applyMistypeRecoil('opponent');
              if (trialModifier === '1hp_sudden_death') {
                setOpponent(prev => {
                  if (prev.shield > 0) {
                    return { ...prev, shield: Math.max(0, prev.shield - 20) };
                  } else {
                    endMatch('player', 'sudden_death');
                    return { ...prev, health: 0 };
                  }
                });
              }
            }
          },
          onWordCompleted: word => {
            const pushMultiplier = trialModifier === 'code_syntax' ? 1.5 : 1.0;
            applyWordBurst('opponent', word.text.length, bot.getStance(), false, pushMultiplier);

            if (bot.getStance() === 'strike') {
              const dmg = word.damage;
              setPlayer(prev => {
                // Check player Counter Shield
                let remainingDmg = dmg;
                let currentShield = prev.shield;
                let currentHealth = prev.health;

                if (currentShield > 0) {
                  // Convert 50% damage absorbed to health
                  const absorb = Math.min(currentShield, dmg);
                  currentShield -= absorb;
                  remainingDmg -= absorb;
                  currentHealth = Math.min(prev.maxHealth, currentHealth + Math.round(absorb * 0.5));
                }

                const nextHealth = Math.max(0, currentHealth - remainingDmg);
                if (nextHealth === 0) {
                  endMatch('opponent', trialModifier === '1hp_sudden_death' ? 'sudden_death' : 'health_depleted_ko');
                }
                checkFinisherTrigger(nextHealth, opponent.health);
                return { ...prev, shield: currentShield, health: nextHealth };
              });
            } else if (bot.getStance() === 'disrupt') {
              // Disrupt player UI!
              setPlayer(prev => ({
                ...prev,
                isDisrupted: true,
                disruptionRemainingMs: 2500,
              }));
            }

            if (onWordExplode) {
              onWordExplode(word.text, window.innerWidth * 0.75, window.innerHeight * 0.45, '#FF3333');
            }
          },
          onStanceChanged: newStance => {
            setOpponent(prev => ({
              ...prev,
              stance: newStance,
              activeWord: bot.getActiveWord(),
            }));
          },
          onRecoilFatality: () => {
            endMatch('player', 'sudden_death');
          },
        },
        trialModifier
      );

      botRef.current = bot;
      bot.start();

      const initialOpponentWord = bot.getActiveWord();
      const botProf: BotProfile = bot.getProfile();

      setPlayer({
        id: 'player',
        name: 'ROOT_USER',
        health: trialModifier === '1hp_sudden_death' ? 1 : 100,
        maxHealth: trialModifier === '1hp_sudden_death' ? 1 : 100,
        shield: 0,
        superMeter: 0,
        stance: 'strike',
        activeWord: initialPlayerWord,
        typedText: '',
        cleanStreak: 0,
        isOverclocked: false,
        isDisrupted: false,
        disruptionRemainingMs: 0,
        stats: { ...INITIAL_STATS },
      });

      setOpponent({
        id: 'opponent',
        name: botProf.name,
        health: trialModifier === '1hp_sudden_death' ? 1 : 100,
        maxHealth: trialModifier === '1hp_sudden_death' ? 1 : 100,
        shield: 0,
        superMeter: 0,
        stance: botProf.preferredStance,
        activeWord: initialOpponentWord,
        typedText: '',
        cleanStreak: 0,
        isOverclocked: false,
        isDisrupted: false,
        disruptionRemainingMs: 0,
        stats: {
          ...INITIAL_STATS,
          wpm: botProf.wpm,
          accuracy: Math.round(botProf.accuracy * 100),
        },
      });

      setMatchStatus('in_progress');
    }
  }, [
    botProfileId,
    trialModifier,
    matchStatus,
    opponent.health,
    resetBeam,
    resetOverclock,
    resetFinisher,
    advanceFinisherProgress,
    applyCorrectKeystroke,
    applyMistypeRecoil,
    applyWordBurst,
    checkFinisherTrigger,
    endMatch,
    onWordExplode,
  ]);

  // Clean up bot and ghost on unmount
  useEffect(() => {
    return () => {
      if (botRef.current) {
        botRef.current.stop();
      }
      if (ghostRef.current) {
        ghostRef.current.stop();
      }
    };
  }, []);

  // Screen shake and disruption decay ticker
  useEffect(() => {
    const timer = setInterval(() => {
      decayScreenShake();

      // Disruption decay
      setPlayer(prev => {
        if (!prev.isDisrupted) return prev;
        const remaining = Math.max(0, prev.disruptionRemainingMs - 100);
        return { ...prev, disruptionRemainingMs: remaining, isDisrupted: remaining > 0 };
      });
      setOpponent(prev => {
        if (!prev.isDisrupted) return prev;
        const remaining = Math.max(0, prev.disruptionRemainingMs - 100);
        return { ...prev, disruptionRemainingMs: remaining, isDisrupted: remaining > 0 };
      });
    }, 100);

    return () => clearInterval(timer);
  }, [decayScreenShake]);

  return {
    matchStatus,
    player,
    opponent,
    beamState,
    isOverclocked,
    overclockStreak,
    damageMultiplier,
    ghostTrailIntensity,
    finisherState,
    matchResult,
    startMatch,
    setPlayerStance: (stance: StanceType) => {
      const nextWord = generateWord(stance, trialModifier);
      telemetryRef.current.setActiveWord(nextWord.text);
      setPlayer(prev => ({
        ...prev,
        stance,
        activeWord: nextWord,
      }));
    },
    handlePlayerKeystroke,
    handlePlayerMistype,
    handlePlayerWordComplete,
    telemetry: telemetryRef.current,
  };
}
