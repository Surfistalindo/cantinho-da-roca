import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faCaretDown, faCheck, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  WHATSAPP_TEMPLATES,
  buildWhatsAppUrl,
  getTemplate,
  pickSuggestedTemplate,
  type TemplateKey,
  type TemplateLead,
} from '@/lib/whatsappTemplates';
import { interactionService } from '@/services/interactionService';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  lead: TemplateLead & { id: string; phone: string | null };
  variant?: 'primary' | 'icon' | 'ghost';
  size?: 'sm' | 'md';
  interactionCount?: number;
  onSent?: () => void;
  className?: string;
}

export default function WhatsAppQuickAction({
  lead,
  variant = 'icon',
  size = 'sm',
  interactionCount,
  onSent,
  className,
}: Props) {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState<TemplateKey>('first_contact');
  const [editText, setEditText] = useState('');
  const [justSent, setJustSent] = useState(false);

  const disabled = !lead.phone;
  const suggestedKey = pickSuggestedTemplate(lead, { interactionCount });

  async function logInteraction(label: string, message: string) {
    if (!user?.id) return;
    try {
      await interactionService.create({
        lead_id: lead.id,
        contact_type: 'mensagem',
        description: `[Template: ${label}] ${message.slice(0, 80)}${message.length > 80 ? '…' : ''}`,
        created_by: user.id,
      });
    } catch (e) {
      console.warn('Falha ao registrar interação WhatsApp:', e);
      toast.warning('Mensagem aberta, mas não foi possível registrar a interação.');
    }
  }

  function flashSent() {
    setJustSent(true);
    setTimeout(() => setJustSent(false), 1200);
  }

  async function send(key: TemplateKey, customMessage?: string) {
    if (!lead.phone) return;
    const tpl = getTemplate(key);
    const message = customMessage ?? tpl.build(lead);
    const url = buildWhatsAppUrl(lead.phone, message);
    if (!url) {
      toast.error('Telefone inválido');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    flashSent();
    await logInteraction(tpl.label, message);
    if (user?.id) toast.success('Mensagem enviada e registrada');
    onSent?.();
  }

  function openEditor(key: TemplateKey) {
    const tpl = getTemplate(key);
    setEditKey(key);
    setEditText(tpl.build(lead));
    setEditOpen(true);
  }

  async function confirmEdited() {
    await send(editKey, editText);
    setEditOpen(false);
  }

  // ----- VISUAL -----
  const iconNode = (
    <FontAwesomeIcon
      icon={justSent ? faCheck : faWhatsapp}
      className={cn(
        size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5',
        justSent && 'text-success animate-in zoom-in-50 duration-200',
      )}
    />
  );

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

  const trigger = (() => {
    if (variant === 'primary') {
      return (
        <div className={cn('inline-flex rounded-lg overflow-hidden shadow-sm', className)} onClick={stop}>
          <Button
            type="button"
            size={size === 'md' ? 'sm' : 'sm'}
            disabled={disabled}
            onClick={() => send(suggestedKey)}
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-none rounded-l-lg gap-1.5 disabled:opacity-50"
          >
            {iconNode}
            <span className="font-medium">WhatsApp</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                disabled={disabled}
                className="bg-[#1faa50] hover:bg-[#188a40] text-white rounded-none rounded-r-lg px-2 border-l border-white/15"
                aria-label="Escolher template de mensagem"
              >
                <FontAwesomeIcon icon={faCaretDown} className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            {menuContent()}
          </DropdownMenu>
        </div>
      );
    }

    return (
      <div className={cn('inline-flex items-center gap-0.5', className)} onClick={stop}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => send(suggestedKey)}
              className={cn(
                'h-7 w-7 text-success hover:bg-success-soft',
                disabled && 'opacity-40',
              )}
              aria-label="Enviar WhatsApp (template sugerido)"
            >
              {iconNode}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {disabled ? 'Sem telefone cadastrado' : `Enviar: ${getTemplate(suggestedKey).label}`}
          </TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="h-7 w-4 text-success/70 hover:bg-success-soft hover:text-success"
              aria-label="Escolher template"
            >
              <FontAwesomeIcon icon={faCaretDown} className="h-2.5 w-2.5" />
            </Button>
          </DropdownMenuTrigger>
          {menuContent()}
        </DropdownMenu>
      </div>
    );
  })();

  function menuContent() {
    return (
      <DropdownMenuContent align="end" className="rounded-xl shadow-pop w-64" onClick={stop}>
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Templates
        </DropdownMenuLabel>
        {WHATSAPP_TEMPLATES.map((tpl) => (
          <DropdownMenuItem
            key={tpl.key}
            onClick={() => send(tpl.key)}
            className="flex items-start gap-2.5 py-2 cursor-pointer"
          >
            <FontAwesomeIcon icon={tpl.icon} className="h-3.5 w-3.5 mt-0.5 text-success" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground">{tpl.label}</span>
                {tpl.key === suggestedKey && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-success-soft text-success font-semibold">
                    Sugerido
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{tpl.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => openEditor(suggestedKey)}
          className="text-xs gap-2 cursor-pointer"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="h-3 w-3" />
          Ver / editar antes de enviar
        </DropdownMenuItem>
      </DropdownMenuContent>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      {trigger}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl shadow-pop max-w-md" onClick={stop}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-success" />
              Editar mensagem
            </DialogTitle>
            <DialogDescription>
              Template: <span className="font-medium text-foreground">{getTemplate(editKey).label}</span> · enviando para{' '}
              <span className="font-mono text-foreground">{lead.phone}</span>
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[140px] text-sm"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            {WHATSAPP_TEMPLATES.map((tpl) => (
              <Button
                key={tpl.key}
                type="button"
                variant={editKey === tpl.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setEditKey(tpl.key);
                  setEditText(tpl.build(lead));
                }}
                className="h-7 text-xs"
              >
                <FontAwesomeIcon icon={tpl.icon} className="h-3 w-3 mr-1.5" />
                {tpl.label}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={confirmEdited}
              disabled={!editText.trim()}
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white"
            >
              <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 mr-1.5" />
              Abrir WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
