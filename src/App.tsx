import { useState, useRef, useCallback, useEffect } from 'react';
import { TerminalViewport } from './components/TerminalViewport.tsx';
import { CombatHud } from './components/CombatHud.tsx';
import { KineticBeamDisplay } from './components/KineticBeamDisplay.tsx';
import { TypingTest } from './components/TypingTest.tsx';
import { MenuModal } from './components/MenuModal.tsx';
import { BlackMarketModal } from './components/BlackMarketModal.tsx';
import { RivalryDossierModal } from './components/RivalryDossierModal.tsx';
import { TournamentLounge } from './components/TournamentLounge.tsx';
import { WeeklyTrialModal } from './components/WeeklyTrialModal.tsx';
import { GhostDuelSelector } from './components/GhostDuelSelector.tsx';
import { KoSignatureStamp } from './components/KoSignatureStamp.tsx';
import { AsciiDebrisCanvas, AsciiDebrisCanvasHandle } from './canvas/AsciiDebrisCanvas.tsx';
import { TypingTrailsCanvas, TypingTrailsHandle } from './canvas/TypingTrailsCanvas.tsx';
import { useCombatCoordinator } from './engine/useCombatCoordinator.ts';
import { useTypingEngine } from './engine/useTypingEngine.ts';
import { useStanceManager } from './engine/useStanceManager.ts';
import { useEconomy } from './economy/useEconomy.ts';
import { loadDossier, recordMatchInDossier, DossierData } from './social/rivalryDossier.ts';
import {
  GhostRunData,
  GhostRecorder,
  savePersonalBest,
  getPersonalBest,
  saveLastRun,
  getLastRun,
} from './social/ghostRecorder.ts';
import {
  UserCalibration,
  getStoredCalibration,
} from './engine/calibration.ts';
import {
  RivalDifficultyLevel,
  RIVAL_DIFFICULTIES,
  createAdaptiveRivalProfile,
} from './engine/adaptiveRival.ts';
import { BotProfile } from './engine/botOpponent.ts';
import { soundEngine } from './audio/soundEngine.ts';
import { STANCE_CONFIGS } from './engine/dictionary.ts';
import { WeeklyTrial } from './trials/weeklyTrials.ts';
import { MatchResult } from './types/combat.ts';

export function App() {
  // Player Benchmark Calibration
  const [calibration, setCalibration] = useState<UserCalibration | null>(() => getStoredCalibration());
  const [isCalibrating, setIsCalibrating] = useState<boolean>(() => !getStoredCalibration());
  const [difficulty, setDifficulty] = useState<RivalDifficultyLevel>('equal');

  // Display toggles
  const [crtEnabled, setCrtEnabled] = useState<boolean>(false);
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(false);

  // Economy & Cosmetics
  const economy = useEconomy();
  const [dossier, setDossier] = useState<DossierData>(() => loadDossier());

  // Menu & Modal toggles
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [marketOpen, setMarketOpen] = useState<boolean>(false);
  const [dossierOpen, setDossierOpen] = useState<boolean>(false);
  const [tournamentOpen, setTournamentOpen] = useState<boolean>(false);
  const [trialsOpen, setTrialsOpen] = useState<boolean>(false);
  const [ghostOpen, setGhostOpen] = useState<boolean>(false);

  // Ghost Recorder & Persistence
  const ghostRecorderRef = useRef<GhostRecorder>(new GhostRecorder());
  const [lastPlayerGhost, setLastPlayerGhost] = useState<GhostRunData | null>(() => getLastRun());
  const [personalBestGhost, setPersonalBestGhost] = useState<GhostRunData | null>(() => getPersonalBest());
  const lastOpponentRef = useRef<string | GhostRunData | BotProfile>('shinobi');
  const opponentNameRef = useRef<string>('Shinobi-X');

  // Active Weekly Trial Modifier
  const [activeTrial, setActiveTrial] = useState<WeeklyTrial | null>(null);
  const [isWordFlashing, setIsWordFlashing] = useState<boolean>(false);
  const [revealedWord, setRevealedWord] = useState<string | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);

  // Canvas Refs
  const debrisCanvasRef = useRef<AsciiDebrisCanvasHandle | null>(null);
  const trailsCanvasRef = useRef<TypingTrailsHandle | null>(null);

  const isAnyModalOpen =
    menuOpen || marketOpen || dossierOpen || tournamentOpen || trialsOpen || ghostOpen;

  // Stance Manager
  const { stance, setStance } = useStanceManager({
    initialStance: 'strike',
    enabled: !isAnyModalOpen && !isCalibrating,
  });

  // Sound Callbacks
  const handlePlayKeystrokeSound = useCallback((isMistype: boolean, streak: number) => {
    if (isMistype) {
      soundEngine.playMistype();
    } else {
      soundEngine.playKeystroke(streak, false);
    }
  }, []);

  const handleWordExplode = useCallback((word: string, x: number, y: number, color: string) => {
    if (debrisCanvasRef.current) {
      debrisCanvasRef.current.spawnWordExplosion(word, x, y, color);
    }
    soundEngine.playKeystroke(10, true);
  }, []);

  // Match End Handler
  const handleMatchEnd = useCallback(
    (result: MatchResult) => {
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

      let totalKp = result.kpEarned;
      if (activeTrial && result.winner === 'player') {
        totalKp += activeTrial.kpBounty;
      }
      economy.awardKp(totalKp);

      setDossier((prev) =>
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
    },
    [activeTrial, economy]
  );

  // Combat Coordinator
  const combat = useCombatCoordinator({
    botProfileId: 'shinobi',
    trialModifier: activeTrial?.id,
    onMatchEnd: handleMatchEnd,
    onWordExplode: handleWordExplode,
    onPlayKeystrokeSound: handlePlayKeystrokeSound,
  });

  // Blind Duel: 0.5s initial flash period on new target word
  useEffect(() => {
    if (activeTrial?.id === 'blind_duel' && combat.player.activeWord) {
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

    return () => {
      if (flashTimerRef.current !== null) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, [activeTrial?.id, combat.player.activeWord?.id]);

  // Sync current opponent name for dossier recording
  useEffect(() => {
    if (combat.opponent.name) {
      opponentNameRef.current = combat.opponent.name;
    }
  }, [combat.opponent.name]);

  // Sync stance changes into combat engine
  useEffect(() => {
    combat.setPlayerStance(stance);
  }, [stance]);

  // Sync Overclock Ducking to Web Audio
  useEffect(() => {
    soundEngine.setOverclockDucking(combat.isOverclocked);
  }, [combat.isOverclocked]);

  // Zero-Latency Typing Engine for Player
  const isInputEnabled =
    (combat.matchStatus === 'in_progress' || combat.matchStatus === 'finisher') &&
    !isCalibrating &&
    !isAnyModalOpen;

  const typing = useTypingEngine({
    activeWord:
      combat.matchStatus === 'finisher'
        ? {
            id: 'finisher_boss',
            text: combat.finisherState.bossWord,
            stance: 'strike',
            damage: 50,
          }
        : combat.player.activeWord,
    activeStance: stance,
    enabled: isInputEnabled,
    isDisrupted: combat.player.isDisrupted,
    isBlind: activeTrial?.id === 'blind_duel',
    onCorrectChar: (char, currentStreak, currentWpm) => {
      combat.handlePlayerKeystroke(char, currentStreak, currentWpm);
      ghostRecorderRef.current.recordKeystroke(char, true, stance);

      if (trailsCanvasRef.current) {
        trailsCanvasRef.current.addKeystroke(
          window.innerWidth * 0.32,
          window.innerHeight * 0.58,
          char
        );
      }
    },
    onMistype: (key, _expected) => {
      combat.handlePlayerMistype();
      ghostRecorderRef.current.recordKeystroke(key, false, stance);
    },
    onWordComplete: (word, stats) => {
      combat.handlePlayerWordComplete(word, stats);
      ghostRecorderRef.current.recordWordComplete(word.text);

      if (activeTrial?.id === 'blind_duel') {
        setRevealedWord(word.text);
        if (revealTimerRef.current !== null) {
          clearTimeout(revealTimerRef.current);
        }
        revealTimerRef.current = window.setTimeout(() => {
          setRevealedWord(null);
          revealTimerRef.current = null;
        }, 700);
      }
    },
  });

  // Start match against calibrated adaptive rival
  const startNewAdaptiveMatch = useCallback(
    (customCal?: UserCalibration, customDiff?: RivalDifficultyLevel) => {
      const activeCal = customCal || calibration;
      const activeDiff = customDiff || difficulty;

      let opponentTarget: string | BotProfile = 'shinobi';

      if (activeCal) {
        opponentTarget = createAdaptiveRivalProfile(activeCal, activeDiff);
      }

      lastOpponentRef.current = opponentTarget;
      ghostRecorderRef.current.start();
      combat.startMatch(opponentTarget);
      typing.resetTypingEngine();
    },
    [calibration, difficulty, combat, typing]
  );

  // When calibration benchmark finishes
  const handleCalibrationComplete = (newCal: UserCalibration) => {
    setCalibration(newCal);
    setIsCalibrating(false);
    startNewAdaptiveMatch(newCal, difficulty);
  };

  // Render character formatting helper
  const renderWordCharacters = (
    wordText: string,
    typedIdx: number,
    isDisrupted: boolean,
    isBlind: boolean,
    isFlashing: boolean = false
  ) => {
    return wordText.split('').map((char, index) => {
      let displayChar = char;
      if (isDisrupted && index >= typedIdx) {
        displayChar = String.fromCharCode(33 + ((char.charCodeAt(0) + index * 7) % 90));
      } else if (isBlind && !isFlashing) {
        displayChar = '•';
      }

      const isTyped = index < typedIdx;
      const isCurrent = index === typedIdx;

      return (
        <span
          key={index}
          className={`inline-block transition-all duration-75 ${
            isTyped
              ? 'text-[var(--theme-text)] glow-wpm font-bold opacity-100'
              : isCurrent
              ? 'text-white border-b-2 border-[var(--theme-text)] animate-pulse glow-subtle scale-110'
              : 'text-zinc-600 opacity-60'
          }`}
        >
          {displayChar}
        </span>
      );
    });
  };

  return (
    <TerminalViewport
      kpBalance={economy.balance}
      currentPaletteId={economy.equipped.palette}
      currentWpm={typing.currentWpm}
      onSelectPalette={(id) => economy.equipItem('palette', id)}
      onOpenMenu={() => setMenuOpen(true)}
      onRetest={() => setIsCalibrating(true)}
      crtEnabled={crtEnabled}
      scanlinesEnabled={scanlinesEnabled}
      calibrationBadge={
        calibration ? (
          <button
            type="button"
            onClick={() => setIsCalibrating(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 rounded-full text-xs transition-colors cursor-pointer"
            title="Click to re-benchmark typing speed"
          >
            <span className="text-amber-400 font-bold">⚡</span>
            <span className="text-zinc-300">
              Calibrated: <strong className="text-white">{calibration.netWpm} WPM</strong>
            </span>
            <span className="text-zinc-500 text-[10px]">({calibration.accuracy}% Acc)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCalibrating(true)}
            className="px-3 py-1 bg-amber-950/60 border border-amber-500/80 text-amber-300 rounded-full text-xs font-bold animate-pulse"
          >
            ⚡ Take Benchmark Test
          </button>
        )
      }
    >
      {/* Canvas Layer: ASCII Debris & Typing Trails */}
      <AsciiDebrisCanvas ref={debrisCanvasRef} />
      <TypingTrailsCanvas ref={trailsCanvasRef} trailType={economy.equipped.trail} />

      {/* VIEW MODE 1: CALIBRATION BENCHMARK TEST */}
      {isCalibrating ? (
        <TypingTest
          existingCalibration={calibration}
          onComplete={handleCalibrationComplete}
          onCancel={calibration ? () => setIsCalibrating(false) : undefined}
        />
      ) : (
        /* VIEW MODE 2: SIMPLIFIED RIVAL DUEL ARENA */
        <div className="w-full max-w-5xl flex-1 flex flex-col justify-between items-center relative my-2">
          {/* Top Combat HUD (HP Bars & Stance) */}
          <CombatHud
            player={combat.player}
            opponent={combat.opponent}
            activeStance={stance}
            onSelectStance={setStance}
            overclockStreak={combat.overclockStreak}
            isOverclocked={combat.isOverclocked}
            damageMultiplier={combat.damageMultiplier}
          />

          {/* Kinetic Tug-of-War Beam */}
          <KineticBeamDisplay
            beamState={combat.beamState}
            isOverclocked={combat.isOverclocked}
            playerName={`${combat.player.name} (${typing.currentWpm} WPM)`}
            opponentName={`${combat.opponent.name} (${combat.opponent.stats.wpm} WPM)`}
          />

          {/* Arena Centerpiece */}
          <div className="w-full flex-1 flex flex-col justify-center items-center my-2">
            {/* IDLE STATE: Pre-duel Rival Tuning */}
            {combat.matchStatus === 'idle' && (
              <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-zinc-950/90 border border-zinc-800 rounded-xl text-center max-w-lg shadow-2xl">
                <div className="inline-block px-3 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                  ⚡ ADAPTIVE RIVAL DUEL
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-white tracking-wider mb-2">
                  SPEEDTYPE COMBAT
                </h2>

                <p className="text-xs text-zinc-400 mb-6 max-w-md leading-relaxed">
                  Duel against an adaptive Rival AI calibrated to your{' '}
                  <strong className="text-[var(--theme-text)]">
                    {calibration?.netWpm || 65} WPM
                  </strong>{' '}
                  baseline. Type cleanly to push the kinetic beam across the enemy threshold!
                </p>

                {/* Difficulty Selector */}
                <div className="w-full mb-6">
                  <span className="text-[11px] text-zinc-500 block uppercase font-bold mb-2">
                    Select Rival Difficulty:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['relaxed', 'equal', 'challenger', 'boss'] as RivalDifficultyLevel[]).map(
                      (diffKey) => {
                        const conf = RIVAL_DIFFICULTIES[diffKey];
                        const isSelected = difficulty === diffKey;
                        return (
                          <button
                            key={diffKey}
                            type="button"
                            onClick={() => setDifficulty(diffKey)}
                            className={`p-2 rounded border text-left flex flex-col justify-between transition-all ${
                              isSelected
                                ? 'border-[var(--theme-text)] bg-zinc-900 text-white shadow-sm'
                                : 'border-zinc-800 bg-black/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                          >
                            <span className="text-xs font-bold block">{conf.label}</span>
                            <span className="text-[10px] text-zinc-500">{conf.badge}</span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Start Button */}
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => startNewAdaptiveMatch()}
                    className="px-8 py-3 text-sm font-bold bg-[var(--theme-text)] text-black rounded-lg hover:brightness-110 shadow-[0_0_20px_var(--theme-dim)] transition-all tracking-wider uppercase"
                  >
                    [START DUEL]
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCalibrating(true)}
                    className="px-4 py-3 text-xs font-bold border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg transition-colors"
                  >
                    [RETEST SPEED]
                  </button>
                </div>
              </div>
            )}

            {/* FINISHER WORD DUEL */}
            {combat.matchStatus === 'finisher' && (
              <div className="w-full max-w-2xl p-6 bg-red-950/40 border-2 border-red-500 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.4)] flex flex-col items-center text-center animate-pulse">
                <span className="text-xs font-bold text-red-400 tracking-widest uppercase mb-1">
                  ⚠️ FATAL FINISHER WORD DUEL ⚠️
                </span>
                <p className="text-[11px] text-zinc-400 mb-4">
                  First to complete the boss word executes instant Knockout!
                </p>

                <div className="text-3xl sm:text-4xl font-mono tracking-widest font-black my-4 px-6 py-3 bg-black border border-red-500/80 rounded shadow-inner">
                  {renderWordCharacters(
                    combat.finisherState.bossWord,
                    typing.typedIndex,
                    false,
                    false
                  )}
                </div>

                <div className="w-full grid grid-cols-2 gap-4 text-xs mt-2">
                  <div className="p-2 bg-black/60 border border-zinc-800 rounded">
                    <span className="text-zinc-400 block text-[10px]">YOU</span>
                    <strong className="text-[var(--theme-text)] font-bold">
                      {typing.typedIndex} / {combat.finisherState.bossWord.length} CHARS
                    </strong>
                  </div>
                  <div className="p-2 bg-black/60 border border-zinc-800 rounded">
                    <span className="text-zinc-400 block text-[10px]">RIVAL</span>
                    <strong className="text-red-400 font-bold">
                      {combat.finisherState.opponentProgress} / {combat.finisherState.bossWord.length} CHARS
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE COMBAT WORD ARENA */}
            {combat.matchStatus === 'in_progress' && (
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* PLAYER WORD HERO CARD */}
                <div
                  className={`p-6 rounded-xl border flex flex-col items-center justify-center min-h-[200px] transition-all ${
                    combat.player.isDisrupted
                      ? 'glitch-active bg-purple-950/20 border-purple-500'
                      : 'bg-zinc-950 border-zinc-800 shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2 text-xs">
                    <span
                      className="font-bold px-2 py-0.5 rounded text-[10px] uppercase"
                      style={{
                        color: STANCE_CONFIGS[stance].themeColor,
                        backgroundColor: `${STANCE_CONFIGS[stance].themeColor}22`,
                      }}
                    >
                      {STANCE_CONFIGS[stance].badge}
                    </span>

                    <span className="text-zinc-400 text-xs font-semibold">
                      YOUR TARGET TOKEN
                    </span>
                  </div>

                  {/* Blind Duel Flash Indicators */}
                  {activeTrial?.id === 'blind_duel' && isWordFlashing && (
                    <div className="text-[10px] text-purple-300 font-bold bg-purple-950/70 border border-purple-500/50 px-2.5 py-0.5 rounded tracking-wider animate-pulse mb-1">
                      ⚡ FLASH: MEMORIZE TOKEN
                    </div>
                  )}
                  {activeTrial?.id === 'blind_duel' && revealedWord && (
                    <div className="text-xs font-bold text-green-400 bg-green-950/80 border border-green-500/80 px-3 py-0.5 rounded shadow-lg animate-pulse mb-1 tracking-widest">
                      ✓ CONFIRMED: {revealedWord}
                    </div>
                  )}

                  {/* Typed Word Stream */}
                  <div className="text-4xl sm:text-5xl font-mono tracking-wider font-bold my-4 px-4 py-2 select-none">
                    {combat.player.activeWord ? (
                      renderWordCharacters(
                        combat.player.activeWord.text,
                        typing.typedIndex,
                        combat.player.isDisrupted,
                        activeTrial?.id === 'blind_duel',
                        isWordFlashing
                      )
                    ) : (
                      <span className="text-zinc-600 animate-pulse">GENERATING TOKEN...</span>
                    )}
                  </div>

                  {/* Live typing stats */}
                  <div className="flex justify-between w-full text-xs text-zinc-400 mt-2 border-t border-zinc-900 pt-3">
                    <span>
                      STREAK: <strong className="text-white">{typing.cleanStreak}</strong>
                    </span>
                    <span>
                      WPM: <strong className="text-[var(--theme-text)]">{typing.currentWpm}</strong>
                    </span>
                    <span className="text-zinc-500 hidden sm:inline">[TAB]: SHIFT STANCE</span>
                  </div>
                </div>

                {/* OPPONENT WORD PREVIEW */}
                <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/60 flex flex-col items-center justify-center min-h-[200px]">
                  <div className="flex items-center justify-between w-full mb-2 text-xs">
                    <span className="font-bold text-red-400 text-[10px] uppercase">
                      {combat.opponent.name}
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      PACING: {combat.opponent.stats.wpm} WPM
                    </span>
                  </div>

                  <div className="text-3xl sm:text-4xl font-mono tracking-wider font-bold my-4 px-4 py-2 text-zinc-600 select-none">
                    {combat.opponent.activeWord?.text || 'SYNCHRONIZING...'}
                  </div>

                  <div className="flex justify-between w-full text-xs text-zinc-500 mt-2 border-t border-zinc-900 pt-3">
                    <span>STATUS: <strong className="text-red-400">ENGAGED</strong></span>
                    <span>OPPONENT STANCE: <strong className="text-zinc-400">{combat.opponent.stance.toUpperCase()}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post-Match KO Stamp / Summary */}
      <KoSignatureStamp
        result={combat.matchResult}
        signatureId={economy.equipped.signature}
        onRematch={() => startNewAdaptiveMatch()}
      />

      {/* Clean Menu Modal (Extras & Archives) */}
      <MenuModal
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenTournament={() => setTournamentOpen(true)}
        onOpenGhost={() => setGhostOpen(true)}
        onOpenDossier={() => setDossierOpen(true)}
        onOpenTrials={() => setTrialsOpen(true)}
        onOpenMarket={() => setMarketOpen(true)}
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(!crtEnabled)}
        scanlinesEnabled={scanlinesEnabled}
        onToggleScanlines={() => setScanlinesEnabled(!scanlinesEnabled)}
        kpBalance={economy.balance}
      />

      {/* Secondary Meta Subsystem Modals */}
      <BlackMarketModal
        isOpen={marketOpen}
        onClose={() => setMarketOpen(false)}
        balance={economy.balance}
        unlockedItemIds={economy.unlockedItemIds}
        equipped={economy.equipped}
        onBuy={economy.buyItem}
        onEquip={economy.equipItem}
      />

      <RivalryDossierModal
        isOpen={dossierOpen}
        onClose={() => setDossierOpen(false)}
        dossier={dossier}
      />

      <TournamentLounge
        isOpen={tournamentOpen}
        onClose={() => setTournamentOpen(false)}
        playerKp={economy.balance}
        onUpdateKp={(delta) => economy.awardKp(delta)}
      />

      <WeeklyTrialModal
        isOpen={trialsOpen}
        onClose={() => setTrialsOpen(false)}
        activeModifier={activeTrial?.id}
        onSelectTrial={(trial) => setActiveTrial(trial)}
      />

      <GhostDuelSelector
        isOpen={ghostOpen}
        onClose={() => setGhostOpen(false)}
        lastPlayerRun={lastPlayerGhost}
        personalBestRun={personalBestGhost}
        onSelectGhost={(ghost) => {
          lastOpponentRef.current = ghost;
          ghostRecorderRef.current.start();
          combat.startMatch(ghost);
          typing.resetTypingEngine();
        }}
      />
    </TerminalViewport>
  );
}

export default App;
