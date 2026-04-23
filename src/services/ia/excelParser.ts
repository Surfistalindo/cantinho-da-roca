import * as XLSX from 'xlsx';

export interface ParsedSheet {
  headers: string[];
  rows: Array<Record<string, unknown>>;
  rawRows: unknown[][];
  sheetName: string;
  totalRows: number;
}

const MAX_ROWS = 5000;

export async function parseExcelFile(file: File): Promise<ParsedSheet> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('Planilha vazia');
  const ws = wb.Sheets[sheetName];

  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '', raw: false });
  if (aoa.length === 0) throw new Error('Planilha sem dados');

  // Detecta primeira linha não vazia como cabeçalho
  let headerIdx = 0;
  while (headerIdx < aoa.length && aoa[headerIdx].every((c) => c === '' || c == null)) headerIdx++;
  if (headerIdx >= aoa.length) throw new Error('Cabeçalho não encontrado');

  const headerRow = aoa[headerIdx].map((c, i) => String(c ?? '').trim() || `Coluna ${i + 1}`);
  const dataRows = aoa.slice(headerIdx + 1).filter((r) => r.some((c) => c !== '' && c != null));
  const limited = dataRows.slice(0, MAX_ROWS);

  const rows = limited.map((r) => {
    const obj: Record<string, unknown> = {};
    headerRow.forEach((h, i) => { obj[h] = r[i] ?? ''; });
    return obj;
  });

  return {
    headers: headerRow,
    rows,
    rawRows: limited,
    sheetName,
    totalRows: dataRows.length,
  };
}
