import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faExternalLink, faQrcode, faKey, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { WAConfig } from './types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  config: WAConfig | null;
  onSaved: () => void;
}

const steps = [
  { num: 1, icon: faExternalLink, title: 'Crie sua instância',
    text: 'Acesse o painel da Z-API e crie uma instância gratuita.' },
  { num: 2, icon: faQrcode, title: 'Conecte o WhatsApp',
    text: 'Escaneie o QR Code com o celular que vai enviar as mensagens.' },
  { num: 3, icon: faKey, title: 'Cole o Instance ID',
    text: 'No painel da Z-API, copie o ID e cole aqui embaixo.' },
];

export default function SetupDialog({ open, onOpenChange, config, onSaved }: Props) {
  const [step, setStep] = useState(config?.is_configured ? 3 : 1);
  const [instanceId, setInstanceId] = useState(config?.instance_id ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setInstanceId(config?.instance_id ?? '');
      setStep(config?.is_configured ? 3 : 1);
    }
  }, [open, config]);

  const save = async () => {
    if (!instanceId.trim()) { toast.error('Cole o Instance ID'); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('wa-config-save', {
        body: { instance_id: instanceId.trim() },
      });
      if (error || data?.error) toast.error(data?.error || error?.message || 'Falha');
      else { toast.success('WhatsApp conectado!'); onSaved(); onOpenChange(false); }
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display-warm text-xl flex items-center gap-2">
            <FontAwesomeIcon icon={faWhatsapp} className="h-5 w-5 text-[#25D366]" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Em 3 passos seu CRM vai poder enviar e receber mensagens via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between gap-2 py-4">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <button
                onClick={() => setStep(s.num)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left',
                  step === s.num ? 'bg-muted' : 'hover:bg-muted/50',
                )}
              >
                <span
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    step >= s.num
                      ? 'bg-[hsl(var(--secondary))] text-white'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {s.num}
                </span>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold leading-tight">{s.title}</p>
                </div>
              </button>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-px mx-1', step > s.num ? 'bg-[hsl(var(--secondary))]' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>

        {/* Conteúdo do passo */}
        <div className="rounded-xl border border-border bg-muted/30 p-5 min-h-[180px]">
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FontAwesomeIcon icon={faExternalLink} className="h-3.5 w-3.5" />
                Passo 1 — Crie sua instância
              </div>
              <p className="text-sm text-muted-foreground">
                A Z-API é o serviço que conecta seu CRM ao WhatsApp. É grátis para começar.
              </p>
              <a
                href="https://app.z-api.io/" target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--secondary))] hover:underline"
              >
                Abrir painel da Z-API
                <FontAwesomeIcon icon={faExternalLink} className="h-3 w-3" />
              </a>
              <div className="pt-3">
                <Button onClick={() => setStep(2)} size="sm">
                  Já criei <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FontAwesomeIcon icon={faQrcode} className="h-3.5 w-3.5" />
                Passo 2 — Conecte seu WhatsApp
              </div>
              <p className="text-sm text-muted-foreground">
                No painel da Z-API, clique em <strong>"QR Code"</strong> e escaneie com o WhatsApp do celular que vai enviar as mensagens (recomendamos um número dedicado).
              </p>
              <p className="text-xs text-muted-foreground">
                ⚠ Não use seu WhatsApp pessoal — pode ser desconectado pelo aplicativo.
              </p>
              <div className="pt-3">
                <Button onClick={() => setStep(3)} size="sm">
                  Conectei <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FontAwesomeIcon icon={faKey} className="h-3.5 w-3.5" />
                Passo 3 — Cole o Instance ID
              </div>
              <p className="text-sm text-muted-foreground">
                No topo do painel da Z-API, ao lado do nome da instância, copie o código <strong>Instance ID</strong> e cole abaixo.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="instance">Instance ID</Label>
                <Input
                  id="instance"
                  placeholder="3D..."
                  value={instanceId}
                  onChange={(e) => setInstanceId(e.target.value)}
                  className="font-mono"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Os tokens sensíveis (Instance Token e Client Token) já estão guardados em segredo no servidor.
              </p>
              <div className="pt-2 flex items-center justify-between">
                {config?.is_configured && (
                  <span className="text-xs text-success flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                    Já configurado anteriormente
                  </span>
                )}
                <Button onClick={save} disabled={saving} className="ml-auto">
                  {saving ? 'Salvando…' : 'Salvar e conectar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
