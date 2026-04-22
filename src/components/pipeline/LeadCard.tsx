import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClockRotateLeft, faTag } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';
import { getContactRecency } from '@/lib/contactRecency';
import { getLeadScore } from '@/lib/leadScore';

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
  lead: Lead;
  onClick?: () => void;
  interactionCount?: number;
}

export default function LeadCard({ lead, onClick, interactionCount }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const recency = getContactRecency(lead.last_contact_at, lead.status, lead.created_at);
  const needsAttention = recency.level === 'attention';
  const overdue = recency.level === 'overdue';

  const score = getLeadScore(lead, { interactionCount });

  // Lateral colorida = nível de prioridade
  const sideTone =
    score.urgent ? 'before:bg-destructive'
    : score.level === 'hot' ? 'before:bg-success'
    : score.level === 'warm' ? 'before:bg-warning'
    : score.level === 'cold' ? 'before:bg-muted-foreground/30'
    : 'before:bg-muted-foreground/20';

  const openWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) return;
    const clean = lead.phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent('Olá, tudo bem? Estou entrando em contato sobre seu interesse no Cantinho da Roça.')}`, '_blank');
  };

  const sendFollowUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) return;
    const clean = lead.phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent('Oi! Passando para saber se ainda tem interesse 😊')}`, '_blank');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'relative bg-card border border-border rounded-xl p-3 pl-3.5 cursor-grab active:cursor-grabbing shadow-soft transition-all duration-150',
        'hover:shadow-card hover:border-border-strong hover:-translate-y-px',
        'before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-[3px] before:rounded-full',
        sideTone,
        score.urgent && 'ring-1 ring-destructive/40',
        isDragging && 'opacity-50 shadow-pop ring-2 ring-primary/30',
      )}
    >
      {score.level !== 'closed' && (
        <div className="mb-2">
          <LeadScoreBadge lead={lead} interactionCount={interactionCount} size="sm" />
        </div>
      )}

      <div className="flex items-start gap-2.5">
        <InitialsAvatar name={lead.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[13px] text-foreground truncate leading-tight">{lead.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono truncate">
            {lead.phone ?? 'Sem telefone'}
          </p>
        </div>
      </div>

      {lead.product_interest && (
        <p className="text-[11px] text-foreground/70 mt-2 flex items-center gap-1 truncate">
          <FontAwesomeIcon icon={faTag} className="h-2.5 w-2.5 text-primary/70 shrink-0" />
          <span className="truncate">{lead.product_interest}</span>
        </p>
      )}

      <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-border/60">
        <ContactRecencyBadge
          lastContactAt={lead.last_contact_at}
          status={lead.status}
          createdAt={lead.created_at}
          size="sm"
        />
        <div className="ml-auto flex gap-0.5">
          {lead.phone && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:bg-success-soft" onClick={openWhatsApp}>
              <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5" />
            </Button>
          )}
          {(needsAttention || overdue) && lead.phone && (
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-7 w-7', overdue ? 'text-destructive hover:bg-destructive/10' : 'text-warning hover:bg-warning-soft')}
              onClick={sendFollowUp}
              title="Enviar follow-up"
            >
              <FontAwesomeIcon icon={faClockRotateLeft} className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
