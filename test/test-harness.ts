/**
 * SpeedType Unified Test Harness
 * Provides browser shims, test registry, assertion engine, and summary reporting.
 */

// Browser Environment Shims for Node.js
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, String(value));
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
    clear: (): void => {
      store.clear();
    },
    key: (index: number): string | null => Array.from(store.keys())[index] ?? null,
    get length(): number {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  });
}

// Ensure mockable navigator and vibration history
export interface MockNavigatorState {
  vibrateCalls: Array<number | number[]>;
  clipboardWrites: string[];
}

export const mockNavState: MockNavigatorState = {
  vibrateCalls: [],
  clipboardWrites: [],
};

const navigatorShim = {
  vibrate: (pattern: number | number[]): boolean => {
    mockNavState.vibrateCalls.push(pattern);
    return true;
  },
  clipboard: {
    writeText: async (text: string): Promise<void> => {
      mockNavState.clipboardWrites.push(text);
    },
  },
};

if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: navigatorShim,
    writable: true,
    configurable: true,
  });
} else {
  // If navigator exists (e.g. Node 24 partial navigator), patch vibrate and clipboard if missing
  const nav = globalThis.navigator as unknown as Record<string, unknown>;
  if (typeof nav.vibrate !== 'function') {
    nav.vibrate = navigatorShim.vibrate;
  }
  if (!nav.clipboard) {
    nav.clipboard = navigatorShim.clipboard;
  }
}

// Shims for requestAnimationFrame / cancelAnimationFrame
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number => {
    return setTimeout(() => callback(performance.now()), 16) as unknown as number;
  };
  globalThis.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id as unknown as NodeJS.Timeout);
  };
}

// Test Runner Interfaces
export type TestFn = () => void | Promise<void>;

export interface TestCase {
  name: string;
  fn: TestFn;
}

export interface TestSuite {
  name: string;
  cases: TestCase[];
}

export interface AssertionResult {
  suiteName: string;
  testName: string;
  passed: boolean;
  error?: Error | unknown;
  durationMs: number;
}

const suites: TestSuite[] = [];
let currentSuite: TestSuite | null = null;

export function describe(name: string, fn: () => void): void {
  const previousSuite = currentSuite;
  const newSuite: TestSuite = { name, cases: [] };
  suites.push(newSuite);
  currentSuite = newSuite;
  try {
    fn();
  } finally {
    currentSuite = previousSuite;
  }
}

export function it(name: string, fn: TestFn): void {
  if (!currentSuite) {
    describe('Default Suite', () => {
      currentSuite!.cases.push({ name, fn });
    });
  } else {
    currentSuite.cases.push({ name, fn });
  }
}

export const test = it;

// Deep equality helper
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || typeof a !== 'object' || b === null || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, k)) return false;
    if (!deepEqual(objA[k], objB[k])) return false;
  }
  return true;
}

// Assertion Matchers
export interface Matcher<T> {
  toBe(expected: T): void;
  toEqual(expected: unknown): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeNull(): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeCloseTo(expected: number, delta?: number): void;
  toContain(item: unknown): void;
  toThrow(expectedMessageSubstr?: string): void;
  not: Matcher<T>;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function expect<T>(actual: T): Matcher<T> {
  const createMatcher = (isNegated: boolean): Matcher<T> => {
    return {
      toBe(expected: T): void {
        const pass = actual === expected;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected [${String(actual)}] NOT to be [${String(expected)}]`
              : `Expected [${String(expected)}] (type: ${typeof expected}) but got [${String(actual)}] (type: ${typeof actual})`
          );
        }
      },
      toEqual(expected: unknown): void {
        const pass = deepEqual(actual, expected);
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected values NOT to be deeply equal`
              : `Expected deep equality:\nExpected: ${JSON.stringify(expected, null, 2)}\nActual:   ${JSON.stringify(actual, null, 2)}`
          );
        }
      },
      toBeTruthy(): void {
        const pass = Boolean(actual);
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected value NOT to be truthy, but got [${String(actual)}]`
              : `Expected truthy value but got [${String(actual)}]`
          );
        }
      },
      toBeFalsy(): void {
        const pass = !actual;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected value NOT to be falsy, but got [${String(actual)}]`
              : `Expected falsy value but got [${String(actual)}]`
          );
        }
      },
      toBeNull(): void {
        const pass = actual === null;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated ? `Expected value NOT to be null` : `Expected null but got [${String(actual)}]`
          );
        }
      },
      toBeDefined(): void {
        const pass = actual !== undefined;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated ? `Expected value to be undefined` : `Expected value to be defined but got undefined`
          );
        }
      },
      toBeUndefined(): void {
        const pass = actual === undefined;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated ? `Expected value to be defined` : `Expected undefined but got [${String(actual)}]`
          );
        }
      },
      toBeGreaterThan(expected: number): void {
        const val = actual as unknown as number;
        const pass = typeof val === 'number' && val > expected;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected [${val}] NOT to be > [${expected}]`
              : `Expected [${val}] to be greater than [${expected}]`
          );
        }
      },
      toBeGreaterThanOrEqual(expected: number): void {
        const val = actual as unknown as number;
        const pass = typeof val === 'number' && val >= expected;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected [${val}] NOT to be >= [${expected}]`
              : `Expected [${val}] to be >= [${expected}]`
          );
        }
      },
      toBeLessThan(expected: number): void {
        const val = actual as unknown as number;
        const pass = typeof val === 'number' && val < expected;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected [${val}] NOT to be < [${expected}]`
              : `Expected [${val}] to be less than [${expected}]`
          );
        }
      },
      toBeLessThanOrEqual(expected: number): void {
        const val = actual as unknown as number;
        const pass = typeof val === 'number' && val <= expected;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected [${val}] NOT to be <= [${expected}]`
              : `Expected [${val}] to be <= [${expected}]`
          );
        }
      },
      toBeCloseTo(expected: number, delta: number = 0.01): void {
        const val = actual as unknown as number;
        const pass = typeof val === 'number' && Math.abs(val - expected) <= delta;
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected [${val}] NOT to be within [${delta}] of [${expected}]`
              : `Expected [${val}] to be within [${delta}] of [${expected}]`
          );
        }
      },
      toContain(item: unknown): void {
        let pass = false;
        if (Array.isArray(actual)) {
          pass = (actual as unknown[]).some(x => deepEqual(x, item));
        } else if (typeof actual === 'string') {
          pass = actual.includes(String(item));
        } else {
          throw new Error(`toContain called on non-collection type: ${typeof actual}`);
        }
        if (isNegated ? pass : !pass) {
          throw new Error(
            isNegated
              ? `Expected collection NOT to contain [${JSON.stringify(item)}]`
              : `Collection did not contain expected item: ${JSON.stringify(item)}`
          );
        }
      },
      toThrow(expectedMessageSubstr?: string): void {
        if (typeof actual !== 'function') {
          throw new Error(`toThrow called on non-function: ${typeof actual}`);
        }
        let didThrow = false;
        let caughtError: unknown;
        try {
          (actual as () => unknown)();
        } catch (err) {
          didThrow = true;
          caughtError = err;
        }
        if (isNegated) {
          if (didThrow) {
            throw new Error(`Expected function NOT to throw, but it threw error`);
          }
          return;
        }
        if (!didThrow) {
          throw new Error(`Expected function to throw, but it did not throw`);
        }
        if (expectedMessageSubstr && caughtError instanceof Error) {
          if (!caughtError.message.includes(expectedMessageSubstr)) {
            throw new Error(
              `Expected error message to contain "${expectedMessageSubstr}", but got "${caughtError.message}"`
            );
          }
        }
      },
      get not(): Matcher<T> {
        return createMatcher(!isNegated);
      },
    };
  };

  return createMatcher(false);
}

// Reset runner state
export function resetSuites(): void {
  suites.length = 0;
  currentSuite = null;
  mockNavState.vibrateCalls.length = 0;
  mockNavState.clipboardWrites.length = 0;
  localStorage.clear();
}

// Run all registered suites
export async function runAllRegisteredSuites(verbose: boolean = false): Promise<{
  totalTests: number;
  passedTests: number;
  failedTests: number;
  durationMs: number;
  results: AssertionResult[];
}> {
  const startTime = performance.now();
  const results: AssertionResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const suite of suites) {
    if (verbose) {
      console.log(`\n--- [SUITE] ${suite.name} ---`);
    }

    for (const testCase of suite.cases) {
      const caseStart = performance.now();
      try {
        await testCase.fn();
        const duration = Math.round(performance.now() - caseStart);
        results.push({
          suiteName: suite.name,
          testName: testCase.name,
          passed: true,
          durationMs: duration,
        });
        passed++;
        if (verbose) {
          console.log(`  ✓ ${testCase.name} (${duration}ms)`);
        }
      } catch (err) {
        const duration = Math.round(performance.now() - caseStart);
        results.push({
          suiteName: suite.name,
          testName: testCase.name,
          passed: false,
          error: err,
          durationMs: duration,
        });
        failed++;
        console.error(`  ✗ [FAIL] ${suite.name} > ${testCase.name}`);
        if (err instanceof Error) {
          console.error(`    ${err.message}`);
          if (err.stack) {
            console.error(`    ${err.stack.split('\n').slice(1, 4).join('\n')}`);
          }
        } else {
          console.error(`    ${String(err)}`);
        }
      }
    }
  }

  const totalDuration = Math.round(performance.now() - startTime);

  return {
    totalTests: passed + failed,
    passedTests: passed,
    failedTests: failed,
    durationMs: totalDuration,
    results,
  };
}
