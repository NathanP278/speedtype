import { useState, useEffect, useRef, useCallback } from 'react';
import { UserCalibration, calculateReadingAdjustedWpm } from './calibration.ts';
import { RivalDifficultyLevel, RIVAL_DIFFICULTIES, drawRivalWpm } from './adaptiveRival.ts';
import { DuelResultData } from '../components/ModernResultModal.tsx';
import { soundEngine } from '../audio/soundEngine.ts';
import {
  CompactGhostEvent,
  GhostRunData,
  saveLastRun,
  savePersonalBest,
  getPersonalBest,
} from '../social/ghostRecorder.ts';

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
  const [rawCurrentWpm, setRawCurrentWpm] = useState<number>(0);

  // Rival AI state — WPM drawn fresh per match
  const [rivalTargetWpm, setRivalTargetWpm] = useState<number>(() =>
    drawRivalWpm(calibration, difficulty)
  );
  const [customRivalName, setCustomRivalName] = useState<string | null>(null);
  const [rivalWordIndex, setRivalWordIndex] = useState<number>(0);
  const [rivalCharIndex, setRivalCharIndex] = useState<number>(0);
  // Gate: rival does NOT move until player types first key
  const [rivalStarted, setRivalStarted] = useState<boolean>(false);

  // Match state
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [duelResult, setDuelResult] = useState<DuelResultData | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const rivalTimerRef = useRef<number | null>(null);
  const eventsRef = useRef<CompactGhostEvent[]>([]);

  const diffConfig = RIVAL_DIFFICULTIES[difficulty] || RIVAL_DIFFICULTIES.equal;
  const basePlayerWpm = calibration?.netWpm || 65;
  const rivalName = customRivalName || `RIVAL // ${diffConfig.label}`;

  const currentWordText = wordsList[playerWordIndex] || '';
  const upcomingWords = wordsList.slice(playerWordIndex + 1, playerWordIndex + 6);
  const rivalActiveWordText = wordsList[rivalWordIndex] || '';

  // WPM calculation ticker — gates on startTimeRef (set on first keypress)
  useEffect(() => {
    if (!enabled || isFinished || !startTimeRef.current) return;

    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - startTimeRef.current!) / 1000;
      const elapsedMinutes = elapsedSec / 60;
      if (elapsedMinutes > 0.01) {
        const rawWpm = Math.round((correctKeystrokes / 5) / elapsedMinutes);
        // Reading-adjusted: subtracts 50ms per completed word, blended 70/30 with raw
        const adjusted = calculateReadingAdjustedWpm(playerWordIndex, elapsedSec);
        const blended = Math.round(adjusted * 0.7 + rawWpm * 0.3);
        setCurrentWpm(blended);
        setRawCurrentWpm(rawWpm);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [enabled, isFinished, correctKeystrokes, playerWordIndex]);

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

      const finalPlayerWpm = currentWpm || basePlayerWpm;

      const result: DuelResultData = {
        winner,
        playerWpm: finalPlayerWpm,
        playerAccuracy: accuracy,
        playerMistakes: mistakes,
        rivalWpm: rivalTargetWpm,
        rivalName,
        difficulty,
        durationSeconds: elapsedSec,
        streak: bestStreak,
      };

      setDuelResult(result);

      // Save ghost run data for challenge generation & personal best
      const ghost: GhostRunData = {
        id: `ghost_${Date.now()}`,
        playerName: 'YOU',
        timestamp: Date.now(),
        durationMs: elapsedSec * 1000,
        wpm: finalPlayerWpm,
        accuracy,
        events: eventsRef.current,
      };
      saveLastRun(ghost);
      const pb = getPersonalBest();
      if (!pb || finalPlayerWpm > pb.wpm) {
        savePersonalBest(ghost);
      }

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

  // Rival AI typing loop — only starts when rivalStarted becomes true
  useEffect(() => {
    if (!enabled || isFinished || !rivalStarted) return;

    const targetWordsCount = wordsList.length;

    const scheduleNextRivalChar = () => {
      if (isFinished) return;

      // Characters per second = (WPM * 5) / 60
      const charsPerSec = (rivalTargetWpm * 5) / 60;
      const baseDelayMs = 1000 / charsPerSec;
      // Add natural +/- 20% jitter for human feel
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
              if (nextWord >= targetWordsCount) {
                endDuel('rival');
              }
              return nextWord;
            });
            return 0;
          }
          return nextChar;
        });

        if (!isFinished && rivalWordIndex < targetWordsCount) {
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
  }, [enabled, isFinished, rivalStarted, rivalWordIndex, rivalTargetWpm, wordsList, endDuel]);

  // Player keystroke listener
  useEffect(() => {
    if (!enabled || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === 'Tab' || e.key === 'Escape') return;
      if (e.key.length !== 1) return;

      e.preventDefault();

      // First valid keypress: start both player timer AND rival
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        setRivalStarted(true);
        eventsRef.current = [];
      }

      const targetChar = currentWordText[typedIndex];
      const isCorrect = e.key === targetChar;
      const targetWordsCount = wordsList.length;

      setTotalKeystrokes((prev) => prev + 1);

      let wordCompleted = false;

      if (isCorrect) {
        soundEngine.playKeystroke(cleanStreak + 1, false);
        setCorrectKeystrokes((prev) => prev + 1);
        const nextStreak = cleanStreak + 1;
        setCleanStreak(nextStreak);
        setBestStreak((prev) => Math.max(prev, nextStreak));

        const nextTyped = typedIndex + 1;
        if (nextTyped >= currentWordText.length) {
          // Word completed!
          wordCompleted = true;
          soundEngine.playKeystroke(10, true);
          setPlayerWordIndex((prevWord) => {
            const nextWord = prevWord + 1;
            if (nextWord >= targetWordsCount) {
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

      // Record compact event for ghost replay & challenge generation
      const delta = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      eventsRef.current.push({
        t: delta,
        c: e.key,
        ok: isCorrect,
        s: 'strike',
        w: wordCompleted ? currentWordText : undefined,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    isFinished,
    currentWordText,
    typedIndex,
    cleanStreak,
    wordsList,
    endDuel,
  ]);

  // Reset match — draw fresh rival WPM, reset rivalStarted gate
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
    setRawCurrentWpm(0);

    setRivalWordIndex(0);
    setRivalCharIndex(0);
    setRivalStarted(false);
    setCustomRivalName(null);

    // Draw fresh WPM for the new match
    setRivalTargetWpm(drawRivalWpm(calibration, difficulty));

    setIsFinished(false);
    setDuelResult(null);
    startTimeRef.current = null;
    eventsRef.current = [];

    if (rivalTimerRef.current !== null) {
      clearTimeout(rivalTimerRef.current);
      rivalTimerRef.current = null;
    }
  }, [calibration, difficulty]);

  // Start custom challenge match
  const startCustomMatch = useCallback(
    (words: string[], targetWpm: number, opponentName?: string) => {
      setWordsList(words);
      setPlayerWordIndex(0);
      setTypedIndex(0);
      setCleanStreak(0);
      setBestStreak(0);
      setTotalKeystrokes(0);
      setCorrectKeystrokes(0);
      setMistakes(0);
      setCurrentWpm(0);
      setRawCurrentWpm(0);

      setRivalWordIndex(0);
      setRivalCharIndex(0);
      setRivalStarted(false);

      setRivalTargetWpm(targetWpm);
      if (opponentName) {
        setCustomRivalName(opponentName);
      }

      setIsFinished(false);
      setDuelResult(null);
      startTimeRef.current = null;
      eventsRef.current = [];

      if (rivalTimerRef.current !== null) {
        clearTimeout(rivalTimerRef.current);
        rivalTimerRef.current = null;
      }
    },
    []
  );

  const accuracy = totalKeystrokes > 0
    ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
    : 100;

  return {
    currentWordText,
    typedIndex,
    upcomingWords,
    difficulty,
    duelResult,
    gameStarted: rivalStarted,
    playerStats: {
      wpm: currentWpm || basePlayerWpm,
      rawWpm: rawCurrentWpm,
      accuracy,
      streak: cleanStreak,
      completedCount: playerWordIndex,
      totalTargetWords: wordsList.length,
    },
    rivalStats: {
      name: rivalName,
      targetWpm: rivalTargetWpm,
      completedCount: rivalWordIndex,
      activeWordText: rivalActiveWordText,
      charIndex: rivalCharIndex,
      totalTargetWords: wordsList.length,
    },
    resetDuel,
    startCustomMatch,
  };
}
