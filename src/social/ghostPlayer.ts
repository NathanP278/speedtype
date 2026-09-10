import { GhostRunData } from './ghostRecorder.ts';
import { StanceType } from '../types/combat.ts';

export class GhostPlaybackEngine {
  private run: GhostRunData;
  private isPlaying: boolean = false;
  private startTime: number = 0;
  private eventIndex: number = 0;
  private animFrameId: number | null = null;

  private onCharTyped: (char: string, ok: boolean, stance: StanceType) => void;
  private onPlaybackComplete?: () => void;

  constructor(
    run: GhostRunData,
    callbacks: {
      onCharTyped: (char: string, ok: boolean, stance: StanceType) => void;
      onPlaybackComplete?: () => void;
    }
  ) {
    this.run = run;
    this.onCharTyped = callbacks.onCharTyped;
    this.onPlaybackComplete = callbacks.onPlaybackComplete;
  }

  public start() {
    this.isPlaying = true;
    this.startTime = performance.now();
    this.eventIndex = 0;
    this.tick();
  }

  public stop() {
    this.isPlaying = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private tick = () => {
    if (!this.isPlaying) return;

    const elapsed = performance.now() - this.startTime;

    while (this.eventIndex < this.run.events.length) {
      const evt = this.run.events[this.eventIndex];
      if (elapsed >= evt.t) {
        this.onCharTyped(evt.c, evt.ok, evt.s);
        this.eventIndex++;
      } else {
        break;
      }
    }

    if (this.eventIndex >= this.run.events.length) {
      this.isPlaying = false;
      if (this.onPlaybackComplete) this.onPlaybackComplete();
    } else {
      this.animFrameId = requestAnimationFrame(this.tick);
    }
  };
}
