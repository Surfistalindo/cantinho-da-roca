import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPenToSquare, faCircleCheck, faClock } from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { WATemplate } from './types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templates: WATemplate[];
  onChanged: () => void;
}

function delayLabel(hours: number | null) {
  if (!hours || hours === 0) return 'imediato';
  if (hours < 24) return `${hours}h depois`;
  const d = Math.round(hours / 24);
  return `${d} dia${d > 1 ? 's' : ''} depois`;
}

export default function AutomationsDialog({ open, onOpenChange, templates, onChanged }: Props) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const init: Record<string, string> = {};
      templates.forEach((t) => { init[t.id] = t.body_preview; });
      setEdits(init);
    }
  }, [open, templates]);

  const save = async (id: string) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('whatsapp_templates')
        .update({ body_preview: edits[id] })
        .eq('id', id);
      if (error) toast.error(error.message);
      else { toast.success('Mensagem atualizada'); onChanged(); }
    } finally { setSaving(null); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] !grid-rows-[auto_minmax(0,1fr)] grid-cols-1">
        <DialogHeader>
          <DialogTitle className="font-display-warm text-xl flex items-center gap-2">
            <FontAwesomeIcon icon={faRobot} className="h-5 w-5 text-[hsl(var(--honey))]" />
            Automações da Régua
          </DialogTitle>
          <DialogDescription>
            Quando um lead vai para o status <strong>"Em contato"</strong>, ele recebe estas mensagens automaticamente, na ordem.
            Se ele responder a qualquer momento, a automação para sozinha.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 -mx-6 px-6 h-full">
          <div className="space-y-3 py-2">
            {templates.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Nenhuma automação configurada ainda.
              </div>
            )}

            {templates.map((t, i) => (
              <div key={t.id}>
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-7 w-7 rounded-full bg-[hsl(var(--honey)/0.25)] text-[hsl(var(--cocoa))] text-xs font-bold flex items-center justify-center">
                        {t.step_order}
                      </span>
                      <div>
                        <p className="font-semibold text-sm">{t.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                          {delayLabel(t.delay_hours)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={t.is_active ? 'default' : 'outline'} className="text-[10px]">
                      {t.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  <Textarea
                    rows={3}
                    value={edits[t.id] ?? ''}
                    onChange={(e) => setEdits((p) => ({ ...p, [t.id]: e.target.value }))}
                    className="text-sm font-body-warm"
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      Variáveis: <code className="px-1 rounded bg-muted">{'{{nome}}'}</code>
                    </p>
                    <Button
                      size="sm"
                      onClick={() => save(t.id)}
                      disabled={saving === t.id || edits[t.id] === t.body_preview}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="h-3 w-3 mr-1.5" />
                      {saving === t.id ? 'Salvando…' : 'Salvar mensagem'}
                    </Button>
                  </div>
                </div>

                {i < templates.length - 1 && (
                  <div className="flex justify-center my-1">
                    <div className="h-6 w-px bg-border" />
                  </div>
                )}
              </div>
            ))}

            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 mt-4">
              <p className="text-xs flex items-start gap-2 text-muted-foreground">
                <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3 mt-0.5 text-success shrink-0" />
                <span>
                  Após a última etapa sem resposta, o lead recebe a tag <strong>"Régua esgotada"</strong>{' '}
                  e volta para a fila manual. A automação roda automaticamente a cada 5 minutos.
                </span>
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
