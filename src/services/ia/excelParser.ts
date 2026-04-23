import * as XLSX from 'xlsx';
import { FIELD_DICTIONARY, normalizeHeader } from '@/lib/ia/fieldDictionary';

export interface SheetSummary {
  name: string;
  rows: number;
  skipped?: string;
  headerRowIndex?: number; // 0-based linha onde achamos o header
}

/** Dados completos de uma aba para mapeamento independente. */
export interface PerSheetData {
  name: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
  rawRows: unknown[][];
  totalRows: number;
}

export interface ParsedSheet {
  /** União de todos os headers (compat com fluxo antigo). */
  headers: string[];
  /** Soma de todas as rows de todas as abas (compat). */
  rows: Array<Record<string, unknown>>;
  rawRows: unknown[][];
  sheetName: string; // primeira aba lida (compat)
  totalRows: number;
  sheets: SheetSummary[];
  /** Novo: dados por aba para mapeamento independente. */
  perSheet?: PerSheetData[];
}

const MAX_ROWS = 5000;
const HEADER_SCAN_DEPTH = 6;

/** Conjunto plano de todos os sinônimos para detecção de header. */
const ALL_SYNONYMS = new Set<string>(
  Object.values(FIELD_DICTIONARY).flat(),
);

/** Heurística: avalia quão "header-like" é uma linha. */
function scoreHeaderRow(row: unknown[]): number {
  const cells = row.map((c) => String(c ?? '').trim()).filter((c) => c.length > 0);
  if (cells.length === 0) return -1;

  let score = 0;
  let dictMatches = 0;
  let purelyNumeric = 0;
  let tooLong = 0;

  for (const c of cells) {
    const norm = normalizeHeader(c);
    // Match com dicionário (parcial conta menos)
    if (ALL_SYNONYMS.has(norm)) {
      dictMatches += 2;
    } else {
      for (const syn of ALL_SYNONYMS) {
        if (norm.length >= 3 && (norm.includes(syn) || syn.includes(norm))) {
          dictMatches += 1;
          break;
        }
      }
    }
    // Números puros = não é header
    if (/^\d+$/.test(c.replace(/[\s.,/-]/g, ''))) purelyNumeric += 1;
    // Cabeçalho costuma ser curto
    if (c.length > 50) tooLong += 1;
  }

  score += dictMatches * 3;
  score -= purelyNumeric * 2;
  score -= tooLong * 2;
  // Linha com muitas células curtas e não-numéricas tem boost
  const shortCells = cells.filter((c) => c.length <= 40 && !/^\d+$/.test(c)).length;
  score += shortCells;
  // Penaliza linhas muito esparsas (só 1 célula)
  if (cells.length <= 1 && row.length > 3) score -= 5;
  return score;
}

function pickHeaderIndex(aoa: unknown[][]): number {
  // Considera as primeiras N linhas não-vazias
  const candidates: Array<{ idx: number; score: number }> = [];
  let scanned = 0;
  for (let i = 0; i < aoa.length && scanned < HEADER_SCAN_DEPTH; i++) {
    const row = aoa[i];
    if (!row || row.every((c) => c === '' || c == null)) continue;
    scanned += 1;
    candidates.push({ idx: i, score: scoreHeaderRow(row) });
  }
  if (candidates.length === 0) return -1;
  // Escolhe maior score; empate → mais cedo
  candidates.sort((a, b) => b.score - a.score || a.idx - b.idx);
  // Se o melhor candidato tem score muito ruim, fallback: primeira não-vazia
  if (candidates[0].score < 1) {
    return candidates.sort((a, b) => a.idx - b.idx)[0].idx;
  }
  return candidates[0].idx;
}

interface ParsedOneSheet {
  headers: string[];
  rows: Array<Record<string, unknown>>;
  totalRows: number;
  headerRowIndex: number;
}

function parseSingleSheet(ws: XLSX.WorkSheet): ParsedOneSheet | null {
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: true });
  if (aoa.length === 0) return null;

  const headerIdx = pickHeaderIndex(aoa);
  if (headerIdx < 0) return null;

  // Cria headers únicos (deduplica colisões)
  const seen = new Map<string, number>();
  const headerRow = aoa[headerIdx].map((c, i) => {
    const base = String(c ?? '').trim() || `Coluna ${i + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });

  const dataRows = aoa.slice(headerIdx + 1).filter((r) => r.some((c) => c !== '' && c != null));
  if (dataRows.length === 0) return null;

  const rows = dataRows.map((r) => {
    const obj: Record<string, unknown> = {};
    headerRow.forEach((h, i) => { obj[h] = r[i] ?? ''; });
    return obj;
  });

  return { headers: headerRow, rows, totalRows: dataRows.length, headerRowIndex: headerIdx };
}

export async function parseExcelFile(file: File): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  if (!wb.SheetNames.length) throw new Error('Planilha vazia');

  const sheetSummaries: SheetSummary[] = [];
  const perSheet: PerSheetData[] = [];
  const allHeaders = new Set<string>();
  const allRows: Array<Record<string, unknown>> = [];
  let firstSheetName = '';
  let totalRows = 0;

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const parsed = parseSingleSheet(ws);
    if (!parsed) {
      sheetSummaries.push({ name, rows: 0, skipped: 'sem cabeçalho reconhecível ou sem dados' });
      continue;
    }
    if (!firstSheetName) firstSheetName = name;

    // Per-sheet data (com __sheet metadata p/ origem fallback)
    const sheetRows = parsed.rows.map((r) => ({ ...r, __sheet: name }));
    const sheetHeaders = [...parsed.headers, '__sheet'];
    const sheetRawRows = sheetRows.map((r) => sheetHeaders.map((h) => r[h]));
    perSheet.push({
      name,
      headers: sheetHeaders,
      rows: sheetRows,
      rawRows: sheetRawRows,
      totalRows: parsed.totalRows,
    });

    // Compat: union global
    sheetHeaders.forEach((h) => allHeaders.add(h));
    for (const r of sheetRows) {
      allRows.push(r);
      if (allRows.length >= MAX_ROWS) break;
    }
    sheetSummaries.push({ name, rows: parsed.totalRows, headerRowIndex: parsed.headerRowIndex });
    totalRows += parsed.totalRows;
    if (allRows.length >= MAX_ROWS) break;
  }

  if (allRows.length === 0) throw new Error('Nenhuma aba com dados válidos encontrada');

  const headers = Array.from(allHeaders);
  const normalizedRows = allRows.map((r) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h) => { obj[h] = r[h] ?? ''; });
    return obj;
  });
  const rawRows = normalizedRows.map((r) => headers.map((h) => r[h]));

  return {
    headers,
    rows: normalizedRows,
    rawRows,
    sheetName: firstSheetName || wb.SheetNames[0],
    totalRows,
    sheets: sheetSummaries,
    perSheet,
  };
}
