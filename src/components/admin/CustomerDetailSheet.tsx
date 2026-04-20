import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import InteractionTimeline from './InteractionTimeline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faPenToSquare, faTrashCan, faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';

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

  if (!customer) return null;

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
            <InteractionTimeline entityId={customer.id} entityType="customer" />
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
