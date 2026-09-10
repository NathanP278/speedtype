export type CommentarySpeaker = 'CASTER' | 'ANALYST' | 'ARENA';

export type CommentaryEventType =
  | 'intro'
  | 'surge'
  | 'recoil'
  | 'low_hp'
  | 'ko'
  | 'champion'
  | 'system';

export interface CommentaryLine {
  id: string;
  timestamp: number;
  speaker: CommentarySpeaker;
  speakerColor: string;
  text: string;
  type: CommentaryEventType;
}

export interface CommentaryContext {
  roundName?: string;
  matchName?: string;
  contestant1Name?: string;
  contestant2Name?: string;
  winnerName?: string;
  loserName?: string;
  activeContestantName?: string;
  wpm?: number;
  word?: string;
  hp?: number;
  beamDelta?: number;
}

const SPEAKER_COLORS: Record<CommentarySpeaker, string> = {
  CASTER: '#FBBF24',   // Amber-400
  ANALYST: '#00E5FF',  // Cyan-400
  ARENA: '#E040FB',    // Neon Purple
};

const INTRO_TEMPLATES: Array<{ speaker: CommentarySpeaker; text: (c: CommentaryContext) => string }> = [
  {
    speaker: 'CASTER',
    text: c =>
      `LIVE IN THE ARENA! ${c.contestant1Name || 'GLADIATOR 1'} clashes with ${c.contestant2Name || 'GLADIATOR 2'} in the ${c.roundName || 'bracket'}!`,
  },
  {
    speaker: 'ANALYST',
    text: c =>
      `Key matchup here! Can ${c.contestant2Name || 'the underdog'} weather the opening cadence of ${c.contestant1Name || 'the favorite'}?`,
  },
  {
    speaker: 'CASTER',
    text: c =>
      `Ten fingers, two terminals, one victor! ${c.contestant1Name || 'C1'} vs ${c.contestant2Name || 'C2'} is underway!`,
  },
  {
    speaker: 'ARENA',
    text: c =>
      `>>> KINETIC DUEL COMMENCED: [${c.contestant1Name}] VS [${c.contestant2Name}]. SYNCHRONIZING SPECTATOR FEED...`,
  },
];

const SURGE_TEMPLATES: Array<{ speaker: CommentarySpeaker; text: (c: CommentaryContext) => string }> = [
  {
    speaker: 'CASTER',
    text: c =>
      `BLISTERING SPEED! ${c.activeContestantName || 'Gladiator'} surges to ${c.wpm || 120} WPM on "${c.word || 'EXECUTE'}"!`,
  },
  {
    speaker: 'ANALYST',
    text: c =>
      `That stroke cadence from ${c.activeContestantName || 'the racer'} is metronomic—clocking ${c.wpm || 118} WPM without a single stutter!`,
  },
  {
    speaker: 'CASTER',
    text: c =>
      `ENERGY SURGE! Look at the beam slide—${c.activeContestantName || 'C1'} is in pure flow state!`,
  },
  {
    speaker: 'ANALYST',
    text: c =>
      `Overclock territory! ${c.activeContestantName || 'Gladiator'} just shredded that phrase in under a second!`,
  },
];

const RECOIL_TEMPLATES: Array<{ speaker: CommentarySpeaker; text: (c: CommentaryContext) => string }> = [
  {
    speaker: 'ANALYST',
    text: c =>
      `STUMBLE! ${c.activeContestantName || 'Gladiator'} hit a typo recoil! That 200ms freeze costs massive beam positioning!`,
  },
  {
    speaker: 'CASTER',
    text: c =>
      `A mistype on the syntax! ${c.activeContestantName || 'The gladiator'} slips and eats kinetic blowback!`,
  },
  {
    speaker: 'ANALYST',
    text: c =>
      `Momentum flip for ${c.activeContestantName || 'the contender'}! You cannot afford unforced keystroke errors against this bracket!`,
  },
  {
    speaker: 'CASTER',
    text: c =>
      `Recoil shockwave! The beam snaps hard toward ${c.activeContestantName || 'the trailing terminal'}!`,
  },
];

const LOW_HP_TEMPLATES: Array<{ speaker: CommentarySpeaker; text: (c: CommentaryContext) => string }> = [
  {
    speaker: 'CASTER',
    text: c =>
      `CRITICAL ALERT! ${c.activeContestantName || 'Contestant'} drops to ${c.hp ?? 25}% integrity! One clean word finishes this!`,
  },
  {
    speaker: 'ANALYST',
    text: c =>
      `Danger zone for ${c.activeContestantName || 'defense'}! Buffer integrity is compromised!`,
  },
  {
    speaker: 'CASTER',
    text: c =>
      `ON THE BRINK! Red baseline alarm sounding for ${c.activeContestantName || 'the fighter'}!`,
  },
];

const KO_TEMPLATES: Array<{ speaker: CommentarySpeaker; text: (c: CommentaryContext) => string }> = [
  {
    speaker: 'CASTER',
    text: c =>
      `KNOCKOUT! ${c.winnerName || 'Winner'} detonates the kinetic beam and advances!`,
  },
  {
    speaker: 'ANALYST',
    text: c =>
      `Devastating precision. ${c.winnerName || 'The victor'} kept cool while ${c.loserName || 'opponent'} shattered under pressure.`,
  },
  {
    speaker: 'ARENA',
    text: c =>
      `>>> TERMINAL SHUTDOWN CONFIRMED. [${c.winnerName}] claims victory in ${c.matchName || 'the duel'}!`,
  },
  {
    speaker: 'CASTER',
    text: c =>
      `IT IS OVER! Clean knockout strike from ${c.winnerName || 'the victor'}!`,
  },
];

const CHAMPION_TEMPLATES: Array<{ speaker: CommentarySpeaker; text: (c: CommentaryContext) => string }> = [
  {
    speaker: 'CASTER',
    text: c =>
      `🏆 ALL HAIL THE CHAMPION! ${c.winnerName || 'Champion'} claims the SpeedType Tournament Trophy! Keyboard perfection!`,
  },
  {
    speaker: 'ANALYST',
    text: c =>
      `Historic run from ${c.winnerName || 'the champ'}! From Quarterfinals to the Grand Finals podium without dropping a step!`,
  },
  {
    speaker: 'ARENA',
    text: c =>
      `>>> 🏆 TOURNAMENT COMPLETE. CROWNING CHAMPION: [${c.winnerName}]. PAYOUTS DISPATCHED TO ALL WINNING BETTORS.`,
  },
];

const SYSTEM_TEMPLATES: Array<{ speaker: CommentarySpeaker; text: (c: CommentaryContext) => string }> = [
  {
    speaker: 'ARENA',
    text: c =>
      `>>> ROUND [${c.roundName || 'STAGE'}] BETTING WINDOW OPEN. PLACE WAGERS ON THE CONDUIT TERMINALS.`,
  },
  {
    speaker: 'ARENA',
    text: c =>
      `>>> ADVANCING [${c.roundName || 'BRACKET'}] FIXTURES... PREPARING NEXT MATCH DUEL SIMULATION.`,
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateCommentary(
  type: CommentaryEventType,
  context: CommentaryContext = {}
): CommentaryLine {
  let templatePool = INTRO_TEMPLATES;

  switch (type) {
    case 'intro':
      templatePool = INTRO_TEMPLATES;
      break;
    case 'surge':
      templatePool = SURGE_TEMPLATES;
      break;
    case 'recoil':
      templatePool = RECOIL_TEMPLATES;
      break;
    case 'low_hp':
      templatePool = LOW_HP_TEMPLATES;
      break;
    case 'ko':
      templatePool = KO_TEMPLATES;
      break;
    case 'champion':
      templatePool = CHAMPION_TEMPLATES;
      break;
    case 'system':
      templatePool = SYSTEM_TEMPLATES;
      break;
  }

  const selected = pickRandom(templatePool);
  const text = selected.text(context);

  return {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    speaker: selected.speaker,
    speakerColor: SPEAKER_COLORS[selected.speaker],
    text,
    type,
  };
}
