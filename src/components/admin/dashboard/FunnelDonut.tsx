import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface FunnelSegment {
  key: string;
  label: string;
  value: number;
  tone: 'info' | 'primary' | 'warning' | 'success' | 'muted';
}

const TONE_HSL: Record<FunnelSegment['tone'], string> = {
  info: 'hsl(var(--info))',
  primary: 'hsl(var(--primary))',
  warning: 'hsl(var(--warning))',
  success: 'hsl(var(--success))',
  muted: 'hsl(var(--muted-foreground) / 0.4)',
};
const TONE_DOT: Record<FunnelSegment['tone'], string> = {
  info: 'bg-info',
  primary: 'bg-primary',
  warning: 'bg-warning',
  success: 'bg-success',
  muted: 'bg-muted-foreground/40',
};

interface Props {
  segments: FunnelSegment[];
  centerLabel?: string;
}

export default function FunnelDonut({ segments, centerLabel = 'leads' }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const total = segments.reduce((a, s) => a + s.value, 0);
  const size = 200;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 2; // gap em px do contorno
  const gapFrac = total > 0 ? gap / c : 0;

  let offset = 0;
  const arcs = segments.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const length = Math.max(0, frac * c - gap);
    const arc = {
      ...s,
      length,
      offset,
      gap: c - length,
    };
    offset += frac * c;
    return arc;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="stroke-muted fill-none" />
          {total > 0 && arcs.map((a) => (
            <circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              strokeWidth={stroke}
              stroke={TONE_HSL[a.tone]}
              strokeLinecap="butt"
              fill="none"
              strokeDasharray={`${a.length} ${a.gap}`}
              strokeDashoffset={-a.offset}
              onMouseEnter={() => setHover(a.key)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer transition-all duration-200"
              style={{
                opacity: hover && hover !== a.key ? 0.35 : 1,
                filter: hover === a.key ? `drop-shadow(0 0 8px ${TONE_HSL[a.tone]})` : undefined,
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {hover ? (
            <>
              <span className="text-[28px] font-bold text-foreground tabular-nums leading-none">
                {arcs.find((a) => a.key === hover)?.value ?? 0}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                {arcs.find((a) => a.key === hover)?.label}
              </span>
            </>
          ) : (
            <>
              <span className="text-[32px] font-bold text-foreground tabular-nums leading-none">{total}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{centerLabel}</span>
            </>
          )}
        </div>
      </div>

      <ul className="flex-1 w-full space-y-2 min-w-0">
        {segments.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <li
              key={s.key}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors cursor-pointer',
                hover === s.key ? 'bg-muted/60' : 'hover:bg-muted/40',
              )}
            >
              <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', TONE_DOT[s.tone])} />
              <span className="text-[12px] text-foreground/90 truncate">{s.label}</span>
              <span className="ml-auto text-[11px] text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
              <span className="text-[12px] font-bold text-foreground tabular-nums w-9 text-right">{s.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
