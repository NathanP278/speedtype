import type { StanceType } from '../types/combat.ts';

export const STORAGE_KEY_PERSONAL_BEST = 'speedtype_personal_best_ghost_v1';
export const STORAGE_KEY_LAST_RUN = 'speedtype_last_ghost_v1';

export interface CompactGhostEvent {
  t: number; // delta milliseconds from match start
  c: string; // character typed
  ok: boolean; // whether correct
  s: StanceType; // stance at the time
  w?: string; // optional completed word text
}

export interface GhostRunData {
  id: string;
  playerName: string;
  timestamp: number;
  durationMs: number;
  wpm: number;
  accuracy: number;
  events: CompactGhostEvent[];
}
export const GhostRunData = {};

export function savePersonalBest(run: GhostRunData): void {
  try {
    localStorage.setItem(STORAGE_KEY_PERSONAL_BEST, JSON.stringify(run));
  } catch (err) {
    console.error('Failed to save personal best ghost run:', err);
  }
}

export function getPersonalBest(): GhostRunData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_BEST);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && Array.isArray(parsed.events)) {
      return parsed as GhostRunData;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveLastRun(run: GhostRunData): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_RUN, JSON.stringify(run));
  } catch (err) {
    console.error('Failed to save last ghost run:', err);
  }
}

export function getLastRun(): GhostRunData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_RUN);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && Array.isArray(parsed.events)) {
      return parsed as GhostRunData;
    }
    return null;
  } catch {
    return null;
  }
}

export class GhostRecorder {
  private startTime: number | null = null;
  private events: CompactGhostEvent[] = [];
  private isRecording: boolean = false;

  public start(): void {
    this.startTime = performance.now();
    this.events = [];
    this.isRecording = true;
  }

  public recordKeystroke(char: string, isCorrect: boolean, stance: StanceType, completedWord?: string): void {
    if (!this.isRecording || !this.startTime) return;
    const delta = Math.round(performance.now() - this.startTime);
    const event: CompactGhostEvent = {
      t: delta,
      c: char,
      ok: isCorrect,
      s: stance,
    };
    if (completedWord) {
      event.w = completedWord;
    }
    this.events.push(event);
  }

  public recordWordComplete(wordText: string): void {
    if (!this.isRecording || this.events.length === 0) return;
    this.events[this.events.length - 1].w = wordText;
  }

  public stop(playerName: string, wpm: number, accuracy: number): GhostRunData | null {
    if (!this.isRecording || !this.startTime || this.events.length === 0) {
      this.isRecording = false;
      return null;
    }

    const duration = Math.round(performance.now() - this.startTime);
    this.isRecording = false;

    const run: GhostRunData = {
      id: `ghost_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerName,
      timestamp: Date.now(),
      durationMs: duration,
      wpm,
      accuracy,
      events: this.events,
    };

    return run;
  }

  public static serialize(run: GhostRunData): string {
    const json = JSON.stringify(run);
    return btoa(encodeURIComponent(json));
  }

  public static deserialize(encoded: string): GhostRunData | null {
    try {
      const json = decodeURIComponent(atob(encoded));
      const parsed = JSON.parse(json);
      if (parsed.id && Array.isArray(parsed.events)) {
        return parsed as GhostRunData;
      }
      return null;
    } catch {
      return null;
    }
  }
}
