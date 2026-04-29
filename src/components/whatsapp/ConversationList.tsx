import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faRobot, faInbox } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import InboxLegend from './InboxLegend';
import type { WAConversation, WAFilter } from './types';

interface Props {
  conversations: WAConversation[];
  selectedLeadId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (s: string) => void;
  filter: WAFilter;
  onFilter: (f: WAFilter) => void;
  totalCount: number;
}

const filters: { key: WAFilter; label: string; hint: string }[] = [
  { key: 'all', label: 'Todas', hint: 'Todas as conversas' },
  { key: 'unread', label: 'Não lidas', hint: 'Mensagens recebidas que você ainda não respondeu' },
  { key: 'in_cadence', label: 'Em automação', hint: 'Leads recebendo a régua agora' },
  { key: 'paused', label: 'Pausadas', hint: 'Opt-out ou cadência pausada manualmente' },
  { key: 'no_reply', label: 'Sem resposta', hint: 'Você enviou e o lead nunca respondeu' },
];

export default function ConversationList({
  conversations, selectedLeadId, onSelect, search, onSearch, filter, onFilter, totalCount,
}: Props) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 sm:p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display-warm text-base font-bold">Conversas</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-mono">
              {conversations.length}/{totalCount}
            </span>
            <InboxLegend />
          </div>
        </div>

        <div className="relative" data-tour="wa-conv-search">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
          />
          <Input
            data-wa-search
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar nome ou número… ( / )"
            className="pl-8 h-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" data-tour="wa-conv-filters">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilter(f.key)}
              title={f.hint}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded-full border transition-colors',
                filter === f.key
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-transparent text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1" data-tour="wa-conv-list">
        {totalCount === 0 ? (
          <div className="p-6 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-[#25D366]" />
            </div>
            <div>
              <p className="text-sm font-semibold">Nenhum lead com WhatsApp ainda</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Cadastre leads com telefone ou importe contatos para começar.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="default" onClick={() => navigate('/admin/ia/whatsapp')}>
                Importar do WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/leads')}>
                Cadastrar lead
              </Button>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
            <FontAwesomeIcon icon={faInbox} className="h-5 w-5 opacity-40" />
            <p>Nenhuma conversa com os filtros atuais.</p>
            {(search || filter !== 'all') && (
              <button
                onClick={() => { onSearch(''); onFilter('all'); }}
                className="text-[11px] underline text-foreground"
              >
                Limpar busca e filtros
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {conversations.map((c) => {
              const last = c.lastMessage;
              const isSelected = c.lead.id === selectedLeadId;
              const inCadence = c.lead.cadence_state === 'active' && !c.lead.cadence_exhausted;
              const preview = last?.body
                ?? (last?.message_type === 'image' ? '🖼 Imagem' : 'Sem mensagens');
              const prefix = last?.direction === 'out' ? 'Você: ' : '';

              return (
                <li key={c.lead.id} data-tour-item="wa-conv-item">
                  <button
                    onClick={() => onSelect(c.lead.id)}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors text-left',
                      isSelected && 'bg-muted',
                    )}
                  >
                    <InitialsAvatar name={c.lead.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-sm font-semibold truncate">{c.lead.name}</span>
                          {inCadence && (
                            <FontAwesomeIcon
                              icon={faRobot}
                              className="h-2.5 w-2.5 text-[hsl(var(--honey))] shrink-0"
                              title="Automação ativa"
                            />
                          )}
                        </div>
                        {last && (
                          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                            {formatDistanceToNow(new Date(last.created_at), { locale: ptBR, addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                          {prefix}{preview}
                        </p>
                        {c.unreadCount > 0 && (
                          <Badge className="h-4 min-w-[16px] px-1 text-[9px] bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))] text-white shrink-0">
                            {c.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
