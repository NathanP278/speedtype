export type TrialModifierId = 'code_syntax' | 'blind_duel' | '1hp_sudden_death';

export interface WeeklyTrial {
  id: TrialModifierId;
  name: string;
  badge: string;
  themeColor: string;
  description: string;
  rules: string[];
  kpBounty: number;
}

export const WEEKLY_TRIALS: Record<TrialModifierId, WeeklyTrial> = {
  code_syntax: {
    id: 'code_syntax',
    name: 'Code Syntax Only',
    badge: '[SYNTAX_PRO]',
    themeColor: '#00E5FF',
    description: 'Strips plain English dictionary. Generates exclusively Rust, C++, and TypeScript programming tokens.',
    rules: [
      'Target words include brackets, pointers, arrows, and keywords (e.g. std::unique_ptr<T>).',
      'Case sensitivity and punctuation precision strictly enforced.',
      'Completed code tokens deal +50% bonus beam push.',
    ],
    kpBounty: 750,
  },
  blind_duel: {
    id: 'blind_duel',
    name: 'Blind Duel (Muscle Memory)',
    badge: '[BLIND_OPERATOR]',
    themeColor: '#B026FF',
    description: 'Tests pure spatial muscle memory. The word is flashed for 0.5s and then masked into dots until completed.',
    rules: [
      'Typed characters render as masked bullet points.',
      'Zero visual feedback until full word is successfully confirmed.',
      'Typo immediately resets the current masked token.',
    ],
    kpBounty: 850,
  },
  '1hp_sudden_death': {
    id: '1hp_sudden_death',
    name: '1 HP Sudden Death',
    badge: '[LETHAL_OVERCLOCK]',
    themeColor: '#FF3333',
    description: 'High-stakes instant fatality duel. Both combatants possess exactly 1 HP.',
    rules: [
      'Both Player and Opponent start at 1 HP.',
      'A single unabsorbed hit or beam recoil causes immediate knockout.',
      'Absorption shields and parries are essential for survival.',
    ],
    kpBounty: 1000,
  },
};
