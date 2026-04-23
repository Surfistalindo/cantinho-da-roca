import * as XLSX from 'xlsx';

export interface SheetSummary {
  name: string;
  rows: number;
  skipped?: string;
}

export interface ParsedSheet {
  headers: string[];
  rows: Array<Record<string, unknown>>;
  rawRows: unknown[][];
  sheetName: string; // primeira aba lida (compat)
  totalRows: number;
  sheets: SheetSummary[];
}

const MAX_ROWS = 5000;

interface ParsedOneSheet {
  headers: string[];
  rows: Array<Record<string, unknown>>;
  totalRows: number;
}

function parseSingleSheet(ws: XLSX.WorkSheet): ParsedOneSheet | null {
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: true });
  if (aoa.length === 0) return null;

  let headerIdx = 0;
  while (headerIdx < aoa.length && aoa[headerIdx].every((c) => c === '' || c == null)) headerIdx++;
  if (headerIdx >= aoa.length) return null;

  const headerRow = aoa[headerIdx].map((c, i) => String(c ?? '').trim() || `Coluna ${i + 1}`);
  const dataRows = aoa.slice(headerIdx + 1).filter((r) => r.some((c) => c !== '' && c != null));
  if (dataRows.length === 0) return null;

  const rows = dataRows.map((r) => {
    const obj: Record<string, unknown> = {};
    headerRow.forEach((h, i) => { obj[h] = r[i] ?? ''; });
    return obj;
  });

  return { headers: headerRow, rows, totalRows: dataRows.length };
}

export async function parseExcelFile(file: File): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  if (!wb.SheetNames.length) throw new Error('Planilha vazia');

  const sheetSummaries: SheetSummary[] = [];
  const allHeaders = new Set<string>();
  const allRows: Array<Record<string, unknown>> = [];
  let firstSheetName = '';
  let totalRows = 0;

  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const parsed = parseSingleSheet(ws);
    if (!parsed) {
      sheetSummaries.push({ name, rows: 0, skipped: 'sem cabeçalho ou dados' });
      continue;
    }
    if (!firstSheetName) firstSheetName = name;
    parsed.headers.forEach((h) => allHeaders.add(h));
    for (const r of parsed.rows) {
      allRows.push({ ...r, __sheet: name });
      if (allRows.length >= MAX_ROWS) break;
    }
    sheetSummaries.push({ name, rows: parsed.totalRows });
    totalRows += parsed.totalRows;
    if (allRows.length >= MAX_ROWS) break;
  }

  if (allRows.length === 0) throw new Error('Nenhuma aba com dados válidos encontrada');

  const headers = Array.from(allHeaders);
  // Normaliza linhas para conter todas as colunas unificadas
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
  };
}
