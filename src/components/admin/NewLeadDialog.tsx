import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APP_CONFIG } from '@/config/app';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(100, 'Máx. 100 caracteres'),
  phone: z.string().trim().min(10, 'Telefone inválido').max(20, 'Telefone inválido')
    .regex(/^[\d\s()+-]+$/, 'Apenas números e ( ) + -'),
  origin: z.string().trim().max(50).optional().or(z.literal('')),
  product_interest: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().max(500).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  status: z.string(),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  /** Pré-seleciona o status (útil ao criar lead a partir de uma coluna do pipeline) */
  defaultStatus?: string;
}

const buildInitial = (status = 'new') => ({
  name: '', phone: '', origin: '', product_interest: '', message: '', notes: '', status,
});

export default function NewLeadDialog({ open, onOpenChange, onCreated, defaultStatus }: Props) {
  const [data, setData] = useState(() => buildInitial(defaultStatus));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Sincroniza status quando defaultStatus muda ou dialog abre
  useEffect(() => {
    if (open) {
      setData((d) => ({ ...d, status: defaultStatus ?? d.status ?? 'new' }));
    }
  }, [open, defaultStatus]);

  const reset = () => { setData(buildInitial(defaultStatus)); setErrors({}); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { if (i.path[0]) errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);

    const phoneClean = parsed.data.phone.replace(/\D/g, '');
    // Combine message + notes internally
    const combinedNotes = [
      parsed.data.message ? `Mensagem: ${parsed.data.message}` : null,
      parsed.data.notes ? `Obs: ${parsed.data.notes}` : null,
    ].filter(Boolean).join('\n\n') || null;

    const { error } = await supabase.from('leads').insert({
      name: parsed.data.name,
      phone: phoneClean,
      origin: parsed.data.origin || 'Cadastro manual',
      product_interest: parsed.data.product_interest || null,
      notes: combinedNotes,
      status: parsed.data.status,
    });
    setSaving(false);

    if (error) {
      if ((error as { code?: string }).code === '23505') {
        toast.error('Telefone já cadastrado', { description: 'Esse contato já existe no CRM.' });
        setErrors({ phone: 'Telefone já cadastrado' });
        return;
      }
      toast.error('Erro ao cadastrar', { description: error.message });
      return;
    }

    toast.success('Contato cadastrado com sucesso!');
    reset();
    onOpenChange(false);
    onCreated?.();
  };

  const handleClose = (v: boolean) => { if (!v) reset(); onOpenChange(v); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo contato</DialogTitle>
          <DialogDescription>Cadastre manualmente um lead no CRM. Ele entra na mesma base dos leads do site.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid gap-1.5">
            <Label htmlFor="nl-name">Nome <span className="text-destructive">*</span></Label>
            <Input id="nl-name" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} maxLength={100} />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nl-phone">WhatsApp <span className="text-destructive">*</span></Label>
            <Input id="nl-phone" placeholder="(71) 99999-9999" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} maxLength={20} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nl-origin">Origem</Label>
              <Select value={data.origin} onValueChange={(v) => setData({ ...data, origin: v })}>
                <SelectTrigger id="nl-origin"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {APP_CONFIG.leadOrigins.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                  <SelectItem value="Cadastro manual">Cadastro manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nl-status">Status inicial</Label>
              <Select value={data.status} onValueChange={(v) => setData({ ...data, status: v })}>
                <SelectTrigger id="nl-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {APP_CONFIG.leadStatuses.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nl-interest">Interesse</Label>
            <Input id="nl-interest" placeholder="Ex: Queijos, doces, cesta..." value={data.product_interest} onChange={(e) => setData({ ...data, product_interest: e.target.value })} maxLength={200} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nl-message">Mensagem do contato</Label>
            <Textarea id="nl-message" placeholder="O que ele disse / pediu..." value={data.message} onChange={(e) => setData({ ...data, message: e.target.value })} maxLength={500} rows={2} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="nl-notes">Observações internas</Label>
            <Textarea id="nl-notes" placeholder="Notas privadas da equipe..." value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} maxLength={1000} rows={2} />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              <FontAwesomeIcon icon={faFloppyDisk} className="h-3.5 w-3.5 mr-1.5" />
              {saving ? 'Salvando...' : 'Cadastrar contato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
