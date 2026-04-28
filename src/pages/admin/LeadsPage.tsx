import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LeadFilters, { type RecencyFilter, type PriorityFilter } from '@/components/admin/LeadFilters';
import LeadStatusSelect from '@/components/admin/LeadStatusSelect';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';
import LeadDetailSheet from '@/components/admin/LeadDetailSheet';
import NewLeadDialog from '@/components/admin/NewLeadDialog';
import PageHeader from '@/components/admin/PageHeader';
import EmptyState from '@/components/admin/EmptyState';
import LoadingState from '@/components/admin/LoadingState';
import ListState from '@/components/admin/ListState';
import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useInteractionCounts } from '@/hooks/useInteractionCounts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faTrashCan, faUserGroup, faArrowDownShortWide, faArrowUpShortWide,
  faCommentDots, faSeedling, faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';
import { getContactRecency } from '@/lib/contactRecency';
import { getLeadScore, compareByScore } from '@/lib/leadScore';
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
type SortBy = 'score' | 'created';

export default function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [recencyFilter, setRecencyFilter] = useState<RecencyFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [newOpen, setNewOpen] = useState(false);

  const interactionCounts = useInteractionCounts(leads.map((l) => l.id));

  useEffect(() => {
    const recency = searchParams.get('recency') as RecencyFilter | null;
    if (recency && ['recent', 'attention', 'overdue', 'all'].includes(recency)) {
      setRecencyFilter(recency);
    } else if (searchParams.get('followup') === '1') {
      setRecencyFilter('overdue');
    }
    const sort = searchParams.get('sort');
    if (sort === 'created' || sort === 'score') setSortBy(sort);
    const priority = searchParams.get('priority') as PriorityFilter | null;
    if (priority && ['hot', 'warm', 'cold', 'all'].includes(priority)) {
      setPriorityFilter(priority);
    }
  }, [searchParams]);

  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || leads.length === 0) return;
    const target = leads.find((l) => l.id === focusId);
    if (target) {
      setSelectedLead(target);
      setSheetOpen(true);
      const params = new URLSearchParams(searchParams);
      params.delete('focus');
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, leads, setSearchParams]);

  const updateRecency = (v: RecencyFilter) => {
    setRecencyFilter(v);
    const params = new URLSearchParams(searchParams);
    params.delete('followup');
    if (v === 'all') params.delete('recency');
    else params.set('recency', v);
    setSearchParams(params, { replace: true });
  };

  const updatePriority = (v: PriorityFilter) => {
    setPriorityFilter(v);
    const params = new URLSearchParams(searchParams);
    if (v === 'all') params.delete('priority');
    else params.set('priority', v);
    setSearchParams(params, { replace: true });
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'all' ||
    originFilter !== 'all' ||
    recencyFilter !== 'all' ||
    priorityFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setOriginFilter('all');
    setRecencyFilter('all');
    setPriorityFilter('all');
    const params = new URLSearchParams(searchParams);
    params.delete('recency');
    params.delete('priority');
    params.delete('followup');
    setSearchParams(params, { replace: true });
  };

  const toggleSort = () => {
    if (sortBy === 'score') {
      setSortBy('created');
      setSortDir('desc');
    } else {
      // ciclo: created desc → created asc → score desc
      if (sortDir === 'desc') setSortDir('asc');
      else { setSortBy('score'); setSortDir('desc'); }
    }
    const params = new URLSearchParams(searchParams);
    params.set('sort', sortBy === 'score' ? 'created' : 'score');
    setSearchParams(params, { replace: true });
  };

  const fetchLeads = useCallback(async () => {
    setFetchError(null);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      const err = error as { message?: string };
      setFetchError(new Error(err.message ?? 'Erro ao carregar leads'));
    } else {
      setLeads((data as Lead[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useRealtimeTable('leads', fetchLeads);

  const filtered = useMemo(() => {
    const list = leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (originFilter !== 'all' && l.origin !== originFilter) return false;
      if (recencyFilter !== 'all') {
        const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
        if (recencyFilter === 'recent' && info.level !== 'recent') return false;
        if (recencyFilter === 'attention' && info.level !== 'attention') return false;
        if (recencyFilter === 'overdue' && info.level !== 'overdue') return false;
      }
      if (priorityFilter !== 'all') {
        const info = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
        if (info.level !== priorityFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !(l.phone ?? '').includes(q)) return false;
      }
      return true;
    });
    if (sortBy === 'score') {
      const enriched = list.map((l) => ({
        ...l,
        _scoreInfo: getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 }),
      }));
      enriched.sort(compareByScore);
      return enriched;
    }
    list.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortDir === 'desc' ? db - da : da - db;
    });
    return list;
  }, [leads, statusFilter, originFilter, search, recencyFilter, priorityFilter, sortBy, sortDir, interactionCounts]);

  const newestId = useMemo(() => {
    if (leads.length === 0) return null;
    return [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].id;
  }, [leads]);

  const isToday = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const openDetail = (lead: Lead) => { setSelectedLead(lead); setSheetOpen(true); };

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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-[1600px] mx-auto space-y-3">
        <PageHeader
          title="Leads"
          description="Central comercial — acompanhe, filtre e gerencie todos os leads em um só lugar."
          actions={
            <Button onClick={() => setNewOpen(true)} size="sm" className="h-9 shadow-sm">
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 mr-1.5" />
              Novo contato
            </Button>
          }
          meta={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium tabular-nums">{filtered.length}</span>
              <span>resultado{filtered.length === 1 ? '' : 's'}</span>
              {leads.some((l) => isToday(l.created_at)) && (
                <Badge variant="secondary" className="bg-success-soft text-success border-0 ml-1">
                  <FontAwesomeIcon icon={faSeedling} className="h-3 w-3 mr-1" />
                  {leads.filter((l) => isToday(l.created_at)).length} hoje
                </Badge>
              )}
            </div>
          }
        />

        <div className="board-panel crm-dense-table p-3">
          <LeadFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            originFilter={originFilter}
            onOriginChange={setOriginFilter}
            recencyFilter={recencyFilter}
            onRecencyChange={updateRecency}
            priorityFilter={priorityFilter}
            onPriorityChange={updatePriority}
          />

          <ListState
            loading={loading}
            error={fetchError}
            onRetry={fetchLeads}
            totalCount={leads.length}
            filteredCount={filtered.length}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            emptyIcon={faUserGroup}
            emptyTitle="Nenhum lead cadastrado ainda"
            emptyDescription="Aguarde novos cadastros pelo site ou crie um lead manualmente."
          >
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto -mx-5">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Lead</TableHead>
                      <TableHead className="hidden lg:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Origem</TableHead>
                      <TableHead className="hidden xl:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Interesse</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Prioridade</TableHead>
                      <TableHead className="hidden lg:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Recência</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                        <button
                          onClick={toggleSort}
                          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors uppercase"
                          title={sortBy === 'score' ? 'Ordenado por prioridade' : 'Ordenado por data'}
                        >
                          {sortBy === 'score' ? 'Prioridade' : 'Entrada'}
                          <FontAwesomeIcon
                            icon={sortDir === 'desc' ? faArrowDownShortWide : faArrowUpShortWide}
                            className="h-3 w-3"
                          />
                        </button>
                      </TableHead>
                      <TableHead className="w-[120px] text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((lead, idx) => {
                      const isNewest = lead.id === newestId;
                      const score = getLeadScore(lead, { interactionCount: interactionCounts[lead.id] ?? 0 });
                      return (
                        <TableRow
                          key={lead.id}
                          className={cn(
                            'group cursor-pointer border-border/60',
                            isNewest && '!bg-primary/5 hover:!bg-primary/10',
                            score.urgent && 'border-l-2 border-l-destructive',
                          )}
                          onClick={() => openDetail(lead)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <InitialsAvatar name={lead.name} size="md" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isNewest && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" title="Lead mais recente" />
                                  )}
                                  <span className="text-sm font-semibold truncate">{lead.name}</span>
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono">{lead.phone ?? '—'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {lead.origin ? (
                              <span className={cn('tag-cell', `tag-${colorForLabel(lead.origin)}`)}>{lead.origin}</span>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                            {lead.product_interest ?? '—'}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} onUpdated={fetchLeads} />
                          </TableCell>
                          <TableCell>
                            <LeadScoreBadge lead={lead} interactionCount={interactionCounts[lead.id] ?? 0} size="sm" />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <ContactRecencyBadge
                              lastContactAt={lead.last_contact_at}
                              status={lead.status}
                              createdAt={lead.created_at}
                              size="sm"
                            />
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap font-mono">
                            {format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR })}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(lead)}>
                                    <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhes</TooltipContent>
                              </Tooltip>
                              {lead.phone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success-soft" onClick={(e) => openWhatsApp(e, lead.phone)}>
                                      <FontAwesomeIcon icon={faWhatsapp} className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Abrir WhatsApp</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={(e) => deleteLead(e, lead.id)}>
                                    <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-2.5">
                {filtered.map((lead) => {
                  const isNewest = lead.id === newestId;
                  const score = getLeadScore(lead, { interactionCount: interactionCounts[lead.id] ?? 0 });
                  return (
                    <button
                      key={lead.id}
                      onClick={() => openDetail(lead)}
                      className={cn(
                        'w-full text-left bg-card border border-border rounded-2xl p-4 transition-all duration-150 hover:border-border-strong hover:shadow-card',
                        isNewest && 'border-primary/40 bg-primary/[0.03]',
                        score.urgent && 'border-l-2 border-l-destructive',
                      )}
                    >
                      {score.level !== 'closed' && (
                        <div className="mb-2">
                          <LeadScoreBadge lead={lead} interactionCount={interactionCounts[lead.id] ?? 0} size="sm" />
                        </div>
                      )}
                      <div className="flex items-start gap-3 mb-3">
                        <InitialsAvatar name={lead.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            {isNewest && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
                            <h3 className="font-semibold text-sm truncate">{lead.name}</h3>
                          </div>
                          {lead.phone && <p className="text-xs font-mono text-muted-foreground">{lead.phone}</p>}
                        </div>
                        <LeadStatusBadge status={lead.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        {lead.origin && <span>{lead.origin}</span>}
                        {lead.product_interest && <span className="truncate max-w-[200px]">· {lead.product_interest}</span>}
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <ContactRecencyBadge
                          lastContactAt={lead.last_contact_at}
                          status={lead.status}
                          createdAt={lead.created_at}
                          size="sm"
                        />
                        <span className="text-[11px] text-muted-foreground font-mono">{format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR })}</span>
                      </div>
                      {lead.phone && (
                        <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" className="flex-1 text-success border-success/30" onClick={(e) => openWhatsApp(e, lead.phone)}>
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
          </ListState>
        </div>

        <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} onUpdated={fetchLeads} />
        <NewLeadDialog open={newOpen} onOpenChange={setNewOpen} onCreated={fetchLeads} />
      </div>
    </TooltipProvider>
  );
}
