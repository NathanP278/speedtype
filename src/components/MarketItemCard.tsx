import React from 'react';
import { MarketItem, CosmeticCategory } from '../economy/economyState.ts';
import { soundEngine } from '../audio/soundEngine.ts';
import { SoundboardId } from '../audio/soundboards.ts';
import { PHOSPHOR_PALETTES, PaletteId } from '../styles/palettes.ts';

interface MarketItemCardProps {
  item: MarketItem;
  isUnlocked: boolean;
  isEquipped: boolean;
  canAfford: boolean;
  onBuy: (item: MarketItem) => void;
  onEquip: (category: CosmeticCategory, id: string) => void;
}

export const MarketItemCard: React.FC<MarketItemCardProps> = ({
  item,
  isUnlocked,
  isEquipped,
  canAfford,
  onBuy,
  onEquip,
}) => {
  const handleTestSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.category === 'soundboard') {
      const prev = soundEngine.getSoundboard();
      soundEngine.setSoundboard(item.id as SoundboardId);
      soundEngine.playKeystroke(5, false);
      soundEngine.setSoundboard(prev);
    }
  };

  const palette = item.category === 'palette' ? PHOSPHOR_PALETTES[item.id as PaletteId] : null;

  return (
    <div
      className={`p-3.5 rounded border transition-all duration-150 flex flex-col justify-between ${
        isEquipped
          ? 'bg-zinc-900/90 border-[var(--theme-text)] shadow-[0_0_12px_var(--theme-dim)]'
          : isUnlocked
          ? 'bg-zinc-950/80 border-zinc-700 hover:border-zinc-500'
          : 'bg-zinc-950/40 border-zinc-800/80 opacity-90'
      }`}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5 font-mono">
            {item.name}
            {palette && (
              <span
                className="inline-block w-3 h-3 rounded-full border border-white/40"
                style={{ backgroundColor: palette.primary, boxShadow: `0 0 6px ${palette.glow}` }}
              />
            )}
          </h4>

          {isEquipped ? (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[var(--theme-text)] text-black font-mono">
              EQUIPPED
            </span>
          ) : isUnlocked ? (
            <span className="px-2 py-0.5 text-[10px] rounded border border-zinc-700 text-zinc-400 font-mono">
              UNLOCKED
            </span>
          ) : (
            <span className="text-xs font-bold text-amber-400 font-mono">
              ⚡ {item.price} KP
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 mb-3 font-mono leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-800/60">
        {item.category === 'soundboard' && (
          <button
            type="button"
            onClick={handleTestSound}
            className="px-2 py-1 text-[11px] font-mono rounded border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white transition-colors"
          >
            ▶ TEST SOUND
          </button>
        )}

        <div className="flex-1 flex justify-end">
          {isEquipped ? (
            <span className="text-[11px] text-zinc-500 font-mono py-1">ACTIVE</span>
          ) : isUnlocked ? (
            <button
              type="button"
              onClick={() => onEquip(item.category, item.id)}
              className="px-3 py-1 text-xs font-mono font-bold rounded border border-[var(--theme-text)] text-[var(--theme-text)] hover:bg-[var(--theme-text)] hover:text-black transition-colors"
            >
              EQUIP
            </button>
          ) : (
            <button
              type="button"
              disabled={!canAfford}
              onClick={() => onBuy(item)}
              className={`px-3 py-1 text-xs font-mono font-bold rounded border transition-colors ${
                canAfford
                  ? 'border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black'
                  : 'border-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {canAfford ? 'PURCHASE' : 'NEED KP'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
