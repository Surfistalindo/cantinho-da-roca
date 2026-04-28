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
import InteractionTimeline from './InteractionTimeline';
import ContactRecencyBadge from './ContactRecencyBadge';
import InitialsAvatar from './InitialsAvatar';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare,
  faTrashCan,
  faFloppyDisk,
  faXmark,
  faPlus,
  faPhone,
  faEllipsisVertical,
  faQuoteLeft,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  product_bought: string | null;
  purchase_date: string | null;
  last_contact_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
      {children}
    </h4>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

export default function CustomerDetailSheet({ customer, open, onOpenChange, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', product_bought: '', notes: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (customer && open) setEditing(false);
  }, [customer, open]);

  const startEditing = () => {
    if (!customer) return;
    setEditData({
      name: customer.name,
      phone: customer.phone ?? '',
      product_bought: customer.product_bought ?? '',
      notes: customer.notes ?? '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!customer) return;
    const { error } = await supabase.from('customers').update({
      name: editData.name,
      phone: editData.phone || null,
      product_bought: editData.product_bought || null,
      notes: editData.notes || null,
    }).eq('id', customer.id);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Cliente atualizado');
    setEditing(false);
    onUpdated?.();
  };

  const deleteCustomer = async () => {
    if (!customer) return;
    const { error } = await supabase.from('customers').delete().eq('id', customer.id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Cliente excluído');
    setDeleteDialogOpen(false);
    onOpenChange(false);
    onUpdated?.();
  };

  const openWhatsApp = () => {
    if (!customer?.phone) return;
    const clean = customer.phone.replace(/\D/g, '');
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

  if (!customer) return null;

  const createdRelative = formatDistanceToNow(new Date(customer.created_at), { locale: ptBR, addSuffix: false });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="crm-scroll-area sm:max-w-xl p-0 flex flex-col bg-background">
          <SheetHeader className="px-6 pt-6 pb-5 border-b border-border bg-card sticky top-0 z-10 space-y-0">
            <div className="flex items-start gap-4">
              <InitialsAvatar name={customer.name} size="lg" />
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
                  <span className="truncate">{customer.name}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-success-soft text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                    Cliente
                  </span>
                </SheetTitle>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                  {customer.phone && (
                    <button
                      onClick={openWhatsApp}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
                      <span className="font-medium font-mono">{customer.phone}</span>
                    </button>
                  )}
                  <ContactRecencyBadge
                    lastContactAt={customer.last_contact_at}
                    status="contacting"
                    createdAt={customer.created_at}
                    size="sm"
                  />
                  <span className="text-muted-foreground/70">· Cliente há {createdRelative}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-5">
              {customer.phone && (
                <Button size="sm" onClick={openWhatsApp} className="bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-sm">
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
                    Excluir cliente
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SheetHeader>

          <div className="px-6 py-6 space-y-4 flex-1">
            <section className="rounded-2xl bg-card border border-border p-5">
              <SectionLabel>Compra</SectionLabel>
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
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Produto comprado</p>
                    <Input value={editData.product_bought} onChange={(e) => setEditData({ ...editData, product_bought: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {customer.product_bought && <Field label="Produto" value={customer.product_bought} />}
                  {customer.purchase_date && (
                    <Field
                      label="Data da compra"
                      value={format(new Date(customer.purchase_date), 'dd/MM/yyyy', { locale: ptBR })}
                    />
                  )}
                  {customer.last_contact_at && (
                    <Field
                      label="Último contato"
                      value={format(new Date(customer.last_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    />
                  )}
                  <Field
                    label="Cadastrado em"
                    value={format(new Date(customer.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  />
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border surface-muted p-5">
              <SectionLabel>
                <span className="inline-flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faQuoteLeft} className="h-3 w-3" />
                  Observações
                </span>
              </SectionLabel>
              {editing ? (
                <Textarea
                  placeholder="Observações internas..."
                  value={editData.notes}
                  onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                  className="min-h-[100px] bg-card"
                />
              ) : customer.notes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{customer.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem observações registradas.</p>
              )}
            </section>

            <section className="rounded-2xl bg-card border border-border p-5">
              <SectionLabel>Histórico de Interações</SectionLabel>
              <InteractionTimeline entityId={customer.id} entityType="customer" />
            </section>
          </div>

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
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{customer.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteCustomer}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
