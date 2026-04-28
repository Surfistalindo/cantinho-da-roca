import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt, faCheck, faCalendarPlus, faCopy, faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  leadId: string;
  leadName: string;
  phone: string | null;
  onUpdated?: () => void;
  align?: 'start' | 'center' | 'end';
}

export default function QuickActionsPopover({ leadId, leadName, phone, onUpdated, align = 'end' }: Props) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [date, setDate] = useState<Date | undefined>();

  const markContacted = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Sessão expirada'); return; }
    const now = new Date().toISOString();
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('leads').update({ last_contact_at: now }).eq('id', leadId),
      supabase.from('interactions').insert({
        lead_id: leadId,
        created_by: user.id,
        contact_type: 'observação',
        description: 'Contato marcado como feito',
        interaction_date: now,
      }),
    ]);
    if (e1 || e2) { toast.error('Erro ao registrar contato'); return; }
    toast.success(`Contato registrado para ${leadName}`);
    setOpen(false);
    onUpdated?.();
  };

  const scheduleFollowup = async (d: Date) => {
    const { error } = await supabase
      .from('leads')
      .update({ next_contact_at: d.toISOString() })
      .eq('id', leadId);
    if (error) { toast.error('Erro ao agendar'); return; }
    toast.success(`Follow-up agendado para ${d.toLocaleDateString('pt-BR')}`);
    setShowCalendar(false);
    setOpen(false);
    onUpdated?.();
  };

  const copyPhone = async () => {
    if (!phone) return;
    await navigator.clipboard.writeText(phone);
    toast.success('Telefone copiado');
    setOpen(false);
  };

  const openWhats = () => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${num}?text=Olá! Aqui é da equipe Cantinho da Roça.`, '_blank');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
          aria-label="Ações rápidas"
        >
          <FontAwesomeIcon icon={faBolt} className="h-3.5 w-3.5 text-honey" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn('w-56 p-1', showCalendar && 'w-auto')}
        onClick={(e) => e.stopPropagation()}
      >
        {!showCalendar ? (
          <div className="space-y-0.5">
            <ActionRow icon={faCheck} label="Marcar contato feito" onClick={markContacted} tone="success" />
            <ActionRow icon={faCalendarPlus} label="Agendar follow-up" onClick={() => setShowCalendar(true)} />
            {phone && (
              <>
                <div className="my-1 h-px bg-border" />
                <ActionRow icon={faWhatsapp} label="Abrir WhatsApp" onClick={openWhats} tone="success" />
                <ActionRow icon={faCopy} label="Copiar telefone" onClick={copyPhone} />
                <ActionRow
                  icon={faPhone}
                  label="Ligar"
                  onClick={() => { window.location.href = `tel:${phone}`; setOpen(false); }}
                />
              </>
            )}
          </div>
        ) : (
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => { setDate(d); if (d) scheduleFollowup(d); }}
            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function ActionRow({
  icon, label, onClick, tone,
}: { icon: typeof faCheck; label: string; onClick: () => void; tone?: 'success' | 'default' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-left hover:bg-muted transition-colors',
        tone === 'success' && 'text-success',
      )}
    >
      <FontAwesomeIcon icon={icon} className="h-3 w-3 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}
