import { useState, useEffect, useRef, useCallback } from 'react';
import { UserCalibration } from './calibration.ts';
import { RivalDifficultyLevel, RIVAL_DIFFICULTIES } from './adaptiveRival.ts';
import { DuelResultData } from '../components/ModernResultModal.tsx';
import { soundEngine } from '../audio/soundEngine.ts';

const DUEL_WORD_POOL = [
  'system', 'action', 'vector', 'signal', 'matrix', 'stream', 'syntax',
  'engine', 'kernel', 'charge', 'impact', 'glitch', 'target', 'socket',
  'buffer', 'memory', 'render', 'thread', 'quantum', 'cipher', 'neural',
  'packet', 'device', 'switch', 'module', 'portal', 'sensor', 'beacon',
  'binary', 'static', 'dynamic', 'future', 'hybrid', 'vertex', 'canvas',
  'layout', 'screen', 'window', 'player', 'combat', 'zenith', 'pulse',
  'rhythm', 'active', 'legend', 'shadow', 'strike', 'falcon', 'velocity'
];

const TARGET_WORDS_COUNT = 20;

function generateWordList(count: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * DUEL_WORD_POOL.length);
    words.push(DUEL_WORD_POOL[randomIndex]);
  }
  return words;
}

interface UseSimpleDuelOptions {
  calibration: UserCalibration | null;
  difficulty: RivalDifficultyLevel;
  enabled?: boolean;
}

export function useSimpleDuel({
  calibration,
  difficulty,
  enabled = true,
}: UseSimpleDuelOptions) {
  const [wordsList, setWordsList] = useState<string[]>(() => generateWordList(TARGET_WORDS_COUNT));
  const [playerWordIndex, setPlayerWordIndex] = useState<number>(0);
  const [typedIndex, setTypedIndex] = useState<number>(0);

  // Player metrics
  const [cleanStreak, setCleanStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState<number>(0);
  const [mistakes, setMistakes] = useState<number>(0);
  const [currentWpm, setCurrentWpm] = useState<number>(0);

  // Rival AI state
  const [rivalWordIndex, setRivalWordIndex] = useState<number>(0);
  const [rivalCharIndex, setRivalCharIndex] = useState<number>(0);

  // Match state
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [duelResult, setDuelResult] = useState<DuelResultData | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const rivalTimerRef = useRef<number | null>(null);

  const diffConfig = RIVAL_DIFFICULTIES[difficulty] || RIVAL_DIFFICULTIES.equal;
  const basePlayerWpm = calibration?.netWpm || 65;
  const rivalTargetWpm = Math.max(25, Math.round(basePlayerWpm * diffConfig.multiplier));
  const rivalName = `RIVAL // ${diffConfig.label}`;

  const currentWordText = wordsList[playerWordIndex] || '';
  const upcomingWords = wordsList.slice(playerWordIndex + 1, playerWordIndex + 6);
  const rivalActiveWordText = wordsList[rivalWordIndex] || '';

  // WPM calculation ticker
  useEffect(() => {
    if (!enabled || isFinished || !startTimeRef.current) return;

    const interval = setInterval(() => {
      const elapsedMinutes = (Date.now() - startTimeRef.current!) / 60000;
      if (elapsedMinutes > 0.01) {
        const liveWpm = Math.round((correctKeystrokes / 5) / elapsedMinutes);
        setCurrentWpm(liveWpm);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [enabled, isFinished, correctKeystrokes]);

  // Finish Match handler
  const endDuel = useCallback(
    (winner: 'player' | 'rival') => {
      if (isFinished) return;
      setIsFinished(true);

      if (rivalTimerRef.current !== null) {
        clearTimeout(rivalTimerRef.current);
        rivalTimerRef.current = null;
      }

      const elapsedSec = startTimeRef.current
        ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
        : 1;

      const accuracy = totalKeystrokes > 0
        ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
        : 100;

      const result: DuelResultData = {
        winner,
        playerWpm: currentWpm || basePlayerWpm,
        playerAccuracy: accuracy,
        playerMistakes: mistakes,
        rivalWpm: rivalTargetWpm,
        rivalName,
        difficulty,
        durationSeconds: elapsedSec,
        streak: bestStreak,
      };

      setDuelResult(result);
      if (winner === 'player') {
        soundEngine.playKeystroke(25, true);
      } else {
        soundEngine.playMistype();
      }
    },
    [
      isFinished,
      totalKeystrokes,
      correctKeystrokes,
      currentWpm,
      basePlayerWpm,
      mistakes,
      rivalTargetWpm,
      rivalName,
      difficulty,
      bestStreak,
    ]
  );

  // Rival AI typing loop
  useEffect(() => {
    if (!enabled || isFinished) return;

    const scheduleNextRivalChar = () => {
      if (isFinished) return;

      // Characters per second = (WPM * 5) / 60
      const charsPerSec = (rivalTargetWpm * 5) / 60;
      const baseDelayMs = 1000 / charsPerSec;
      // Add natural +/- 20% jitter
      const jitter = (Math.random() - 0.5) * (baseDelayMs * 0.4);
      const delay = Math.max(40, baseDelayMs + jitter);

      rivalTimerRef.current = window.setTimeout(() => {
        setRivalCharIndex((prevChar) => {
          const currentRivalWord = wordsList[rivalWordIndex];
          if (!currentRivalWord) return 0;

          const nextChar = prevChar + 1;
          if (nextChar >= currentRivalWord.length) {
            // Completed word
            setRivalWordIndex((prevWord) => {
              const nextWord = prevWord + 1;
              if (nextWord >= TARGET_WORDS_COUNT) {
                endDuel('rival');
              }
              return nextWord;
            });
            return 0;
          }
          return nextChar;
        });

        if (!isFinished && rivalWordIndex < TARGET_WORDS_COUNT) {
          scheduleNextRivalChar();
        }
      }, delay);
    };

    scheduleNextRivalChar();

    return () => {
      if (rivalTimerRef.current !== null) {
        clearTimeout(rivalTimerRef.current);
      }
    };
  }, [enabled, isFinished, rivalWordIndex, rivalTargetWpm, wordsList, endDuel]);

  // Player keystroke listener
  useEffect(() => {
    if (!enabled || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Tab' || e.key === 'Escape') return;

      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      if (e.key.length !== 1) return;
      e.preventDefault();

      const targetChar = currentWordText[typedIndex];
      const isCorrect = e.key === targetChar;

      setTotalKeystrokes((prev) => prev + 1);

      if (isCorrect) {
        soundEngine.playKeystroke(cleanStreak + 1, false);
        setCorrectKeystrokes((prev) => prev + 1);
        const nextStreak = cleanStreak + 1;
        setCleanStreak(nextStreak);
        setBestStreak((prev) => Math.max(prev, nextStreak));

        const nextTyped = typedIndex + 1;
        if (nextTyped >= currentWordText.length) {
          // Word completed!
          soundEngine.playKeystroke(10, true);
          setPlayerWordIndex((prevWord) => {
            const nextWord = prevWord + 1;
            if (nextWord >= TARGET_WORDS_COUNT) {
              endDuel('player');
            }
            return nextWord;
          });
          setTypedIndex(0);
        } else {
          setTypedIndex(nextTyped);
        }
      } else {
        soundEngine.playMistype();
        setMistakes((prev) => prev + 1);
        setCleanStreak(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    isFinished,
    currentWordText,
    typedIndex,
    cleanStreak,
    endDuel,
  ]);

  // Reset match
  const resetDuel = useCallback(() => {
    setWordsList(generateWordList(TARGET_WORDS_COUNT));
    setPlayerWordIndex(0);
    setTypedIndex(0);
    setCleanStreak(0);
    setBestStreak(0);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setMistakes(0);
    setCurrentWpm(0);

    setRivalWordIndex(0);
    setRivalCharIndex(0);

    setIsFinished(false);
    setDuelResult(null);
    startTimeRef.current = null;

    if (rivalTimerRef.current !== null) {
      clearTimeout(rivalTimerRef.current);
      rivalTimerRef.current = null;
    }
  }, []);

  const accuracy = totalKeystrokes > 0
    ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
    : 100;

  return {
    currentWordText,
    typedIndex,
    upcomingWords,
    difficulty,
    duelResult,
    playerStats: {
      wpm: currentWpm || basePlayerWpm,
      accuracy,
      streak: cleanStreak,
      completedCount: playerWordIndex,
      totalTargetWords: TARGET_WORDS_COUNT,
    },
    rivalStats: {
      name: rivalName,
      targetWpm: rivalTargetWpm,
      completedCount: rivalWordIndex,
      activeWordText: rivalActiveWordText,
      charIndex: rivalCharIndex,
      totalTargetWords: TARGET_WORDS_COUNT,
    },
    resetDuel,
  };
}
