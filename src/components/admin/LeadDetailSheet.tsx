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
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      {children}
    </h4>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

export default function LeadDetailSheet({ lead, open, onOpenChange, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', origin: '', product_interest: '', notes: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

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
      // Histórico transferido dentro de createFromLead via interactions.customer_id
      toast.success('Lead convertido em cliente!');
      setConvertDialogOpen(false);
      onOpenChange(false);
      onUpdated?.();
    } catch {
      toast.error('Erro ao converter lead');
    }
  };

  const openWhatsApp = () => {
    if (!lead?.phone) return;
    const clean = lead.phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${num}`, '_blank');
  };

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
        <SheetContent className="overflow-y-auto sm:max-w-lg p-0 flex flex-col">
          {/* HEADER */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border bg-card sticky top-0 z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SheetTitle className="font-heading text-xl flex flex-wrap items-center gap-2">
                  <span className="truncate">{lead.name}</span>
                  <LeadStatusBadge status={lead.status} />
                </SheetTitle>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                  {lead.phone && (
                    <button
                      onClick={openWhatsApp}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
                      <span className="font-medium">{lead.phone}</span>
                    </button>
                  )}
                  <ContactRecencyBadge
                    lastContactAt={lead.last_contact_at}
                    status={lead.status}
                    createdAt={lead.created_at}
                    size="sm"
                  />
                  <span>· Lead há {createdRelative}</span>
                </div>
              </div>
            </div>

            {/* AÇÕES RÁPIDAS */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {lead.phone && (
                <Button size="sm" onClick={openWhatsApp} className="bg-[#25D366] text-white hover:bg-[#20bd5a]">
                  <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 mr-1.5" />
                  WhatsApp
                </Button>
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
                  className="text-primary"
                >
                  <FontAwesomeIcon icon={faUserCheck} className="h-3.5 w-3.5 mr-1.5" />
                  Converter
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="ml-auto px-2">
                    <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5 mr-2" />
                    Excluir lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SheetHeader>

          {/* CONTEÚDO */}
          <div className="px-6 py-5 space-y-5 flex-1">
            {/* BLOCO 1: Status & Acompanhamento */}
            <section className="rounded-lg border border-border bg-card p-4">
              <SectionLabel>Status & Acompanhamento</SectionLabel>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Status atual</span>
                  <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} onUpdated={() => onUpdated?.()} />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Último contato</span>
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
                  <span className="text-sm text-muted-foreground">Próximo contato</span>
                  <span className="text-sm font-medium">
                    {lead.next_contact_at
                      ? format(new Date(lead.next_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* BLOCO 2: Dados do contato */}
            <section className="rounded-lg border border-border bg-card p-4">
              <SectionLabel>Dados do contato</SectionLabel>
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Nome</p>
                    <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Telefone</p>
                    <Input
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Origem</p>
                      <Input
                        value={editData.origin}
                        onChange={(e) => setEditData({ ...editData, origin: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Interesse
                      </p>
                      <Input
                        value={editData.product_interest}
                        onChange={(e) => setEditData({ ...editData, product_interest: e.target.value })}
                      />
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

            {/* BLOCO 3: Mensagem & Observações */}
            <section className="rounded-lg border border-border bg-muted/30 p-4">
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
                  className="min-h-[100px] bg-background"
                />
              ) : lead.notes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem mensagem ou observações registradas.</p>
              )}
            </section>

            {/* BLOCO 4: Histórico de Interações */}
            <section className="rounded-lg border border-border bg-card p-4">
              <SectionLabel>Histórico de Interações</SectionLabel>
              <InteractionTimeline entityId={lead.id} entityType="lead" />
            </section>
          </div>

          {/* FOOTER de edição (sticky) */}
          {editing && (
            <div className="sticky bottom-0 z-10 border-t border-border bg-card px-6 py-3 flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5 mr-1.5" />
                Cancelar
              </Button>
              <Button size="sm" onClick={saveEdit}>
                <FontAwesomeIcon icon={faFloppyDisk} className="h-3.5 w-3.5 mr-1.5" />
                Salvar alterações
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lead</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{lead.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteLead}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em cliente</DialogTitle>
            <DialogDescription>
              Deseja converter "{lead.name}" em cliente? O lead será marcado como Cliente no funil e um novo registro de
              cliente será criado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConvertDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={convertToCustomer}>Converter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
