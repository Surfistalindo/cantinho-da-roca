import type { VelocityRow } from '@/lib/dashboardAnalytics';
import { cn } from '@/lib/utils';

const TONE_BG: Record<VelocityRow['tone'], string> = {
  info: 'bg-info',
  primary: 'bg-primary',
  warning: 'bg-warning',
  success: 'bg-success',
  muted: 'bg-muted-foreground',
};

interface Props {
  rows: VelocityRow[];
}

export default function FunnelVelocity({ rows }: Props) {
  const max = Math.max(1, ...rows.map((r) => r.avgDays));
  const totalLeads = rows.reduce((s, r) => s + r.count, 0);

  if (totalLeads === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Sem leads para calcular a velocidade.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = (r.avgDays / max) * 100;
        return (
          <div key={r.stage} className="group">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <div className="flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', TONE_BG[r.tone])} />
                <span className="font-semibold text-foreground">{r.label}</span>
                <span className="text-muted-foreground tabular-nums">· {r.count} leads</span>
              </div>
              <span className="text-foreground font-bold tabular-nums">
                {r.avgDays < 1 ? `${Math.round(r.avgDays * 24)}h` : `${r.avgDays.toFixed(1)}d`}
              </span>
            </div>
            <div className="h-7 rounded-md bg-muted/60 overflow-hidden relative">
              <div
                className={cn('h-full rounded-md transition-all duration-700 ease-out', TONE_BG[r.tone])}
                style={{ width: `${Math.max(2, pct)}%`, opacity: 0.85 }}
              />
            </div>
          </div>
        );
      })}
      <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
        Tempo médio entre criação do lead e o último contato registrado em cada estágio.
      </p>
    </div>
  );
}
