import React, { useRef, useState, useEffect } from 'react';
import { RivalDifficultyLevel, RIVAL_DIFFICULTIES } from '../engine/adaptiveRival.ts';
import { AdaptiveInputCapture, AdaptiveInputCaptureHandle } from './AdaptiveInputCapture.tsx';
import { VirtualKeyboardDock } from './VirtualKeyboardDock.tsx';
import { useDeviceProfile } from '../engine/useDeviceProfile.ts';

interface ModernDuelArenaProps {
  playerStats: {
    wpm: number;
    rawWpm?: number;
    accuracy: number;
    streak: number;
    completedCount: number;
    totalTargetWords: number;
  };
  rivalStats: {
    name: string;
    targetWpm: number;
    completedCount: number;
    activeWordText: string;
    totalTargetWords: number;
  };
  currentWordText: string;
  typedIndex: number;
  upcomingWords: string[];
  difficulty: RivalDifficultyLevel;
  gameStarted?: boolean;
  onResetMatch: () => void;
  onRetestSpeed: () => void;
  onCharInput?: (char: string) => void;
  onBackspace?: () => void;
}

export const ModernDuelArena: React.FC<ModernDuelArenaProps> = ({
  playerStats,
  rivalStats,
  currentWordText,
  typedIndex,
  upcomingWords,
  difficulty,
  gameStarted = false,
  onResetMatch,
  onRetestSpeed,
  onCharInput,
  onBackspace,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputCaptureRef = useRef<AdaptiveInputCaptureHandle>(null);
  const [touchKeyboardOpen, setTouchKeyboardOpen] = useState<boolean>(false);
  const device = useDeviceProfile();

  const diffConfig = RIVAL_DIFFICULTIES[difficulty] || RIVAL_DIFFICULTIES.equal;

  const totalWords = Math.max(1, playerStats.totalTargetWords);
  const playerPercent = Math.min(100, Math.round((playerStats.completedCount / totalWords) * 100));
  const rivalPercent = Math.min(100, Math.round((rivalStats.completedCount / totalWords) * 100));

  const isKeyboardActive = device.isKeyboardOpen;

  // Auto focus adaptive input on mount and on clicks anywhere in the arena
  useEffect(() => {
    inputCaptureRef.current?.focus();
  }, []);

  const handleArenaInteraction = () => {
    inputCaptureRef.current?.focus();
  };

  const handleCharacterTyped = (char: string) => {
    onCharInput?.(char);
  };

  const handleBackspaceTyped = () => {
    onBackspace?.();
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onClick={handleArenaInteraction}
      onTouchStart={handleArenaInteraction}
      className="relative w-full max-w-5xl mx-auto flex-1 flex flex-col justify-between items-center px-3 sm:px-4 py-2 md:py-6 outline-none select-none font-mono cursor-text overflow-hidden"
    >
      {/* Invisible Adaptive Input Capture Receiver */}
      {onCharInput && (
        <AdaptiveInputCapture
          ref={inputCaptureRef}
          onCharInput={handleCharacterTyped}
          onBackspace={handleBackspaceTyped}
          currentTypedValue={currentWordText.slice(0, typedIndex)}
          autoFocus={true}
        />
      )}

      {/* ── Section 1: Unified Race Strip (Slimmed when keyboard active) ──── */}
      <div
        className={`w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl shadow-xl transition-all duration-200 ${
          isKeyboardActive ? 'p-2 mb-2 border-zinc-800/40 bg-zinc-950/60' : 'p-3 sm:p-5 mb-2'
        }`}
      >
        <div className="flex items-center justify-between text-xs mb-1.5">
          {/* Player Lead Info */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-[var(--theme-text)] text-xs">YOU</span>
            <span className="text-[10px] text-zinc-400 font-bold">
              {playerStats.completedCount}/{totalWords} ({playerPercent}%)
            </span>
            {playerStats.streak > 1 && !isKeyboardActive && (
              <span className="text-[9px] px-1.5 py-0.2 bg-zinc-900 border border-[var(--theme-text)] text-[var(--theme-text)] rounded-full">
                ⚡ {playerStats.streak}
              </span>
            )}
          </div>

          {!isKeyboardActive && (
            <span className="hidden xs:inline text-[9px] sm:text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
              FIRST TO {totalWords}
            </span>
          )}

          {/* Rival Lead Info */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] text-zinc-400 font-bold">
              ({rivalPercent}%) {rivalStats.completedCount}/{totalWords}
            </span>
            <span className="font-extrabold text-rose-400 text-xs">RIVAL</span>
          </div>
        </div>

        {/* Unified Race Track */}
        <div
          className={`relative w-full bg-zinc-900/90 rounded-full overflow-hidden border border-zinc-800/80 transition-all ${
            isKeyboardActive ? 'h-2' : 'h-3 sm:h-3.5'
          }`}
        >
          {/* Player Progress (Theme Color) */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-[var(--theme-text)] progress-bar-smooth rounded-full shadow-[0_0_12px_var(--theme-glow)] opacity-80"
            style={{ width: `${playerPercent}%` }}
          />

          {/* Rival Progress Marker (Rose/Red Pip) */}
          <div
            className="absolute top-0 bottom-0 w-2.5 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.9)] transition-all duration-150 z-10 -ml-1.5"
            style={{ left: `${Math.max(1, rivalPercent)}%` }}
            title={`Rival progress: ${rivalPercent}%`}
          />
        </div>
      </div>

      {/* ── Section 2: Hero Word Zone (Natural Breathing Room & Fluid Typography) ── */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-center my-auto transition-all duration-200 py-3 sm:py-8 select-none">
        {/* Pre-game "Waiting to Start" Overlay */}
        {!gameStarted && (
          <div className="absolute top-1 sm:top-4 flex items-center gap-2 px-3 py-1 bg-zinc-900/90 border border-zinc-800 rounded-full text-xs text-zinc-300 shadow-lg animate-pulse z-20">
            <span className="text-[var(--theme-text)]">▶</span>
            <span className="font-bold tracking-wider text-[10px] sm:text-xs">
              TAP OR TYPE TO BEGIN
            </span>
          </div>
        )}

        {/* Massive Hero Word Display with Responsive Fluid Typography */}
        <div
          className={`font-mono tracking-wider sm:tracking-widest font-black text-center select-none transition-all duration-150 break-keep px-2 ${
            isKeyboardActive
              ? 'text-4xl sm:text-6xl md:text-7xl'
              : 'text-5xl xs:text-6xl sm:text-7xl md:text-8xl'
          } ${!gameStarted ? 'opacity-50' : 'opacity-100'}`}
        >
          {currentWordText.split('').map((char, index) => {
            const isTyped = index < typedIndex;
            const isCurrent = index === typedIndex;

            let charStyle = 'text-zinc-400 font-bold';
            if (isTyped) {
              charStyle = 'text-[var(--theme-text)] glow-wpm font-black';
            } else if (isCurrent) {
              charStyle = 'text-white font-black';
            }

            return (
              <span key={index} className={`relative inline-block transition-colors duration-75 ${charStyle}`}>
                {isCurrent && (
                  <span className="absolute left-0 bottom-1 top-1 w-[2.5px] sm:w-[3px] bg-[var(--theme-text)] animate-pulse shadow-[0_0_10px_var(--theme-text)]" />
                )}
                {char}
              </span>
            );
          })}
        </div>

        {/* Upcoming Words Ribbon — Flowing Typography Preview */}
        {upcomingWords.length > 0 && (
          <div
            className={`flex items-center justify-center text-xs sm:text-sm font-mono select-none overflow-hidden max-w-xl px-2 transition-all ${
              isKeyboardActive ? 'mt-2' : 'mt-4 sm:mt-6'
            }`}
          >
            <div className="flex items-center gap-2 text-zinc-400 tracking-wider">
              {upcomingWords.slice(0, 3).map((word, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-zinc-700 select-none">·</span>}
                  <span className={idx === 0 ? 'text-zinc-300 font-semibold' : 'text-zinc-500 font-normal'}>
                    {word}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Mobile Combat Pulse Bar (Phone Viewports < 640px) ── */}
      {!isKeyboardActive && (
        <div className="flex sm:hidden w-full items-center justify-between px-3.5 py-2 bg-zinc-950/85 border border-zinc-800/80 rounded-xl text-xs backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-bold text-white">
              YOU <span className="text-[var(--theme-text)] font-extrabold">{playerStats.wpm}</span>
            </span>
            <span className="text-zinc-700 text-[10px]">•</span>
            <span className="text-[11px] font-bold text-zinc-400">
              RIVAL <span className="text-rose-400 font-extrabold">{rivalStats.targetWpm}</span>
            </span>
            {playerStats.streak > 1 && (
              <>
                <span className="text-zinc-700 text-[10px]">•</span>
                <span className="text-[10px] text-amber-400 font-bold">⚡{playerStats.streak}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onResetMatch}
              className="p-1 px-2 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs leading-none cursor-pointer"
              title="Restart match"
              aria-label="Restart match"
            >
              ↺
            </button>
            <button
              type="button"
              onClick={onRetestSpeed}
              className="p-1 px-2 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-lg text-[10px] leading-none cursor-pointer"
              title="Recalibrate"
              aria-label="Recalibrate"
            >
              ⚡
            </button>
          </div>
        </div>
      )}

      {/* ── Section 3: Desktop Ambient Stats Bar (Tablet & Desktop >= 640px) ── */}
      <div
        className={`hidden sm:flex w-full bg-zinc-950/70 border border-zinc-800/60 rounded-xl px-4 sm:px-5 py-2 sm:py-3 items-center justify-between text-xs text-zinc-400 gap-3 transition-all ${
          isKeyboardActive ? 'py-1.5' : ''
        }`}
      >
        {/* Left: Player Ambient Stats */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
          <span>
            YOU: <strong className="text-[var(--theme-text)] font-bold">{playerStats.wpm} WPM</strong>
          </span>
          <span className="text-zinc-700">•</span>
          <span>
            ACC: <strong className="text-cyan-400 font-bold">{playerStats.accuracy}%</strong>
          </span>
          <span className="text-zinc-700">•</span>
          <span>
            STREAK: <strong className="text-amber-400 font-bold">{playerStats.streak}</strong>
          </span>
        </div>

        {/* Center/Right: Rival Ambient Info */}
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
          <span className="text-zinc-500">
            RIVAL: <strong className="text-rose-400">{rivalStats.name}</strong> ({diffConfig.badge} • {rivalStats.targetWpm} WPM)
          </span>
          {rivalStats.activeWordText && (
            <span className="hidden md:inline text-[11px] text-zinc-600">
              [{rivalStats.activeWordText}]
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetMatch}
            className="px-2.5 py-1 text-[11px] border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-md transition-colors focus-ring cursor-pointer"
            title="Restart current duel"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={onRetestSpeed}
            className="px-2.5 py-1 text-[11px] border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white rounded-md transition-colors focus-ring cursor-pointer"
            title="Recalibrate benchmark"
          >
            Recalibrate
          </button>
        </div>
      </div>

      {/* Cybernetic On-Screen Touch Keyboard Dock */}
      {onCharInput && (
        <VirtualKeyboardDock
          isOpen={touchKeyboardOpen}
          onToggle={() => setTouchKeyboardOpen(!touchKeyboardOpen)}
          onCharInput={handleCharacterTyped}
          onBackspace={handleBackspaceTyped}
        />
      )}
    </div>
  );
};
