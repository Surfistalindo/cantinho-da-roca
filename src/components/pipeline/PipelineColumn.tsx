import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import LeadCard from './LeadCard';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
}

interface Props {
  status: string;
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

export default function PipelineColumn({ status, leads, onLeadClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-muted/40 rounded-xl border border-border p-3 min-h-[300px] transition-colors',
        isOver && 'bg-primary/5 border-primary/30'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <LeadStatusBadge status={status} />
        <span className="text-xs text-muted-foreground font-medium">{leads.length}</span>
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
