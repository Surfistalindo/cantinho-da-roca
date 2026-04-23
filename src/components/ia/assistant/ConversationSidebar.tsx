import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faComments } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ConversationSummary } from '@/services/ai/aiAssistantService';

interface Props {
  conversations: ConversationSummary[];
  currentId: string;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export default function ConversationSidebar({ conversations, currentId, onNew, onOpen, onDelete }: Props) {
  return (
    <aside className="rounded-2xl border bg-card flex flex-col overflow-hidden h-full">
      <div className="p-3 border-b">
        <Button onClick={onNew} className="w-full gap-2" size="sm">
          <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
          Nova conversa
        </Button>
      </div>
      <div className="px-3 pt-3 pb-2 text-[10.5px] uppercase tracking-[0.14em] font-semibold text-muted-foreground flex items-center gap-1.5">
        <FontAwesomeIcon icon={faComments} className="h-2.5 w-2.5" />
        Histórico
      </div>
      <ScrollArea className="flex-1">
        <ul className="px-2 pb-2 space-y-1">
          {conversations.length === 0 && (
            <li className="px-2 py-3 text-[11.5px] text-muted-foreground italic text-center">
              Nenhuma conversa ainda
            </li>
          )}
          {conversations.map((c) => {
            const active = c.conversation_id === currentId;
            return (
              <li key={c.conversation_id}>
                <div
                  className={cn(
                    'group rounded-lg border transition-colors flex items-stretch',
                    active ? 'border-primary/40 bg-primary/5' : 'border-transparent hover:bg-muted/40',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(c.conversation_id)}
                    className="flex-1 min-w-0 px-2.5 py-2 text-left"
                  >
                    <div className={cn('text-[12px] font-medium truncate', active ? 'text-foreground' : 'text-foreground/85')}>
                      {c.first_message}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{formatRelative(c.last_at)}</span>
                      <span>·</span>
                      <span>{c.count} {c.count === 1 ? 'msg' : 'msgs'}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(c.conversation_id)}
                    aria-label="Apagar conversa"
                    className="px-2.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
