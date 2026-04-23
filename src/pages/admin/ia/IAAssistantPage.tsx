import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faStop, faRobot, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import IAPageShell from '@/components/ia/IAPageShell';
import MessageBubble from '@/components/ia/assistant/MessageBubble';
import SuggestedQuestions from '@/components/ia/assistant/SuggestedQuestions';
import ConversationSidebar from '@/components/ia/assistant/ConversationSidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAIChat } from '@/hooks/useAIChat';
import { cn } from '@/lib/utils';

export default function IAAssistantPage() {
  const chat = useAIChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll para a base ao chegarem novos tokens
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.turns]);

  const submit = (text: string) => {
    if (!text.trim() || chat.streaming) return;
    chat.send(text);
    setInput('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  const empty = chat.turns.length === 0;

  return (
    <IAPageShell
      title="Assistente Comercial IA"
      subtitle="Converse com sua base como se fosse um analista comercial sênior. Acesso total a leads e interações."
      breadcrumbs={[{ label: 'Assistente' }]}
      backTo="/admin/ia"
    >
      <div className="grid gap-4 lg:grid-cols-[280px_1fr] h-[calc(100vh-260px)] min-h-[520px]">
        <div className="hidden lg:block min-h-0">
          <ConversationSidebar
            conversations={chat.conversations}
            currentId={chat.conversationId}
            onNew={chat.newConversation}
            onOpen={chat.openConversation}
            onDelete={chat.removeConversation}
          />
        </div>

        <section className="rounded-2xl border bg-card flex flex-col overflow-hidden min-h-0">
          {/* Header com indicador RAG */}
          <div className="px-4 py-2.5 border-b flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faRobot} className="h-3 w-3" />
              </span>
              <div className="min-w-0">
                <div className="text-[12.5px] font-semibold text-foreground">Assistente</div>
                <div className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                  <span className={cn('h-1.5 w-1.5 rounded-full', chat.streaming ? 'bg-warning animate-pulse' : 'bg-success')} />
                  {chat.streaming ? 'Pensando…' : 'Conectado · acesso a leads e interações'}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={chat.newConversation}>
              Nova
            </Button>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {empty ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-6">
                <span className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <FontAwesomeIcon icon={faRobot} className="h-6 w-6" />
                </span>
                <div className="space-y-1.5">
                  <h2 className="text-[16px] font-semibold text-foreground">Como posso ajudar você hoje?</h2>
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                    Pergunte qualquer coisa sobre seus leads. Vou consultar sua base em tempo real para responder com dados reais.
                  </p>
                </div>
                <SuggestedQuestions onPick={submit} disabled={chat.streaming} />
              </div>
            ) : (
              chat.turns.map((t) => <MessageBubble key={t.id} turn={t} />)
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t p-3 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte algo sobre sua base de leads…"
              rows={1}
              className="resize-none min-h-[44px] max-h-[140px] text-[13px]"
              disabled={chat.streaming}
            />
            {chat.streaming ? (
              <Button type="button" variant="outline" size="icon" onClick={chat.stop} aria-label="Parar" className="h-11 w-11 shrink-0">
                <FontAwesomeIcon icon={faStop} className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Enviar" className="h-11 w-11 shrink-0">
                <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
              </Button>
            )}
          </form>

          <div className="px-4 pb-2.5 text-[10.5px] text-muted-foreground flex items-center gap-1.5">
            <FontAwesomeIcon icon={faCircleInfo} className="h-2.5 w-2.5" />
            Enter envia · Shift+Enter quebra linha · O assistente lê leads e interações da sua base.
          </div>
        </section>
      </div>
    </IAPageShell>
  );
}
