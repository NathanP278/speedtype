import { GhostRunData, CompactGhostEvent } from './ghostRecorder.ts';
import { StanceType } from '../types/combat.ts';

export interface GhostPlaybackCallbacks {
  onCharTyped: (char: string, ok: boolean, stance: StanceType) => void;
  onStanceChanged?: (stance: StanceType) => void;
  onWordCompleted?: (word: string, stance: StanceType) => void;
  onPlaybackComplete?: () => void;
}

export interface GhostProfile {
  name: string;
  avatar: string;
  title: string;
  baseWpm: number;
  wpm: number;
  accuracy: number;
  preferredStance: StanceType;
}

interface ReconstructedWordSpan {
  word: string;
  startIndex: number;
  endIndex: number;
}

const KNOWN_WORDS: string[] = [
  // STRIKE
  'STRIKE', 'BREACH', 'PULVERIZE', 'SHATTER', 'EXECUTE',
  'CLEAVE', 'SMITE', 'OVERLOAD', 'RUPTURE', 'ANNIHILATE',
  'PIERCE', 'DEMOLISH', 'VAPORIZE', 'FRACTURE', 'DECIMATE',
  'BLITZ', 'CRUSH', 'OBLITERATE', 'COMBUST', 'SEVER',
  'SPLINTER', 'SURGE', 'IGNITE', 'DETONATE', 'DISINTEGRATE',
  // COUNTER
  'QUARANTINE', 'ENCRYPT', 'IMMOBILIZE', 'FIREWALL', 'CONTAIN',
  'DEFLECT', 'INSULATE', 'DECRYPT', 'BUFFER', 'ISOLATE',
  'INTERCEPT', 'REINFORCE', 'NEUTRALIZE', 'AUTHENTICATE', 'SAFEGUARD',
  'MITIGATE', 'FORTIFY', 'ENCASE', 'COUNTERACT', 'ABSORB',
  'SHIELD', 'STABILIZE', 'SECURE', 'PRESERVE', 'REVISE',
  // DISRUPT
  '$sys.ptr->0x9F;', '!&&_NULL#', '[k*~void::run]', '@async{42}/',
  '~(buf^0xFF)', 'const *ref[]=', '#!/bin/sh<0>', 'eval(`%x%`);',
  '{fn()=>_nil}', '|pipe|>filter?', 'struct<T&>{}', '0b101101?true',
  '*(int*)0x00=0;', 'std::move(&v);', 'fn(x)={!x?0:1}', '<<hex::dump>>',
  'catch(e:any){}', '[key:string]:v;',
  // BOSS
  'UNCONSCIONABLE', 'ELECTROMAGNETIC', 'COUNTERMEASURE', 'SUPERCONDUCTOR',
  'SYNCHRONIZATION', 'VULNERABILITY', 'AUTHENTICATION', 'DISILLUSIONMENT',
  'DECENTRALIZATION', 'CRYPTOGRAPHICALLY', 'MICROCONTROLLER', 'INDESCRIBABLY',
  'PHOTOVOLTAICS', 'HYPERTHREADING', 'CHARACTERISTIC',
  // CODE SYNTAX
  'std::unique_ptr<T>', 'fn main() -> Result<()>', 'export default async',
  'reinterpret_cast<T*>', 'impl<T> From<U> for T', 'Promise.allSettled()',
  'git commit -m "init"', 'interface Combatant<T>', 'Array.from({length:32})',
  'useCallback(fn, [deps])', 'process.env.NODE_ENV'
];

function reconstructWordSpans(events: CompactGhostEvent[]): ReconstructedWordSpan[] {
  const spans: ReconstructedWordSpan[] = [];
  let buffer = '';
  let startIndex = 0;

  for (let i = 0; i < events.length; i++) {
    const evt = events[i];

    if (evt.w) {
      spans.push({
        word: evt.w,
        startIndex,
        endIndex: i,
      });
      buffer = '';
      startIndex = i + 1;
      continue;
    }

    if (evt.ok) {
      buffer += evt.c;

      const exactMatch = KNOWN_WORDS.find(w => w === buffer);
      if (exactMatch) {
        const longerMatch = KNOWN_WORDS.find(w => w.length > buffer.length && w.startsWith(buffer));
        if (!longerMatch) {
          spans.push({
            word: exactMatch,
            startIndex,
            endIndex: i,
          });
          buffer = '';
          startIndex = i + 1;
        }
      }
    }
  }

  if (buffer.length > 0) {
    const candidate = KNOWN_WORDS.find(w => w.startsWith(buffer)) || buffer;
    spans.push({
      word: candidate,
      startIndex,
      endIndex: -1,
    });
  }

  return spans;
}

export class GhostPlaybackEngine {
  private run: GhostRunData;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private startTime: number = 0;
  private pauseTime: number = 0;
  private eventIndex: number = 0;
  private animFrameId: number | null = null;
  private currentStance: StanceType;
  private currentActiveWord: string = '';
  private wordSpans: ReconstructedWordSpan[] = [];
  private currentSpanIndex: number = 0;

  private onCharTyped: (char: string, ok: boolean, stance: StanceType) => void;
  private onStanceChanged?: (stance: StanceType) => void;
  private onWordCompleted?: (word: string, stance: StanceType) => void;
  private onPlaybackComplete?: () => void;

  constructor(
    run: GhostRunData,
    callbacks: GhostPlaybackCallbacks
  ) {
    this.run = run;
    this.onCharTyped = callbacks.onCharTyped;
    this.onStanceChanged = callbacks.onStanceChanged;
    this.onWordCompleted = callbacks.onWordCompleted;
    this.onPlaybackComplete = callbacks.onPlaybackComplete;

    this.currentStance = run.events[0]?.s || 'strike';
    this.wordSpans = reconstructWordSpans(run.events);
    this.currentActiveWord = this.wordSpans[0]?.word || '';
  }

  public start(): void {
    this.stop();
    this.isPlaying = true;
    this.isPaused = false;
    this.startTime = performance.now();
    this.eventIndex = 0;
    this.currentSpanIndex = 0;
    this.currentStance = this.run.events[0]?.s || 'strike';
    this.currentActiveWord = this.wordSpans[0]?.word || '';

    if (this.run.events.length === 0) {
      this.isPlaying = false;
      if (this.onPlaybackComplete) {
        this.onPlaybackComplete();
      }
      return;
    }

    this.scheduleTick();
  }

  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.cancelTick();
  }

  public pause(): void {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this.pauseTime = performance.now();
    this.cancelTick();
  }

  public resume(): void {
    if (!this.isPlaying || !this.isPaused) return;
    this.isPaused = false;
    const pausedDuration = performance.now() - this.pauseTime;
    this.startTime += pausedDuration;
    this.scheduleTick();
  }

  public getStance(): StanceType {
    return this.currentStance;
  }

  public getActiveWord(): string {
    return this.currentActiveWord;
  }

  public getProfile(): GhostProfile {
    return {
      name: `${this.run.playerName} [GHOST]`,
      avatar: '👻',
      title: 'Recorded Ghost Challenger',
      baseWpm: this.run.wpm,
      wpm: this.run.wpm,
      accuracy: this.run.accuracy,
      preferredStance: this.run.events[0]?.s || 'strike',
    };
  }

  private scheduleTick(): void {
    const requestFrame =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(cb, 16) as unknown as number;

    this.animFrameId = requestFrame(this.tick);
  }

  private cancelTick(): void {
    if (this.animFrameId !== null) {
      const cancelFrame =
        typeof cancelAnimationFrame === 'function'
          ? cancelAnimationFrame
          : (id: number) => clearTimeout(id);

      cancelFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private tick = (): void => {
    if (!this.isPlaying || this.isPaused) return;

    const elapsed = performance.now() - this.startTime;

    while (this.eventIndex < this.run.events.length) {
      const evt = this.run.events[this.eventIndex];
      if (elapsed >= evt.t) {
        if (evt.s !== this.currentStance) {
          this.currentStance = evt.s;
          if (this.onStanceChanged) {
            this.onStanceChanged(this.currentStance);
          }
        }

        this.onCharTyped(evt.c, evt.ok, evt.s);

        const activeSpan = this.wordSpans[this.currentSpanIndex];
        if (activeSpan && activeSpan.endIndex === this.eventIndex) {
          const completedWord = activeSpan.word;
          this.currentSpanIndex++;
          this.currentActiveWord = this.wordSpans[this.currentSpanIndex]?.word || '';
          if (this.onWordCompleted) {
            this.onWordCompleted(completedWord, this.currentStance);
          }
        }

        this.eventIndex++;
      } else {
        break;
      }
    }

    if (this.eventIndex >= this.run.events.length) {
      this.isPlaying = false;
      this.cancelTick();
      if (this.onPlaybackComplete) {
        this.onPlaybackComplete();
      }
    } else {
      this.scheduleTick();
    }
  };
}
