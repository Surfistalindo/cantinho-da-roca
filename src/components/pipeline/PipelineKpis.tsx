import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faFire, faPercent, faClock } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { getLeadScore } from '@/lib/leadScore';

interface Lead {
  id: string;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at?: string | null;
}

interface Props {
  leads: Lead[];
  interactionCounts: Record<string, number>;
}

const ACTIVE = new Set(['new', 'contacting', 'negotiating']);

function formatDays(d: number | null) {
  if (d === null || !isFinite(d)) return '—';
  if (d < 1) return '<1d';
  return `${Math.round(d)}d`;
}

function KpiCard({
  icon, label, value, hint, tone = 'default',
}: {
  icon: typeof faChartLine;
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'hot' | 'success' | 'info';
}) {
  return (
    <div
      className="surface-card--hair rounded-lg p-3 flex items-center gap-3 min-w-0"
      role="group"
      aria-label={label}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center h-9 w-9 rounded-md shrink-0',
          tone === 'hot' && 'bg-destructive/10 text-destructive',
          tone === 'success' && 'bg-success/10 text-success',
          tone === 'info' && 'bg-primary/10 text-primary',
          tone === 'default' && 'bg-muted text-muted-foreground',
        )}
      >
        <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground truncate">
          {label}
        </p>
        <p className="text-lg font-bold tabular-nums leading-tight truncate">{value}</p>
        {hint && <p className="text-[10.5px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </div>
  );
}

export default function PipelineKpis({ leads, interactionCounts }: Props) {
  const stats = useMemo(() => {
    let active = 0;
    let won = 0;
    let lost = 0;
    let hot = 0;
    let urgent = 0;
    const wonDurations: number[] = [];
    const now = Date.now();

    for (const l of leads) {
      if (ACTIVE.has(l.status)) active++;
      if (l.status === 'won') {
        won++;
        const ref = l.last_contact_at ? new Date(l.last_contact_at).getTime() : now;
        const created = new Date(l.created_at).getTime();
        wonDurations.push(Math.max(0, (ref - created) / 86400000));
      }
      if (l.status === 'lost') lost++;

      const s = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
      if (s.urgent) urgent++;
      if (s.level === 'hot') hot++;
    }

    const closed = won + lost;
    const conversion = closed > 0 ? (won / closed) * 100 : null;
    const avgDays = wonDurations.length
      ? wonDurations.reduce((a, b) => a + b, 0) / wonDurations.length
      : null;

    return { active, won, lost, hot, urgent, conversion, avgDays };
  }, [leads, interactionCounts]);

  return (
    <div
      data-tour="pipeline-kpis"
      className="grid grid-cols-2 lg:grid-cols-4 gap-2.5"
    >
      <KpiCard
        icon={faChartLine}
        label="No funil"
        value={stats.active}
        hint={`${stats.won} ganhos · ${stats.lost} perdidos`}
        tone="info"
      />
      <KpiCard
        icon={faFire}
        label="Hot / Urgentes"
        value={stats.hot + stats.urgent}
        hint={`${stats.hot} hot · ${stats.urgent} urgentes`}
        tone="hot"
      />
      <KpiCard
        icon={faPercent}
        label="Conversão"
        value={stats.conversion === null ? '—' : `${stats.conversion.toFixed(0)}%`}
        hint={stats.conversion === null ? 'Sem fechamentos ainda' : `${stats.won}/${stats.won + stats.lost} fechados`}
        tone="success"
      />
      <KpiCard
        icon={faClock}
        label="Tempo médio até venda"
        value={formatDays(stats.avgDays)}
        hint={stats.avgDays === null ? 'Aguardando ganhos' : `Base: ${stats.won} venda${stats.won === 1 ? '' : 's'}`}
      />
    </div>
  );
}
