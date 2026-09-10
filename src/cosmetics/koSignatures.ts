export interface KoSignature {
  id: string;
  name: string;
  art: string[];
  subtitle: string;
}

export const KO_SIGNATURES: Record<string, KoSignature> = {
  terminated: {
    id: 'terminated',
    name: '[TERMINATED] Tombstone',
    subtitle: 'CORE EXECUTION CEASED // BASELINE BREACHED',
    art: [
      '    _____________________    ',
      '   /                     \\   ',
      '  |     R. I. P.          |  ',
      '  |                       |  ',
      '  |   [ PROCESS KILLED ]  |  ',
      '  |   EXIT CODE: 0xDEAD   |  ',
      '  |   SIGSEGV IN MEMORY   |  ',
      '  |_______________________|  ',
      '  |                       |  ',
      ' /=========================\\ ',
    ],
  },
  purge: {
    id: 'purge',
    name: '[REVILED_PURGE] Skull',
    subtitle: 'SYSTEM SANITIZED // HOST OVERRUN',
    art: [
      '        .---.       .---.       ',
      '       /     \\     /     \\      ',
      '      | () () |   | () () |     ',
      '       \\  ^  /     \\  ^  /      ',
      '        |||||       |||||       ',
      '     ___/     \\___ /     \\___   ',
      '    [ PURGE PROTOCOL EXECUTED ] ',
      '    [ ZERO SURVIVOR SIGNALS   ] ',
    ],
  },
  dump: {
    id: 'dump',
    name: '[CORE_DUMP] Memory Matrix',
    subtitle: 'STACK CORRUPTED // BUFFER OVERFLOW DETECTED',
    art: [
      '+-----------------------------------------+',
      '| 0x00007FFF: FF 00 3A DE AD BE EF 00 ... |',
      '| 0x00007FFE: 53 50 45 45 44 54 59 50 45  |',
      '| 0x00007FFD: [CRITICAL_STACK_OVERFLOW]   |',
      '| INSTRUCTION POINTER HIJACKED BY ROOT    |',
      '+-----------------------------------------+',
    ],
  },
  fatal: {
    id: 'fatal',
    name: '[SYNTAX_FATAL] Crash Report',
    subtitle: 'FATAL SYNTAX EXCEPTION // KINETIC KNOCKOUT',
    art: [
      '/!\\ ================================= /!\\',
      '      FATAL_UNHANDLED_EXCEPTION: KO     ',
      '      TARGET RUNTIME DISCONNECTED       ',
      '      WINNER SIGNATURE VERIFIED: ROOT   ',
      '\\!/ ================================= \\!/',
    ],
  },
};
