import { describe, it, expect, beforeEach } from 'vitest';
import { supabaseMock, resetSupabaseMock, mockResult, mockCalls } from './_supabaseMock';
import { clientService } from '@/services/clientService';

describe('Regressão: clientService (CRUD)', () => {
  beforeEach(() => {
    resetSupabaseMock();
    supabaseMock.from.mockClear();
  });

  it('list() consulta tabela customers ordenado por created_at desc', async () => {
    mockResult([{ id: 'c1', name: 'Cliente' }]);
    const data = await clientService.list();
    expect(supabaseMock.from).toHaveBeenCalledWith('customers');
    expect(mockCalls().find((c) => c.method === 'order')).toEqual({
      method: 'order',
      args: ['created_at', { ascending: false }],
    });
    expect(data).toHaveLength(1);
  });

  it('create() valida e insere cliente', async () => {
    mockResult({ id: 'c1', name: 'Maria' });
    const created = await clientService.create({
      name: 'Maria Silva',
      phone: '11988887777',
      product_bought: 'Mel puro',
    });
    const insertCall = mockCalls().find((c) => c.method === 'insert');
    expect(insertCall).toBeTruthy();
    expect((insertCall!.args[0] as Record<string, unknown>).name).toBe('Maria Silva');
    expect(created).toEqual({ id: 'c1', name: 'Maria' });
  });

  it('create() rejeita nome muito curto', async () => {
    await expect(clientService.create({ name: 'X' })).rejects.toThrow();
  });

  it('update() chama .update().eq(id)', async () => {
    mockResult(null);
    await clientService.update('c1', { name: 'Maria Souza' });
    expect(mockCalls().find((c) => c.method === 'update')).toBeTruthy();
    expect(mockCalls().find((c) => c.method === 'eq')).toEqual({
      method: 'eq',
      args: ['id', 'c1'],
    });
  });

  it('delete() chama .delete().eq(id)', async () => {
    mockResult(null);
    await clientService.delete('c1');
    expect(mockCalls().find((c) => c.method === 'delete')).toBeTruthy();
  });
});
