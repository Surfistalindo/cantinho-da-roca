import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import ListState from '@/components/admin/ListState';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import CustomerLifecycleBadge from '@/components/admin/CustomerLifecycleBadge';
import ClientFilters, {
  type ClientPurchaseFilter,
  type ClientRecencyFilter,
  type ClientStageFilter,
} from '@/components/admin/ClientFilters';
import WhatsAppQuickAction from '@/components/admin/WhatsAppQuickAction';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faUserCheck, faPlus, faCircleCheck, faClock, faTriangleExclamation, faMoon } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { colorForLabel } from '@/components/crm/ui/TagCell';
import GroupSection, { type GroupColor } from '@/components/crm/ui/GroupSection';
import { getCustomerLifecycle, purchaseRecencyLabel } from '@/lib/customerLifecycle';

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

const DAY_MS = 1000 * 60 * 60 * 24;
function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [recencyFilter, setRecencyFilter] = useState<ClientRecencyFilter>('all');
  const [purchaseFilter, setPurchaseFilter] = useState<ClientPurchaseFilter>('all');
  const [stageFilter, setStageFilter] = useState<ClientStageFilter>('all');
  const [reactivationMode, setReactivationMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', product_bought: '' });

  // Suporte a ?view=reactivation
  useEffect(() => {
    if (searchParams.get('view') === 'reactivation') {
      setReactivationMode(true);
    }
  }, [searchParams]);

  const setReactivationModeWrapped = (v: boolean) => {
    setReactivationMode(v);
    const next = new URLSearchParams(searchParams);
    if (v) next.set('view', 'reactivation'); else next.delete('view');
    setSearchParams(next, { replace: true });
  };

  const fetchCustomers = useCallback(async () => {
    setFetchError(null);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      const err = error as { message?: string };
      setFetchError(new Error(err.message ?? 'Erro ao carregar clientes'));
    } else {
      setCustomers((data as Customer[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useRealtimeTable('customers', fetchCustomers);

  // Stats globais (todos clientes — sem filtro aplicado)
  const stats = useMemo(() => {
    const counts = { active: 0, watch: 0, inactive: 0, dormant: 0 };
    for (const c of customers) {
      const s = getCustomerLifecycle(c.last_contact_at, c.purchase_date).stage;
      counts[s]++;
    }
    const total = customers.length || 1;
    return {
      total: customers.length,
      ...counts,
      activePct: Math.round((counts.active / total) * 100),
      watchPct: Math.round((counts.watch / total) * 100),
      inactivePct: Math.round((counts.inactive / total) * 100),
      dormantPct: Math.round((counts.dormant / total) * 100),
    };
  }, [customers]);

  const filtered = useMemo(() => {
    let list = customers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q) ||
        (c.product_bought ?? '').toLowerCase().includes(q)
      );
    }

    if (stageFilter !== 'all') {
      list = list.filter((c) => getCustomerLifecycle(c.last_contact_at, c.purchase_date).stage === stageFilter);
    }

    if (recencyFilter !== 'all') {
      list = list.filter((c) => {
        const d = daysSince(c.last_contact_at);
        if (recencyFilter === 'recent') return d !== null && d <= 7;
        if (recencyFilter === 'attention') return d !== null && d > 7 && d <= 30;
        if (recencyFilter === 'inactive30') return d === null || d > 30;
        if (recencyFilter === 'inactive90') return d === null || d > 90;
        return true;
      });
    }

    if (purchaseFilter !== 'all') {
      list = list.filter((c) => {
        const d = daysSince(c.purchase_date);
        if (d === null) return false;
        if (purchaseFilter === 'p30') return d <= 30;
        if (purchaseFilter === 'p90') return d > 30 && d <= 90;
        if (purchaseFilter === 'p180') return d > 90 && d <= 180;
        if (purchaseFilter === 'p180plus') return d > 180;
        return true;
      });
    }

    if (reactivationMode) {
      list = list
        .filter((c) => {
          const d = daysSince(c.purchase_date);
          return c.phone && d !== null && d >= 90;
        })
        .sort((a, b) => (daysSince(b.purchase_date) ?? 0) - (daysSince(a.purchase_date) ?? 0));
    }

    return list;
  }, [customers, search, stageFilter, recencyFilter, purchaseFilter, reactivationMode]);

  const openDetail = (c: Customer) => { setSelectedCustomer(c); setSheetOpen(true); };

  const hasActiveFilters =
    search.trim() !== '' ||
    stageFilter !== 'all' ||
    recencyFilter !== 'all' ||
    purchaseFilter !== 'all' ||
    reactivationMode;

  const clearFilters = () => {
    setSearch('');
    setStageFilter('all');
    setRecencyFilter('all');
    setPurchaseFilter('all');
    setReactivationModeWrapped(false);
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

  const kpiCards = [
    { label: 'Ativos', value: stats.active, pct: stats.activePct, icon: faCircleCheck, accent: 'text-success bg-success-soft' },
    { label: 'Em atenção', value: stats.watch, pct: stats.watchPct, icon: faClock, accent: 'text-warning bg-warning-soft' },
    { label: 'Inativos', value: stats.inactive, pct: stats.inactivePct, icon: faTriangleExclamation, accent: 'text-destructive bg-destructive/10' },
    { label: 'Adormecidos', value: stats.dormant, pct: stats.dormantPct, icon: faMoon, accent: 'text-muted-foreground bg-muted' },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-[1600px] mx-auto space-y-3">
        <PageHeader
          title={reactivationMode ? 'Painel de reativação' : 'Clientes'}
          description={
            reactivationMode
              ? 'Clientes inativos há 90+ dias com telefone — prontos para reativar.'
              : 'Base de clientes convertidos a partir de leads ou cadastros manuais.'
          }
          meta={
            <span className="text-xs text-muted-foreground">
              <span className="font-medium tabular-nums">{filtered.length}</span> de{' '}
              <span className="font-medium tabular-nums">{customers.length}</span> cliente{customers.length === 1 ? '' : 's'}
            </span>
          }
          actions={
            <Button size="sm" onClick={() => setAddOpen(true)} className="h-9 shadow-sm">
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 mr-1.5" /> Novo cliente
            </Button>
          }
        />

        {/* KPIs de ciclo de vida */}
        {customers.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {kpiCards.map((c) => (
              <div key={c.label} className="bg-card rounded-lg border border-border p-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', c.accent)}>
                    <FontAwesomeIcon icon={c.icon} className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{c.label}</p>
                    <p className="text-[16px] font-semibold tabular-nums leading-tight">
                      {c.value} <span className="text-[11px] font-normal text-muted-foreground">({c.pct}%)</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="board-panel crm-dense-table p-3">
          <ClientFilters
            search={search}
            onSearchChange={setSearch}
            recencyFilter={recencyFilter}
            onRecencyChange={setRecencyFilter}
            purchaseFilter={purchaseFilter}
            onPurchaseChange={setPurchaseFilter}
            stageFilter={stageFilter}
            onStageChange={setStageFilter}
            reactivationMode={reactivationMode}
            onReactivationToggle={setReactivationModeWrapped}
          />

          <ListState
            loading={loading}
            error={fetchError}
            onRetry={fetchCustomers}
            totalCount={customers.length}
            filteredCount={filtered.length}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            emptyIcon={faUserCheck}
            emptyTitle="Nenhum cliente cadastrado ainda"
            emptyDescription="Cadastre manualmente ou converta leads em clientes."
          >
            <div className="overflow-x-auto -mx-5">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Cliente</TableHead>
                    <TableHead className="hidden md:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Produto</TableHead>
                    <TableHead className="hidden sm:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Última compra</TableHead>
                    <TableHead className="hidden lg:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="w-[100px] text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c, idx) => {
                    const purchaseDays = daysSince(c.purchase_date);
                    return (
                      <TableRow
                        key={c.id}
                        className={cn('group cursor-pointer border-border/60')}
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
                        <TableCell className="hidden md:table-cell">
                          {c.product_bought ? (
                            <span className={cn('tag-cell', `tag-${colorForLabel(c.product_bought)}`)}>{c.product_bought}</span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-[11px] text-muted-foreground">
                          {c.purchase_date ? (
                            <div>
                              <div className="font-mono">{format(new Date(c.purchase_date), 'dd/MM/yy', { locale: ptBR })}</div>
                              <div className="text-[10px] mt-0.5">{purchaseRecencyLabel(purchaseDays)}</div>
                            </div>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <CustomerLifecycleBadge
                            lastContactAt={c.last_contact_at}
                            purchaseDate={c.purchase_date}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-0.5 items-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(c)}>
                                  <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalhes</TooltipContent>
                            </Tooltip>
                            {c.phone && (
                              <WhatsAppQuickAction
                                lead={{
                                  id: c.id,
                                  name: c.name,
                                  phone: c.phone,
                                  product_bought: c.product_bought,
                                  status: 'customer',
                                  last_contact_at: c.last_contact_at,
                                  created_at: c.purchase_date ?? c.created_at,
                                }}
                                variant="icon"
                                size="sm"
                                onSent={fetchCustomers}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ListState>
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
