import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LeadStatusBadge from './LeadStatusBadge';
import LeadStatusSelect from './LeadStatusSelect';
import InteractionTimeline from './InteractionTimeline';
import ContactRecencyBadge from './ContactRecencyBadge';
import InitialsAvatar from './InitialsAvatar';
import LeadScoreBadge from './LeadScoreBadge';
import WhatsAppQuickAction from './WhatsAppQuickAction';
import { useInteractionCounts } from '@/hooks/useInteractionCounts';
import { getLeadScore } from '@/lib/leadScore';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare,
  faTrashCan,
  faUserCheck,
  faFloppyDisk,
  faXmark,
  faPlus,
  faPhone,
  faEllipsisVertical,
  faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { clientService } from '@/services/clientService';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
  last_contact_at: string | null;
  next_contact_at: string | null;
  notes: string | null;
  cadence_exhausted?: boolean | null;
  cadence_step?: number | null;
  whatsapp_opt_out?: boolean | null;
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80 mb-4">
      {children}
    </h4>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">{label}</p>
      <p className="text-sm font-medium text-foreground break-words leading-snug">{value}</p>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0 last:pb-0 first:pt-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 text-right">{children}</div>
    </div>
  );
}

export default function LeadDetailSheet({ lead, open, onOpenChange, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', origin: '', product_interest: '', notes: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  const interactionCounts = useInteractionCounts(lead ? [lead.id] : []);
  const interactionCount = lead ? (interactionCounts[lead.id] ?? 0) : 0;
  const scoreInfo = lead ? getLeadScore(lead, { interactionCount }) : null;

  useEffect(() => {
    if (lead && open) setEditing(false);
  }, [lead, open]);

  const startEditing = () => {
    if (!lead) return;
    setEditData({
      name: lead.name,
      phone: lead.phone ?? '',
      origin: lead.origin ?? '',
      product_interest: lead.product_interest ?? '',
      notes: lead.notes ?? '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!lead) return;
    const { error } = await supabase
      .from('leads')
      .update({
        name: editData.name,
        phone: editData.phone || null,
        origin: editData.origin || null,
        product_interest: editData.product_interest || null,
        notes: editData.notes || null,
      })
      .eq('id', lead.id);
    if (error) {
      toast.error('Erro ao salvar');
      return;
    }
    toast.success('Lead atualizado');
    setEditing(false);
    onUpdated?.();
  };

  const deleteLead = async () => {
    if (!lead) return;
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    if (error) {
      toast.error('Erro ao excluir');
      return;
    }
    toast.success('Lead excluído');
    setDeleteDialogOpen(false);
    onOpenChange(false);
    onUpdated?.();
  };

  const convertToCustomer = async () => {
    if (!lead) return;
    try {
      await clientService.createFromLead(lead);
      await supabase.from('leads').update({ status: 'won' }).eq('id', lead.id);
      toast.success('Lead convertido em cliente!');
      setConvertDialogOpen(false);
      onOpenChange(false);
      onUpdated?.();
    } catch {
      toast.error('Erro ao converter lead');
    }
  };

  // openWhatsApp removido — WhatsAppQuickAction cuida do envio + log de interação

  const focusInteractionForm = () => {
    const el = document.getElementById('new-interaction-form');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const ta = document.getElementById('new-interaction-textarea') as HTMLTextAreaElement | null;
      ta?.focus();
    }, 350);
  };

  if (!lead) return null;

  const createdRelative = formatDistanceToNow(new Date(lead.created_at), { locale: ptBR, addSuffix: false });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-xl p-0 flex flex-col bg-background">
          {/* HEADER */}
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-border bg-card sticky top-0 z-10 space-y-0">
            <div className="flex items-start gap-4">
              <InitialsAvatar name={lead.name} size="lg" />
              <div className="min-w-0 flex-1">
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-xl p-0 flex flex-col bg-muted/30">
          {/* HEADER */}
          <SheetHeader className="px-7 pt-7 pb-6 border-b border-border bg-card sticky top-0 z-10 space-y-0">
            <div className="flex items-start gap-4">
              <InitialsAvatar name={lead.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <SheetTitle className="text-[22px] leading-tight font-semibold tracking-tight truncate">
                      {lead.name}
                    </SheetTitle>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-muted-foreground">
                      {lead.phone && (
                        <span className="inline-flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
                          <span className="font-medium font-mono">{lead.phone}</span>
                        </span>
                      )}
                      {lead.phone && <span className="text-border">·</span>}
                      <span className="text-muted-foreground/80">há {createdRelative}</span>
                    </div>
                  </div>
                  <LeadScoreBadge lead={lead} interactionCount={interactionCount} size="md" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <LeadStatusBadge status={lead.status} />
                  <ContactRecencyBadge
                    lastContactAt={lead.last_contact_at}
                    status={lead.status}
                    createdAt={lead.created_at}
                    size="sm"
                  />
                  {lead.cadence_exhausted && (
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-destructive/10 text-destructive border border-destructive/20">
                      Régua esgotada
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AÇÕES RÁPIDAS */}
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {lead.phone && (
                <WhatsAppQuickAction
                  lead={lead}
                  interactionCount={interactionCount}
                  variant="primary"
                  size="md"
                  onSent={() => onUpdated?.()}
                />
              )}
              <Button size="sm" variant="outline" onClick={focusInteractionForm}>
                <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 mr-1.5" />
                Interação
              </Button>
              <Button size="sm" variant="outline" onClick={startEditing} disabled={editing}>
                <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
              {lead.status !== 'won' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConvertDialogOpen(true)}
                  className="text-primary border-primary/30 hover:bg-primary/5"
                >
                  <FontAwesomeIcon icon={faUserCheck} className="h-3.5 w-3.5 mr-1.5" />
                  Converter
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="ml-auto px-2 h-9">
                    <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive text-xs"
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5 mr-2" />
                    Excluir lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SheetHeader>

          {/* CONTEÚDO */}
          <div className="px-6 py-6 space-y-4 flex-1">
            {/* Por que essa prioridade */}
            {scoreInfo && scoreInfo.level !== 'closed' && scoreInfo.reasons.length > 0 && (
              <section className={cn(
                'rounded-2xl border p-5',
                scoreInfo.urgent ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border',
              )}>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Por que essa prioridade</SectionLabel>
                  <LeadScoreBadge lead={lead} interactionCount={interactionCount} size="lg" />
                </div>
                <ul className="space-y-1.5">
                  {scoreInfo.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                      <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', scoreInfo.dotClass)} />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Status & Acompanhamento */}
            <section className="rounded-2xl bg-card border border-border p-5">
              <SectionLabel>Status & Acompanhamento</SectionLabel>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Status atual</span>
                  <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} onUpdated={() => onUpdated?.()} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Último contato</span>
                  <div className="flex items-center gap-2 text-right">
                    <ContactRecencyBadge
                      lastContactAt={lead.last_contact_at}
                      status={lead.status}
                      createdAt={lead.created_at}
                      size="sm"
                    />
                    {lead.last_contact_at && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(lead.last_contact_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Próximo contato</span>
                  <span className="text-xs font-medium">
                    {lead.next_contact_at
                      ? format(new Date(lead.next_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* Dados do contato */}
            <section className="rounded-2xl bg-card border border-border p-5">
              <SectionLabel>Dados do contato</SectionLabel>
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</p>
                    <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Telefone</p>
                    <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Origem</p>
                      <Input value={editData.origin} onChange={(e) => setEditData({ ...editData, origin: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Interesse</p>
                      <Input value={editData.product_interest} onChange={(e) => setEditData({ ...editData, product_interest: e.target.value })} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {lead.origin && <Field label="Origem" value={lead.origin} />}
                  {lead.product_interest && <Field label="Interesse" value={lead.product_interest} />}
                  <Field
                    label="Entrou em"
                    value={format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  />
                  {lead.updated_at && (
                    <Field
                      label="Atualizado em"
                      value={format(new Date(lead.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    />
                  )}
                </div>
              )}
            </section>

            {/* Mensagem & Observações */}
            <section className="rounded-2xl border border-border surface-muted p-5">
              <SectionLabel>
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faQuoteLeft} className="h-3 w-3" />
                  Mensagem & Observações
                </span>
              </SectionLabel>
              {editing ? (
                <Textarea
                  placeholder="Mensagem do contato ou observações internas..."
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="min-h-[100px] bg-card"
                />
              ) : lead.notes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem mensagem ou observações registradas.</p>
              )}
            </section>

            {/* Histórico de Interações */}
            <section className="rounded-2xl bg-card border border-border p-5">
              <SectionLabel>Histórico de Interações</SectionLabel>
              <InteractionTimeline entityId={lead.id} entityType="lead" />
            </section>
          </div>

          {/* FOOTER edição */}
          {editing && (
            <div className="sticky bottom-0 z-10 border-t border-border bg-gradient-to-t from-card via-card to-card/90 backdrop-blur px-6 py-3.5 flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>
              <Button size="sm" onClick={saveEdit} className="shadow-sm">
                <FontAwesomeIcon icon={faFloppyDisk} className="h-3.5 w-3.5 mr-1.5" />
                Salvar alterações
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl shadow-pop">
          <DialogHeader>
            <DialogTitle>Excluir lead</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{lead.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteLead}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="rounded-2xl shadow-pop">
          <DialogHeader>
            <DialogTitle>Converter em cliente</DialogTitle>
            <DialogDescription>
              Deseja converter "{lead.name}" em cliente? O lead será marcado como Cliente no funil e um novo registro de
              cliente será criado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConvertDialogOpen(false)}>Cancelar</Button>
            <Button onClick={convertToCustomer}>Converter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
