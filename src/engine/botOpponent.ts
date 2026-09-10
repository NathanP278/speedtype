import { StanceType, WordTarget } from '../types/combat.ts';
import { generateWord } from './dictionary.ts';

export interface BotProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  wpm: number;
  accuracy: number; // 0 to 1
  preferredStance: StanceType;
  stanceSwitchChance: number;
}

export const BOT_ARCHETYPES: Record<string, BotProfile> = {
  ada: {
    id: 'ada-01',
    name: 'Ada-01',
    avatar: '[ADA]',
    title: 'The Cryptographic Aegis',
    wpm: 78,
    accuracy: 0.98,
    preferredStance: 'counter',
    stanceSwitchChance: 0.15,
  },
  shinobi: {
    id: 'shinobi-x',
    name: 'Shinobi-X',
    avatar: '[SHN]',
    title: 'Kinetic Overclock Assassin',
    wpm: 115,
    accuracy: 0.92,
    preferredStance: 'strike',
    stanceSwitchChance: 0.25,
  },
  glitch: {
    id: 'glitch-daemon',
    name: 'Glitch-Daemon',
    avatar: '[GLT]',
    title: 'Interface Saboteur',
    wpm: 92,
    accuracy: 0.90,
    preferredStance: 'disrupt',
    stanceSwitchChance: 0.35,
  },
};

export class BotSimulator {
  private profile: BotProfile;
  private currentStance: StanceType;
  private currentWord: WordTarget;
  private typedCharIndex: number = 0;
  private isRunning: boolean = false;
  private timerId: number | null = null;
  private trialModifier?: string;

  private onCharTyped: (char: string, isCorrect: boolean, stance: StanceType) => void;
  private onWordCompleted: (word: WordTarget) => void;
  private onStanceChanged: (newStance: StanceType) => void;
  private onRecoilFatality?: () => void;

  constructor(
    profileId: string = 'shinobi',
    callbacks: {
      onCharTyped: (char: string, isCorrect: boolean, stance: StanceType) => void;
      onWordCompleted: (word: WordTarget) => void;
      onStanceChanged: (newStance: StanceType) => void;
      onRecoilFatality?: () => void;
    },
    trialModifier?: string
  ) {
    this.profile = BOT_ARCHETYPES[profileId] || BOT_ARCHETYPES.shinobi;
    this.currentStance = this.profile.preferredStance;
    this.trialModifier = trialModifier;
    this.currentWord = generateWord(this.currentStance, this.trialModifier);
    this.onCharTyped = callbacks.onCharTyped;
    this.onWordCompleted = callbacks.onWordCompleted;
    this.onStanceChanged = callbacks.onStanceChanged;
    this.onRecoilFatality = callbacks.onRecoilFatality;
  }

  public start() {
    this.isRunning = true;
    this.scheduleNextChar();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public getProfile(): BotProfile {
    return this.profile;
  }

  public getStance(): StanceType {
    return this.currentStance;
  }

  public getActiveWord(): WordTarget {
    return this.currentWord;
  }

  private scheduleNextChar() {
    if (!this.isRunning) return;

    // Calculate delay from WPM: characters per second = WPM * 5 / 60
    const charsPerSec = (this.profile.wpm * 5) / 60;
    const baseDelayMs = 1000 / charsPerSec;
    // Add realistic jitter (+/- 25%)
    const jitter = (Math.random() - 0.5) * (baseDelayMs * 0.5);
    const delay = Math.max(30, baseDelayMs + jitter);

    this.timerId = window.setTimeout(() => {
      this.step();
    }, delay);
  }

  private step() {
    if (!this.isRunning) return;

    // Roll for accuracy
    const isCorrect = Math.random() < this.profile.accuracy;
    const expectedChar = this.currentWord.text[this.typedCharIndex];

    this.onCharTyped(expectedChar, isCorrect, this.currentStance);

    if (isCorrect) {
      this.typedCharIndex++;

      if (this.typedCharIndex >= this.currentWord.text.length) {
        // Completed word
        this.onWordCompleted(this.currentWord);

        // Maybe switch stance
        if (Math.random() < this.profile.stanceSwitchChance) {
          const stances: StanceType[] = ['strike', 'counter', 'disrupt'];
          this.currentStance = stances[Math.floor(Math.random() * stances.length)];
          this.onStanceChanged(this.currentStance);
        }

        this.currentWord = generateWord(this.currentStance, this.trialModifier);
        this.typedCharIndex = 0;
      }
    } else {
      // 1 HP Sudden Death: bot recoil fatality on unshielded mistype
      if (this.trialModifier === '1hp_sudden_death') {
        if (this.onRecoilFatality) {
          this.onRecoilFatality();
          this.stop();
          return;
        }
      }
    }

    this.scheduleNextChar();
  }
}
