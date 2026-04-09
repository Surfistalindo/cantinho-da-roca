import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import LeadFilters from '@/components/admin/LeadFilters';
import LeadStatusSelect from '@/components/admin/LeadStatusSelect';
import LeadDetailSheet from '@/components/admin/LeadDetailSheet';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, MessageCircle } from 'lucide-react';

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

export default function LeadsPage() {
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

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const openWhatsApp = (phone: string | null) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${num}?text=Olá! Aqui é da equipe Cantinho da Roça.`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-heading">Leads</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} resultado(s)</span>
      </div>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
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
          <div className="overflow-x-auto -mx-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Origem</TableHead>
                  <TableHead className="hidden lg:table-cell">Interesse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((lead) => (
                  <TableRow key={lead.id} className="group">
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-sm">{lead.phone ?? '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{lead.origin ?? '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{lead.product_interest ?? '—'}</TableCell>
                    <TableCell>
                      <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} onUpdated={fetchLeads} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(lead)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {lead.phone && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" onClick={() => openWhatsApp(lead.phone)}>
                            <MessageCircle className="h-3.5 w-3.5" />
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

      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
