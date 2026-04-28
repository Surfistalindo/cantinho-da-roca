import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentSlash, faChevronLeft, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import type { WAMessage, WALeadInfo, WATemplate } from './types';

interface Props {
  lead: WALeadInfo | null;
  messages: WAMessage[];
  templates: WATemplate[];
  isConfigured: boolean;
  onBack?: () => void;          // mobile
  onShowContext?: () => void;   // tablet/mobile
  onSent: () => void;
}

function dayLabel(d: Date) {
  const today = new Date();
  if (isSameDay(d, today)) return 'Hoje';
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (isSameDay(d, y)) return 'Ontem';
  return format(d, "d 'de' MMMM", { locale: ptBR });
}

export default function ConversationThread({
  lead, messages, templates, isConfigured, onBack, onShowContext, onSent,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, lead?.id]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-[hsl(var(--surface-warm))]">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <FontAwesomeIcon icon={faCommentSlash} className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-display-warm text-lg font-bold mb-1">Selecione uma conversa</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Escolha um contato à esquerda para ver o histórico e responder.
        </p>
      </div>
    );
  }

  // agrupa por dia
  const grouped: { day: string; items: WAMessage[] }[] = [];
  for (const m of messages) {
    const label = dayLabel(new Date(m.created_at));
    const last = grouped[grouped.length - 1];
    if (last && last.day === label) last.items.push(m);
    else grouped.push({ day: label, items: [m] });
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--surface-warm))]">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-border bg-card shrink-0">
        {onBack && (
          <Button size="icon" variant="ghost" className="lg:hidden h-9 w-9" onClick={onBack}>
            <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
          </Button>
        )}
        <InitialsAvatar name={lead.name} size="md" />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{lead.name}</h2>
          <p className="text-[11px] text-muted-foreground font-mono">
            {lead.phone ?? 'sem telefone'}
          </p>
        </div>
        {onShowContext && (
          <Button size="icon" variant="ghost" className="xl:hidden h-9 w-9" onClick={onShowContext} title="Detalhes do lead">
            <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Banner config */}
      {!isConfigured && (
        <div className="px-4 py-2 bg-warning-soft text-warning text-xs border-b border-warning/20">
          ⚠ WhatsApp não está conectado. Abra <strong>Configurar</strong> no topo.
        </div>
      )}

      {/* Mensagens */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="p-4 sm:p-6 space-y-4">
          {grouped.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-12">
              Nenhuma mensagem ainda. Envie a primeira abaixo.
            </div>
          ) : (
            grouped.map((g, gi) => (
              <div key={gi} className="space-y-2">
                <div className="flex justify-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-card border border-border rounded-full px-2.5 py-0.5 font-semibold">
                    {g.day}
                  </span>
                </div>
                {g.items.map((m) => <MessageBubble key={m.id} msg={m} />)}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Composer */}
      <MessageComposer
        phone={lead.phone ?? ''}
        leadId={lead.id}
        templates={templates}
        disabled={!isConfigured || !lead.phone}
        onSent={onSent}
      />
    </div>
  );
}
