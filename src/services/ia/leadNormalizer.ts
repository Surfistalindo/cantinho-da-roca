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

function isPlausible(d: Date): boolean {
  const y = d.getFullYear();
  const max = new Date().getFullYear() + 5;
  return y >= 2000 && y <= max;
}

function excelSerialToDate(n: number): Date | null {
  if (!isFinite(n) || n <= 0 || n > 80000) return null;
  const ms = Math.round(n * 86400 * 1000);
  const d = new Date(Date.UTC(1899, 11, 30) + ms);
  return isValid(d) ? d : null;
}

function tryParseAmbiguous(a: number, b: number, year: number): Date | null {
  const candidates: Date[] = [];
  if (a >= 1 && a <= 31 && b >= 1 && b <= 12) {
    const d = new Date(year, b - 1, a);
    if (isValid(d) && isPlausible(d)) candidates.push(d);
  }
  if (b >= 1 && b <= 31 && a >= 1 && a <= 12) {
    const d = new Date(year, a - 1, b);
    if (isValid(d) && isPlausible(d)) candidates.push(d);
  }
  if (!candidates.length) return null;
  return candidates[0];
}

function normalizeYear(yy: number): number {
  if (yy >= 100) return yy;
  return yy < 50 ? 2000 + yy : 1900 + yy;
}

/** Pré-limpa string de data: barras duplas, espaços, separadores misturados. */
function cleanDateString(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, '')
    .replace(/\/{2,}/g, '/')   // 04/11//25 -> 04/11/25
    .replace(/-{2,}/g, '-')
    .replace(/\.{2,}/g, '.');
}

function parseDate(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date && isValid(raw)) return raw.toISOString();

  if (typeof raw === 'number') {
    const d = excelSerialToDate(raw);
    if (d && isPlausible(d)) return d.toISOString();
  }

  const original = String(raw).trim();
  if (!original) return null;
  const s = cleanDateString(original);

  if (/^\d+(\.\d+)?$/.test(s)) {
    const d = excelSerialToDate(Number(s));
    if (d && isPlausible(d)) return d.toISOString();
  }

  const iso = parseISO(s);
  if (isValid(iso) && isPlausible(iso)) return iso.toISOString();

  // Padrão tokens com / - .
  const m = s.match(/^(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})$/);
  if (m) {
    const t1 = Number(m[1]);
    const t2 = Number(m[2]);
    const t3 = Number(m[3]);
    if (m[1].length === 4) {
      const d = new Date(t1, t2 - 1, t3);
      if (isValid(d) && isPlausible(d)) return d.toISOString();
    }
    const year = m[3].length === 4 ? t3 : normalizeYear(t3);
    const d = tryParseAmbiguous(t1, t2, year);
    if (d) return d.toISOString();
  }

  const m2 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
  if (m2) {
    const a = Number(m2[1]);
    const b = Number(m2[2]);
    const d = tryParseAmbiguous(a, b, new Date().getFullYear());
    if (d) return d.toISOString();
  }

  const formats = [
    'dd/MM/yyyy', 'd/M/yyyy', 'MM/dd/yyyy', 'M/d/yyyy',
    'dd-MM-yyyy', 'yyyy-MM-dd',
    'dd.MM.yyyy', 'd.M.yyyy', 'dd.MM.yy', 'd.M.yy',
    'dd/MM/yy', 'd/M/yy',
  ];
  for (const fmt of formats) {
    const d = parse(s, fmt, new Date());
    if (isValid(d) && isPlausible(d)) return d.toISOString();
  }
  return null;
}

function makeSyntheticName(phone: string | null, productInterest: string | null): string | null {
  if (productInterest) {
    const trimmed = productInterest.length > 40 ? `${productInterest.slice(0, 40)}…` : productInterest;
    return `Lead — ${trimmed}`;
  }
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    const ddd = digits.length >= 11 ? digits.slice(-11, -9) : '';
    return ddd ? `Lead s/ nome (${ddd} ${last4})` : `Lead s/ nome (${last4})`;
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

  // Fallback: origem = nome da aba quando não veio mapeada e __sheet existe
  // Mas evita gravar nomes de meses/datas como origem (poluiria o filtro de origem)
  if (!data.origin) {
    const sheetMeta = row['__sheet'];
    if (typeof sheetMeta === 'string' && sheetMeta.trim()) {
      const candidate = sheetMeta.trim();
      const monthRe = /^(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*\.?\s*\/?\s*\d{0,4}/i;
      const dateRe = /^\d{1,2}[\/\-.]\d{1,2}([\/\-.]\d{2,4})?$/;
      if (!monthRe.test(candidate) && !dateRe.test(candidate)) {
        data.origin = candidate;
      }
    }
  }

  // Nome sintético quando há telefone OU produto, mas sem nome
  if (!data.name) {
    const synthetic = makeSyntheticName(data.phone, data.product_interest);
    if (synthetic) {
      data.name = synthetic;
      warnings.push('Nome ausente — gerado automaticamente a partir do contato/produto');
    } else {
      errors.push('Linha sem nome, telefone ou produto identificável');
    }
  }

  return { rowIndex, data, errors, warnings };
}

export function normalizeAll(
  rows: Array<Record<string, unknown>>,
  mappings: ColumnMapping[],
): NormalizedLeadRow[] {
  return rows.map((r, i) => normalizeRow(r, mappings, i));
}
