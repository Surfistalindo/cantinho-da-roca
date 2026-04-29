import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faImage, faXmark, faBoltLightning, faEye } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import FormatToolbar from './FormatToolbar';
import type { WATemplate } from './types';

interface Props {
  phone: string;
  leadId: string;
  leadName?: string;
  templates: WATemplate[];
  disabled?: boolean;
  onSent: () => void;
}

const SOFT_LIMIT = 1000;
const HARD_LIMIT = 4096;

function applyVariables(body: string, name?: string) {
  return body
    .replace(/\{\{\s*nome\s*\}\}/gi, (name ?? '').split(' ')[0] || 'amigo')
    .replace(/\{\{\s*name\s*\}\}/gi, (name ?? '').split(' ')[0] || 'friend');
}

function renderWaPreview(text: string) {
  const escape = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
  let html = escape(text);
  html = html.replace(/```([\s\S]+?)```/g, '<code class="bg-muted px-1 rounded">$1</code>');
  html = html.replace(/\*([^\s*][^*]*[^\s*]|\S)\*/g, '<strong>$1</strong>');
  html = html.replace(/_([^\s_][^_]*[^\s_]|\S)_/g, '<em>$1</em>');
  html = html.replace(/~([^\s~][^~]*[^\s~]|\S)~/g, '<s>$1</s>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}

export default function MessageComposer({ phone, leadId, leadName, templates, disabled, onSent }: Props) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [substituted, setSubstituted] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Restaurar rascunho ao trocar de lead
  useEffect(() => {
    setText('');
    setImageUrl('');
    setShowImage(false);
    setSubstituted(false);
    try {
      const draft = localStorage.getItem(`wa-draft-${leadId}`);
      if (draft) setText(draft);
    } catch { /* ignore */ }
  }, [leadId]);

  // Persistir rascunho (debounce simples)
  useEffect(() => {
    if (!leadId) return;
    const t = setTimeout(() => {
      try {
        if (text) {
          localStorage.setItem(`wa-draft-${leadId}`, text);
          setDraftSavedAt(Date.now());
        } else {
          localStorage.removeItem(`wa-draft-${leadId}`);
          setDraftSavedAt(null);
        }
      } catch { /* ignore */ }
    }, 400);
    return () => clearTimeout(t);
  }, [text, leadId]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [text]);

  const send = async () => {
    if (showImage) {
      if (!imageUrl.trim()) { toast.error('Informe a URL da imagem'); return; }
    } else if (!text.trim()) return;
    if (text.length > HARD_LIMIT) { toast.error(`Máximo de ${HARD_LIMIT} caracteres`); return; }

    setSending(true);
    try {
      const finalText = applyVariables(text, leadName);
      const payload = showImage
        ? { phone, type: 'image' as const, imageUrl, caption: finalText, leadId }
        : { phone, type: 'text' as const, message: finalText, leadId };

      const { data, error } = await supabase.functions.invoke('wa-send', { body: payload });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Falha no envio');
      } else {
        toast.success('Mensagem enviada');
        setText(''); setImageUrl(''); setShowImage(false);
        try { localStorage.removeItem(`wa-draft-${leadId}`); } catch { /* ignore */ }
        onSent();
      }
    } finally { setSending(false); }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const insertTemplate = (tpl: WATemplate) => {
    const original = tpl.body_preview;
    const filled = applyVariables(original, leadName);
    setText(filled);
    setSubstituted(filled !== original);
    if (filled !== original) setTimeout(() => setSubstituted(false), 3000);
    taRef.current?.focus();
  };

  const len = text.length;
  const overSoft = len > SOFT_LIMIT;
  const overHard = len > HARD_LIMIT;
  const hasFormatting = /[*_~`]/.test(text);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="border-t border-border bg-card p-3 sm:p-4 space-y-2">
        {showImage && (
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (URL pública da imagem)"
              className="h-9 text-sm"
            />
            <Button size="sm" variant="ghost" onClick={() => { setShowImage(false); setImageUrl(''); }}>
              <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
            </Button>
          </div>
        )}
        {showImage && imageUrl.trim() && (
          <div className="rounded-lg border border-border overflow-hidden bg-muted/30 max-w-[180px]">
            <img src={imageUrl} alt="" className="w-full h-auto max-h-32 object-contain" />
          </div>
        )}

        {/* Toolbar de formatação */}
        <div className="flex items-center justify-between gap-2" data-tour="wa-composer-format">
          <FormatToolbar textareaRef={taRef} value={text} onChange={setText} disabled={disabled || sending} />

          <div className="flex items-center gap-1">
            {hasFormatting && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-[11px] gap-1">
                    <FontAwesomeIcon icon={faEye} className="h-3 w-3" />
                    Preview
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-3 text-sm">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                    Como vai aparecer no WhatsApp
                  </p>
                  <div
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderWaPreview(applyVariables(text, leadName)) }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button" size="icon" variant="ghost"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setShowImage((v) => !v)}
                  disabled={disabled}
                >
                  <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-[11px]">Anexar imagem por URL pública</TooltipContent>
            </Tooltip>

            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      type="button" size="icon" variant="ghost"
                      className="h-9 w-9 rounded-full"
                      disabled={disabled || templates.length === 0}
                      data-tour="wa-composer-templates"
                    >
                      <FontAwesomeIcon icon={faBoltLightning} className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent className="text-[11px]">Inserir template (variáveis substituídas)</TooltipContent>
              </Tooltip>
              <PopoverContent align="start" className="w-72 p-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-semibold">
                  Templates da régua
                </p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => insertTemplate(t)}
                      className="w-full text-left p-2 rounded-md hover:bg-muted text-xs space-y-0.5"
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center h-4 w-4 rounded bg-honey/30 text-[hsl(var(--cocoa))] text-[9px] font-bold">
                          {t.step_order}
                        </span>
                        {t.name}
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{t.body_preview}</p>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground px-2 pt-2 border-t border-border mt-1">
                  Variáveis suportadas: <code className="px-1 rounded bg-muted">{'{{nome}}'}</code>
                </p>
              </PopoverContent>
            </Popover>
          </div>

          <Textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={showImage ? 'Legenda (opcional)…' : 'Digite uma mensagem… (Enter envia, Shift+Enter quebra linha)'}
            className="resize-none min-h-[40px] max-h-40 text-sm"
            disabled={disabled || sending}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={send}
                disabled={disabled || sending || overHard || (!text.trim() && !showImage)}
                size="icon"
                className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.9)] text-white shrink-0"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-[11px]">
              Enviar agora · <kbd className="px-1 rounded bg-muted">Enter</kbd>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between text-[10px] px-1 gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span><kbd className="px-1 rounded bg-muted">Enter</kbd> envia · <kbd className="px-1 rounded bg-muted">Shift+Enter</kbd> nova linha</span>
            {substituted && (
              <span className="text-success font-semibold">Variáveis preenchidas</span>
            )}
            {draftSavedAt && !substituted && (
              <span className="text-muted-foreground italic">Rascunho salvo</span>
            )}
          </div>
          <div className={cn(
            'font-mono',
            overHard ? 'text-destructive font-bold' : overSoft ? 'text-warning' : 'text-muted-foreground',
          )}>
            {len}/{HARD_LIMIT}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
