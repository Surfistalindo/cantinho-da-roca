import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LeadFilters from '@/components/admin/LeadFilters';
import LeadStatusSelect from '@/components/admin/LeadStatusSelect';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';
import LeadDetailSheet from '@/components/admin/LeadDetailSheet';
import NewLeadDialog from '@/components/admin/NewLeadDialog';
import PageHeader from '@/components/admin/PageHeader';
import EmptyState from '@/components/admin/EmptyState';
import LoadingState from '@/components/admin/LoadingState';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faTrashCan, faUserGroup, faArrowDownShortWide, faArrowUpShortWide,
  faCommentDots, faSeedling, faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';
import { isLeadStale } from '@/services/followUpService';
import { cn } from '@/lib/utils';

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

type SortDir = 'desc' | 'asc';

export default function LeadsPage() {
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState(false);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('followup') === '1') setFollowUpFilter(true);
  }, [searchParams]);

  const fetchLeads = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useRealtimeTable('leads', fetchLeads);

  const filtered = useMemo(() => {
    const list = leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (originFilter !== 'all' && l.origin !== originFilter) return false;
      if (followUpFilter && !isLeadStale(l)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !(l.phone ?? '').includes(q)) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortDir === 'desc' ? db - da : da - db;
    });
    return list;
  }, [leads, statusFilter, originFilter, search, followUpFilter, sortDir]);

  const newestId = useMemo(() => {
    if (leads.length === 0) return null;
    return [...leads].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0].id;
  }, [leads]);

  const isToday = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetOpen(true);
  };

  const openWhatsApp = (e: React.MouseEvent, phone: string | null) => {
    e.stopPropagation();
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('55') ? clean : `55${clean}`;
    window.open(`https://wa.me/${num}?text=Olá! Aqui é da equipe Cantinho da Roça.`, '_blank');
  };

  const deleteLead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Excluir este lead?')) return;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Lead excluído');
    fetchLeads();
  };

  const lastContactLabel = (lead: Lead) => {
    const ref = lead.last_contact_at;
    if (!ref) return <span className="text-muted-foreground italic">—</span>;
    return (
      <span title={format(new Date(ref), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}>
        {formatDistanceToNow(new Date(ref), { locale: ptBR, addSuffix: true })}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Leads"
        description="Central comercial — acompanhe, filtre e gerencie todos os leads em um só lugar."
        actions={
          <Button onClick={() => setNewOpen(true)} size="sm">
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 mr-1.5" />
            Novo contato
          </Button>
        }
        meta={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{filtered.length} resultado(s)</span>
            {leads.some((l) => isToday(l.created_at)) && (
              <Badge variant="secondary" className="bg-success-soft text-success border-0">
                <FontAwesomeIcon icon={faSeedling} className="h-3 w-3 mr-1" />
                {leads.filter((l) => isToday(l.created_at)).length} hoje
              </Badge>
            )}
          </div>
        }
      />

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <LeadFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          originFilter={originFilter}
          onOriginChange={setOriginFilter}
          followUpFilter={followUpFilter}
          onFollowUpChange={setFollowUpFilter}
        />

        {loading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={faUserGroup}
            title="Nenhum lead encontrado"
            description="Ajuste os filtros ou aguarde novos cadastros pelo site."
          />
        ) : (
          <>
            {/* Desktop / tablet — tabela */}
            <div className="hidden md:block overflow-x-auto -mx-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead className="hidden lg:table-cell">Origem</TableHead>
                    <TableHead className="hidden xl:table-cell">Interesse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Último contato</TableHead>
                    <TableHead>
                      <button
                        onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        Entrada
                        <FontAwesomeIcon
                          icon={sortDir === 'desc' ? faArrowDownShortWide : faArrowUpShortWide}
                          className="h-3 w-3"
                        />
                      </button>
                    </TableHead>
                    <TableHead className="w-[130px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => {
                    const isNewest = lead.id === newestId;
                    const stale = isLeadStale(lead);
                    return (
                      <TableRow
                        key={lead.id}
                        className={cn(
                          'group cursor-pointer',
                          isNewest && 'bg-primary/5 hover:bg-primary/10'
                        )}
                        onClick={() => openDetail(lead)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isNewest && (
                              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" title="Lead mais recente" />
                            )}
                            <span>{lead.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{lead.phone ?? '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{lead.origin ?? '—'}</TableCell>
                        <TableCell className="hidden xl:table-cell text-sm max-w-[200px] truncate">
                          {lead.product_interest ?? '—'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} onUpdated={fetchLeads} />
                        </TableCell>
                        <TableCell className={cn(
                          'hidden lg:table-cell text-xs',
                          stale ? 'text-warning font-medium' : 'text-muted-foreground'
                        )}>
                          {lastContactLabel(lead)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR })}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(lead)} title="Ver detalhes">
                              <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                            </Button>
                            {lead.phone && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={(e) => openWhatsApp(e, lead.phone)} title="Abrir WhatsApp">
                                <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => deleteLead(e, lead.id)} title="Excluir">
                              <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile — cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((lead) => {
                const isNewest = lead.id === newestId;
                const stale = isLeadStale(lead);
                return (
                  <button
                    key={lead.id}
                    onClick={() => openDetail(lead)}
                    className={cn(
                      'w-full text-left bg-background border border-border rounded-lg p-4 transition-colors hover:border-primary/40',
                      isNewest && 'border-primary/40 bg-primary/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {isNewest && <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />}
                          <h3 className="font-medium truncate">{lead.name}</h3>
                        </div>
                        {lead.phone && <p className="text-sm font-mono text-muted-foreground">{lead.phone}</p>}
                      </div>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {lead.origin && <span>📍 {lead.origin}</span>}
                      {lead.product_interest && <span className="truncate max-w-[200px]">💡 {lead.product_interest}</span>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className={cn(stale ? 'text-warning font-medium' : 'text-muted-foreground')}>
                        Último contato: {lead.last_contact_at
                          ? formatDistanceToNow(new Date(lead.last_contact_at), { locale: ptBR, addSuffix: true })
                          : 'nunca'}
                      </span>
                      <span className="text-muted-foreground">{format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
                    </div>
                    {lead.phone && (
                      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="flex-1 text-success" onClick={(e) => openWhatsApp(e, lead.phone)}>
                          <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); openDetail(lead); }}>
                          <FontAwesomeIcon icon={faCommentDots} className="h-3.5 w-3.5 mr-1.5" /> Interagir
                        </Button>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} onUpdated={fetchLeads} />
      <NewLeadDialog open={newOpen} onOpenChange={setNewOpen} onCreated={fetchLeads} />
    </div>
  );
}
