import { StanceType, StanceConfig, WordTarget } from '../types/combat.ts';

export const STANCE_CONFIGS: Record<StanceType, StanceConfig> = {
  strike: {
    id: 'strike',
    name: 'Strike Stance',
    themeColor: '#FF3333',
    glowColor: 'rgba(255, 51, 51, 0.7)',
    badge: 'STRIKE // 2.0x BURST',
    description: 'Fast punchy verbs that deal 2x burst damage to the kinetic beam and enemy HP.',
    combatBonus: '+100% Beam Push & Damage'
  },
  counter: {
    id: 'counter',
    name: 'Counter Stance',
    themeColor: '#00E5FF',
    glowColor: 'rgba(0, 229, 255, 0.7)',
    badge: 'COUNTER // ABSORB SHIELD',
    description: 'Defensive cybernetic terms that generate an absorption shield converting enemy strikes into health.',
    combatBonus: '+50% Damage Converted to Health'
  },
  disrupt: {
    id: 'disrupt',
    name: 'Disrupt Stance',
    themeColor: '#B026FF',
    glowColor: 'rgba(176, 38, 255, 0.7)',
    badge: 'DISRUPT // UI SCRAMBLER',
    description: 'Awkward symbol syntax that scrambles, flips, or flickers the opponent interface.',
    combatBonus: '2.5s Enemy Screen Glitch & Lag'
  }
};

const STRIKE_WORDS: string[] = [
  'STRIKE', 'BREACH', 'PULVERIZE', 'SHATTER', 'EXECUTE',
  'CLEAVE', 'SMITE', 'OVERLOAD', 'RUPTURE', 'ANNIHILATE',
  'PIERCE', 'DEMOLISH', 'VAPORIZE', 'FRACTURE', 'DECIMATE',
  'BLITZ', 'CRUSH', 'OBLITERATE', 'COMBUST', 'SEVER',
  'SPLINTER', 'SURGE', 'IGNITE', 'DETONATE', 'DISINTEGRATE'
];

const COUNTER_WORDS: string[] = [
  'QUARANTINE', 'ENCRYPT', 'IMMOBILIZE', 'FIREWALL', 'CONTAIN',
  'DEFLECT', 'INSULATE', 'DECRYPT', 'BUFFER', 'ISOLATE',
  'INTERCEPT', 'REINFORCE', 'NEUTRALIZE', 'AUTHENTICATE', 'SAFEGUARD',
  'MITIGATE', 'FORTIFY', 'ENCASE', 'COUNTERACT', 'ABSORB',
  'SHIELD', 'STABILIZE', 'SECURE', 'PRESERVE', 'REVISE'
];

const DISRUPT_WORDS: string[] = [
  '$sys.ptr->0x9F;',
  '!&&_NULL#',
  '[k*~void::run]',
  '@async{42}/',
  '~(buf^0xFF)',
  'const *ref[]=',
  '#!/bin/sh<0>',
  'eval(`%x%`);',
  '{fn()=>_nil}',
  '|pipe|>filter?',
  'struct<T&>{}',
  '0b101101?true',
  '*(int*)0x00=0;',
  'std::move(&v);',
  'fn(x)={!x?0:1}',
  '<<hex::dump>>',
  'catch(e:any){}',
  '[key:string]:v;'
];

const BOSS_WORDS: string[] = [
  'UNCONSCIONABLE',
  'ELECTROMAGNETIC',
  'COUNTERMEASURE',
  'SUPERCONDUCTOR',
  'SYNCHRONIZATION',
  'VULNERABILITY',
  'AUTHENTICATION',
  'DISILLUSIONMENT',
  'DECENTRALIZATION',
  'CRYPTOGRAPHICALLY',
  'MICROCONTROLLER',
  'INDESCRIBABLY',
  'PHOTOVOLTAICS',
  'HYPERTHREADING',
  'CHARACTERISTIC'
];

const CODE_SYNTAX_WORDS: string[] = [
  'std::unique_ptr<T>',
  'fn main() -> Result<()>',
  'export default async',
  'reinterpret_cast<T*>',
  'impl<T> From<U> for T',
  'Promise.allSettled()',
  'git commit -m "init"',
  'interface Combatant<T>',
  'Array.from({length:32})',
  'useCallback(fn, [deps])',
  'process.env.NODE_ENV'
];

export function generateWord(stance: StanceType, modifier?: string): WordTarget {
  let pool: string[];
  if (modifier === 'code_syntax') {
    pool = CODE_SYNTAX_WORDS;
  } else {
    switch (stance) {
      case 'strike':
        pool = STRIKE_WORDS;
        break;
      case 'counter':
        pool = COUNTER_WORDS;
        break;
      case 'disrupt':
        pool = DISRUPT_WORDS;
        break;
      default:
        pool = STRIKE_WORDS;
    }
  }

  const selectedText = pool[Math.floor(Math.random() * pool.length)];
  const baseDamage = stance === 'strike' ? 15 : stance === 'counter' ? 8 : 12;

  return {
    id: `${stance}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    text: selectedText,
    stance,
    damage: baseDamage,
    bonusMultiplier: 1.0
  };
}

export function generateBossWord(): string {
  return BOSS_WORDS[Math.floor(Math.random() * BOSS_WORDS.length)];
}

export function getStanceConfig(stance: StanceType): StanceConfig {
  return STANCE_CONFIGS[stance];
}
