import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import CustomerDetailSheet from '@/components/admin/CustomerDetailSheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faCommentDots, faUserCheck, faPlus, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';

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

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.phone ?? '').includes(q)
    );
  }, [customers, search]);

  const openDetail = (c: Customer) => {
    setSelectedCustomer(c);
    setSheetOpen(true);
  };

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
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-heading">Clientes</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4 mr-1.5" /> Novo Cliente
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <div className="relative mb-4">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faUserCheck} className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum cliente encontrado.</p>
            <p className="text-xs text-muted-foreground mt-1">Cadastre ou converta leads em clientes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Produto</TableHead>
                  <TableHead className="hidden sm:table-cell">Data Compra</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="group">
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.phone ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{c.product_bought ?? '—'}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {c.purchase_date ? format(new Date(c.purchase_date), 'dd/MM/yy', { locale: ptBR }) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(c)}>
                          <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                        </Button>
                        {c.phone && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => openWhatsApp(c.phone)}>
                            <FontAwesomeIcon icon={faCommentDots} className="h-3.5 w-3.5" />
                          </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
  );
}
