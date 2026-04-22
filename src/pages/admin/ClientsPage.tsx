import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CustomerDetailSheet from '@/components/admin/CustomerDetailSheet';
import PageHeader from '@/components/admin/PageHeader';
import EmptyState from '@/components/admin/EmptyState';
import LoadingState from '@/components/admin/LoadingState';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faUserCheck, faPlus, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', product_bought: '' });

  const fetchCustomers = useCallback(async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    setCustomers((data as Customer[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useRealtimeTable('customers', fetchCustomers);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.product_bought ?? '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  const openDetail = (c: Customer) => { setSelectedCustomer(c); setSheetOpen(true); };

  const openWhatsApp = (phone: string | null) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${num}?text=Olá! Aqui é da equipe Cantinho da Roça.`, '_blank');
  };

  const addCustomer = async () => {
    if (!newCustomer.name.trim()) { toast.error('Nome é obrigatório'); return; }
    const { error } = await supabase.from('customers').insert({
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim() || null,
      product_bought: newCustomer.product_bought.trim() || null,
      purchase_date: new Date().toISOString().split('T')[0],
    });
    if (error) { toast.error('Erro ao cadastrar'); return; }
    toast.success('Cliente cadastrado');
    setNewCustomer({ name: '', phone: '', product_bought: '' });
    setAddOpen(false);
    fetchCustomers();
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-7xl mx-auto space-y-7">
        <PageHeader
          title="Clientes"
          description="Base de clientes convertidos a partir de leads ou cadastros manuais."
          meta={
            <span className="text-xs text-muted-foreground">
              <span className="font-medium tabular-nums">{filtered.length}</span> cliente{filtered.length === 1 ? '' : 's'}
            </span>
          }
          actions={
            <Button size="sm" onClick={() => setAddOpen(true)} className="h-9 shadow-sm">
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 mr-1.5" /> Novo cliente
            </Button>
          }
        />

        <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
          <div className="relative mb-5 max-w-md">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-muted/40 border-transparent focus-visible:bg-card focus-visible:border-input"
            />
          </div>

          {loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={faUserCheck}
              title="Nenhum cliente encontrado"
              description="Cadastre manualmente ou converta leads em clientes."
            />
          ) : (
            <div className="overflow-x-auto -mx-5">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Cliente</TableHead>
                    <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Produto</TableHead>
                    <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Data compra</TableHead>
                    <TableHead className="w-[100px] text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c, idx) => (
                    <TableRow
                      key={c.id}
                      className={cn('group cursor-pointer h-14 border-border/60', idx % 2 === 1 && 'bg-muted/30')}
                      onClick={() => openDetail(c)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={c.name} size="md" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{c.phone ?? '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{c.product_bought ?? '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-[11px] text-muted-foreground font-mono">
                        {c.purchase_date ? format(new Date(c.purchase_date), 'dd/MM/yy', { locale: ptBR }) : '—'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(c)}>
                                <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalhes</TooltipContent>
                          </Tooltip>
                          {c.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success-soft" onClick={() => openWhatsApp(c.phone)}>
                                  <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>WhatsApp</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <CustomerDetailSheet customer={selectedCustomer} open={sheetOpen} onOpenChange={setSheetOpen} onUpdated={fetchCustomers} />

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="rounded-2xl shadow-pop p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight">Novo cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Nome *" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
              <Input placeholder="Telefone" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
              <Input placeholder="Produto comprado" value={newCustomer.product_bought} onChange={(e) => setNewCustomer({ ...newCustomer, product_bought: e.target.value })} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button onClick={addCustomer}>Cadastrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
