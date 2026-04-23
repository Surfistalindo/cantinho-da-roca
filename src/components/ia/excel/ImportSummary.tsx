import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck, faTriangleExclamation, faUserPlus, faClone, faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { getLeadStatusConfig } from '@/lib/leadStatus';
import type { NormalizedLeadRow } from '@/services/ia/leadNormalizer';
import type { DuplicateMatch } from '@/services/ia/duplicateDetector';

interface ImportSummaryProps {
  rows: NormalizedLeadRow[];
  duplicates: DuplicateMatch[];
}

export default function ImportSummary({ rows, duplicates }: ImportSummaryProps) {
  const valid = rows.filter((r) => r.errors.length === 0);
  const invalid = rows.filter((r) => r.errors.length > 0);
  const dupSet = new Set(duplicates.map((d) => d.rowIndex));
  const newCount = valid.filter((r) => !dupSet.has(r.rowIndex)).length;
  const dupCount = duplicates.length;
  const withWarnings = valid.filter((r) => r.warnings.length > 0);

  const statusCounts = valid.reduce<Record<string, number>>((acc, r) => {
    acc[r.data.status] = (acc[r.data.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Cards superiores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={faUserPlus} label="Novos" value={newCount} accent="text-success bg-success-soft" />
        <SummaryCard icon={faClone} label="Duplicados" value={dupCount} accent="text-warning bg-warning-soft" />
        <SummaryCard icon={faCheck} label="Válidos" value={valid.length} accent="text-info bg-info-soft" />
        <SummaryCard icon={faTriangleExclamation} label="Com erro" value={invalid.length} accent="text-destructive bg-destructive/10" />
      </div>

      {/* Distribuição por status */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[13px] font-semibold text-foreground">Distribuição por status</h4>
            <span className="text-[11px] text-muted-foreground">após normalização</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const cfg = getLeadStatusConfig(status);
              return (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium ${cfg.color}`}
                >
                  {cfg.label}
                  <span className="font-mono opacity-80">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Avisos de normalização (não bloqueantes) */}
      {withWarnings.length > 0 && (
        <details className="rounded-2xl border bg-card group" open={withWarnings.length <= 3}>
          <summary className="px-4 py-3 cursor-pointer text-[13px] font-semibold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleInfo} className="h-3.5 w-3.5 text-warning" />
            {withWarnings.length} {withWarnings.length === 1 ? 'linha com aviso' : 'linhas com avisos'}
            <span className="text-[11px] text-muted-foreground font-normal ml-1">
              (serão importadas mesmo assim)
            </span>
          </summary>
          <div className="border-t max-h-64 overflow-y-auto divide-y">
            {withWarnings.map((r) => (
              <div key={r.rowIndex} className="px-4 py-2 text-[12px]">
                <span className="font-mono text-muted-foreground">Linha {r.rowIndex + 2}:</span>{' '}
                <span className="text-foreground/80">{r.data.name ?? '—'}</span>
                <ul className="mt-1 space-y-0.5">
                  {r.warnings.map((w, i) => (
                    <li key={i} className="text-warning text-[11.5px] flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-warning" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Erros bloqueantes */}
      {invalid.length > 0 && (
        <details className="rounded-2xl border bg-card" open>
          <summary className="px-4 py-3 cursor-pointer text-[13px] font-semibold text-foreground flex items-center gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-3.5 w-3.5 text-destructive" />
            {invalid.length} {invalid.length === 1 ? 'linha com erro' : 'linhas com erro'}
            <span className="text-[11px] text-muted-foreground font-normal ml-1">
              (serão ignoradas)
            </span>
          </summary>
          <div className="border-t max-h-64 overflow-y-auto divide-y">
            {invalid.map((r) => (
              <div key={r.rowIndex} className="px-4 py-2 text-[12px]">
                <span className="font-mono text-muted-foreground">Linha {r.rowIndex + 2}:</span>{' '}
                <span className="text-destructive">{r.errors.join('; ')}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function SummaryCard({
  icon, label, value, accent,
}: { icon: typeof faCheck; label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${accent}`}>
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </div>
      <div className="text-[24px] font-semibold text-foreground font-mono leading-none">{value}</div>
      <div className="text-[11.5px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}
