import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isLeadStale } from '@/services/followUpService';

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
  lead: Lead;
  onClick?: () => void;
}

export default function LeadCard({ lead, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const stale = isLeadStale(lead);

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
        stale && 'border-l-4 border-l-warning',
        lead.status === 'new' && !stale && 'border-l-4 border-l-info',
        lead.status === 'negotiating' && !stale && 'border-l-4 border-l-warning/60',
      )}
    >
      <p className="font-medium text-sm truncate">{lead.name}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{lead.phone ?? 'Sem telefone'}</p>
      {lead.origin && (
        <p className="text-xs text-muted-foreground/70 mt-0.5">{lead.origin}</p>
      )}

      <div className="flex items-center gap-1 mt-2">
        {stale && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-warning bg-warning-soft rounded-full px-1.5 py-0.5">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5" /> Follow-up
          </span>
        )}
        <div className="ml-auto flex gap-0.5">
          {lead.phone && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-success" onClick={openWhatsApp}>
              <FontAwesomeIcon icon={faWhatsapp} className="h-3 w-3" />
            </Button>
          )}
          {stale && lead.phone && (
            <Button variant="ghost" size="icon" className="h-6 w-6 text-warning" onClick={sendFollowUp} title="Enviar follow-up">
              <FontAwesomeIcon icon={faClockRotateLeft} className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
