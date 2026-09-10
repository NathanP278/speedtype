/**
 * Live Nemesis Words Telemetry Tracker
 * Tracks attempted words, typos, and beam recoils during combat matches.
 */

export interface WordTelemetryEntry {
  attempts: number;
  mistakes: number;
  recoils: number;
}

export class NemesisTelemetryTracker {
  private attemptedWords: Set<string> = new Set();
  private failedWordsList: string[] = [];
  private wordStatsMap: Map<string, WordTelemetryEntry> = new Map();
  private activeWord: string | null = null;
  private fatalWord: string | null = null;

  public reset(): void {
    this.attemptedWords.clear();
    this.failedWordsList = [];
    this.wordStatsMap.clear();
    this.activeWord = null;
    this.fatalWord = null;
  }

  public setActiveWord(word: string): void {
    if (!word) return;
    this.activeWord = word;
    this.attemptedWords.add(word);
    if (!this.wordStatsMap.has(word)) {
      this.wordStatsMap.set(word, { attempts: 1, mistakes: 0, recoils: 0 });
    }
  }

  public recordMistype(word?: string): void {
    const target = word || this.activeWord;
    if (!target) return;

    this.attemptedWords.add(target);
    this.failedWordsList.push(target);

    const stats = this.wordStatsMap.get(target) || { attempts: 1, mistakes: 0, recoils: 0 };
    stats.mistakes += 1;
    this.wordStatsMap.set(target, stats);
  }

  public recordRecoil(word?: string): void {
    const target = word || this.activeWord;
    if (!target) return;

    this.attemptedWords.add(target);
    // If target hasn't been pushed for this specific event, record failure
    this.failedWordsList.push(target);

    const stats = this.wordStatsMap.get(target) || { attempts: 1, mistakes: 0, recoils: 0 };
    stats.recoils += 1;
    this.wordStatsMap.set(target, stats);
  }

  public recordFatalDefeat(word?: string): void {
    const target = word || this.activeWord;
    if (target) {
      this.fatalWord = target;
      this.attemptedWords.add(target);
    }
  }

  public getActiveWord(): string | null {
    return this.activeWord;
  }

  public getFatalWord(): string | undefined {
    return this.fatalWord ?? undefined;
  }

  public getFailedWords(): string[] {
    return [...this.failedWordsList];
  }

  public getUniqueFailedWords(): string[] {
    return Array.from(new Set(this.failedWordsList));
  }

  public getWordsAttempted(): string[] {
    return Array.from(this.attemptedWords);
  }

  public getWordStats(word: string): WordTelemetryEntry | undefined {
    return this.wordStatsMap.get(word);
  }
}
