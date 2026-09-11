import { useState, useRef, useCallback, useEffect } from 'react';
import { useEconomy } from '../economy/useEconomy.ts';
import { loadDossier, recordMatchInDossier, DossierData } from '../social/rivalryDossier.ts';
import {
  GhostRunData,
  GhostRecorder,
  savePersonalBest,
  getPersonalBest,
  saveLastRun,
  getLastRun,
} from '../social/ghostRecorder.ts';
import { WeeklyTrial } from '../trials/weeklyTrials.ts';
import { MatchResult, StanceType } from '../types/combat.ts';
import { AsciiDebrisCanvasHandle } from '../canvas/AsciiDebrisCanvas.tsx';
import { TypingTrailsHandle } from '../canvas/TypingTrailsCanvas.tsx';

interface CanvasRefs {
  debrisCanvasRef: React.RefObject<AsciiDebrisCanvasHandle | null>;
  trailsCanvasRef: React.RefObject<TypingTrailsHandle | null>;
}

export function useMatchSession(
  economy: ReturnType<typeof useEconomy>,
  canvasRefs: CanvasRefs
) {
  // Ghost Recorder & Persistence
  const ghostRecorderRef = useRef<GhostRecorder>(new GhostRecorder());
  const [lastPlayerGhost, setLastPlayerGhost] = useState<GhostRunData | null>(() => getLastRun());
  const [personalBestGhost, setPersonalBestGhost] = useState<GhostRunData | null>(() => getPersonalBest());
  
  // Opponent Tracking
  const lastOpponentRef = useRef<string | GhostRunData>('shinobi');
  const opponentNameRef = useRef<string>('Shinobi-X');

  // Dossier State
  const [dossier, setDossier] = useState<DossierData>(() => loadDossier());

  // Active Weekly Trial Modifier
  const [activeTrial, setActiveTrial] = useState<WeeklyTrial | null>(null);
  
  // Blind Duel State
  const [isWordFlashing, setIsWordFlashing] = useState<boolean>(false);
  const [revealedWord, setRevealedWord] = useState<string | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) clearTimeout(flashTimerRef.current);
      if (revealTimerRef.current !== null) clearTimeout(revealTimerRef.current);
    };
  }, []);

  const onMatchEnd = useCallback((result: MatchResult) => {
    // Record ghost run
    const ghost = ghostRecorderRef.current.stop(
      'ROOT_USER',
      result.playerStats.wpm,
      result.playerStats.accuracy
    );
    if (ghost) {
      setLastPlayerGhost(ghost);
      saveLastRun(ghost);
      const currentPb = getPersonalBest();
      if (!currentPb || ghost.wpm > currentPb.wpm) {
        setPersonalBestGhost(ghost);
        savePersonalBest(ghost);
      }
    }

    // Award KP
    let totalKp = result.kpEarned;
    if (activeTrial && result.winner === 'player') {
      totalKp += activeTrial.kpBounty;
    }
    economy.awardKp(totalKp);

    // Update Dossier telemetry
    setDossier(prev =>
      recordMatchInDossier(
        prev,
        opponentNameRef.current,
        result.winner === 'player',
        result.playerStats.wpm,
        totalKp,
        result.failedWords || [],
        result.fatalWord
      )
    );
  }, [activeTrial, economy]);

  const onCorrectChar = useCallback((char: string, stance: StanceType) => {
    ghostRecorderRef.current.recordKeystroke(char, true, stance);

    // Trigger Typing Trails Canvas
    if (canvasRefs.trailsCanvasRef.current) {
      canvasRefs.trailsCanvasRef.current.addKeystroke(
        window.innerWidth * 0.32,
        window.innerHeight * 0.58,
        char
      );
    }
  }, [canvasRefs]);

  const onMistype = useCallback((key: string, stance: StanceType) => {
    ghostRecorderRef.current.recordKeystroke(key, false, stance);
  }, []);

  const onWordComplete = useCallback((wordText: string) => {
    ghostRecorderRef.current.recordWordComplete(wordText);

    if (activeTrial?.id === 'blind_duel') {
      setRevealedWord(wordText);
      if (revealTimerRef.current !== null) {
        clearTimeout(revealTimerRef.current);
      }
      revealTimerRef.current = window.setTimeout(() => {
        setRevealedWord(null);
        revealTimerRef.current = null;
      }, 700);
    }
  }, [activeTrial]);

  // Hook to handle blind duel flashing when combat player's active word changes
  const triggerWordFlash = useCallback(() => {
    if (activeTrial?.id === 'blind_duel') {
      setIsWordFlashing(true);
      if (flashTimerRef.current !== null) {
        clearTimeout(flashTimerRef.current);
      }
      flashTimerRef.current = window.setTimeout(() => {
        setIsWordFlashing(false);
        flashTimerRef.current = null;
      }, 500);
    } else {
      setIsWordFlashing(false);
    }
  }, [activeTrial]);

  const startGhostRecording = useCallback(() => {
    ghostRecorderRef.current.start();
  }, []);

  return {
    activeTrial,
    setActiveTrial,
    isWordFlashing,
    revealedWord,
    lastOpponentRef,
    opponentNameRef,
    onMatchEnd,
    onCorrectChar,
    onMistype,
    onWordComplete,
    dossier,
    lastPlayerGhost,
    personalBestGhost,
    triggerWordFlash,
    startGhostRecording
  };
}
