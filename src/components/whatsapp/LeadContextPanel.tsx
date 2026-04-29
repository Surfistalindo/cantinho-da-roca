import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faTag, faClockRotateLeft, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import AutomationStatusCard from './AutomationStatusCard';
import type { WALeadInfo, WAMessage, WATemplate } from './types';

interface Props {
  lead: WALeadInfo;
  messages: WAMessage[];
  templates: WATemplate[];
}

export default function LeadContextPanel({ lead, messages, templates }: Props) {
  const recent = messages.slice(-5).reverse();

  const cadenceHint =
    lead.cadence_state === 'idle' && !lead.cadence_exhausted
      ? 'A régua começa quando o lead vai para o status "Em contato".'
      : lead.cadence_exhausted
      ? 'Régua concluída sem resposta. O lead voltou para a fila manual.'
      : null;

  return (
    <div className="h-full bg-card border-l border-border flex flex-col" data-tour="wa-context-panel">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Identidade */}
          <div className="text-center pb-3 border-b border-border">
            <div className="flex justify-center mb-2">
              <InitialsAvatar name={lead.name} size="lg" />
            </div>
            <h3 className="font-display-warm text-lg font-bold">{lead.name}</h3>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono hover:text-foreground"
              >
                <FontAwesomeIcon icon={faPhone} className="h-2.5 w-2.5" />
                {lead.phone}
              </a>
            )}
            <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
              <Badge variant="outline" className="text-[10px] capitalize">
                <FontAwesomeIcon icon={faTag} className="h-2 w-2 mr-1" />
                {lead.status.replace('_', ' ')}
              </Badge>
              {lead.origin && (
                <Badge variant="secondary" className="text-[10px]">
                  {lead.origin}
                </Badge>
              )}
            </div>
          </div>

          {/* Automação */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Automação
            </p>
            <AutomationStatusCard lead={lead} templates={templates} />
            {cadenceHint && (
              <p className="text-[10.5px] text-muted-foreground mt-2 flex items-start gap-1.5">
                <FontAwesomeIcon icon={faCircleInfo} className="h-2.5 w-2.5 mt-0.5 shrink-0" />
                {cadenceHint}
              </p>
            )}
          </div>

          {/* Linha do tempo */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClockRotateLeft} className="h-2.5 w-2.5" />
              Últimas mensagens
            </p>
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhuma ainda.</p>
            ) : (
              <ol className="space-y-2 border-l-2 border-border pl-3">
                {recent.map((m) => (
                  <li key={m.id} className="text-[11px] relative">
                    <span className="absolute -left-[15px] top-1 h-2 w-2 rounded-full bg-border" />
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold capitalize">
                        {m.direction === 'out' ? (m.cadence_step ? '🤖 Automação' : 'Você') : '← Recebida'}
                      </span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {formatDistanceToNow(new Date(m.created_at), { locale: ptBR, addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 mt-0.5">
                      {m.body ?? (m.image_url ? '🖼 Imagem' : '—')}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Stats */}
          <div className="rounded-lg bg-muted/40 p-3 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de mensagens</span>
              <span className="font-mono font-semibold">{messages.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recebidas</span>
              <span className="font-mono font-semibold">{messages.filter((m) => m.direction === 'in').length}</span>
            </div>
            {lead.last_contact_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Último contato</span>
                <span className="font-mono">{format(new Date(lead.last_contact_at), 'dd/MM HH:mm')}</span>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
