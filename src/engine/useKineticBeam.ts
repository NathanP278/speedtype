import { useState, useCallback, useRef } from 'react';
import { StanceType, BeamState } from '../types/combat.ts';
import { triggerHapticFeedback, HAPTIC_PATTERNS } from '../utils/haptics.ts';

interface UseKineticBeamOptions {
  onBaselineKnockout?: (winner: 'player' | 'opponent') => void;
}

export function useKineticBeam({ onBaselineKnockout }: UseKineticBeamOptions = {}) {
  const [beamState, setBeamState] = useState<BeamState>({
    position: 0,
    velocity: 0,
    tension: 0,
    dominantStance: 'strike',
    lastImpactTime: Date.now(),
    screenShake: 0,
  });

  const positionRef = useRef<number>(0);
  const knockoutTriggeredRef = useRef<boolean>(false);

  const checkKnockout = useCallback(
    (newPos: number) => {
      if (knockoutTriggeredRef.current) return;

      if (newPos >= 100) {
        knockoutTriggeredRef.current = true;
        triggerHapticFeedback(HAPTIC_PATTERNS.BASELINE_IMPACT);
        if (onBaselineKnockout) onBaselineKnockout('player');
      } else if (newPos <= -100) {
        knockoutTriggeredRef.current = true;
        triggerHapticFeedback(HAPTIC_PATTERNS.BASELINE_IMPACT);
        if (onBaselineKnockout) onBaselineKnockout('opponent');
      }
    },
    [onBaselineKnockout]
  );

  const applyCorrectKeystroke = useCallback(
    (source: 'player' | 'opponent', stance: StanceType, isOverclocked: boolean) => {
      let pushAmount = 2.5;
      if (stance === 'strike') pushAmount *= 2.0;
      if (isOverclocked) pushAmount *= 2.0;

      const delta = source === 'player' ? pushAmount : -pushAmount;
      const rawPos = positionRef.current + delta;
      const clampedPos = Math.max(-100, Math.min(100, rawPos));
      positionRef.current = clampedPos;

      setBeamState(prev => ({
        ...prev,
        position: clampedPos,
        velocity: delta,
        dominantStance: stance,
        lastImpactTime: Date.now(),
        screenShake: Math.min(prev.screenShake + (isOverclocked ? 2 : 0.5), 8),
      }));

      checkKnockout(clampedPos);
    },
    [checkKnockout]
  );

  const applyWordBurst = useCallback(
    (source: 'player' | 'opponent', wordLength: number, stance: StanceType, isOverclocked: boolean, pushMultiplier: number = 1.0) => {
      let burstAmount = (8.0 + wordLength * 1.5) * pushMultiplier;
      if (stance === 'strike') burstAmount *= 1.8;
      if (isOverclocked) burstAmount *= 2.0;

      const delta = source === 'player' ? burstAmount : -burstAmount;
      const rawPos = positionRef.current + delta;
      const clampedPos = Math.max(-100, Math.min(100, rawPos));
      positionRef.current = clampedPos;

      setBeamState(prev => ({
        ...prev,
        position: clampedPos,
        velocity: delta * 1.5,
        dominantStance: stance,
        lastImpactTime: Date.now(),
        screenShake: isOverclocked ? 15 : 8,
      }));

      checkKnockout(clampedPos);
    },
    [checkKnockout]
  );

  const applyMistypeRecoil = useCallback(
    (source: 'player' | 'opponent') => {
      const recoilAmount = 4.0;
      // Mistype pushes beam toward the mistyping player's own baseline
      const delta = source === 'player' ? -recoilAmount : recoilAmount;
      const rawPos = positionRef.current + delta;
      const clampedPos = Math.max(-100, Math.min(100, rawPos));
      positionRef.current = clampedPos;

      setBeamState(prev => ({
        ...prev,
        position: clampedPos,
        velocity: delta,
        lastImpactTime: Date.now(),
        screenShake: 4,
      }));

      checkKnockout(clampedPos);
    },
    [checkKnockout]
  );

  const decayScreenShake = useCallback(() => {
    setBeamState(prev => ({
      ...prev,
      screenShake: Math.max(0, prev.screenShake * 0.85),
    }));
  }, []);

  const resetBeam = useCallback(() => {
    positionRef.current = 0;
    knockoutTriggeredRef.current = false;
    setBeamState({
      position: 0,
      velocity: 0,
      tension: 0,
      dominantStance: 'strike',
      lastImpactTime: Date.now(),
      screenShake: 0,
    });
  }, []);

  return {
    beamState,
    applyCorrectKeystroke,
    applyWordBurst,
    applyMistypeRecoil,
    decayScreenShake,
    resetBeam,
  };
}
