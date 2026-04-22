import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRightFromBracket,
  faUserGroup,
  faChartColumn,
  faCommentDots,
} from '@fortawesome/free-solid-svg-icons';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import LeadFilters from '@/components/admin/LeadFilters';
import LeadStatusSelect from '@/components/admin/LeadStatusSelect';
import LeadDetailSheet from '@/components/admin/LeadDetailSheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
  notes: string | null;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (originFilter !== 'all' && l.origin !== originFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !(l.phone ?? '').includes(q)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, originFilter, search]);

  const stats = useMemo(() => ({
    total: leads.length,
    negotiating: leads.filter((l) => l.status === 'negotiating').length,
    sold: leads.filter((l) => l.status === 'sold').length,
  }), [leads]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const cards = [
    { icon: faUserGroup, label: 'Leads', value: String(stats.total), description: 'Total de leads capturados' },
    { icon: faChartColumn, label: 'Negociando', value: String(stats.negotiating), description: 'Em negociação ativa' },
    { icon: faCommentDots, label: 'Vendidos', value: String(stats.sold), description: 'Convertidos em vendas' },
  ];

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-heading">Cantinho da Roça</h1>
          <p className="text-xs text-muted-foreground">CRM &middot; {user?.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">Painel</h2>
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <c.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold">{c.label}</span>
              </div>
              <p className="text-3xl font-bold font-heading">{c.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Leads</h3>
          <LeadFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            originFilter={originFilter}
            onOriginChange={setOriginFilter}
          />
          {loading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nenhum lead encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Interesse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => openDetail(lead)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.phone ?? '—'}</TableCell>
                      <TableCell>{lead.origin ?? '—'}</TableCell>
                      <TableCell>{lead.product_interest ?? '—'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} onUpdated={fetchLeads} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
