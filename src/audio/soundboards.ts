export type SoundboardId = 'thock' | 'model_m' | 'typewriter' | 'blip' | 'silent';

export interface SoundboardPack {
  id: SoundboardId;
  name: string;
  description: string;
  year: string;
}

export const SOUNDBOARD_PACKS: Record<SoundboardId, SoundboardPack> = {
  thock: {
    id: 'thock',
    name: 'Mechanical Thock',
    description: 'Deep, resonant tactile switch sound with clean acoustic dampening.',
    year: '2023',
  },
  model_m: {
    id: 'model_m',
    name: 'IBM Model M',
    description: 'Iconic buckling spring click with metallic chime resonance.',
    year: '1985',
  },
  typewriter: {
    id: 'typewriter',
    name: 'Vintage Typewriter',
    description: 'Heavy mechanical hammer strike with carriage return bell on words.',
    year: '1952',
  },
  blip: {
    id: 'blip',
    name: '8-Bit Blip Arcade',
    description: 'Synthesized retro chiptune square wave arpeggios.',
    year: '1983',
  },
  silent: {
    id: 'silent',
    name: 'Silent Dampener',
    description: 'Subtle, muffled stealth switch for high-speed tournament focus.',
    year: '2021',
  },
};

// Procedural sound synthesis algorithms
export function playProceduralKeystroke(
  ctx: AudioContext,
  dest: AudioNode,
  packId: SoundboardId,
  pitchFreq: number,
  isWordEnd: boolean = false
) {
  const now = ctx.currentTime;

  switch (packId) {
    case 'thock': {
      // Deep bass punch + transient click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(140 + (pitchFreq - 440) * 0.2, now);
      filter.Q.setValueAtTime(3.0, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitchFreq * 0.35, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.04);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.05);
      break;
    }

    case 'model_m': {
      // Stage 1: Tactile snap
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'square';
      snapOsc.frequency.setValueAtTime(2200, now);
      snapGain.gain.setValueAtTime(0.4, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      snapOsc.connect(snapGain);
      snapGain.connect(dest);
      snapOsc.start(now);
      snapOsc.stop(now + 0.025);

      // Stage 2: Metallic spring chime resonance
      const springOsc = ctx.createOscillator();
      const springGain = ctx.createGain();
      const springFilter = ctx.createBiquadFilter();

      springFilter.type = 'bandpass';
      springFilter.frequency.setValueAtTime(4500 + (pitchFreq - 440), now);
      springFilter.Q.setValueAtTime(8.0, now);

      springOsc.type = 'sawtooth';
      springOsc.frequency.setValueAtTime(pitchFreq * 1.5, now);

      springGain.gain.setValueAtTime(0.3, now + 0.01);
      springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      springOsc.connect(springFilter);
      springFilter.connect(springGain);
      springGain.connect(dest);

      springOsc.start(now + 0.01);
      springOsc.stop(now + 0.08);
      break;
    }

    case 'typewriter': {
      // Hammer strike
      const strikeOsc = ctx.createOscillator();
      const strikeGain = ctx.createGain();
      strikeOsc.type = 'sawtooth';
      strikeOsc.frequency.setValueAtTime(800, now);
      strikeGain.gain.setValueAtTime(0.6, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      strikeOsc.connect(strikeGain);
      strikeGain.connect(dest);
      strikeOsc.start(now);
      strikeOsc.stop(now + 0.04);

      // Carriage return bell on word completion
      if (isWordEnd) {
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(2800, now + 0.02);
        bellGain.gain.setValueAtTime(0.5, now + 0.02);
        bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        bellOsc.connect(bellGain);
        bellGain.connect(dest);
        bellOsc.start(now + 0.02);
        bellOsc.stop(now + 0.4);
      }
      break;
    }

    case 'blip': {
      // 8-bit square chip
      const blipOsc = ctx.createOscillator();
      const blipGain = ctx.createGain();
      blipOsc.type = 'square';
      blipOsc.frequency.setValueAtTime(pitchFreq, now);
      blipOsc.frequency.exponentialRampToValueAtTime(pitchFreq * 1.6, now + 0.035);

      blipGain.gain.setValueAtTime(0.3, now);
      blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      blipOsc.connect(blipGain);
      blipGain.connect(dest);
      blipOsc.start(now);
      blipOsc.stop(now + 0.05);
      break;
    }

    case 'silent': {
      // Soft padded dampener
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.035);
      break;
    }
  }
}

export function playMistypeError(ctx: AudioContext, dest: AudioNode) {
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  // Discordant low buzzer
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(82, now);

  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(87, now); // 5Hz beat frequency dissonance

  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(dest);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.15);
  osc2.stop(now + 0.15);
}

export function playImpactBoom(ctx: AudioContext, dest: AudioNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

  gain.gain.setValueAtTime(0.8, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc.connect(gain);
  gain.connect(dest);

  osc.start(now);
  osc.stop(now + 0.4);
}
