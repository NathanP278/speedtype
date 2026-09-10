import { useState, useCallback, useRef } from 'react';
import { FinisherState } from '../types/combat.ts';
import { generateBossWord } from './dictionary.ts';

interface UseFinisherDuelOptions {
  onFinisherAttackerKo?: (attackerId: 'player' | 'opponent') => void;
  onFinisherDefenderClutch?: (defenderId: 'player' | 'opponent') => void;
}

export function useFinisherDuel({
  onFinisherAttackerKo,
  onFinisherDefenderClutch,
}: UseFinisherDuelOptions = {}) {
  const [finisherState, setFinisherState] = useState<FinisherState>({
    active: false,
    attackerId: null,
    defenderId: null,
    bossWord: '',
    playerProgress: 0,
    opponentProgress: 0,
    timeRemainingMs: 15000,
    completed: false,
    winnerId: null,
  });

  const stateRef = useRef<FinisherState>(finisherState);
  stateRef.current = finisherState;

  const triggerFinisher = useCallback(
    (attackerId: 'player' | 'opponent', defenderId: 'player' | 'opponent') => {
      const bossWord = generateBossWord();
      const newState: FinisherState = {
        active: true,
        attackerId,
        defenderId,
        bossWord,
        playerProgress: 0,
        opponentProgress: 0,
        timeRemainingMs: 15000,
        completed: false,
        winnerId: null,
      };
      setFinisherState(newState);
    },
    []
  );

  const advanceProgress = useCallback(
    (source: 'player' | 'opponent') => {
      const curr = stateRef.current;
      if (!curr.active || curr.completed) return;

      const currentProgress = source === 'player' ? curr.playerProgress : curr.opponentProgress;
      const nextProgress = currentProgress + 1;

      if (nextProgress >= curr.bossWord.length) {
        // Finisher completed!
        const isAttackerWin = source === curr.attackerId;
        const resolvedState: FinisherState = {
          ...curr,
          playerProgress: source === 'player' ? nextProgress : curr.playerProgress,
          opponentProgress: source === 'opponent' ? nextProgress : curr.opponentProgress,
          completed: true,
          winnerId: source,
        };
        setFinisherState(resolvedState);

        if (isAttackerWin) {
          if (onFinisherAttackerKo) onFinisherAttackerKo(source);
        } else {
          if (onFinisherDefenderClutch) onFinisherDefenderClutch(source);
        }
      } else {
        setFinisherState(prev => ({
          ...prev,
          playerProgress: source === 'player' ? nextProgress : prev.playerProgress,
          opponentProgress: source === 'opponent' ? nextProgress : prev.opponentProgress,
        }));
      }
    },
    [onFinisherAttackerKo, onFinisherDefenderClutch]
  );

  const resetFinisher = useCallback(() => {
    setFinisherState({
      active: false,
      attackerId: null,
      defenderId: null,
      bossWord: '',
      playerProgress: 0,
      opponentProgress: 0,
      timeRemainingMs: 15000,
      completed: false,
      winnerId: null,
    });
  }, []);

  return {
    finisherState,
    triggerFinisher,
    advanceProgress,
    resetFinisher,
  };
}
