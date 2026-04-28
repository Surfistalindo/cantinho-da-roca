import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadCard from './LeadCard';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFire } from '@fortawesome/free-solid-svg-icons';
import { APP_CONFIG } from '@/config/app';
import { compareByScore, getLeadScore } from '@/lib/leadScore';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest?: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at?: string | null;
}

interface Props {
  status: string;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onAddLead?: (status: string) => void;
  interactionCounts?: Record<string, number>;
}

/** Cor sólida da coluna (Monday-style: cabeçalho pintado inteiro). */
const HEADER_COLOR: Record<string, string> = {
  new:         'bg-[hsl(var(--status-working))]',  // azul claro
  contacting:  'bg-[hsl(var(--status-progress))]', // azul
  negotiating: 'bg-[hsl(var(--status-paused))]',   // laranja
  won:         'bg-[hsl(var(--status-done))]',     // verde
  lost:        'bg-[hsl(var(--status-blocked))]',  // vermelho
};

export default function PipelineColumn({ status, leads, onLeadClick, onAddLead, interactionCounts }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const label = APP_CONFIG.leadStatuses.find((s) => s.value === status)?.label ?? status;
  const headerColor = HEADER_COLOR[status] ?? 'bg-[hsl(var(--status-neutral))]';
  // negotiating uses dark text since orange is light
  const isLightHeader = status === 'negotiating';

  const { sortedLeads, hotCount } = useMemo(() => {
    const enriched = leads.map((l) => ({
      ...l,
      _scoreInfo: getLeadScore(l, { interactionCount: interactionCounts?.[l.id] ?? 0 }),
    }));
    enriched.sort(compareByScore);
    const hot = enriched.filter((l) => l._scoreInfo.level === 'hot' || l._scoreInfo.urgent).length;
    return { sortedLeads: enriched, hotCount: hot };
  }, [leads, interactionCounts]);

  return (
    <div
      ref={setNodeRef}
      aria-label={`Coluna ${label}, ${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`}
      className={cn(
        'rounded-md border border-border bg-surface-2 transition-all duration-150 flex flex-col min-h-[320px] overflow-hidden shadow-soft',
        isOver && 'ring-2 ring-primary/40 border-primary/40',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 px-3 h-9',
          headerColor,
          isLightHeader ? 'text-[hsl(30_80%_14%)]' : 'text-white',
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[12px] font-bold uppercase tracking-wide truncate">
            {label}
          </span>
          <span className={cn(
            'inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10.5px] font-bold tabular-nums',
            isLightHeader ? 'bg-black/15 text-[hsl(30_80%_14%)]' : 'bg-white/25 text-white',
          )}>
            {leads.length}
          </span>
          {hotCount > 0 && (
            <span
              className={cn(
                'inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[10px] font-bold',
                isLightHeader ? 'bg-black/15 text-[hsl(30_80%_14%)]' : 'bg-white/25 text-white',
              )}
              title={`${hotCount} lead${hotCount === 1 ? '' : 's'} de alta prioridade`}
            >
              <FontAwesomeIcon icon={faFire} className="h-2.5 w-2.5" />
              {hotCount}
            </span>
          )}
        </div>
        {onAddLead && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 hover:bg-white/25',
              isLightHeader ? 'text-[hsl(30_80%_14%)] hover:text-[hsl(30_80%_14%)]' : 'text-white hover:text-white',
            )}
            onClick={() => onAddLead(status)}
            title={`Novo lead em ${label}`}
            aria-label={`Adicionar lead em ${label}`}
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          </Button>
        )}
      </div>

      <SortableContext items={sortedLeads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 max-h-[65vh] overflow-y-auto p-2.5 bg-surface-2">
          {sortedLeads.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-muted-foreground">Nenhum lead</p>
            </div>
          )}
          {sortedLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onLeadClick?.(lead)}
              interactionCount={interactionCounts?.[lead.id] ?? 0}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
