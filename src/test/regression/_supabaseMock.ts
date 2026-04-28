// Mock chainable do Supabase client.
// Cada teste injeta o "resultado final" via mockResult() e captura
// a sequência de chamadas em mockCalls para fazer asserts.
import { vi } from 'vitest';

interface MockState {
  result: { data: unknown; error: unknown };
  calls: Array<{ method: string; args: unknown[] }>;
  table: string | null;
}

const state: MockState = {
  result: { data: null, error: null },
  calls: [],
  table: null,
};

export function mockResult(data: unknown, error: unknown = null) {
  state.result = { data, error };
}

export function mockCalls() {
  return state.calls;
}

export function mockTable() {
  return state.table;
}

export function resetSupabaseMock() {
  state.result = { data: null, error: null };
  state.calls = [];
  state.table = null;
}

function record(method: string, args: unknown[]) {
  state.calls.push({ method, args });
}

function makeBuilder() {
  // Builder is thenable so `await` resolves to the configured result.
  const builder: any = {
    select: (...a: unknown[]) => { record('select', a); return builder; },
    insert: (...a: unknown[]) => { record('insert', a); return builder; },
    update: (...a: unknown[]) => { record('update', a); return builder; },
    delete: (...a: unknown[]) => { record('delete', a); return builder; },
    eq: (...a: unknown[]) => { record('eq', a); return builder; },
    or: (...a: unknown[]) => { record('or', a); return builder; },
    order: (...a: unknown[]) => { record('order', a); return builder; },
    single: (...a: unknown[]) => { record('single', a); return builder; },
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(state.result).then(resolve),
  };
  return builder;
}

export const supabaseMock = {
  from: vi.fn((table: string) => {
    state.table = table;
    return makeBuilder();
  }),
  auth: {
    signInWithPassword: vi.fn(async (_: { email: string; password: string }) => state.result),
    signOut: vi.fn(async () => ({ error: null })),
    resetPasswordForEmail: vi.fn(async (_email: string, _opts?: unknown) => state.result),
    getSession: vi.fn(async () => ({ data: { session: null } })),
    onAuthStateChange: vi.fn((_cb: unknown) => ({
      data: { subscription: { unsubscribe: () => {} } },
    })),
  },
};

// Mock the supabase client module globally for any test that imports it.
vi.mock('@/integrations/supabase/client', () => ({
  supabase: supabaseMock,
}));
