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

export const CODE_SYNTAX_WORDS: string[] = [
  // C++ Tokens
  'std::unique_ptr<T>',
  'reinterpret_cast<T*>',
  'template <typename T>',
  'dynamic_cast<Base*>',
  'std::vector<std::string>',
  'std::make_shared<Node>()',
  'const auto& [key, val]',
  'static_cast<uint32_t>',
  'std::move(resource)',
  'constexpr double PI = 3.14159;',
  '#include <type_traits>',
  'std::atomic<bool> flag{false};',
  'namespace cyber::engine',
  'auto&& [first, second]',
  'std::lock_guard<std::mutex>',

  // Rust Tokens
  'fn main() -> Result<()>',
  'impl<T> From<U> for T',
  'Arc::new(Mutex::new(data))',
  'pub async fn execute(&mut self)',
  'let ref mut buffer = vec![0u8; 1024];',
  '#[derive(Debug, Clone, PartialEq)]',
  'Option<Box<dyn Error + Send + Sync>>',
  'use std::sync::atomic::Ordering;',
  'unsafe { *ptr.offset(offset) }',
  'impl Iterator for Scanner',
  'tokio::spawn(async move {})',
  '&\'a mut [u8]',
  'match res { Ok(v) => v, Err(_) => panic!() }',
  'pub const MAX_PACKET_SIZE: usize = 4096;',

  // TypeScript Tokens
  'export default async',
  'Promise.allSettled()',
  'git commit -m "init"',
  'interface Combatant<T>',
  'Array.from({length:32})',
  'useCallback(fn, [deps])',
  'process.env.NODE_ENV',
  'type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };',
  'const [state, dispatch] = useReducer(reducer, init);',
  'Record<string, unknown>',
  'export type Stance = "strike" | "counter" | "disrupt";',
  'import type { FC, ReactNode } from "react";',
  'as unknown as Record<string, never>',
  'Object.freeze({ ...config })',
  'const res = await fetch(url, { method: "POST" });',
  'type Nullable<T> = T | null | undefined;',
  'export const handler = async (req: Request): Promise<Response> => {'
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
