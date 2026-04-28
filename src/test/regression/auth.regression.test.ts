import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseMock, resetSupabaseMock, mockResult } from './_supabaseMock';
import { supabase } from '@/integrations/supabase/client';

describe('Regressão: Autenticação', () => {
  beforeEach(() => {
    resetSupabaseMock();
    supabaseMock.auth.signInWithPassword.mockClear();
    supabaseMock.auth.signOut.mockClear();
    supabaseMock.auth.resetPasswordForEmail.mockClear();
  });

  it('signInWithPassword recebe email + senha corretos', async () => {
    mockResult({ user: { id: 'u1' }, session: { access_token: 't' } }, null);
    await supabase.auth.signInWithPassword({ email: 'a@b.com', password: 'secret123' });
    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret123',
    });
  });

  it('signOut chama o método sem argumentos', async () => {
    await supabase.auth.signOut();
    expect(supabaseMock.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('resetPasswordForEmail recebe redirectTo /reset-password', async () => {
    await supabase.auth.resetPasswordForEmail('a@b.com', {
      redirectTo: 'https://app.test/reset-password',
    });
    const [email, opts] = supabaseMock.auth.resetPasswordForEmail.mock.calls[0];
    expect(email).toBe('a@b.com');
    expect((opts as { redirectTo: string }).redirectTo).toContain('/reset-password');
  });

  it('onAuthStateChange retorna subscription com unsubscribe', () => {
    const result = supabase.auth.onAuthStateChange(() => {});
    expect(typeof result.data.subscription.unsubscribe).toBe('function');
  });
});
