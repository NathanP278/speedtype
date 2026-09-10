export interface NemesisWordStat {
  word: string;
  attempts: number;
  mistakes: number;
  deathsCaused: number;
  errorRate: number; // percentage
}

export interface RivalRecord {
  rivalName: string;
  wins: number;
  losses: number;
  wpmDelta: number; // your avg - rival avg
}

export interface DossierData {
  lifetimeMatches: number;
  wins: number;
  losses: number;
  totalKpEarned: number;
  highestWpm: number;
  averageWpm: number;
  rivals: Record<string, RivalRecord>;
  nemesisWords: Record<string, { attempts: number; mistakes: number; deathsCaused: number }>;
}

const DOSSIER_STORAGE_KEY = 'speedtype_rivalry_dossier_v1';

export const DEFAULT_DOSSIER: DossierData = {
  lifetimeMatches: 0,
  wins: 0,
  losses: 0,
  totalKpEarned: 0,
  highestWpm: 0,
  averageWpm: 0,
  rivals: {
    'Shinobi-X': { rivalName: 'Shinobi-X', wins: 0, losses: 0, wpmDelta: 0 },
    'Ada-01': { rivalName: 'Ada-01', wins: 0, losses: 0, wpmDelta: 0 },
    'Glitch-Daemon': { rivalName: 'Glitch-Daemon', wins: 0, losses: 0, wpmDelta: 0 },
  },
  nemesisWords: {
    'DISILLUSIONMENT': { attempts: 6, mistakes: 4, deathsCaused: 2 },
    'ELECTROMAGNETIC': { attempts: 8, mistakes: 5, deathsCaused: 1 },
    'MICROCONTROLLER': { attempts: 5, mistakes: 3, deathsCaused: 1 },
    '~(buf^0xFF)': { attempts: 4, mistakes: 3, deathsCaused: 1 },
  },
};

export function loadDossier(): DossierData {
  try {
    const saved = localStorage.getItem(DOSSIER_STORAGE_KEY);
    if (!saved) return DEFAULT_DOSSIER;
    return JSON.parse(saved) as DossierData;
  } catch {
    return DEFAULT_DOSSIER;
  }
}

export function saveDossier(data: DossierData) {
  try {
    localStorage.setItem(DOSSIER_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save rivalry dossier:', err);
  }
}

export function getRankedNemesisWords(dossier: DossierData): NemesisWordStat[] {
  const list: NemesisWordStat[] = Object.entries(dossier.nemesisWords).map(([word, stat]) => {
    const errorRate = stat.attempts > 0 ? Math.round((stat.mistakes / stat.attempts) * 100) : 0;
    return {
      word,
      attempts: stat.attempts,
      mistakes: stat.mistakes,
      deathsCaused: stat.deathsCaused,
      errorRate,
    };
  });

  return list.sort((a, b) => b.deathsCaused * 100 + b.errorRate - (a.deathsCaused * 100 + a.errorRate));
}

export function recordMatchInDossier(
  dossier: DossierData,
  rivalName: string,
  isWin: boolean,
  playerWpm: number,
  kpEarned: number,
  failedWords: string[] = []
): DossierData {
  const matches = dossier.lifetimeMatches + 1;
  const wins = isWin ? dossier.wins + 1 : dossier.wins;
  const losses = isWin ? dossier.losses : dossier.losses + 1;
  const totalKp = dossier.totalKpEarned + kpEarned;
  const highestWpm = Math.max(dossier.highestWpm, playerWpm);
  const averageWpm = Math.round((dossier.averageWpm * dossier.lifetimeMatches + playerWpm) / matches);

  const rivals = { ...dossier.rivals };
  const currentRival = rivals[rivalName] || { rivalName, wins: 0, losses: 0, wpmDelta: 0 };
  rivals[rivalName] = {
    ...currentRival,
    wins: isWin ? currentRival.wins + 1 : currentRival.wins,
    losses: isWin ? currentRival.losses : currentRival.losses + 1,
  };

  const nemesisWords = { ...dossier.nemesisWords };
  failedWords.forEach(word => {
    const existing = nemesisWords[word] || { attempts: 0, mistakes: 0, deathsCaused: 0 };
    nemesisWords[word] = {
      attempts: existing.attempts + 1,
      mistakes: existing.mistakes + 1,
      deathsCaused: isWin ? existing.deathsCaused : existing.deathsCaused + 1,
    };
  });

  const updated: DossierData = {
    lifetimeMatches: matches,
    wins,
    losses,
    totalKpEarned: totalKp,
    highestWpm,
    averageWpm,
    rivals,
    nemesisWords,
  };

  saveDossier(updated);
  return updated;
}
