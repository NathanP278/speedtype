import { useState, useEffect, useCallback } from 'react';
import { StanceType } from '../types/combat.ts';

const STANCES: StanceType[] = ['strike', 'counter', 'disrupt'];

interface UseStanceManagerOptions {
  initialStance?: StanceType;
  onStanceChange?: (newStance: StanceType) => void;
  enabled?: boolean;
}

export function useStanceManager({
  initialStance = 'strike',
  onStanceChange,
  enabled = true,
}: UseStanceManagerOptions = {}) {
  const [stance, setStanceState] = useState<StanceType>(initialStance);

  const setStance = useCallback(
    (newStance: StanceType) => {
      if (newStance === stance) return;
      setStanceState(newStance);
      if (onStanceChange) {
        onStanceChange(newStance);
      }
    },
    [stance, onStanceChange]
  );

  const cycleStance = useCallback(() => {
    const currentIndex = STANCES.indexOf(stance);
    const nextIndex = (currentIndex + 1) % STANCES.length;
    setStance(STANCES[nextIndex]);
  }, [stance, setStance]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if modifier keys like Ctrl or Alt are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        cycleStance();
      } else if (e.key === '1') {
        e.preventDefault();
        setStance('strike');
      } else if (e.key === '2') {
        e.preventDefault();
        setStance('counter');
      } else if (e.key === '3') {
        e.preventDefault();
        setStance('disrupt');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, cycleStance, setStance]);

  return {
    stance,
    setStance,
    cycleStance,
  };
}
