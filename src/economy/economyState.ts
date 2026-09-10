import { PaletteId } from '../styles/palettes.ts';
import { SoundboardId } from '../audio/soundboards.ts';

export type CosmeticCategory = 'palette' | 'soundboard' | 'trail' | 'signature';

export interface MarketItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  price: number;
  description: string;
  isDefault?: boolean;
}

export const MARKET_CATALOG: MarketItem[] = [
  // Phosphor Palettes
  { id: 'amber', category: 'palette', name: 'Amber 1984', price: 0, description: 'Warm nostalgic monochrome amber phosphor glow.', isDefault: true },
  { id: 'lime', category: 'palette', name: 'Cyber Lime', price: 300, description: 'Electric neon green terminal phosphor aesthetic.' },
  { id: 'magenta', category: 'palette', name: 'Vaporwave Magenta', price: 600, description: 'Retro synthwave magenta phosphor with cyan highlights.' },
  { id: 'ice', category: 'palette', name: 'Monochrome Ice', price: 900, description: 'Ultra-cold arctic blue-white terminal phosphor glow.' },

  // Soundboards
  { id: 'thock', category: 'soundboard', name: 'Mechanical Thock', price: 0, description: 'Deep acoustic tactile switches.', isDefault: true },
  { id: 'model_m', category: 'soundboard', name: 'IBM Model M', price: 350, description: 'Classic buckling spring clicks with ringing chime.' },
  { id: 'typewriter', category: 'soundboard', name: 'Vintage Typewriter', price: 500, description: 'Heavy hammer strikes and carriage return bell.' },
  { id: 'blip', category: 'soundboard', name: '8-Bit Blips', price: 650, description: 'Arcade chiptune square-wave arpeggio feedback.' },
  { id: 'silent', category: 'soundboard', name: 'Silent Switches', price: 250, description: 'Subtle stealth switches for minimal distraction.' },

  // Typing Trails
  { id: 'ghost', category: 'trail', name: 'Neon Ghost', price: 0, description: 'Chromatic motion-blur ghost trail on cursor.', isDefault: true },
  { id: 'matrix', category: 'trail', name: 'Matrix Rain', price: 450, description: 'Falling green alphanumerics streaming from keystrokes.' },
  { id: 'lightning', category: 'trail', name: 'Lightning Arcs', price: 750, description: 'Procedural high-voltage electrical arcs bridging keys.' },

  // ASCII KO Signatures
  { id: 'terminated', category: 'signature', name: '[TERMINATED] Tombstone', price: 0, description: 'Classic ASCII tombstone epitaph stamp.', isDefault: true },
  { id: 'purge', category: 'signature', name: '[REVILED_PURGE] Skull', price: 500, description: 'Smoking cyber-skull ASCII banner.' },
  { id: 'dump', category: 'signature', name: '[CORE_DUMP] Memory Matrix', price: 750, description: 'Flashing binary memory address crash dump.' },
  { id: 'fatal', category: 'signature', name: '[SYNTAX_FATAL] Crash Report', price: 1000, description: 'Emergency hazard crash banner.' },
];

export interface PlayerEquipped {
  palette: PaletteId;
  soundboard: SoundboardId;
  trail: string;
  signature: string;
}

export interface PlayerEconomyState {
  balance: number;
  unlockedItemIds: string[];
  equipped: PlayerEquipped;
}

const STORAGE_KEY = 'speedtype_economy_state_v1';

export const DEFAULT_ECONOMY_STATE: PlayerEconomyState = {
  balance: 500, // Starter KP grant
  unlockedItemIds: ['amber', 'thock', 'ghost', 'terminated'],
  equipped: {
    palette: 'amber',
    soundboard: 'thock',
    trail: 'ghost',
    signature: 'terminated',
  },
};

export function loadEconomyState(): PlayerEconomyState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_ECONOMY_STATE;
    const parsed = JSON.parse(saved);
    return {
      balance: typeof parsed.balance === 'number' ? parsed.balance : DEFAULT_ECONOMY_STATE.balance,
      unlockedItemIds: Array.isArray(parsed.unlockedItemIds) ? parsed.unlockedItemIds : DEFAULT_ECONOMY_STATE.unlockedItemIds,
      equipped: {
        palette: parsed.equipped?.palette || 'amber',
        soundboard: parsed.equipped?.soundboard || 'thock',
        trail: parsed.equipped?.trail || 'ghost',
        signature: parsed.equipped?.signature || 'terminated',
      },
    };
  } catch {
    return DEFAULT_ECONOMY_STATE;
  }
}

export function saveEconomyState(state: PlayerEconomyState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save economy state:', err);
  }
}
