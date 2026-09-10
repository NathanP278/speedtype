import React, { useState, useEffect } from 'react';

interface FloatingReaction {
  id: string;
  text: string;
  x: number;
  y: number;
}

const REACTIONS: string[] = [
  '[GG]',
  '[PWND]',
  '[CLUTCH!]',
  '(╯°□°)╯',
  '[REKT]',
  '[OVERCLOCK]',
  '(▀̿Ĺ̯▀̿ ̿)',
  '⚡ 120 WPM!',
];

export const AsciiReactionOverlay: React.FC = () => {
  const [activeReactions, setActiveReactions] = useState<FloatingReaction[]>([]);

  const triggerReaction = (text: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}_${Math.random()}`,
      text,
      x: 20 + Math.random() * 60, // percentage across screen
      y: 85,
    };

    setActiveReactions(prev => [...prev.slice(-20), newReaction]);
  };

  useEffect(() => {
    if (activeReactions.length === 0) return;

    const interval = setInterval(() => {
      setActiveReactions(prev =>
        prev
          .map(r => ({ ...r, y: r.y - 3 }))
          .filter(r => r.y > 10)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [activeReactions.length]);

  return (
    <>
      {/* Floating Emotes Area */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden font-mono select-none">
        {activeReactions.map(r => (
          <div
            key={r.id}
            className="absolute text-sm font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] transition-transform duration-75"
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              opacity: r.y < 30 ? r.y / 30 : 1,
            }}
          >
            {r.text}
          </div>
        ))}
      </div>

      {/* Interactive Emote Reaction Bar */}
      <div className="flex items-center gap-1.5 flex-wrap p-2 bg-black/80 border border-zinc-800 rounded font-mono select-none">
        <span className="text-[10px] text-zinc-500 mr-1">SPECTATOR REACTIONS:</span>
        {REACTIONS.map(reaction => (
          <button
            key={reaction}
            type="button"
            onClick={() => triggerReaction(reaction)}
            className="px-2 py-0.5 text-xs bg-zinc-900 hover:bg-amber-400 hover:text-black border border-zinc-700 rounded text-amber-300 transition-colors"
          >
            {reaction}
          </button>
        ))}
      </div>
    </>
  );
};
