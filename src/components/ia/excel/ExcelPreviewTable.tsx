import { useState } from 'react';
import type { ParsedSheet, PerSheetData } from '@/services/ia/excelParser';
import { cn } from '@/lib/utils';

interface ExcelPreviewTableProps {
  parsed: ParsedSheet;
  rows?: number;
}

export default function ExcelPreviewTable({ parsed, rows = 8 }: ExcelPreviewTableProps) {
  const sheetsLoaded = parsed.sheets.filter((s) => !s.skipped);
  const sheetsSkipped = parsed.sheets.filter((s) => s.skipped);
  const perSheet: PerSheetData[] = parsed.perSheet ?? [{
    name: parsed.sheetName,
    headers: parsed.headers,
    rows: parsed.rows,
    rawRows: parsed.rawRows,
    totalRows: parsed.totalRows,
  }];

  const [activeSheet, setActiveSheet] = useState<string>(perSheet[0]?.name ?? '');
  const active = perSheet.find((s) => s.name === activeSheet) ?? perSheet[0];
  if (!active) return null;

  const visibleHeaders = active.headers.filter((h) => h !== '__sheet');
  const preview = active.rows.slice(0, rows);
  const headerRowIdx = parsed.sheets.find((s) => s.name === active.name)?.headerRowIndex;

  return (
    <div className="space-y-3 min-w-0 max-w-full">
      {parsed.sheets.length > 1 && (
        <div className="rounded-xl border bg-muted/20 px-4 py-3">
          <div className="text-[12px] font-semibold text-foreground mb-2">
            {sheetsLoaded.length} {sheetsLoaded.length === 1 ? 'aba detectada' : 'abas detectadas'} · {parsed.totalRows} linhas no total
          </div>
          <div className="flex flex-wrap gap-1.5">
            {perSheet.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setActiveSheet(s.name)}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-md border font-mono transition-colors',
                  s.name === active.name
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {s.name} ({s.totalRows})
              </button>
            ))}
          </div>
          {sheetsSkipped.length > 0 && (
            <div className="mt-2 text-[11px] text-muted-foreground">
              Ignoradas: {sheetsSkipped.map((s) => `${s.name} (${s.skipped})`).join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden min-w-0 max-w-full">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col">
            <h4 className="text-[13px] font-semibold text-foreground">
              Pré-visualização {parsed.sheets.length > 1 && <span className="text-muted-foreground font-normal">— aba "{active.name}"</span>}
            </h4>
            {typeof headerRowIdx === 'number' && headerRowIdx > 0 && (
              <span className="text-[10.5px] text-muted-foreground mt-0.5">
                Cabeçalho detectado na linha {headerRowIdx + 1} (linhas anteriores ignoradas)
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            {active.totalRows} {active.totalRows === 1 ? 'linha' : 'linhas'} · {visibleHeaders.length} colunas
          </span>
        </div>
        <div className="surface-table-wrap has-sticky-first" style={{ ['--table-max-h' as string]: '420px' }}>
          <table className="w-full text-[12px]">
            <thead className="bg-muted/20">
              <tr>
                {visibleHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap border-b">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, ri) => (
                <tr key={ri} className="hover:bg-muted/20">
                  {visibleHeaders.map((h, ci) => (
                    <td key={ci} className="px-3 py-2 text-muted-foreground whitespace-nowrap border-b border-border/50 max-w-[200px] truncate">
                      {String(row[h] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
