import React, { useState, useEffect } from 'react';
import {
  CosmeticCategory,
  MARKET_CATALOG,
  MarketItem,
  PlayerEquipped,
} from '../economy/economyState.ts';
import { MarketItemCard } from './MarketItemCard.tsx';

interface BlackMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  unlockedItemIds: string[];
  equipped: PlayerEquipped;
  onBuy: (item: MarketItem) => boolean;
  onEquip: (category: CosmeticCategory, id: string) => void;
}

const CATEGORIES: { id: CosmeticCategory; label: string }[] = [
  { id: 'palette', label: 'PHOSPHOR PALETTES' },
  { id: 'soundboard', label: 'SOUNDBOARDS' },
  { id: 'trail', label: 'TYPING TRAILS' },
  { id: 'signature', label: 'ASCII SIGNATURES' },
];

export const BlackMarketModal: React.FC<BlackMarketModalProps> = ({
  isOpen,
  onClose,
  balance,
  unlockedItemIds,
  equipped,
  onBuy,
  onEquip,
}) => {
  const [activeTab, setActiveTab] = useState<CosmeticCategory>('palette');

  // Listen for Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredItems = MARKET_CATALOG.filter(item => item.category === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      <div
        className="w-full max-w-3xl bg-zinc-950 border-2 border-[var(--theme-border)] rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.9), 0 0 15px var(--theme-dim)' }}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">🛒</span>
            <div>
              <h3 className="text-sm font-bold text-[var(--theme-text)] tracking-wider">
                THE BLACK MARKET // UNDERGROUND EXCHANGE
              </h3>
              <p className="text-[11px] text-zinc-400">
                Redeem Kinetic Points for tactical aesthetics, switch haptics & ASCII flexes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Wallet */}
            <div className="px-3 py-1 bg-black border border-amber-500/60 rounded text-xs font-bold text-amber-400 flex items-center gap-1.5 shadow-[0_0_8px_rgba(251,191,36,0.2)]">
              <span>⚡</span>
              <span>{balance.toLocaleString()} KP</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs border border-zinc-700 hover:border-red-500 text-zinc-400 hover:text-red-400 rounded transition-colors"
            >
              [ESC / CLOSE]
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-zinc-800 bg-black/50 px-4 pt-2 gap-2">
          {CATEGORIES.map(cat => {
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 text-xs font-bold tracking-wider border-b-2 transition-all ${
                  isSelected
                    ? 'border-[var(--theme-text)] text-[var(--theme-text)] bg-zinc-900/50'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Item Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const isUnlocked = unlockedItemIds.includes(item.id);
            const isEquipped =
              (item.category === 'palette' && equipped.palette === item.id) ||
              (item.category === 'soundboard' && equipped.soundboard === item.id) ||
              (item.category === 'trail' && equipped.trail === item.id) ||
              (item.category === 'signature' && equipped.signature === item.id);

            return (
              <MarketItemCard
                key={item.id}
                item={item}
                isUnlocked={isUnlocked}
                isEquipped={isEquipped}
                canAfford={balance >= item.price}
                onBuy={onBuy}
                onEquip={onEquip}
              />
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-black border-t border-zinc-800 flex justify-between text-[11px] text-zinc-500">
          <span>ALL UNLOCKS PERSIST LOCALLY</span>
          <span>TIP: EQUIP PALETTES TO SHIFT CRT EMISSIVE PHOSPHOR SPECTRUM</span>
        </div>
      </div>
    </div>
  );
};
