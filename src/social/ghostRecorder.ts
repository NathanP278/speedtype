import { StanceType } from '../types/combat.ts';

export interface CompactGhostEvent {
  t: number; // delta milliseconds from match start
  c: string; // character typed
  ok: boolean; // whether correct
  s: StanceType; // stance at the time
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

export class GhostRecorder {
  private startTime: number | null = null;
  private events: CompactGhostEvent[] = [];
  private isRecording: boolean = false;

  public start() {
    this.startTime = performance.now();
    this.events = [];
    this.isRecording = true;
  }

  public recordKeystroke(char: string, isCorrect: boolean, stance: StanceType) {
    if (!this.isRecording || !this.startTime) return;
    const delta = Math.round(performance.now() - this.startTime);
    this.events.push({
      t: delta,
      c: char,
      ok: isCorrect,
      s: stance,
    });
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
