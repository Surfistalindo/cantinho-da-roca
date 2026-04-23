import { parse, isValid, parseISO } from 'date-fns';
import { normalizePhone } from '@/lib/ia/phoneFormat';
import { inferStatus } from '@/lib/ia/statusInference';
import type { ColumnMapping } from './columnMapper';
import type { LeadStatus } from '@/config/app';

export interface NormalizedLeadRow {
  rowIndex: number;
  data: {
    name: string | null;
    phone: string | null;
    origin: string | null;
    product_interest: string | null;
    status: LeadStatus;
    next_contact_at: string | null;
    notes: string | null;
  };
  errors: string[];
  warnings: string[];
}

function cleanText(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  return s.length ? s : null;
}

function parseDate(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date && isValid(raw)) return raw.toISOString();
  const s = String(raw).trim();
  if (!s) return null;

  // ISO
  const iso = parseISO(s);
  if (isValid(iso)) return iso.toISOString();

  const formats = ['dd/MM/yyyy', 'd/M/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'dd/MM/yy', 'dd/MM'];
  for (const fmt of formats) {
    const d = parse(s, fmt, new Date());
    if (isValid(d)) {
      // Para dd/MM, assumimos ano corrente
      if (fmt === 'dd/MM') d.setFullYear(new Date().getFullYear());
      return d.toISOString();
    }
  }
  return null;
}

export function normalizeRow(
  row: Record<string, unknown>,
  mappings: ColumnMapping[],
  rowIndex: number,
): NormalizedLeadRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const data: NormalizedLeadRow['data'] = {
    name: null, phone: null, origin: null,
    product_interest: null, status: 'new' as LeadStatus,
    next_contact_at: null, notes: null,
  };

  for (const m of mappings) {
    if (m.target === 'ignore') continue;
    const raw = row[m.source];
    switch (m.target) {
      case 'name': data.name = cleanText(raw); break;
      case 'phone': {
        const p = normalizePhone(raw);
        if (raw && !p) warnings.push(`Telefone inválido: "${String(raw)}"`);
        data.phone = p;
        break;
      }
      case 'origin': data.origin = cleanText(raw); break;
      case 'product_interest': data.product_interest = cleanText(raw); break;
      case 'status': {
        const inf = inferStatus(raw);
        data.status = inf.status;
        if (raw && !inf.matched) warnings.push(`Status "${String(raw)}" não reconhecido — usando "novo"`);
        break;
      }
      case 'next_contact_at': {
        const d = parseDate(raw);
        if (raw && !d) warnings.push(`Data inválida: "${String(raw)}"`);
        data.next_contact_at = d;
        break;
      }
      case 'notes': data.notes = cleanText(raw); break;
    }
  }

  if (!data.name) errors.push('Nome obrigatório ausente');

  return { rowIndex, data, errors, warnings };
}

export function normalizeAll(
  rows: Array<Record<string, unknown>>,
  mappings: ColumnMapping[],
): NormalizedLeadRow[] {
  return rows.map((r, i) => normalizeRow(r, mappings, i));
}
