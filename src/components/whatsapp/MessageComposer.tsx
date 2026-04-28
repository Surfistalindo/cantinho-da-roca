import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faImage, faXmark, faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WATemplate } from './types';

interface Props {
  phone: string;
  leadId: string;
  templates: WATemplate[];
  disabled?: boolean;
  onSent: () => void;
}

export default function MessageComposer({ phone, leadId, templates, disabled, onSent }: Props) {
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [sending, setSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

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

    setSending(true);
    try {
      const payload = showImage
        ? { phone, type: 'image' as const, imageUrl, caption: text, leadId }
        : { phone, type: 'text' as const, message: text, leadId };

      const { data, error } = await supabase.functions.invoke('wa-send', { body: payload });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || 'Falha no envio');
      } else {
        toast.success('Mensagem enviada');
        setText(''); setImageUrl(''); setShowImage(false);
        onSent();
      }
    } finally { setSending(false); }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const insertTemplate = (tpl: WATemplate) => {
    setText(tpl.body_preview);
    taRef.current?.focus();
  };

  return (
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

      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <Button
            type="button" size="icon" variant="ghost"
            className="h-9 w-9 rounded-full"
            onClick={() => setShowImage((v) => !v)}
            title="Anexar imagem"
            disabled={disabled}
          >
            <FontAwesomeIcon icon={faImage} className="h-3.5 w-3.5" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button" size="icon" variant="ghost"
                className="h-9 w-9 rounded-full"
                title="Inserir template"
                disabled={disabled || templates.length === 0}
              >
                <FontAwesomeIcon icon={faBoltLightning} className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1.5 font-semibold">
                Templates
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
            </PopoverContent>
          </Popover>
        </div>

        <Textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          rows={1}
          placeholder={showImage ? 'Legenda (opcional)…' : 'Digite uma mensagem…'}
          className="resize-none min-h-[40px] max-h-40 text-sm"
          disabled={disabled || sending}
        />

        <Button
          onClick={send}
          disabled={disabled || sending || (!text.trim() && !showImage)}
          size="icon"
          className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary)/0.9)] text-white shrink-0"
          title="Enviar (Enter)"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground px-1">
        <kbd className="px-1 rounded bg-muted">Enter</kbd> envia · <kbd className="px-1 rounded bg-muted">Shift+Enter</kbd> nova linha
      </p>
    </div>
  );
}
