import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCommentSlash, faChevronLeft, faCircleInfo, faCopy, faArrowUpRightFromSquare,
  faBoltLightning, faRobot, faKeyboard,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import ThreadHeaderMenu from './ThreadHeaderMenu';
import type { WAMessage, WALeadInfo, WATemplate, WAFilter } from './types';

interface Props {
  lead: WALeadInfo | null;
  messages: WAMessage[];
  templates: WATemplate[];
  isConfigured: boolean;
  onBack?: () => void;
  onShowContext?: () => void;
  onSent: () => void;
  onChanged: () => void;
  onApplyFilter?: (f: WAFilter) => void;
  onOpenAutomations?: () => void;
}

function dayLabel(d: Date) {
  const today = new Date();
  if (isSameDay(d, today)) return 'Hoje';
  const y = new Date(today); y.setDate(y.getDate() - 1);
  if (isSameDay(d, y)) return 'Ontem';
  return format(d, "d 'de' MMMM", { locale: ptBR });
}

export default function ConversationThread({
  lead, messages, templates, isConfigured, onBack, onShowContext, onSent, onChanged,
  onApplyFilter, onOpenAutomations,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, lead?.id]);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[hsl(var(--surface-warm))]">
        <div className="h-16 w-16 rounded-full bg-card border border-border flex items-center justify-center mb-4 shadow-sm">
          <FontAwesomeIcon icon={faWhatsapp} className="h-6 w-6 text-[#25D366]" />
        </div>
        <h3 className="font-display-warm text-lg font-bold mb-1">Comece uma conversa</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Escolha um contato à esquerda ou use os atalhos abaixo.
        </p>

        <div className="grid grid-cols-1 gap-2 mt-5 w-full max-w-xs">
          {onApplyFilter && (
            <Button
              variant="outline" size="sm"
              onClick={() => onApplyFilter('no_reply')}
              className="justify-start gap-2"
            >
              <FontAwesomeIcon icon={faCommentSlash} className="h-3 w-3 text-muted-foreground" />
              Ver leads sem resposta
            </Button>
          )}
          {onApplyFilter && (
            <Button
              variant="outline" size="sm"
              onClick={() => onApplyFilter('in_cadence')}
              className="justify-start gap-2"
            >
              <FontAwesomeIcon icon={faRobot} className="h-3 w-3 text-[hsl(var(--honey))]" />
              Conversas em automação
            </Button>
          )}
          {onOpenAutomations && (
            <Button
              variant="outline" size="sm"
              onClick={onOpenAutomations}
              className="justify-start gap-2"
            >
              <FontAwesomeIcon icon={faBoltLightning} className="h-3 w-3 text-[hsl(var(--secondary))]" />
              Editar templates da régua
            </Button>
          )}
        </div>

        <div className="mt-6 text-[11px] text-muted-foreground space-y-1.5 max-w-xs">
          <p className="flex items-center gap-1.5 font-semibold">
            <FontAwesomeIcon icon={faKeyboard} className="h-2.5 w-2.5" />
            Atalhos rápidos
          </p>
          <div className="flex justify-between"><span>Navegar conversas</span><kbd className="px-1.5 rounded bg-muted font-mono">↑ ↓</kbd></div>
          <div className="flex justify-between"><span>Buscar contato</span><kbd className="px-1.5 rounded bg-muted font-mono">/</kbd></div>
          <div className="flex justify-between"><span>Abrir ajuda</span><kbd className="px-1.5 rounded bg-muted font-mono">?</kbd></div>
        </div>
      </div>
    );
  }

  const grouped: { day: string; items: WAMessage[] }[] = [];
  for (const m of messages) {
    const label = dayLabel(new Date(m.created_at));
    const last = grouped[grouped.length - 1];
    if (last && last.day === label) last.items.push(m);
    else grouped.push({ day: label, items: [m] });
  }

  const phoneDigits = (lead.phone ?? '').replace(/\D/g, '');
  const waLink = phoneDigits ? `https://wa.me/${phoneDigits.length <= 11 ? '55' + phoneDigits : phoneDigits}` : null;

  const copyPhone = async () => {
    if (!lead.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      toast.success('Número copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--surface-warm))]" data-tour="wa-thread">
      {/* Header */}
      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-border bg-card shrink-0">
          {onBack && (
            <Button size="icon" variant="ghost" className="lg:hidden h-9 w-9" onClick={onBack}>
              <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
            </Button>
          )}
          <InitialsAvatar name={lead.name} size="md" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm truncate">{lead.name}</h2>
            <p className="text-[11px] text-muted-foreground font-mono truncate">
              {lead.phone ?? 'sem telefone'}
            </p>
          </div>

          {lead.phone && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={copyPhone}>
                    <FontAwesomeIcon icon={faCopy} className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-[11px]">Copiar número</TooltipContent>
              </Tooltip>

              {waLink && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center text-[#25D366]"
                    >
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent className="text-[11px]">Abrir no WhatsApp Web</TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          <ThreadHeaderMenu lead={lead} onChanged={onChanged} />

          {onShowContext && (
            <Button size="icon" variant="ghost" className="xl:hidden h-9 w-9" onClick={onShowContext} title="Detalhes do lead">
              <FontAwesomeIcon icon={faCircleInfo} className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TooltipProvider>

      {/* Banner config */}
      {!isConfigured && (
        <div className="px-4 py-2 bg-warning-soft text-warning text-xs border-b border-warning/20">
          ⚠ WhatsApp não está conectado. Peça a um administrador para abrir <strong>Configurar</strong> no topo.
        </div>
      )}

      {/* Mensagens */}
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="p-4 sm:p-6 space-y-4">
          {grouped.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-12 space-y-1">
              <p className="font-semibold text-sm text-foreground">Nenhuma mensagem ainda</p>
              <p>Envie a primeira mensagem abaixo. Use o ⚡ para inserir um template pronto.</p>
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
        leadName={lead.name}
        templates={templates}
        disabled={!isConfigured || !lead.phone}
        onSent={onSent}
      />
    </div>
  );
}
