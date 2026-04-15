import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCommentDots, faPhone, faFileLines, faPenToSquare, faTrashCan, faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

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

interface Interaction {
  id: string;
  contact_type: string;
  description: string;
  interaction_date: string;
}

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

const interactionTypes: { value: string; label: string; icon: IconDefinition }[] = [
  { value: 'mensagem', label: 'Mensagem', icon: faCommentDots },
  { value: 'ligação', label: 'Ligação', icon: faPhone },
  { value: 'observação', label: 'Observação', icon: faFileLines },
];

export default function CustomerDetailSheet({ customer, open, onOpenChange, onUpdated }: Props) {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('observação');
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', product_bought: '', notes: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (customer && open) {
      fetchInteractions();
      setEditing(false);
    }
  }, [customer, open]);

  const fetchInteractions = async () => {
    if (!customer) return;
    const { data } = await supabase
      .from('interactions')
      .select('id, contact_type, description, interaction_date')
      .eq('customer_id', customer.id)
      .order('interaction_date', { ascending: false });
    setInteractions((data as Interaction[]) ?? []);
  };

  const addInteraction = async () => {
    if (!customer || !user || !newContent.trim()) return;
    setSending(true);
    const { error } = await supabase.from('interactions').insert({
      customer_id: customer.id,
      created_by: user.id,
      contact_type: newType,
      description: newContent.trim(),
    });
    setSending(false);
    if (error) { toast.error('Erro ao salvar interação'); return; }
    setNewContent('');
    toast.success('Interação registrada');
    fetchInteractions();
    await supabase.from('customers').update({ last_contact_at: new Date().toISOString() }).eq('id', customer.id);
  };

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

  if (!customer) return null;

  const typeIcon = (ct: string) => {
    const t = interactionTypes.find((i) => i.value === ct);
    return <FontAwesomeIcon icon={t ? t.icon : faFileLines} className="h-3.5 w-3.5" />;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-heading">{customer.name}</SheetTitle>
          </SheetHeader>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={startEditing} disabled={editing}>
              <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-destructive ml-auto">
              <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
            </Button>
          </div>

          {editing ? (
            <div className="mt-4 space-y-3">
              <Input placeholder="Nome" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
              <Input placeholder="Telefone" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
              <Input placeholder="Produto comprado" value={editData.product_bought} onChange={(e) => setEditData({ ...editData, product_bought: e.target.value })} />
              <Textarea placeholder="Observações" value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}><FontAwesomeIcon icon={faFloppyDisk} className="h-3.5 w-3.5 mr-1.5" /> Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5 mr-1.5" /> Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {[
                { label: 'Nome', value: customer.name },
                { label: 'Telefone', value: customer.phone },
                { label: 'Produto comprado', value: customer.product_bought },
                { label: 'Data da compra', value: customer.purchase_date ? format(new Date(customer.purchase_date), 'dd/MM/yyyy', { locale: ptBR }) : null },
                { label: 'Último contato', value: customer.last_contact_at ? format(new Date(customer.last_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null },
                { label: 'Observações', value: customer.notes },
                { label: 'Cadastro', value: format(new Date(customer.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
              ].map((i) =>
                i.value ? (
                  <div key={i.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{i.label}</span>
                    <span className="font-medium text-right max-w-[60%]">{i.value}</span>
                  </div>
                ) : null
              )}
            </div>
          )}

          {customer.phone && (
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => {
              const clean = customer.phone!.replace(/\D/g, '');
              const num = clean.startsWith('55') ? clean : `55${clean}`;
              window.open(`https://wa.me/${num}`, '_blank');
            }}>
              <FontAwesomeIcon icon={faCommentDots} className="h-4 w-4 mr-2 text-green-600" /> Contato via WhatsApp
            </Button>
          )}

          <div className="mt-8">
            <h4 className="font-semibold mb-3">Histórico de Interações</h4>
            <div className="space-y-2 mb-4">
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {interactionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Textarea placeholder="Registrar interação..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="min-h-[60px]" />
                <Button size="icon" onClick={addInteraction} disabled={sending || !newContent.trim()}>
                  <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {interactions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma interação registrada.</p>
              )}
              {interactions.map((n) => (
                <div key={n.id} className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {typeIcon(n.contact_type)}
                    <span className="text-xs font-medium capitalize">{n.contact_type}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(n.interaction_date), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm">{n.description}</p>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir cliente</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir "{customer.name}"? Esta ação não pode ser desfeita.</DialogDescription>
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
