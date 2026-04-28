import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faRobot, faCircle } from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
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

const filters: { key: WAFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'unread', label: 'Não lidas' },
  { key: 'in_cadence', label: 'Em automação' },
  { key: 'paused', label: 'Pausadas' },
  { key: 'no_reply', label: 'Sem resposta' },
];

export default function ConversationList({
  conversations, selectedLeadId, onSelect, search, onSearch, filter, onFilter, totalCount,
}: Props) {
  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 sm:p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display-warm text-base font-bold">Conversas</h2>
          <span className="text-[11px] text-muted-foreground font-mono">
            {conversations.length}/{totalCount}
          </span>
        </div>

        <div className="relative">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar nome ou número…"
            className="pl-8 h-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilter(f.key)}
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

      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Nenhuma conversa encontrada.
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
                <li key={c.lead.id}>
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
