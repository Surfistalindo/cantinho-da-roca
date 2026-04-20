import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faTag } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import { getContactRecency } from '@/lib/contactRecency';

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
  lead: Lead;
  onClick?: () => void;
}

export default function LeadCard({ lead, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const recency = getContactRecency(lead.last_contact_at, lead.status, lead.created_at);
  const needsAttention = recency.level === 'attention';
  const overdue = recency.level === 'overdue';

  const openWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) return;
    const clean = lead.phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent('Olá, tudo bem? Estou entrando em contato sobre seu interesse no Cantinho da Roça.')}`,
      '_blank'
    );
  };

  const sendFollowUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) return;
    const clean = lead.phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent('Oi! Passando para saber se ainda tem interesse 😊')}`,
      '_blank'
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary/30',
        // Borda lateral: recência tem prioridade sobre cor de status
        overdue && 'border-l-4 border-l-destructive',
        !overdue && needsAttention && 'border-l-4 border-l-warning',
        !overdue && !needsAttention && lead.status === 'new' && 'border-l-4 border-l-info',
        !overdue && !needsAttention && lead.status === 'contacting' && 'border-l-4 border-l-primary/60',
        !overdue && !needsAttention && lead.status === 'negotiating' && 'border-l-4 border-l-warning/60',
        !overdue && !needsAttention && lead.status === 'won' && 'border-l-4 border-l-success',
        !overdue && !needsAttention && lead.status === 'lost' && 'border-l-4 border-l-muted-foreground/40',
      )}
    >
      <p className="font-medium text-sm truncate">{lead.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{lead.phone ?? 'Sem telefone'}</p>

      {lead.product_interest && (
        <p className="text-xs text-foreground/70 mt-1.5 flex items-center gap-1 truncate">
          <FontAwesomeIcon icon={faTag} className="h-2.5 w-2.5 text-primary/70 shrink-0" />
          <span className="truncate">{lead.product_interest}</span>
        </p>
      )}

      <div className="flex items-center gap-1 mt-2">
        <ContactRecencyBadge
          lastContactAt={lead.last_contact_at}
          status={lead.status}
          createdAt={lead.created_at}
          size="sm"
        />
        <div className="ml-auto flex gap-0.5">
          {lead.phone && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-success" onClick={openWhatsApp}>
              <FontAwesomeIcon icon={faWhatsapp} className="h-3 w-3" />
            </Button>
          )}
          {(needsAttention || overdue) && lead.phone && (
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-6 w-6', overdue ? 'text-destructive' : 'text-warning')}
              onClick={sendFollowUp}
              title="Enviar follow-up"
            >
              <FontAwesomeIcon icon={faClockRotateLeft} className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
