import { SoundboardId, playProceduralKeystroke, playMistypeError, playImpactBoom } from './soundboards.ts';

// Pentatonic scale frequency multiplier sequence for pitch scaling
const PENTATONIC_FREQUENCIES: number[] = [
  440.0,  // A4
  493.88, // B4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  987.77, // B5
  1046.5, // C6
  1174.66,// D6
  1318.51,// E6
  1567.98,// G6
  1760.0, // A6
  2093.0, // C7
];

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private duckingFilter: BiquadFilterNode | null = null;
  private playerPanner: StereoPannerNode | null = null;
  private opponentPanner: StereoPannerNode | null = null;
  private activeSoundboard: SoundboardId = 'thock';
  private isMuted: boolean = false;

  constructor() {
    // Lazy AudioContext initialization on first interaction
  }

  private ensureContext(): boolean {
    if (this.isMuted) return false;

    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);

      this.duckingFilter = this.ctx.createBiquadFilter();
      this.duckingFilter.type = 'lowpass';
      this.duckingFilter.frequency.setValueAtTime(20000, this.ctx.currentTime);

      // Stereo Panners for spatial battle acoustics
      if (typeof this.ctx.createStereoPanner === 'function') {
        this.playerPanner = this.ctx.createStereoPanner();
        this.playerPanner.pan.setValueAtTime(-0.15, this.ctx.currentTime);

        this.opponentPanner = this.ctx.createStereoPanner();
        this.opponentPanner.pan.setValueAtTime(0.15, this.ctx.currentTime);

        this.playerPanner.connect(this.duckingFilter);
        this.opponentPanner.connect(this.duckingFilter);
      }

      // Chain: duckingFilter -> compressor -> masterGain -> destination
      this.duckingFilter.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return true;
  }

  public setSoundboard(packId: SoundboardId) {
    this.activeSoundboard = packId;
  }

  public getSoundboard(): SoundboardId {
    return this.activeSoundboard;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.65, this.ctx.currentTime);
    }
  }

  public setOverclockDucking(isOverclocked: boolean) {
    if (!this.ensureContext() || !this.duckingFilter || !this.ctx) return;

    const now = this.ctx.currentTime;
    const targetFreq = isOverclocked ? 850 : 20000;
    this.duckingFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);

    if (isOverclocked) {
      this.playOverclockWhoosh();
    }
  }

  public playKeystroke(streak: number, isWordEnd: boolean = false, source: 'player' | 'opponent' = 'player') {
    if (!this.ensureContext() || !this.duckingFilter || !this.ctx) return;

    // Scale pitch with streak
    const noteIndex = Math.min(streak, PENTATONIC_FREQUENCIES.length - 1);
    const pitch = PENTATONIC_FREQUENCIES[noteIndex];

    const dest =
      source === 'player' && this.playerPanner
        ? this.playerPanner
        : source === 'opponent' && this.opponentPanner
        ? this.opponentPanner
        : this.duckingFilter;

    playProceduralKeystroke(this.ctx, dest, this.activeSoundboard, pitch, isWordEnd);

    if (isWordEnd) {
      playImpactBoom(this.ctx, dest);
    }
  }

  public playMistype() {
    if (!this.ensureContext() || !this.duckingFilter || !this.ctx) return;
    const dest = this.playerPanner || this.duckingFilter;
    playMistypeError(this.ctx, dest);
  }

  public playOverclockWhoosh() {
    if (!this.ensureContext() || !this.duckingFilter || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
    filter.Q.setValueAtTime(5, now);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.duckingFilter);

    osc.start(now);
    osc.stop(now + 0.5);
  }
}

// Global shared sound engine singleton
export const soundEngine = new SoundEngine();
