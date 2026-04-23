import type { ParsedSheet } from '@/services/ia/excelParser';

interface ExcelPreviewTableProps {
  parsed: ParsedSheet;
  rows?: number;
}

export default function ExcelPreviewTable({ parsed, rows = 8 }: ExcelPreviewTableProps) {
  const preview = parsed.rows.slice(0, rows);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-foreground">Pré-visualização</h4>
        <span className="text-[11px] text-muted-foreground font-mono">
          {parsed.totalRows} {parsed.totalRows === 1 ? 'linha' : 'linhas'} · {parsed.headers.length} colunas
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
