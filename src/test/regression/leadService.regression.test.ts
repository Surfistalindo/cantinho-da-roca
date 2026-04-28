import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseMock, resetSupabaseMock, mockResult, mockCalls, mockTable } from './_supabaseMock';
import { leadService } from '@/services/leadService';

describe('Regressão: leadService (CRUD + filtros)', () => {
  beforeEach(() => {
    resetSupabaseMock();
    supabaseMock.from.mockClear();
  });

  it('list() consulta tabela leads ordenando por created_at desc', async () => {
    mockResult([{ id: '1', name: 'A', status: 'new' }]);
    const data = await leadService.list();
    expect(supabaseMock.from).toHaveBeenCalledWith('leads');
    expect(mockTable()).toBe('leads');
    const calls = mockCalls();
    expect(calls.find((c) => c.method === 'select')).toBeTruthy();
    expect(calls.find((c) => c.method === 'order')).toEqual({
      method: 'order',
      args: ['created_at', { ascending: false }],
    });
    expect(data).toHaveLength(1);
  });

  it('list({ status, origin }) aplica filtros .eq()', async () => {
    mockResult([]);
    await leadService.list({ status: 'qualified', origin: 'Site' });
    const eqCalls = mockCalls().filter((c) => c.method === 'eq');
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        { method: 'eq', args: ['status', 'qualified'] },
        { method: 'eq', args: ['origin', 'Site'] },
      ])
    );
  });

  it('list({ search }) aplica .or() saneado contra injection', async () => {
    mockResult([]);
    await leadService.list({ search: 'Maria,*()\'' });
    const orCall = mockCalls().find((c) => c.method === 'or');
    expect(orCall).toBeTruthy();
    const filter = (orCall!.args[0] as string);
    // Caracteres perigosos não devem aparecer no filtro .or()
    expect(filter).not.toMatch(/[,()'"*\\]/);
    expect(filter).toContain('name.ilike');
    expect(filter).toContain('phone.ilike');
  });

  it('create() valida payload e insere com campos esperados', async () => {
    mockResult({ id: 'new-1', name: 'João' });
    const created = await leadService.create({
      name: 'João Silva',
      phone: '11999999999',
      origin: 'Instagram',
      product_interest: 'Chá de hibisco',
    });
    const insertCall = mockCalls().find((c) => c.method === 'insert');
    expect(insertCall).toBeTruthy();
    const payload = insertCall!.args[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      name: 'João Silva',
      phone: '11999999999',
      origin: 'Instagram',
      product_interest: 'Chá de hibisco',
    });
    expect(created).toEqual({ id: 'new-1', name: 'João' });
  });

  it('create() rejeita nome inválido (regra de validação)', async () => {
    await expect(
      leadService.create({ name: 'A', phone: '11999999999' })
    ).rejects.toThrow();
  });

  it('updateStatus() valida e chama .update().eq(id)', async () => {
    mockResult(null);
    await leadService.updateStatus('lead-1', 'won');
    const updateCall = mockCalls().find((c) => c.method === 'update');
    const eqCall = mockCalls().find((c) => c.method === 'eq');
    expect((updateCall!.args[0] as Record<string, unknown>).status).toBe('won');
    expect(eqCall).toEqual({ method: 'eq', args: ['id', 'lead-1'] });
  });

  it('delete() chama .delete().eq(id)', async () => {
    mockResult(null);
    await leadService.delete('lead-9');
    expect(mockCalls().find((c) => c.method === 'delete')).toBeTruthy();
    expect(mockCalls().find((c) => c.method === 'eq')).toEqual({
      method: 'eq',
      args: ['id', 'lead-9'],
    });
  });

  it('propaga erro do Supabase (estado de erro tratado)', async () => {
    mockResult(null, { message: 'permission denied', code: '42501' });
    await expect(leadService.list()).rejects.toMatchObject({ message: 'permission denied' });
  });
});
