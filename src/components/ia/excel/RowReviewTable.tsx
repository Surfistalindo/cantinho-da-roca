import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faTriangleExclamation, faWandMagicSparkles, faSliders,
} from '@fortawesome/free-solid-svg-icons';
import RowEditCell, { type CellState } from './RowEditCell';
import InlineMappingPanel from './InlineMappingPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CRM_FIELD_LABELS, type CrmFieldKey } from '@/lib/ia/fieldDictionary';
import type { NormalizedLeadRow } from '@/services/ia/leadNormalizer';
import type { ColumnMapping } from '@/services/ia/columnMapper';
import type { DuplicateMatch } from '@/services/ia/duplicateDetector';

interface RowReviewTableProps {
  rows: NormalizedLeadRow[];
  duplicates: DuplicateMatch[];
  mappings: ColumnMapping[];
  onUpdateField: (rowIndex: number, field: keyof NormalizedLeadRow['data'], value: unknown) => void;
  onRemap: (mappings: ColumnMapping[]) => void;
  samplesByHeader?: Record<string, unknown[]>;
}

type Filter = 'all' | 'errors' | 'warnings' | 'valid';

const FIELDS: Array<{ key: keyof NormalizedLeadRow['data']; label: string }> = [
  { key: 'name',              label: CRM_FIELD_LABELS.name },
  { key: 'phone',             label: CRM_FIELD_LABELS.phone },
  { key: 'status',            label: CRM_FIELD_LABELS.status },
  { key: 'next_contact_at',   label: CRM_FIELD_LABELS.next_contact_at },
  { key: 'origin',            label: CRM_FIELD_LABELS.origin },
  { key: 'product_interest',  label: CRM_FIELD_LABELS.product_interest },
  { key: 'notes',             label: CRM_FIELD_LABELS.notes },
];

function getCellState(row: NormalizedLeadRow, field: keyof NormalizedLeadRow['data']): { state: CellState; message?: string } {
  // Erro bloqueante
  if (field === 'name' && !row.data.name) {
    return { state: 'error', message: 'Nome é obrigatório' };
  }
  // Warnings ligados ao campo
  const warningHit = row.warnings.find((w) => {
    const lw = w.toLowerCase();
    if (field === 'phone') return lw.startsWith('telefone');
    if (field === 'next_contact_at') return lw.startsWith('data');
    if (field === 'status') return lw.startsWith('status');
    return false;
  });
  if (warningHit) return { state: 'warning', message: warningHit };
  if (row.data[field] == null || row.data[field] === '') return { state: 'empty' };
  return { state: 'ok' };
}

export default function RowReviewTable({
  rows, duplicates, mappings, onUpdateField, onRemap, samplesByHeader,
}: RowReviewTableProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const [panelOpen, setPanelOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { errors: 0, warnings: 0, valid: 0 };
    for (const r of rows) {
      if (r.errors.length) c.errors++;
      else if (r.warnings.length) c.warnings++;
      else c.valid++;
    }
    return c;
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (filter === 'errors')   return rows.filter((r) => r.errors.length > 0);
    if (filter === 'warnings') return rows.filter((r) => r.errors.length === 0 && r.warnings.length > 0);
    if (filter === 'valid')    return rows.filter((r) => r.errors.length === 0 && r.warnings.length === 0);
    return rows;
  }, [rows, filter]);

  const dupSet = useMemo(() => new Set(duplicates.map((d) => d.rowIndex)), [duplicates]);

  return (
    <div className="space-y-3">
      {/* Header com KPIs e filtros */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <KpiBadge label="Válidas" value={counts.valid} tone="success" />
            <KpiBadge label="Com aviso" value={counts.warnings} tone="warning" />
            <KpiBadge label="Com erro" value={counts.errors} tone="destructive" />
            {duplicates.length > 0 && (
              <KpiBadge label="Duplicadas" value={duplicates.length} tone="info" />
            )}
          </div>
          <Button
            size="sm" variant="outline"
            onClick={() => setPanelOpen(true)}
            className="h-8 text-[12px] gap-1.5"
          >
            <FontAwesomeIcon icon={faSliders} className="h-3 w-3" />
            Ajustar mapeamento
          </Button>
        </div>

        {/* Filtros */}
        <div className="px-4 py-2 border-b bg-muted/10 flex items-center gap-1.5 flex-wrap">
          {(['all', 'errors', 'warnings', 'valid'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors',
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {f === 'all' && `Todas (${rows.length})`}
              {f === 'errors' && `Com erro (${counts.errors})`}
              {f === 'warnings' && `Com aviso (${counts.warnings})`}
              {f === 'valid' && `Válidas (${counts.valid})`}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead className="sticky top-0 z-10 bg-card border-b">
              <tr>
                <th className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground w-14">
                  Linha
                </th>
                {FIELDS.map((f) => (
                  <th key={f.key} className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground min-w-[140px]">
                    {f.label}
                    {f.key === 'name' && <span className="text-destructive ml-1">*</span>}
                  </th>
                ))}
                <th className="text-left px-3 py-2 text-[10.5px] uppercase tracking-wider font-semibold text-muted-foreground w-20">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={FIELDS.length + 2} className="text-center py-10 text-[13px] text-muted-foreground">
                    Nenhuma linha corresponde ao filtro.
                  </td>
                </tr>
              )}
              {filteredRows.map((r) => {
                const isDup = dupSet.has(r.rowIndex);
                const hasError = r.errors.length > 0;
                const hasWarn = r.warnings.length > 0;
                return (
                  <tr key={r.rowIndex} className="border-b last:border-b-0 hover:bg-muted/10">
                    <td className="px-3 py-1.5 text-[11px] font-mono text-muted-foreground align-top pt-3">
                      {r.rowIndex + 2}
                    </td>
                    {FIELDS.map((f) => {
                      const { state, message } = getCellState(r, f.key);
                      return (
                        <td key={f.key} className="px-2 py-1.5 align-top">
                          <RowEditCell
                            value={r.data[f.key]}
                            field={f.key}
                            state={state}
                            message={message}
                            onCommit={(v) => onUpdateField(r.rowIndex, f.key, v)}
                          />
                        </td>
                      );
                    })}
                    <td className="px-3 py-1.5 align-top pt-3">
                      <div className="flex flex-col gap-1">
                        {hasError && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                            <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5" />
                            Erro
                          </span>
                        )}
                        {!hasError && hasWarn && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning-soft px-1.5 py-0.5 rounded">
                            <FontAwesomeIcon icon={faWandMagicSparkles} className="h-2.5 w-2.5" />
                            Ajuste
                          </span>
                        )}
                        {!hasError && !hasWarn && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success bg-success-soft px-1.5 py-0.5 rounded">
                            <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5" />
                            OK
                          </span>
                        )}
                        {isDup && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-info bg-info-soft px-1.5 py-0.5 rounded">
                            Dup.
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <InlineMappingPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        mappings={mappings}
        onApply={onRemap}
        samplesByHeader={samplesByHeader}
      />
    </div>
  );
}

function KpiBadge({ label, value, tone }: { label: string; value: number; tone: 'success' | 'warning' | 'destructive' | 'info' }) {
  const toneClass = {
    success: 'text-success bg-success-soft',
    warning: 'text-warning bg-warning-soft',
    destructive: 'text-destructive bg-destructive/10',
    info: 'text-info bg-info-soft',
  }[tone];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md', toneClass)}>
      <span className="font-semibold font-mono text-[12.5px]">{value}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </span>
  );
}
