import { useState, useEffect, useRef, useCallback } from 'react';
import { WordTarget, CombatStats, KeystrokeLog, StanceType } from '../types/combat.ts';

interface UseTypingEngineOptions {
  activeWord: WordTarget | null;
  activeStance: StanceType;
  enabled?: boolean;
  isDisrupted?: boolean;
  isBlind?: boolean;
  onCorrectChar?: (char: string, currentStreak: number, currentWpm: number) => void;
  onMistype?: (key: string, expectedChar: string) => void;
  onWordComplete?: (word: WordTarget, stats: CombatStats) => void;
}

export function useTypingEngine({
  activeWord,
  activeStance,
  enabled = true,
  isDisrupted = false,
  isBlind = false,
  onCorrectChar,
  onMistype,
  onWordComplete,
}: UseTypingEngineOptions) {
  const [typedIndex, setTypedIndex] = useState<number>(0);
  const [cleanStreak, setCleanStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [totalMistakes, setTotalMistakes] = useState<number>(0);
  const [wordsCompleted, setWordsCompleted] = useState<number>(0);
  const [peakWpm, setPeakWpm] = useState<number>(0);
  const [currentWpm, setCurrentWpm] = useState<number>(0);

  const startTimeRef = useRef<number | null>(null);
  const correctCharsCountRef = useRef<number>(0);
  const lockoutUntilRef = useRef<number>(0);
  const keystrokeHistoryRef = useRef<KeystrokeLog[]>([]);

  // Reset typed index when active word changes
  useEffect(() => {
    setTypedIndex(0);
  }, [activeWord?.id]);

  // Real-time WPM ticker
  useEffect(() => {
    if (!enabled || !startTimeRef.current) return;

    const interval = setInterval(() => {
      const now = performance.now();
      const elapsedMinutes = (now - startTimeRef.current!) / 60000;
      if (elapsedMinutes > 0.02) {
        const calculatedWpm = Math.round((correctCharsCountRef.current / 5) / elapsedMinutes);
        setCurrentWpm(calculatedWpm);
        setPeakWpm(prev => Math.max(prev, calculatedWpm));
      }
    }, 200);

    return () => clearInterval(interval);
  }, [enabled]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !activeWord) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'Tab' || e.key === 'Escape') return;

    const now = performance.now();
    if (now < lockoutUntilRef.current) {
      e.preventDefault();
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = now;
    }

    // Only process single-character printable inputs
    if (e.key.length !== 1) return;
    e.preventDefault();

    const expectedChar = activeWord.text[typedIndex];
    const isCorrect = e.key === expectedChar;

    setTotalKeystrokes(prev => prev + 1);

    const logEntry: KeystrokeLog = {
      timestamp: now,
      char: e.key,
      expectedChar,
      correct: isCorrect,
      stance: activeStance,
      wpm: currentWpm,
    };
    keystrokeHistoryRef.current.push(logEntry);

    if (isCorrect) {
      correctCharsCountRef.current += 1;
      const nextIndex = typedIndex + 1;
      const nextStreak = cleanStreak + 1;

      setTypedIndex(nextIndex);
      setCleanStreak(nextStreak);
      setLongestStreak(prev => Math.max(prev, nextStreak));

      if (onCorrectChar) {
        onCorrectChar(e.key, nextStreak, currentWpm);
      }

      // Check for word completion
      if (nextIndex >= activeWord.text.length) {
        setWordsCompleted(prev => prev + 1);
        setTypedIndex(0);

        if (onWordComplete) {
          const stats: CombatStats = {
            wpm: currentWpm,
            peakWpm,
            accuracy: totalKeystrokes > 0
              ? Math.round(((totalKeystrokes - totalMistakes) / (totalKeystrokes + 1)) * 100)
              : 100,
            totalKeystrokes: totalKeystrokes + 1,
            totalMistakes,
            longestStreak: Math.max(longestStreak, nextStreak),
            wordsCompleted: wordsCompleted + 1,
            parriesCount: 0,
            overclockCount: 0,
          };
          onWordComplete(activeWord, stats);
        }
      }
    } else {
      // Mistype penalty: 120ms lockout + streak reset
      lockoutUntilRef.current = now + 120;
      setTotalMistakes(prev => prev + 1);
      setCleanStreak(0);

      if (onMistype) {
        onMistype(e.key, expectedChar);
      }
    }
  }, [
    enabled,
    activeWord,
    typedIndex,
    cleanStreak,
    longestStreak,
    totalKeystrokes,
    totalMistakes,
    wordsCompleted,
    currentWpm,
    peakWpm,
    activeStance,
    onCorrectChar,
    onMistype,
    onWordComplete,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const accuracy = totalKeystrokes > 0
    ? Math.max(0, Math.round(((totalKeystrokes - totalMistakes) / totalKeystrokes) * 100))
    : 100;

  const resetTypingEngine = useCallback(() => {
    setTypedIndex(0);
    setCleanStreak(0);
    setLongestStreak(0);
    setTotalKeystrokes(0);
    setTotalMistakes(0);
    setWordsCompleted(0);
    setCurrentWpm(0);
    setPeakWpm(0);
    startTimeRef.current = null;
    correctCharsCountRef.current = 0;
    lockoutUntilRef.current = 0;
    keystrokeHistoryRef.current = [];
  }, []);

  return {
    typedIndex,
    cleanStreak,
    longestStreak,
    totalKeystrokes,
    totalMistakes,
    wordsCompleted,
    currentWpm,
    peakWpm,
    accuracy,
    isDisrupted,
    isBlind,
    keystrokeHistory: keystrokeHistoryRef.current,
    resetTypingEngine,
  };
}
