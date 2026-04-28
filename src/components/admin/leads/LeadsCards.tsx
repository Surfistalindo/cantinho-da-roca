import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';
import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import QuickActionsPopover from './QuickActionsPopover';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { getLeadScore } from '@/lib/leadScore';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
}

interface Props {
  leads: Lead[];
  selected: Set<string>;
  onToggleOne: (id: string) => void;
  newestId: string | null;
  interactionCounts: Record<string, number>;
  onOpenDetail: (l: Lead) => void;
  onUpdated: () => void;
}

const openWhats = (phone: string | null) => {
  if (!phone) return;
  const clean = phone.replace(/\D/g, '');
  const num = clean.startsWith('55') ? clean : `55${clean}`;
  window.open(`https://wa.me/${num}?text=Olá! Aqui é da equipe Cantinho da Roça.`, '_blank');
};

export default function LeadsCards({
  leads, selected, onToggleOne, newestId, interactionCounts, onOpenDetail, onUpdated,
}: Props) {
  if (leads.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
      {leads.map((lead) => {
        const score = getLeadScore(lead, { interactionCount: interactionCounts[lead.id] ?? 0 });
        const isNewest = lead.id === newestId;
        const isChecked = selected.has(lead.id);
        return (
          <div
            key={lead.id}
            className={cn(
              'relative bg-card border rounded-2xl p-3.5 transition-all cursor-pointer hover:shadow-card hover:border-border-strong',
              isChecked ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border',
              isNewest && !isChecked && 'border-primary/30 bg-primary/[0.03]',
              score.urgent && 'border-l-2 border-l-destructive',
            )}
            onClick={() => onOpenDetail(lead)}
          >
            <div className="absolute top-2.5 left-2.5" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggleOne(lead.id)}
                aria-label={`Selecionar ${lead.name}`}
              />
            </div>
            <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
              <QuickActionsPopover
                leadId={lead.id}
                leadName={lead.name}
                phone={lead.phone}
                onUpdated={onUpdated}
              />
            </div>

            <div className="flex items-start gap-3 mt-1 ml-7">
              <InitialsAvatar name={lead.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {isNewest && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
                  <h3 className="font-semibold text-sm truncate">{lead.name}</h3>
                </div>
                {lead.phone && <p className="text-[11px] font-mono text-muted-foreground truncate">{lead.phone}</p>}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <LeadStatusBadge status={lead.status} />
              {score.level !== 'closed' && (
                <LeadScoreBadge lead={lead} interactionCount={interactionCounts[lead.id] ?? 0} size="sm" />
              )}
              <ContactRecencyBadge
                lastContactAt={lead.last_contact_at}
                status={lead.status}
                createdAt={lead.created_at}
                size="sm"
              />
            </div>

            {(lead.origin || lead.product_interest) && (
              <div className="mt-2 text-[11px] text-muted-foreground">
                {lead.origin && <span>{lead.origin}</span>}
                {lead.origin && lead.product_interest && <span> · </span>}
                {lead.product_interest && <span className="truncate">{lead.product_interest}</span>}
              </div>
            )}

            <div
              className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-[11px] text-muted-foreground font-mono">
                {format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR })}
              </span>
              <div className="flex gap-1">
                {lead.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-success border-success/30 hover:bg-success-soft"
                    onClick={() => openWhats(lead.phone)}
                  >
                    <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7" onClick={() => onOpenDetail(lead)}>
                  <FontAwesomeIcon icon={faCommentDots} className="h-3.5 w-3.5 mr-1" />
                  Detalhes
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
