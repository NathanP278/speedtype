import { useState, useCallback } from 'react';

interface UseOverclockOptions {
  streakThreshold?: number;
  onOverclockActivate?: () => void;
  onOverclockDeactivate?: () => void;
}

export function useOverclock({
  streakThreshold = 30,
  onOverclockActivate,
  onOverclockDeactivate,
}: UseOverclockOptions = {}) {
  const [isOverclocked, setIsOverclocked] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [totalOverclocks, setTotalOverclocks] = useState<number>(0);

  const handleCorrectChar = useCallback(
    (currentStreak: number) => {
      setStreak(currentStreak);
      if (currentStreak >= streakThreshold && !isOverclocked) {
        setIsOverclocked(true);
        setTotalOverclocks(prev => prev + 1);
        if (onOverclockActivate) onOverclockActivate();
      }
    },
    [streakThreshold, isOverclocked, onOverclockActivate]
  );

  const handleTypo = useCallback(() => {
    setStreak(0);
    if (isOverclocked) {
      setIsOverclocked(false);
      if (onOverclockDeactivate) onOverclockDeactivate();
    }
  }, [isOverclocked, onOverclockDeactivate]);

  const resetOverclock = useCallback(() => {
    setIsOverclocked(false);
    setStreak(0);
  }, []);

  return {
    isOverclocked,
    streak,
    streakThreshold,
    totalOverclocks,
    damageMultiplier: isOverclocked ? 2.0 : 1.0,
    ghostTrailIntensity: isOverclocked ? 1.0 : Math.min(streak / streakThreshold, 0.4),
    handleCorrectChar,
    handleTypo,
    resetOverclock,
  };
}
