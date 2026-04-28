import { useState, useMemo } from 'react';
import type { HeatCell } from '@/lib/dashboardAnalytics';
import { cn } from '@/lib/utils';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Props {
  cells: HeatCell[];
  max: number;
  total: number;
}

export default function ActivityHeatmap({ cells, max, total }: Props) {
  const [hover, setHover] = useState<HeatCell | null>(null);

  const grid = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array<HeatCell>(24));
    for (const c of cells) g[c.day][c.hour] = c;
    return g;
  }, [cells]);

  // Suggestion: best hour
  const best = useMemo(() => {
    if (max === 0) return null;
    return cells.reduce((acc, c) => (c.value > acc.value ? c : acc), cells[0]);
  }, [cells, max]);

  const intensity = (v: number) => (max === 0 ? 0 : v / max);

  return (
    <div>
      {total === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Sem interações no período.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="min-w-[560px]">
              {/* hour ruler */}
              <div className="grid grid-cols-[36px_repeat(24,1fr)] gap-[2px] mb-1 text-[9px] text-muted-foreground">
                <div />
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="text-center tabular-nums">
                    {h % 3 === 0 ? h : ''}
                  </div>
                ))}
              </div>

              {/* rows */}
              {grid.map((row, day) => (
                <div key={day} className="grid grid-cols-[36px_repeat(24,1fr)] gap-[2px] mb-[2px]">
                  <div className="text-[10px] font-semibold text-muted-foreground flex items-center">
                    {DAYS_PT[day]}
                  </div>
                  {row.map((c) => {
                    const a = intensity(c.value);
                    const isHover = hover && hover.day === c.day && hover.hour === c.hour;
                    return (
                      <button
                        key={c.hour}
                        type="button"
                        onMouseEnter={() => setHover(c)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(c)}
                        onBlur={() => setHover(null)}
                        className={cn(
                          'aspect-square min-h-[14px] rounded-[3px] transition-all',
                          'border border-transparent',
                          isHover && 'ring-2 ring-primary ring-offset-1 ring-offset-card scale-110',
                        )}
                        style={{
                          background: a === 0
                            ? 'hsl(var(--muted) / 0.5)'
                            : `hsl(var(--primary) / ${0.15 + a * 0.85})`,
                        }}
                        aria-label={`${DAYS_PT[c.day]} ${c.hour}h: ${c.value} interações`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-[2px]">
                {[0.15, 0.4, 0.65, 0.9].map((a) => (
                  <span
                    key={a}
                    className="w-3 h-3 rounded-[3px]"
                    style={{ background: `hsl(var(--primary) / ${a})` }}
                  />
                ))}
              </div>
              <span>Mais</span>
            </div>
            {hover ? (
              <div className="text-[12px]">
                <span className="font-semibold text-foreground">{DAYS_PT[hover.day]} · {String(hover.hour).padStart(2, '0')}h</span>
                <span className="text-muted-foreground ml-2">{hover.value} interações</span>
              </div>
            ) : best && best.value > 0 ? (
              <div className="text-[11px] text-muted-foreground">
                Melhor janela: <span className="font-semibold text-foreground">{DAYS_PT[best.day]} {String(best.hour).padStart(2, '0')}h</span> · {best.value} interações
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
