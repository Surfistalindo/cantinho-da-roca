import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup, faSeedling, faClock, faFire, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { getContactRecency } from '@/lib/contactRecency';
import { getLeadScore } from '@/lib/leadScore';

export type KpiKey = 'total' | 'today' | 'waiting' | 'hot' | 'overdue';

interface Lead {
  id: string;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  ai_score?: number | null;
  ai_priority?: string | null;
}

interface Props {
  leads: Lead[];
  interactionCounts: Record<string, number>;
  active: KpiKey | null;
  onSelect: (key: KpiKey) => void;
}

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export default function LeadsKpiStrip({ leads, interactionCounts, active, onSelect }: Props) {
  const stats = useMemo(() => {
    let today = 0, waiting = 0, hot = 0, overdue = 0;
    for (const l of leads) {
      if (isToday(l.created_at)) today++;
      if (l.status === 'new') waiting++;
      const score = getLeadScore(l as never, { interactionCount: interactionCounts[l.id] ?? 0 });
      if (score.level === 'hot' || score.urgent) hot++;
      const rec = getContactRecency(l.last_contact_at, l.status, l.created_at);
      if (rec.level === 'overdue') overdue++;
    }
    return { total: leads.length, today, waiting, hot, overdue };
  }, [leads, interactionCounts]);

  const cards: { key: KpiKey; label: string; value: number; icon: typeof faUserGroup; tone: string }[] = [
    { key: 'total',   label: 'Total',           value: stats.total,   icon: faUserGroup,           tone: 'text-foreground' },
    { key: 'today',   label: 'Novos hoje',      value: stats.today,   icon: faSeedling,            tone: 'text-success' },
    { key: 'waiting', label: 'Aguardando',      value: stats.waiting, icon: faClock,               tone: 'text-info' },
    { key: 'hot',     label: 'Quentes',         value: stats.hot,     icon: faFire,                tone: 'text-destructive' },
    { key: 'overdue', label: 'SLA estourado',   value: stats.overdue, icon: faTriangleExclamation, tone: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      {cards.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            aria-pressed={isActive}
            className={cn(
              'group flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 text-left transition-all',
              'hover:border-primary/40 hover:shadow-card',
              isActive ? 'border-primary/60 shadow-card ring-1 ring-primary/30' : 'border-border',
            )}
          >
            <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center bg-muted/60', c.tone)}>
              <FontAwesomeIcon icon={c.icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{c.label}</div>
              <div className="text-xl font-bold tabular-nums leading-tight">{c.value}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
