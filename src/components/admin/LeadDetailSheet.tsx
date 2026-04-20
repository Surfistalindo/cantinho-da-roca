import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LeadStatusBadge from './LeadStatusBadge';
import LeadStatusSelect from './LeadStatusSelect';
import InteractionTimeline from './InteractionTimeline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faPenToSquare, faTrashCan, faUserCheck, faFloppyDisk, faXmark } from '@fortawesome/free-solid-svg-icons';
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

export default function LeadDetailSheet({ lead, open, onOpenChange, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', phone: '', origin: '', product_interest: '', notes: '' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);

  useEffect(() => {
    if (lead && open) {
      setEditing(false);
    }
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
    const { error } = await supabase.from('leads').update({
      name: editData.name,
      phone: editData.phone || null,
      origin: editData.origin || null,
      product_interest: editData.product_interest || null,
      notes: editData.notes || null,
    }).eq('id', lead.id);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Lead atualizado');
    setEditing(false);
    onUpdated?.();
  };

  const deleteLead = async () => {
    if (!lead) return;
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    if (error) { toast.error('Erro ao excluir'); return; }
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

  if (!lead) return null;

  const typeIcon = (ct: string) => {
    const t = interactionTypes.find((i) => i.value === ct);
    return <FontAwesomeIcon icon={t ? t.icon : faFileLines} className="h-3.5 w-3.5" />;
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="font-heading flex flex-wrap items-center gap-2">
              {lead.name}
              <LeadStatusBadge status={lead.status} />
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status atual</span>
            <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} onUpdated={() => onUpdated?.()} />
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={startEditing} disabled={editing}>
              <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConvertDialogOpen(true)} className="text-primary">
              <FontAwesomeIcon icon={faUserCheck} className="h-3.5 w-3.5 mr-1.5" /> Converter em Cliente
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(true)} className="text-destructive ml-auto">
              <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
            </Button>
          </div>

          {editing ? (
            <div className="mt-4 space-y-3">
              <Input placeholder="Nome" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
              <Input placeholder="Telefone" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
              <Input placeholder="Origem" value={editData.origin} onChange={(e) => setEditData({ ...editData, origin: e.target.value })} />
              <Input placeholder="Interesse" value={editData.product_interest} onChange={(e) => setEditData({ ...editData, product_interest: e.target.value })} />
              <Textarea placeholder="Observações" value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}><FontAwesomeIcon icon={faFloppyDisk} className="h-3.5 w-3.5 mr-1.5" /> Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5 mr-1.5" /> Cancelar</Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {[
                { label: 'Nome', value: lead.name },
                { label: 'Telefone', value: lead.phone },
                { label: 'Origem', value: lead.origin },
                { label: 'Interesse', value: lead.product_interest },
                { label: 'Criado em', value: format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) },
                { label: 'Atualizado em', value: lead.updated_at ? format(new Date(lead.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null },
                { label: 'Último contato', value: lead.last_contact_at ? format(new Date(lead.last_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null },
                { label: 'Próximo contato', value: lead.next_contact_at ? format(new Date(lead.next_contact_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : null },
                { label: 'Observações', value: lead.notes },
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

          {lead.phone && (
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => {
              const clean = lead.phone!.replace(/\D/g, '');
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
            <DialogTitle>Excluir lead</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir "{lead.name}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteLead}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em cliente</DialogTitle>
            <DialogDescription>Deseja converter "{lead.name}" em cliente? O lead será marcado como Cliente no funil e um novo registro de cliente será criado.</DialogDescription>
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
