import { describe, it, expect } from 'vitest';
import {
  leadCreateSchema,
  leadUpdateSchema,
  customerCreateSchema,
  escapePostgrestSearch,
  stripHtml,
} from '@/lib/validation/schemas';

describe('Regressão: schemas de validação', () => {
  it('leadCreateSchema aceita payload válido', () => {
    const r = leadCreateSchema.parse({ name: 'João Silva', phone: '11999999999' });
    expect(r.name).toBe('João Silva');
  });

  it('leadCreateSchema remove HTML do nome', () => {
    const r = leadCreateSchema.parse({ name: '<b>João</b>', phone: '11999999999' });
    expect(r.name).toBe('João');
  });

  it('leadCreateSchema rejeita telefone com letras', () => {
    expect(() =>
      leadCreateSchema.parse({ name: 'João', phone: 'abc' })
    ).toThrow();
  });

  it('leadUpdateSchema aceita atualização parcial', () => {
    const r = leadUpdateSchema.parse({ status: 'won' });
    expect(r.status).toBe('won');
  });

  it('customerCreateSchema aceita só name', () => {
    const r = customerCreateSchema.parse({ name: 'Maria' });
    expect(r.name).toBe('Maria');
  });

  it('stripHtml remove tags', () => {
    expect(stripHtml('<script>x</script>oi')).toBe('oi');
  });

  it('escapePostgrestSearch remove caracteres perigosos', () => {
    expect(escapePostgrestSearch("a,b()'*\\\"c")).toBe('abc');
  });

  it('escapePostgrestSearch limita a 100 chars', () => {
    expect(escapePostgrestSearch('x'.repeat(500))).toHaveLength(100);
  });
});
