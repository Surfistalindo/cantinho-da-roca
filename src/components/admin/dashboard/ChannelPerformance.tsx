import type { ChannelRow } from '@/lib/dashboardAnalytics';
import { MSym } from '@/components/crm/MSym';
import { cn } from '@/lib/utils';

interface Props {
  rows: ChannelRow[];
  activeOrigin?: string | null;
  onSelect?: (origin: string) => void;
}

function Spark({ values, tone }: { values: number[]; tone: string }) {
  const max = Math.max(1, ...values);
  const w = 80;
  const h = 24;
  const step = w / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * h).toFixed(1)}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-6">
      <polygon points={area} fill={`hsl(var(--${tone}) / 0.15)`} />
      <polyline points={pts} fill="none" stroke={`hsl(var(--${tone}))`} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChannelPerformance({ rows, activeOrigin, onSelect }: Props) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sem canais ativos no período.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {rows.slice(0, 8).map((r) => {
        const tone = r.conversionRate >= 20 ? 'success' : r.conversionRate >= 10 ? 'primary' : r.conversionRate > 0 ? 'warning' : 'muted-foreground';
        const isActive = activeOrigin === r.origin;
        return (
          <button
            key={r.origin}
            type="button"
            onClick={() => onSelect?.(r.origin)}
            className={cn(
              'group text-left rounded-xl border p-3.5 bg-card transition-all',
              'hover:border-primary/40 hover:shadow-sm',
              isActive ? 'border-primary ring-1 ring-primary/30' : 'border-border',
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                <MSym name="hub" size={14} className="text-muted-foreground" />
              </div>
              <p className="text-[12px] font-bold text-foreground truncate flex-1">{r.origin}</p>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-[20px] font-bold tabular-nums text-foreground">{r.total}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">leads</span>
            </div>
            <Spark values={r.spark} tone={tone === 'muted-foreground' ? 'muted-foreground' : tone} />
            <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-border">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Conversão</p>
                <p className={cn('text-[13px] font-bold tabular-nums', `text-${tone === 'muted-foreground' ? 'foreground' : tone}`)}>
                  {r.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Resposta</p>
                <p className="text-[13px] font-bold tabular-nums text-foreground">
                  {r.msgsOut > 0 ? `${r.responseRate.toFixed(0)}%` : '—'}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
