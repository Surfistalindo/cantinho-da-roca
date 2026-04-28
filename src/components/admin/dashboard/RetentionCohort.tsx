import type { CohortRow } from '@/lib/dashboardAnalytics';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Props {
  rows: CohortRow[];
  bucketLabels: string[];
}

export default function RetentionCohort({ rows, bucketLabels }: Props) {
  const [hover, setHover] = useState<{ row: number; col: number } | null>(null);

  const total = rows.reduce((s, r) => s + r.size, 0);
  if (total === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sem dados suficientes para construir cohort.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[480px] text-[12px] border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold py-1.5 pr-3">
                Semana
              </th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted-foreground font-semibold py-1.5 pr-3">
                Leads
              </th>
              {bucketLabels.map((b) => (
                <th key={b} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold py-1.5">
                  {b}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r.weekStart}>
                <td className="font-semibold text-foreground tabular-nums pr-3">{r.weekLabel}</td>
                <td className="text-right text-muted-foreground tabular-nums pr-3">{r.size}</td>
                {r.buckets.map((b, ci) => {
                  if (b === null) {
                    return (
                      <td key={ci} className="text-center">
                        <div className="h-9 rounded-md bg-muted/30 flex items-center justify-center text-[10px] text-muted-foreground">
                          —
                        </div>
                      </td>
                    );
                  }
                  const a = Math.min(1, b / 30); // 30% conv = full color
                  const isHover = hover?.row === ri && hover?.col === ci;
                  return (
                    <td key={ci} className="text-center">
                      <div
                        onMouseEnter={() => setHover({ row: ri, col: ci })}
                        onMouseLeave={() => setHover(null)}
                        className={cn(
                          'h-9 rounded-md flex items-center justify-center font-bold tabular-nums transition-all cursor-default',
                          isHover && 'ring-2 ring-primary scale-105',
                          b >= 5 ? 'text-foreground' : 'text-muted-foreground',
                        )}
                        style={{
                          background: b === 0
                            ? 'hsl(var(--muted) / 0.5)'
                            : `hsl(var(--success) / ${0.15 + a * 0.7})`,
                        }}
                        title={`${b.toFixed(1)}% convertidos até ${bucketLabels[ci]}`}
                      >
                        {b.toFixed(0)}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground pt-3 mt-2 border-t border-border">
        % de leads de cada semana convertidos em clientes até a semana indicada (acumulado).
      </p>
    </div>
  );
}
