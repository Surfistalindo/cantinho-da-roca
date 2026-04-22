import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadCard from './LeadCard';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { APP_CONFIG } from '@/config/app';
import { getLeadStatusConfig } from '@/lib/leadStatus';
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
}

interface Props {
  status: string;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onAddLead?: (status: string) => void;
}

export default function PipelineColumn({ status, leads, onLeadClick, onAddLead }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const cfg = getLeadStatusConfig(status);
  const label = APP_CONFIG.leadStatuses.find((s) => s.value === status)?.label ?? status;

  return (
    <div
      ref={setNodeRef}
      aria-label={`Coluna ${label}, ${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`}
      className={cn(
        'rounded-2xl border border-border bg-muted/50 transition-all duration-150 flex flex-col min-h-[320px]',
        isOver && 'bg-primary/5 ring-2 ring-primary/20 border-primary/30',
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-border/60 bg-muted/80 backdrop-blur rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide', cfg.color.replace(/bg-[^\s]+/g, ''))}>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {label}
          </span>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-card border border-border text-[10px] font-mono font-semibold text-muted-foreground">
            {leads.length}
          </span>
        </div>
        {onAddLead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-card"
            onClick={() => onAddLead(status)}
            title={`Novo lead em ${label}`}
            aria-label={`Adicionar lead em ${label}`}
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          </Button>
        )}
      </div>

      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 max-h-[65vh] overflow-y-auto p-2.5">
          {leads.length === 0 && (
            <div className="text-center py-10">
              <p className="text-xs text-muted-foreground/70">Nenhum lead</p>
            </div>
          )}
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
