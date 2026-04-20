import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadCard from './LeadCard';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { APP_CONFIG } from '@/config/app';
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
  const label = APP_CONFIG.leadStatuses.find((s) => s.value === status)?.label ?? status;

  return (
    <div
      ref={setNodeRef}
      aria-label={`Coluna ${label}, ${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`}
      className={cn(
        'bg-muted/40 rounded-xl border border-border p-3 min-h-[300px] transition-colors',
        isOver && 'bg-primary/5 border-primary/30'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LeadStatusBadge status={status} />
          <span className="text-xs text-muted-foreground font-medium">{leads.length}</span>
        </div>
        {onAddLead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-primary"
            onClick={() => onAddLead(status)}
            title={`Novo lead em ${label}`}
            aria-label={`Adicionar lead em ${label}`}
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          </Button>
        )}
      </div>

      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {leads.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhum lead</p>
          )}
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
