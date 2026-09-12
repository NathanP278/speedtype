import React, { useState } from 'react';
import { soundEngine } from '../audio/soundEngine.ts';

interface VirtualKeyboardDockProps {
  onCharInput: (char: string) => void;
  onBackspace?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

export const VirtualKeyboardDock: React.FC<VirtualKeyboardDockProps> = ({
  onCharInput,
  onBackspace,
  isOpen = false,
  onToggle,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleKeyPress = (char: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveKey(char);
    setTimeout(() => setActiveKey(null), 120);

    // Haptic pulse if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }

    soundEngine.playKeystroke(1, false);
    onCharInput(char);
  };

  const handleBackspacePress = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setActiveKey('backspace');
    setTimeout(() => setActiveKey(null), 120);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }

    soundEngine.playMistype();
    onBackspace?.();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 px-3.5 py-2 bg-zinc-950/90 border border-[var(--theme-border)] text-[var(--theme-text)] rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md active:scale-95 transition-all cursor-pointer"
          title="Toggle Cybernetic Touch Keyboard"
        >
          <span>⌨</span>
          <span className="hidden sm:inline">TOUCH KEYBOARD</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-2 sm:p-3 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-lg rounded-t-2xl shadow-2xl font-mono select-none z-40 animate-slideUp">
      {/* Top dock bar */}
      <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-zinc-850 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1.5 font-bold text-[var(--theme-text)]">
          <span>⚡</span>
          <span>CYBERNETIC TOUCH DOCK</span>
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="text-zinc-500 hover:text-white px-2 py-0.5 rounded border border-zinc-800"
        >
          [HIDE ✕]
        </button>
      </div>

      {/* Rows */}
      <div className="space-y-1.5">
        {/* Row 1 */}
        <div className="flex justify-center gap-1">
          {KEYBOARD_ROWS[0].map((key) => (
            <button
              key={key}
              type="button"
              onMouseDown={(e) => handleKeyPress(key, e)}
              onTouchStart={(e) => handleKeyPress(key, e)}
              className={`flex-1 max-w-[48px] h-10 sm:h-12 bg-zinc-900/90 border rounded-lg text-sm sm:text-base font-bold uppercase transition-all duration-75 flex items-center justify-center cursor-pointer ${
                activeKey === key
                  ? 'bg-[var(--theme-text)] text-black border-[var(--theme-text)] scale-95 shadow-[0_0_12px_var(--theme-glow)]'
                  : 'border-zinc-800 text-zinc-200 active:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="flex justify-center gap-1 px-3">
          {KEYBOARD_ROWS[1].map((key) => (
            <button
              key={key}
              type="button"
              onMouseDown={(e) => handleKeyPress(key, e)}
              onTouchStart={(e) => handleKeyPress(key, e)}
              className={`flex-1 max-w-[48px] h-10 sm:h-12 bg-zinc-900/90 border rounded-lg text-sm sm:text-base font-bold uppercase transition-all duration-75 flex items-center justify-center cursor-pointer ${
                activeKey === key
                  ? 'bg-[var(--theme-text)] text-black border-[var(--theme-text)] scale-95 shadow-[0_0_12px_var(--theme-glow)]'
                  : 'border-zinc-800 text-zinc-200 active:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Row 3 */}
        <div className="flex justify-center gap-1">
          {KEYBOARD_ROWS[2].map((key) => (
            <button
              key={key}
              type="button"
              onMouseDown={(e) => handleKeyPress(key, e)}
              onTouchStart={(e) => handleKeyPress(key, e)}
              className={`flex-1 max-w-[48px] h-10 sm:h-12 bg-zinc-900/90 border rounded-lg text-sm sm:text-base font-bold uppercase transition-all duration-75 flex items-center justify-center cursor-pointer ${
                activeKey === key
                  ? 'bg-[var(--theme-text)] text-black border-[var(--theme-text)] scale-95 shadow-[0_0_12px_var(--theme-glow)]'
                  : 'border-zinc-800 text-zinc-200 active:bg-zinc-800 hover:border-zinc-600'
              }`}
            >
              {key}
            </button>
          ))}

          {/* Backspace Key */}
          <button
            type="button"
            onMouseDown={handleBackspacePress}
            onTouchStart={handleBackspacePress}
            className={`px-3 h-10 sm:h-12 bg-red-950/40 border border-red-800/60 rounded-lg text-xs sm:text-sm font-bold text-red-400 transition-all duration-75 flex items-center justify-center cursor-pointer ${
              activeKey === 'backspace' ? 'bg-red-800 text-white scale-95' : 'hover:bg-red-900/40'
            }`}
            title="Backspace"
          >
            ⌫
          </button>
        </div>

        {/* Spacebar Row */}
        <div className="flex justify-center px-8 pt-0.5">
          <button
            type="button"
            onMouseDown={(e) => handleKeyPress(' ', e)}
            onTouchStart={(e) => handleKeyPress(' ', e)}
            className={`w-full max-w-sm h-9 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 tracking-widest uppercase transition-all duration-75 flex items-center justify-center cursor-pointer ${
              activeKey === ' '
                ? 'bg-[var(--theme-text)] text-black border-[var(--theme-text)] scale-95'
                : 'active:bg-zinc-800 hover:border-zinc-600'
            }`}
          >
            SPACE
          </button>
        </div>
      </div>
    </div>
  );
};
