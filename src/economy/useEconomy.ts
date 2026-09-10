import { useState, useCallback, useEffect } from 'react';
import {
  PlayerEconomyState,
  MarketItem,
  CosmeticCategory,
  loadEconomyState,
  saveEconomyState,
} from './economyState.ts';
import { PaletteId, PHOSPHOR_PALETTES, applyPaletteToRoot } from '../styles/palettes.ts';
import { SoundboardId } from '../audio/soundboards.ts';
import { soundEngine } from '../audio/soundEngine.ts';

export function useEconomy() {
  const [economy, setEconomy] = useState<PlayerEconomyState>(() => loadEconomyState());

  // Save to localStorage on change and sync global soundboard/palette
  useEffect(() => {
    saveEconomyState(economy);
    soundEngine.setSoundboard(economy.equipped.soundboard);
    const pal = PHOSPHOR_PALETTES[economy.equipped.palette] || PHOSPHOR_PALETTES.amber;
    applyPaletteToRoot(pal);
  }, [economy]);

  const awardKp = useCallback((amount: number) => {
    setEconomy(prev => ({
      ...prev,
      balance: prev.balance + amount,
    }));
  }, []);

  const buyItem = useCallback((item: MarketItem): boolean => {
    let success = false;
    setEconomy(prev => {
      if (prev.balance < item.price || prev.unlockedItemIds.includes(item.id)) {
        return prev;
      }
      success = true;
      const nextUnlocked = [...prev.unlockedItemIds, item.id];
      // Auto-equip on purchase
      const nextEquipped = { ...prev.equipped };
      if (item.category === 'palette') nextEquipped.palette = item.id as PaletteId;
      else if (item.category === 'soundboard') nextEquipped.soundboard = item.id as SoundboardId;
      else if (item.category === 'trail') nextEquipped.trail = item.id;
      else if (item.category === 'signature') nextEquipped.signature = item.id;

      return {
        balance: prev.balance - item.price,
        unlockedItemIds: nextUnlocked,
        equipped: nextEquipped,
      };
    });
    return success;
  }, []);

  const equipItem = useCallback((category: CosmeticCategory, itemId: string) => {
    setEconomy(prev => {
      if (!prev.unlockedItemIds.includes(itemId)) return prev;

      const nextEquipped = { ...prev.equipped };
      if (category === 'palette') nextEquipped.palette = itemId as PaletteId;
      else if (category === 'soundboard') nextEquipped.soundboard = itemId as SoundboardId;
      else if (category === 'trail') nextEquipped.trail = itemId;
      else if (category === 'signature') nextEquipped.signature = itemId;

      return {
        ...prev,
        equipped: nextEquipped,
      };
    });
  }, []);

  return {
    balance: economy.balance,
    unlockedItemIds: economy.unlockedItemIds,
    equipped: economy.equipped,
    awardKp,
    buyItem,
    equipItem,
  };
}
