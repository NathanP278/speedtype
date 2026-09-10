import { useState, useRef, useCallback, useEffect } from 'react';
import { TerminalViewport } from './components/TerminalViewport.tsx';
import { CombatHud } from './components/CombatHud.tsx';
import { KineticBeamDisplay } from './components/KineticBeamDisplay.tsx';
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
import { GhostRunData, GhostRecorder } from './social/ghostRecorder.ts';
import { soundEngine } from './audio/soundEngine.ts';
import { STANCE_CONFIGS } from './engine/dictionary.ts';
import { WeeklyTrial } from './trials/weeklyTrials.ts';
import { MatchResult } from './types/combat.ts';

export function App() {
  // Economy & Cosmetics
  const economy = useEconomy();
  const [dossier, setDossier] = useState<DossierData>(() => loadDossier());

  // Modal toggles
  const [marketOpen, setMarketOpen] = useState<boolean>(false);
  const [dossierOpen, setDossierOpen] = useState<boolean>(false);
  const [tournamentOpen, setTournamentOpen] = useState<boolean>(false);
  const [trialsOpen, setTrialsOpen] = useState<boolean>(false);
  const [ghostOpen, setGhostOpen] = useState<boolean>(false);

  // Ghost Recorder
  const ghostRecorderRef = useRef<GhostRecorder>(new GhostRecorder());
  const [lastPlayerGhost, setLastPlayerGhost] = useState<GhostRunData | null>(null);

  // Active Weekly Trial Modifier
  const [activeTrial, setActiveTrial] = useState<WeeklyTrial | null>(null);

  // Canvas Refs
  const debrisCanvasRef = useRef<AsciiDebrisCanvasHandle | null>(null);
  const trailsCanvasRef = useRef<TypingTrailsHandle | null>(null);

  // Stance Manager
  const { stance, setStance } = useStanceManager({
    initialStance: 'strike',
    enabled: !marketOpen && !dossierOpen && !tournamentOpen && !trialsOpen && !ghostOpen,
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
  const handleMatchEnd = useCallback((result: MatchResult) => {
    // Record ghost run
    const ghost = ghostRecorderRef.current.stop(
      'ROOT_USER',
      result.playerStats.wpm,
      result.playerStats.accuracy
    );
    if (ghost) setLastPlayerGhost(ghost);

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
        'Shinobi-X',
        result.winner === 'player',
        result.playerStats.wpm,
        totalKp
      )
    );
  }, [activeTrial, economy]);

  // Combat Coordinator
  const combat = useCombatCoordinator({
    botProfileId: 'shinobi',
    trialModifier: activeTrial?.id,
    onMatchEnd: handleMatchEnd,
    onWordExplode: handleWordExplode,
    onPlayKeystrokeSound: handlePlayKeystrokeSound,
  });

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
    combat.matchStatus === 'in_progress' || combat.matchStatus === 'finisher';

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
    enabled: isInputEnabled && !marketOpen && !dossierOpen && !tournamentOpen && !trialsOpen && !ghostOpen,
    isDisrupted: combat.player.isDisrupted,
    isBlind: activeTrial?.id === 'blind_duel',
    onCorrectChar: (char, currentStreak, currentWpm) => {
      combat.handlePlayerKeystroke(char, currentStreak, currentWpm);
      ghostRecorderRef.current.recordKeystroke(char, true, stance);

      // Trigger Typing Trails Canvas
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
    },
  });

  const startNewMatch = () => {
    ghostRecorderRef.current.start();
    combat.startMatch('shinobi');
    typing.resetTypingEngine();
  };


  // Render character formatting helper
  const renderWordCharacters = (wordText: string, typedIdx: number, isDisrupted: boolean, isBlind: boolean) => {
    return wordText.split('').map((char, index) => {
      let displayChar = char;
      if (isDisrupted && index >= typedIdx) {
        // Scramble letters if disrupted
        displayChar = String.fromCharCode(33 + (char.charCodeAt(0) + index * 7) % 90);
      } else if (isBlind && index >= typedIdx) {
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
      onSelectPalette={id => economy.equipItem('palette', id)}
      onOpenMarket={() => setMarketOpen(true)}
      onOpenDossier={() => setDossierOpen(true)}
      onOpenTournament={() => setTournamentOpen(true)}
      onOpenTrials={() => setTrialsOpen(true)}
    >
      {/* Canvas Layer: ASCII Debris & Typing Trails */}
      <AsciiDebrisCanvas ref={debrisCanvasRef} />
      <TypingTrailsCanvas ref={trailsCanvasRef} trailType={economy.equipped.trail} />

      {/* Top Combat HUD */}
      <CombatHud
        player={combat.player}
        opponent={combat.opponent}
        activeStance={stance}
        onSelectStance={setStance}
        overclockStreak={combat.overclockStreak}
        isOverclocked={combat.isOverclocked}
        damageMultiplier={combat.damageMultiplier}
      />

      {/* Center Kinetic Tug-of-War Beam */}
      <KineticBeamDisplay beamState={combat.beamState} isOverclocked={combat.isOverclocked} />

      {/* Active Match Arena / Word Zones */}
      <div className="w-full max-w-5xl flex-1 flex flex-col justify-center items-center relative my-2">
        {combat.matchStatus === 'idle' && (
          <div className="flex flex-col items-center justify-center p-8 bg-black/80 border border-zinc-800 rounded-lg text-center max-w-md shadow-2xl">
            <h2 className="text-2xl font-black text-[var(--theme-text)] glow-medium tracking-wider mb-2">
              SPEEDTYPE // COMBAT ARENA
            </h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Master the Stance Triangle: Strike for burst damage, Counter for absorption shields, and Disrupt to scramble the rival interface.
            </p>

            {activeTrial && (
              <div className="mb-4 p-2 bg-purple-950/60 border border-purple-500 rounded text-xs text-purple-300">
                ACTIVE TRIAL: <strong>{activeTrial.name}</strong> (+{activeTrial.kpBounty} KP Bounty)
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <button
                type="button"
                onClick={startNewMatch}
                className="px-6 py-2.5 text-sm font-bold bg-[var(--theme-text)] text-black rounded hover:brightness-110 transition-all tracking-wider shadow-[0_0_15px_var(--theme-dim)]"
              >
                [ENTER COMBAT]
              </button>
              <button
                type="button"
                onClick={() => setGhostOpen(true)}
                className="px-4 py-2.5 text-xs font-bold border border-cyan-600 text-cyan-400 hover:bg-cyan-950/40 rounded transition-colors"
              >
                [GHOST DUELS]
              </button>
            </div>
          </div>
        )}

        {/* FINISHER WORD DUEL MODAL SCREEN LOCK */}
        {combat.matchStatus === 'finisher' && (
          <div className="w-full max-w-3xl p-6 bg-red-950/40 border-2 border-red-500 rounded-lg shadow-[0_0_40px_rgba(239,68,68,0.5)] flex flex-col items-center text-center animate-pulse">
            <span className="text-xs font-bold text-red-400 tracking-widest uppercase mb-1">
              ⚠️ FATAL FINISHER WORD DUEL // CLOCK LOCKED ⚠️
            </span>
            <p className="text-[11px] text-zinc-400 mb-4">
              First to complete the 12-15 letter boss word executes instant Knockout. Defending clutch rebounds with +25% HP!
            </p>

            {/* Boss Word Display */}
            <div className="text-3xl sm:text-4xl font-mono tracking-widest font-black my-4 px-6 py-3 bg-black border border-red-500/80 rounded shadow-inner">
              {renderWordCharacters(
                combat.finisherState.bossWord,
                typing.typedIndex,
                false,
                false
              )}
            </div>

            {/* Duel Progress Comparison */}
            <div className="w-full grid grid-cols-2 gap-4 text-xs mt-2">
              <div className="p-2 bg-black/60 border border-zinc-800 rounded">
                <span className="text-zinc-400 block text-[10px]">YOU (ATTACKER)</span>
                <strong className="text-[var(--theme-text)] font-bold">
                  {typing.typedIndex} / {combat.finisherState.bossWord.length} CHARACTERS
                </strong>
              </div>
              <div className="p-2 bg-black/60 border border-zinc-800 rounded">
                <span className="text-zinc-400 block text-[10px]">RIVAL (DEFENDER)</span>
                <strong className="text-red-400 font-bold">
                  {combat.finisherState.opponentProgress} / {combat.finisherState.bossWord.length} CHARACTERS
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* STANDARD COMBAT WORD ARENA */}
        {combat.matchStatus === 'in_progress' && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* PLAYER ACTIVE WORD TARGET */}
            <div
              className={`p-6 rounded-lg border flex flex-col items-center justify-center min-h-[180px] transition-all ${
                combat.player.isDisrupted
                  ? 'glitch-active bg-purple-950/20 border-purple-500'
                  : 'bg-zinc-950/90 border-[var(--theme-border)] shadow-[0_0_20px_rgba(0,0,0,0.8)]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3 text-xs">
                <span
                  className="font-bold px-2 py-0.5 rounded text-[10px] uppercase"
                  style={{
                    color: STANCE_CONFIGS[stance].themeColor,
                    backgroundColor: `${STANCE_CONFIGS[stance].themeColor}22`,
                  }}
                >
                  {STANCE_CONFIGS[stance].badge}
                </span>

                {combat.player.isDisrupted && (
                  <span className="text-purple-400 font-bold text-[11px] animate-pulse">
                    ⚡ UI DISRUPTED ({(combat.player.disruptionRemainingMs / 1000).toFixed(1)}s)
                  </span>
                )}
              </div>

              {/* Typed Word Stream */}
              <div className="text-3xl sm:text-4xl font-mono tracking-wider font-bold my-3 px-4 py-2 select-none">
                {combat.player.activeWord ? (
                  renderWordCharacters(
                    combat.player.activeWord.text,
                    typing.typedIndex,
                    combat.player.isDisrupted,
                    activeTrial?.id === 'blind_duel'
                  )
                ) : (
                  <span className="text-zinc-600 animate-pulse">GENERATING TOKEN...</span>
                )}
              </div>

              <div className="flex justify-between w-full text-[11px] text-zinc-500 mt-2">
                <span>STREAK: <strong className="text-zinc-200">{typing.cleanStreak}</strong></span>
                <span>WPM: <strong className="text-[var(--theme-text)]">{typing.currentWpm}</strong></span>
                <span>PRESS [TAB] TO SHIFT STANCE</span>
              </div>
            </div>

            {/* OPPONENT ACTIVE WORD TARGET */}
            <div
              className={`p-6 rounded-lg border flex flex-col items-center justify-center min-h-[180px] transition-all ${
                combat.opponent.isDisrupted
                  ? 'glitch-active bg-purple-950/20 border-purple-500'
                  : 'bg-zinc-950/90 border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3 text-xs">
                <span className="font-bold text-red-400 text-[10px] uppercase">
                  RIVAL TARGET // {combat.opponent.stance.toUpperCase()}
                </span>
                {combat.opponent.isDisrupted && (
                  <span className="text-purple-400 font-bold text-[11px] animate-pulse">
                    ⚡ RIVAL UI JITTER
                  </span>
                )}
              </div>

              {/* Opponent Word Preview */}
              <div className="text-2xl sm:text-3xl font-mono tracking-wider font-bold my-3 px-4 py-2 text-zinc-500 select-none">
                {combat.opponent.activeWord?.text || 'SYNCHRONIZING...'}
              </div>

              <div className="flex justify-between w-full text-[11px] text-zinc-500 mt-2">
                <span>BOT ARCHETYPE: <strong className="text-zinc-300">SHINOBI-X</strong></span>
                <span>STATUS: <strong className="text-red-400">ENGAGED</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Victory / Defeat KO Signature Stamp Modal */}
      <KoSignatureStamp
        result={combat.matchResult}
        signatureId={economy.equipped.signature}
        onRematch={startNewMatch}
      />

      {/* Meta Subsystem Modals */}
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
        onUpdateKp={delta => economy.awardKp(delta)}
      />

      <WeeklyTrialModal
        isOpen={trialsOpen}
        onClose={() => setTrialsOpen(false)}
        activeModifier={activeTrial?.id}
        onSelectTrial={trial => setActiveTrial(trial)}
      />

      <GhostDuelSelector
        isOpen={ghostOpen}
        onClose={() => setGhostOpen(false)}
        lastPlayerRun={lastPlayerGhost}
        onSelectGhost={ghost => {
          ghostRecorderRef.current.start();
          combat.startMatch(ghost.playerName);
        }}
      />
    </TerminalViewport>
  );
}
export default App;
