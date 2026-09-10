export type PaletteId = 'amber' | 'lime' | 'magenta' | 'ice';

export interface PhosphorPalette {
  id: PaletteId;
  name: string;
  year: string;
  primary: string;
  glow: string;
  dim: string;
  background: string;
  surface: string;
  border: string;
  accent: string;
  scanlineOpacity: number;
}

export const PHOSPHOR_PALETTES: Record<PaletteId, PhosphorPalette> = {
  amber: {
    id: 'amber',
    name: 'Amber 1984',
    year: '1984',
    primary: '#FFB000',
    glow: 'rgba(255, 176, 0, 0.75)',
    dim: 'rgba(255, 176, 0, 0.25)',
    background: '#0a0600',
    surface: '#170e00',
    border: '#4d3300',
    accent: '#FFE066',
    scanlineOpacity: 0.18,
  },
  lime: {
    id: 'lime',
    name: 'Cyber Lime',
    year: '1991',
    primary: '#00FF66',
    glow: 'rgba(0, 255, 102, 0.75)',
    dim: 'rgba(0, 255, 102, 0.25)',
    background: '#000c04',
    surface: '#001a09',
    border: '#004d1f',
    accent: '#33FF99',
    scanlineOpacity: 0.16,
  },
  magenta: {
    id: 'magenta',
    name: 'Vaporwave Magenta',
    year: '1997',
    primary: '#FF007F',
    glow: 'rgba(255, 0, 127, 0.8)',
    dim: 'rgba(255, 0, 127, 0.3)',
    background: '#0d0008',
    surface: '#1f0014',
    border: '#590038',
    accent: '#00F0FF',
    scanlineOpacity: 0.20,
  },
  ice: {
    id: 'ice',
    name: 'Monochrome Ice',
    year: '2004',
    primary: '#E0F7FA',
    glow: 'rgba(224, 247, 250, 0.75)',
    dim: 'rgba(224, 247, 250, 0.3)',
    background: '#030a0d',
    surface: '#07161c',
    border: '#004354',
    accent: '#80DEEA',
    scanlineOpacity: 0.14,
  },
};

export function applyPaletteToRoot(palette: PhosphorPalette) {
  const root = document.documentElement;
  root.style.setProperty('--theme-text', palette.primary);
  root.style.setProperty('--theme-glow', palette.glow);
  root.style.setProperty('--theme-dim', palette.dim);
  root.style.setProperty('--theme-bg-accent', palette.surface);
  root.style.setProperty('--theme-border', palette.border);
  root.style.setProperty('--theme-accent', palette.accent);
  root.style.setProperty('--scanline-opacity', String(palette.scanlineOpacity));
}
