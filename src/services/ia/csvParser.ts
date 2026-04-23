import Papa from 'papaparse';
import type { ParsedSheet } from './excelParser';

const MAX_ROWS = 5000;
const DELIMS = [',', ';', '\t', '|'] as const;

export interface CsvDetection {
  delimiter: string;
  encoding: string;
  delimiterLabel: string;
}

/** Lê arquivo como texto tentando UTF-8 primeiro; se vir replacement chars, tenta latin1. */
async function readAsText(file: File): Promise<{ text: string; encoding: string }> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  // Heurística: se encontrar muitos U+FFFD (replacement) ou caracteres mal formados típicos,
  // refaz como latin1 (windows-1252).
  const replacementCount = (utf8.match(/\uFFFD/g) ?? []).length;
  const totalLen = utf8.length || 1;
  if (replacementCount / totalLen > 0.001) {
    const latin = new TextDecoder('windows-1252').decode(buf);
    return { text: latin, encoding: 'windows-1252' };
  }
  return { text: utf8, encoding: 'utf-8' };
}

/** Detecta delimitador analisando as primeiras linhas. */
function detectDelimiter(sample: string): string {
  const lines = sample.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
  if (!lines.length) return ',';
  let best = ',';
  let bestScore = -1;
  for (const d of DELIMS) {
    const counts = lines.map((l) => l.split(d).length);
    const first = counts[0];
    if (first <= 1) continue;
    // Consistência: número de colunas estável entre linhas
    const consistent = counts.every((c) => c === first);
    const score = first * (consistent ? 10 : 1);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

function delimiterLabel(d: string): string {
  if (d === ',') return 'vírgula (,)';
  if (d === ';') return 'ponto e vírgula (;)';
  if (d === '\t') return 'tabulação (\\t)';
  if (d === '|') return 'pipe (|)';
  return d;
}

export async function parseCsvFile(
  file: File,
  override?: { delimiter?: string; encoding?: string },
): Promise<ParsedSheet & { detection: CsvDetection }> {
  const { text, encoding } = override?.encoding === 'windows-1252'
    ? { text: new TextDecoder('windows-1252').decode(await file.arrayBuffer()), encoding: 'windows-1252' }
    : override?.encoding === 'utf-8'
      ? { text: new TextDecoder('utf-8').decode(await file.arrayBuffer()), encoding: 'utf-8' }
      : await readAsText(file);

  const delimiter = override?.delimiter ?? detectDelimiter(text.slice(0, 4000));

  const result = Papa.parse<unknown[]>(text, {
    delimiter,
    skipEmptyLines: 'greedy',
    header: false,
  });

  const aoa = result.data as unknown[][];
  if (!aoa.length) throw new Error('CSV sem dados');

  // Cabeçalho = primeira linha não vazia
  let headerIdx = 0;
  while (headerIdx < aoa.length && (aoa[headerIdx] as unknown[]).every((c) => c === '' || c == null)) {
    headerIdx++;
  }
  if (headerIdx >= aoa.length) throw new Error('Cabeçalho não encontrado');

  const headerRow = (aoa[headerIdx] as unknown[]).map((c, i) =>
    String(c ?? '').trim() || `Coluna ${i + 1}`,
  );

  const dataRows = aoa
    .slice(headerIdx + 1)
    .filter((r) => (r as unknown[]).some((c) => c !== '' && c != null));

  const limited = dataRows.slice(0, MAX_ROWS);

  const rows = limited.map((r) => {
    const obj: Record<string, unknown> = {};
    headerRow.forEach((h, i) => {
      obj[h] = (r as unknown[])[i] ?? '';
    });
    return obj;
  });

  return {
    headers: headerRow,
    rows,
    rawRows: limited,
    sheetName: file.name.replace(/\.csv$/i, ''),
    totalRows: dataRows.length,
    detection: {
      delimiter,
      encoding,
      delimiterLabel: delimiterLabel(delimiter),
    },
  };
}
