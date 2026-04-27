import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface OriginRow {
  origin: string;
  segments: { key: string; label: string; value: number; tone: 'info' | 'primary' | 'warning' | 'success' | 'muted' }[];
}

const TONE_BG: Record<string, string> = {
  info: 'bg-info',
  primary: 'bg-primary',
  warning: 'bg-warning',
  success: 'bg-success',
  muted: 'bg-muted-foreground/40',
};
const TONE_HSL: Record<string, string> = {
  info: 'hsl(var(--info))',
  primary: 'hsl(var(--primary))',
  warning: 'hsl(var(--warning))',
  success: 'hsl(var(--success))',
  muted: 'hsl(var(--muted-foreground) / 0.4)',
};

interface Props {
  rows: OriginRow[];
}

export default function OriginBars({ rows }: Props) {
  const [hover, setHover] = useState<{ row: string; seg: string } | null>(null);
  const maxTotal = Math.max(1, ...rows.map((r) => r.segments.reduce((a, s) => a + s.value, 0)));

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">Sem dados de origem no período.</div>
    );
  }

  // Legenda única (a partir da primeira linha — todas têm os mesmos segments)
  const legend = rows[0]?.segments ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {legend.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className={cn('w-2.5 h-2.5 rounded-full', TONE_BG[s.tone])} />
            {s.label}
          </div>
        ))}
      </div>

      <ul className="space-y-2.5">
        {rows.map((r) => {
          const total = r.segments.reduce((a, s) => a + s.value, 0);
          const widthPct = (total / maxTotal) * 100;
          return (
            <li key={r.origin} className="flex items-center gap-3">
              <span className="w-24 sm:w-28 shrink-0 text-[12px] font-medium text-foreground truncate">{r.origin}</span>
              <div className="flex-1 h-7 rounded-md bg-muted/40 overflow-hidden relative" style={{ maxWidth: `${widthPct}%` }}>
                <div className="flex h-full">
                  {r.segments.map((s) => {
                    const pct = total > 0 ? (s.value / total) * 100 : 0;
                    const isHover = hover?.row === r.origin && hover.seg === s.key;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={s.key}
                        className={cn('h-full transition-all duration-200 cursor-pointer relative group', TONE_BG[s.tone])}
                        style={{
                          width: `${pct}%`,
                          opacity: hover && !isHover ? 0.45 : 1,
                          background: `linear-gradient(180deg, ${TONE_HSL[s.tone]} 0%, ${TONE_HSL[s.tone]} 60%, color-mix(in srgb, ${TONE_HSL[s.tone]} 80%, black) 100%)`,
                          boxShadow: isHover ? `inset 0 0 0 1px hsl(0 0% 100% / 0.2), 0 0 12px ${TONE_HSL[s.tone]}` : undefined,
                        }}
                        onMouseEnter={() => setHover({ row: r.origin, seg: s.key })}
                        onMouseLeave={() => setHover(null)}
                        title={`${s.label}: ${s.value}`}
                      />
                    );
                  })}
                </div>
                {hover?.row === r.origin && (
                  <div className="absolute -top-7 left-2 z-10 bg-popover border border-border rounded px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-lg pointer-events-none whitespace-nowrap">
                    {r.segments.find((s) => s.key === hover.seg)?.label}: {r.segments.find((s) => s.key === hover.seg)?.value}
                  </div>
                )}
              </div>
              <span className="w-10 shrink-0 text-right text-[12px] font-bold text-foreground tabular-nums">{total}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
