import type { ParsedSheet } from '@/services/ia/excelParser';

interface ExcelPreviewTableProps {
  parsed: ParsedSheet;
  rows?: number;
}

export default function ExcelPreviewTable({ parsed, rows = 8 }: ExcelPreviewTableProps) {
  const preview = parsed.rows.slice(0, rows);
  const visibleHeaders = parsed.headers.filter((h) => h !== '__sheet');
  const sheetsLoaded = parsed.sheets.filter((s) => !s.skipped);
  const sheetsSkipped = parsed.sheets.filter((s) => s.skipped);
  return (
    <div className="space-y-3">
      {parsed.sheets.length > 1 && (
        <div className="rounded-xl border bg-muted/20 px-4 py-3">
          <div className="text-[12px] font-semibold text-foreground mb-1">
            {sheetsLoaded.length} {sheetsLoaded.length === 1 ? 'aba detectada' : 'abas detectadas'} · {parsed.totalRows} linhas no total
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sheetsLoaded.map((s) => (
              <span key={s.name} className="text-[11px] px-2 py-0.5 rounded-md bg-background border text-muted-foreground font-mono">
                {s.name} ({s.rows})
              </span>
            ))}
          </div>
          {sheetsSkipped.length > 0 && (
            <div className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
              Ignoradas: {sheetsSkipped.map((s) => s.name).join(', ')} (sem cabeçalho ou dados)
            </div>
          )}
        </div>
      )}
      <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-foreground">Pré-visualização</h4>
        <span className="text-[11px] text-muted-foreground font-mono">
          {parsed.totalRows} {parsed.totalRows === 1 ? 'linha' : 'linhas'} · {visibleHeaders.length} colunas
        </span>
      </div>
      <div className="overflow-x-auto max-h-[420px]">
        <table className="w-full text-[12px]">
          <thead className="bg-muted/20 sticky top-0">
            <tr>
              {parsed.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap border-b">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, ri) => (
              <tr key={ri} className="hover:bg-muted/20">
                {parsed.headers.map((h, ci) => (
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
  );
}
