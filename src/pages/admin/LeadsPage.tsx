import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import LeadFilters, { type RecencyFilter, type PriorityFilter } from '@/components/admin/LeadFilters';
import LeadStatusSelect from '@/components/admin/LeadStatusSelect';
import LeadDetailSheet from '@/components/admin/LeadDetailSheet';
import NewLeadDialog from '@/components/admin/NewLeadDialog';
import PageHeader from '@/components/admin/PageHeader';
import LoadingState from '@/components/admin/LoadingState';
import ListState from '@/components/admin/ListState';
import ContactRecencyBadge from '@/components/admin/ContactRecencyBadge';
import InitialsAvatar from '@/components/admin/InitialsAvatar';
import LeadScoreBadge from '@/components/admin/LeadScoreBadge';
import BulkActionsBar from '@/components/admin/BulkActionsBar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useInteractionCounts } from '@/hooks/useInteractionCounts';
import { useLeadsPaged, useResetPagesOn } from '@/hooks/useLeadsPaged';
import LeadsPagination from '@/components/admin/leads/LeadsPagination';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrashCan, faUserGroup, faArrowDownShortWide, faArrowUpShortWide,
  faPlus, faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';
import { getContactRecency } from '@/lib/contactRecency';
import { getLeadScore, compareByScore } from '@/lib/leadScore';
import { cn } from '@/lib/utils';
import { colorForLabel } from '@/components/crm/ui/TagCell';
import GroupSection, { type GroupColor } from '@/components/crm/ui/GroupSection';
import LeadsKpiStrip, { type KpiKey } from '@/components/admin/leads/LeadsKpiStrip';
import LeadsViewSwitcher, { type LeadsView } from '@/components/admin/leads/LeadsViewSwitcher';
import LeadsKanban from '@/components/admin/leads/LeadsKanban';
import { LeadsDndProvider, DroppableGroupHeader, DraggableRow } from '@/components/admin/leads/LeadsTableDnd';
import LeadsCards from '@/components/admin/leads/LeadsCards';
import SavedFiltersMenu, { type SavedLeadFilter } from '@/components/admin/leads/SavedFiltersMenu';
import QuickActionsPopover from '@/components/admin/leads/QuickActionsPopover';
import { exportLeadsToCsv } from '@/components/admin/leads/exportLeadsCsv';
import { useLeadsUrlState } from '@/hooks/useLeadsUrlState';
import { logger } from '@/lib/logger';

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
  assigned_to?: string | null;
}

type SortDir = 'desc' | 'asc';
type SortBy = 'score' | 'created';

// Status canônicos do APP_CONFIG: new | contacting | negotiating | won | lost
const STATUS_GROUPS: { key: string; title: string; color: GroupColor }[] = [
  { key: 'new',         title: 'Novo lead',  color: 'blue'   },
  { key: 'contacting',  title: 'Em contato', color: 'cyan'   },
  { key: 'negotiating', title: 'Negociação', color: 'orange' },
  { key: 'won',         title: 'Cliente',    color: 'green'  },
  { key: 'lost',        title: 'Perdido',    color: 'red'    },
];

const VIEW_KEY = 'crm:leads:view';

export default function LeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const url = useLeadsUrlState();
  const tableGroupScrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [newOpen, setNewOpen] = useState(false);
  const [newDefaultStatus, setNewDefaultStatus] = useState('new');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeKpi, setActiveKpi] = useState<KpiKey | null>(null);
  // Altura de linha em px — substitui o booleano density (compatibilidade abaixo).
  // Presets: 30 (compact) · 38 (cozy) · 52 (comfortable). Range: 26–72.
  const [rowHeight, setRowHeight] = useState<number>(() => {
    if (typeof window === 'undefined') return 38;
    const saved = Number(localStorage.getItem('crm:leads:rowHeight'));
    if (Number.isFinite(saved) && saved >= 26 && saved <= 72) return saved;
    // Migração do valor antigo "density"
    const legacy = localStorage.getItem('crm:leads:density');
    return legacy === 'compact' ? 30 : 38;
  });
  // density derivado mantém todas as condicionais existentes funcionando.
  const density: 'comfortable' | 'compact' = rowHeight <= 32 ? 'compact' : 'comfortable';
  const setRowHeightClamped = (v: number) =>
    setRowHeight(Math.max(26, Math.min(72, Math.round(v))));
  const [view, setView] = useState<LeadsView>(() => {
    const fromUrl = (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('view')
      : null) as LeadsView | null;
    if (fromUrl && ['table', 'kanban', 'cards'].includes(fromUrl)) return fromUrl;
    if (typeof window === 'undefined') return 'table';
    return (localStorage.getItem(VIEW_KEY) as LeadsView) || 'table';
  });
  const searchInputRef = useRef<HTMLDivElement>(null);

  // Aliases legíveis
  const search = url.search;
  const statusFilter = url.status;
  const originFilter = url.origin;
  const recencyFilter = url.recency;
  const priorityFilter = url.priority;
  const dateFrom = url.from;
  const dateTo = url.to;

  useEffect(() => { localStorage.setItem('crm:leads:rowHeight', String(rowHeight)); }, [rowHeight]);
  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
    const params = new URLSearchParams(searchParams);
    if (view === 'table') params.delete('view'); else params.set('view', view);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // Atalho global N → abrir novo lead
  useEffect(() => {
    const h = () => setNewOpen(true);
    window.addEventListener('crm:new-lead', h);
    return () => window.removeEventListener('crm:new-lead', h);
  }, []);

  const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);
  const interactionCounts = useInteractionCounts(leadIds);

  // sort vem da URL (não migrado para o hook por simplicidade)
  useEffect(() => {
    const sort = searchParams.get('sort');
    if (sort === 'created' || sort === 'score') setSortBy(sort);
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

  const updateRecency = (v: RecencyFilter) => url.set({ recency: v });
  const updatePriority = (v: PriorityFilter) => url.set({ priority: v });

  const hasActiveFilters =
    search.trim() !== '' || statusFilter !== 'all' || originFilter !== 'all' ||
    recencyFilter !== 'all' || priorityFilter !== 'all' || activeKpi !== null ||
    !!dateFrom || !!dateTo;

  const clearFilters = () => {
    logger.debug('[leads] filters cleared');
    url.set({
      search: '', status: 'all', origin: 'all',
      recency: 'all', priority: 'all', from: null, to: null,
    });
    setActiveKpi(null);
  };

  const toggleSort = () => {
    if (sortBy === 'score') { setSortBy('created'); setSortDir('desc'); }
    else if (sortDir === 'desc') setSortDir('asc');
    else { setSortBy('score'); setSortDir('desc'); }
  };

  const fetchLeads = useCallback(async () => {
    setFetchError(null);
    logger.debug('[leads] fetch start');
    const startedAt = performance.now();
    const { data, error } = await supabase
      .from('leads')
      .select(
        'id,name,phone,status,origin,product_interest,last_contact_at,next_contact_at,notes,created_at,updated_at,ai_score,ai_priority,ai_score_reason,ai_summary,assigned_to',
      )
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) {
      logger.error('[leads] fetch error', { code: (error as { code?: string }).code, message: error.message });
      setFetchError(new Error(error.message ?? 'Erro ao carregar leads'));
    } else {
      logger.debug('[leads] fetch ok', { count: data?.length ?? 0, ms: Math.round(performance.now() - startedAt) });
      setLeads((data as Lead[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useRealtimeTable('leads', fetchLeads);

  // Aplica KPI selecionado como filtro virtual
  const applyKpi = (key: KpiKey) => {
    setActiveKpi((prev) => (prev === key ? null : key));
  };

  // Origens reais presentes nos leads (deduplicado case-insensitive, ordenado)
  const availableOrigins = useMemo(() => {
    const map = new Map<string, string>(); // key=lower, val=display
    for (const l of leads) {
      if (!l.origin) continue;
      const trimmed = l.origin.trim();
      if (!trimmed) continue;
      const k = trimmed.toLowerCase();
      if (!map.has(k)) map.set(k, trimmed);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [leads]);

  // Lookup id → { name, status } usado pelo DnD da tabela.
  const leadIndex = useMemo(() => {
    const map: Record<string, { name: string; status: string }> = {};
    for (const l of leads) map[l.id] = { name: l.name, status: l.status };
    return map;
  }, [leads]);

  const filtered = useMemo(() => {
    const list = leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (originFilter !== 'all' && (l.origin ?? '').trim().toLowerCase() !== originFilter.trim().toLowerCase()) return false;
      if (recencyFilter !== 'all') {
        const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
        if (info.level !== recencyFilter) return false;
      }
      if (priorityFilter !== 'all') {
        const info = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
        if (info.level !== priorityFilter) return false;
      }
      if (activeKpi) {
        const score = getLeadScore(l, { interactionCount: interactionCounts[l.id] ?? 0 });
        const rec = getContactRecency(l.last_contact_at, l.status, l.created_at);
        if (activeKpi === 'today' && new Date(l.created_at).toDateString() !== new Date().toDateString()) return false;
        if (activeKpi === 'waiting' && l.status !== 'new') return false;
        if (activeKpi === 'hot' && !(score.level === 'hot' || score.urgent)) return false;
        if (activeKpi === 'overdue' && rec.level !== 'overdue') return false;
      }
      if (dateFrom) {
        if (new Date(l.created_at) < dateFrom) return false;
      }
      if (dateTo) {
        if (new Date(l.created_at) > dateTo) return false;
      }
      if (search) {
        const q = search.toLowerCase().trim();
        const onlyDigits = q.replace(/\D/g, '');
        const phoneDigits = (l.phone ?? '').replace(/\D/g, '');
        const phoneHit = onlyDigits.length >= 3 ? phoneDigits.includes(onlyDigits) : false;
        if (!l.name.toLowerCase().includes(q) && !phoneHit && !(l.phone ?? '').toLowerCase().includes(q)) return false;
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
  }, [leads, statusFilter, originFilter, search, recencyFilter, priorityFilter, sortBy, sortDir, interactionCounts, activeKpi, dateFrom, dateTo]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof filtered> = {};
    for (const g of STATUS_GROUPS) map[g.key] = [];
    const other: typeof filtered = [];
    for (const l of filtered) {
      if (map[l.status]) map[l.status].push(l);
      else other.push(l);
    }
    return { map, other };
  }, [filtered]);

  // Paginação por grupo
  const paged = useLeadsPaged();
  // Reseta páginas quando filtros/busca/ordenação mudam
  useResetPagesOn(paged.resetAll, [
    statusFilter, originFilter, search, recencyFilter, priorityFilter,
    sortBy, sortDir, activeKpi, dateFrom, dateTo,
  ]);

  // Indicador de refresh in-place ao trocar filtros/ordenação (não desmonta o scroller)
  const [isRefreshing, setIsRefreshing] = useState(false);
  const firstRefreshRunRef = useRef(true);
  useEffect(() => {
    if (firstRefreshRunRef.current) { firstRefreshRunRef.current = false; return; }
    setIsRefreshing(true);
    const debounceLog = window.setTimeout(() => {
      logger.debug('[leads] filters', {
        search, statusFilter, originFilter, recencyFilter, priorityFilter,
        activeKpi, sortBy, sortDir,
        dateFrom: dateFrom?.toISOString() ?? null,
        dateTo: dateTo?.toISOString() ?? null,
      });
    }, 250);
    const offTimer = window.setTimeout(() => setIsRefreshing(false), 320);
    return () => { window.clearTimeout(debounceLog); window.clearTimeout(offTimer); };
  }, [statusFilter, originFilter, search, recencyFilter, priorityFilter,
      sortBy, sortDir, activeKpi, dateFrom, dateTo]);

  const newestId = useMemo(() => {
    if (leads.length === 0) return null;
    return [...leads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].id;
  }, [leads]);

  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

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

  const openNewLeadAt = (status: string) => { setNewDefaultStatus(status); setNewOpen(true); };

  // ----- Multi-select -----
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleGroup = (ids: string[], allSelected: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((i) => next.delete(i));
      else ids.forEach((i) => next.add(i));
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  const bulkChangeStatus = async (status: string) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const { error } = await supabase.from('leads').update({ status }).in('id', ids);
    if (error) { toast.error('Erro ao atualizar status'); return; }
    toast.success(`${ids.length} lead(s) movido(s)`);
    clearSelection();
    fetchLeads();
  };
  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Excluir ${ids.length} lead(s)? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from('leads').delete().in('id', ids);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success(`${ids.length} lead(s) excluído(s)`);
    clearSelection();
    fetchLeads();
  };
  const bulkScheduleFollowup = async (date: Date) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('leads')
      .update({ next_contact_at: date.toISOString() })
      .in('id', ids);
    if (error) { toast.error('Erro ao agendar'); return; }
    toast.success(`Follow-up agendado para ${ids.length} lead(s)`);
    clearSelection();
    fetchLeads();
  };
  const bulkCopyPhones = async () => {
    const ids = new Set(selected);
    const phones = leads.filter((l) => ids.has(l.id) && l.phone).map((l) => l.phone!);
    if (phones.length === 0) { toast.error('Nenhum telefone disponível'); return; }
    await navigator.clipboard.writeText(phones.join('\n'));
    toast.success(`${phones.length} telefone(s) copiado(s)`);
  };
  const bulkExport = () => {
    const ids = new Set(selected);
    const items = leads.filter((l) => ids.has(l.id));
    exportLeadsToCsv(items, 'leads-selecionados');
    toast.success(`${items.length} lead(s) exportado(s)`);
  };
  const bulkAssign = async (userId: string | null, name: string | null) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const { error } = await supabase.from('leads').update({ assigned_to: userId }).in('id', ids);
    if (error) { toast.error('Erro ao atribuir responsável'); return; }
    toast.success(userId ? `${ids.length} lead(s) atribuído(s) a ${name ?? 'usuário'}` : `${ids.length} lead(s) sem responsável`);
    clearSelection();
    fetchLeads();
  };
  const exportFiltered = () => {
    exportLeadsToCsv(filtered, 'leads-filtrados');
    toast.success(`${filtered.length} lead(s) exportado(s)`);
  };

  // ----- Atalhos / 1 2 3 [ ] -----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if (isTyping) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/') {
        e.preventDefault();
        const input = searchInputRef.current?.querySelector('input');
        input?.focus();
      } else if (e.key === '1') setView('table');
      else if (e.key === '2') setView('kanban');
      else if (e.key === '3') setView('cards');
      else if (e.key === '[' || e.key === ']') {
        // Navega no primeiro grupo paginável visível
        const dir = e.key === ']' ? 1 : -1;
        for (const g of STATUS_GROUPS) {
          const items = grouped.map[g.key];
          if (items && items.length > paged.pageSize) {
            const info = paged.paginate(items, g.key);
            const next = Math.min(Math.max(1, info.page + dir), info.totalPages);
            if (next !== info.page) info.setPage(next);
            break;
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [grouped, paged]);

  const applySaved = (f: SavedLeadFilter) => {
    url.set({
      search: f.search, status: f.status, origin: f.origin,
      recency: f.recency, priority: f.priority,
    });
    toast.success(`Filtro "${f.name}" aplicado`);
  };

  const getVisibleTableScroller = useCallback(() => {
    if (typeof window === 'undefined') return null;

    return Object.values(tableGroupScrollRefs.current)
      .filter((node): node is HTMLDivElement => Boolean(node && node.offsetParent !== null))
      .map((node) => ({
        node,
        rect: node.getBoundingClientRect(),
      }))
      .filter(({ rect }) => rect.bottom > 0 && rect.top < window.innerHeight)
      .sort((a, b) => Math.abs(a.rect.top) - Math.abs(b.rect.top))[0]?.node ?? null;
  }, []);

  const forwardWheelToLeadTable = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (view !== 'table') return;

    const scroller = getVisibleTableScroller();
    if (!scroller) return;

    const canScrollY = event.deltaY < 0
      ? scroller.scrollTop > 0
      : scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1;

    const canScrollX = event.deltaX < 0
      ? scroller.scrollLeft > 0
      : scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;

    if (!canScrollY && !canScrollX) return;

    event.preventDefault();
    scroller.scrollBy({
      top: event.deltaY,
      left: event.deltaX,
      behavior: 'auto',
    });
  }, [getVisibleTableScroller, view]);

  // Altura de linha agora vem de --row-h (CSS var). Mantemos rowPad vazio para
  // não quebrar callers; classes h-9/h-12 sobrescreveriam a var.
  const rowPad = '';

  if (loading) return <LoadingState />;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-[1600px] mx-auto space-y-3">
        <div onWheel={forwardWheelToLeadTable}>
          <PageHeader
            title="Leads"
            description="Central comercial — acompanhe, filtre, mova e gerencie todos os leads."
            actions={
              <div className="flex items-center gap-1.5 flex-wrap">
                <div data-tour="leads-view-toggle">
                  <LeadsViewSwitcher view={view} onChange={setView} />
                </div>
                {view === 'table' && (
                  <div className="hidden sm:flex items-center rounded-md border border-border bg-card overflow-hidden" data-tour="leads-row-height">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setRowHeightClamped(rowHeight - 4)}
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Diminuir altura da linha"
                          disabled={rowHeight <= 26}
                        >
                          <span className="text-base leading-none">−</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Linha menor</TooltipContent>
                    </Tooltip>
                    <div className="flex items-center border-x border-border">
                      {[
                        { v: 30, label: 'S', tip: 'Compacto' },
                        { v: 38, label: 'M', tip: 'Cozy' },
                        { v: 52, label: 'L', tip: 'Confortável' },
                      ].map((p) => (
                        <Tooltip key={p.v}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setRowHeight(p.v)}
                              className={cn(
                                'h-7 w-7 flex items-center justify-center text-[11px] font-medium transition-colors',
                                rowHeight === p.v
                                  ? 'bg-muted text-foreground'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                              )}
                              aria-label={`Altura ${p.tip}`}
                              aria-pressed={rowHeight === p.v}
                            >
                              {p.label}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{p.tip} ({p.v}px)</TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setRowHeightClamped(rowHeight + 4)}
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Aumentar altura da linha"
                          disabled={rowHeight >= 72}
                        >
                          <span className="text-base leading-none">+</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Linha maior</TooltipContent>
                    </Tooltip>
                  </div>
                )}
                <Button variant="outline" size="sm" className="h-9" onClick={exportFiltered}>
                  <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
                <Button onClick={() => { setNewDefaultStatus('new'); setNewOpen(true); }} size="sm" className="h-9 shadow-sm">
                  <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 mr-1.5" />
                  Novo
                </Button>
              </div>
            }
            meta={
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium tabular-nums">{filtered.length}</span>
                <span>resultado{filtered.length === 1 ? '' : 's'}</span>
                {activeKpi && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0 ml-1">
                    filtro ativo · {activeKpi}
                  </Badge>
                )}
              </div>
            }
          />
        </div>

        <LeadsKpiStrip
          leads={leads}
          interactionCounts={interactionCounts}
          active={activeKpi}
          onSelect={applyKpi}
        />

        <div className="board-panel p-3 space-y-3 min-w-0 relative" aria-busy={isRefreshing}>
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute left-0 right-0 top-0 h-0.5 bg-primary/60 transition-opacity rounded-t-md',
              isRefreshing ? 'opacity-100 animate-pulse' : 'opacity-0',
            )}
          />
          <div className="flex flex-wrap items-start gap-2">
            <div ref={searchInputRef} className="flex-1 min-w-0">
              <LeadFilters
                search={search}
                onSearchChange={(v) => url.set({ search: v })}
                statusFilter={statusFilter}
                onStatusChange={(v) => url.set({ status: v })}
                originFilter={originFilter}
                onOriginChange={(v) => url.set({ origin: v })}
                recencyFilter={recencyFilter}
                onRecencyChange={updateRecency}
                priorityFilter={priorityFilter}
                onPriorityChange={updatePriority}
                availableOrigins={availableOrigins}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateRangeChange={(f, t) => url.set({ from: f, to: t })}
              />
            </div>
            <SavedFiltersMenu
              current={{
                search,
                status: statusFilter,
                origin: originFilter,
                recency: recencyFilter,
                priority: priorityFilter,
              }}
              onApply={applySaved}
            />
          </div>

          <ListState
            loading={false}
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
            {view === 'kanban' && (
              <LeadsKanban
                leads={filtered}
                interactionCounts={interactionCounts}
                onLeadClick={openDetail}
                onAddLead={openNewLeadAt}
                onChanged={fetchLeads}
              />
            )}

            {view === 'cards' && (
              <LeadsCards
                leads={filtered}
                selected={selected}
                onToggleOne={toggleOne}
                newestId={newestId}
                interactionCounts={interactionCounts}
                onOpenDetail={openDetail}
                onUpdated={fetchLeads}
              />
            )}

            {view === 'table' && (
              <>
                {/* Desktop — agrupado por status */}
                <div className="hidden md:block space-y-2">
                  <LeadsDndProvider leadIndex={leadIndex} onChanged={fetchLeads}>
                  {(() => {
                    const renderHeader = (groupIds: string[]) => {
                      const allChecked = groupIds.length > 0 && groupIds.every((id) => selected.has(id));
                      const someChecked = !allChecked && groupIds.some((id) => selected.has(id));
                      return (
                        <TableHeader className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
                          <TableRow className="hover:bg-transparent border-border [&>th]:bg-card">
                            <TableHead scope="col" className="w-[36px] pl-3 pr-0">
                              <Checkbox
                                checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                                onCheckedChange={() => toggleGroup(groupIds, allChecked)}
                                aria-label={`Selecionar todos os ${groupIds.length} leads visíveis deste grupo`}
                              />
                            </TableHead>
                            <TableHead
                              scope="col"
                              className={cn(
                                'text-[11px] uppercase tracking-wider font-semibold text-muted-foreground',
                                density === 'compact' ? 'min-w-[160px]' : 'min-w-[240px]',
                                density === 'comfortable' && 'crm-pin-left',
                              )}
                            >
                              Lead
                            </TableHead>
                            <TableHead scope="col" className={cn('hidden lg:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-[140px]', density === 'compact' && 'lg:hidden')}>Origem</TableHead>
                            <TableHead scope="col" className={cn('hidden xl:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-[200px]', density === 'compact' && 'xl:hidden')}>Interesse</TableHead>
                            <TableHead scope="col" className={cn('text-[11px] uppercase tracking-wider font-semibold text-muted-foreground', density === 'compact' ? 'w-[120px]' : 'w-[160px]')}>Status</TableHead>
                            <TableHead scope="col" className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-[120px]">Prioridade</TableHead>
                            <TableHead scope="col" className={cn('hidden lg:table-cell text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-[140px]', density === 'compact' && 'lg:hidden')}>Recência</TableHead>
                            <TableHead
                              scope="col"
                              aria-sort={sortBy === 'score' ? 'none' : (sortDir === 'desc' ? 'descending' : 'ascending')}
                              className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground w-[100px]"
                            >
                              <button
                                type="button"
                                onClick={toggleSort}
                                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
                                title={sortBy === 'score' ? 'Ordenado por prioridade' : 'Ordenado por data'}
                                aria-label={`Alternar ordenação. Atual: ${sortBy === 'score' ? 'prioridade' : sortDir === 'desc' ? 'mais recentes' : 'mais antigos'}`}
                              >
                                {sortBy === 'score' ? 'Prioridade' : 'Entrada'}
                                <FontAwesomeIcon
                                  icon={sortDir === 'desc' ? faArrowDownShortWide : faArrowUpShortWide}
                                  className="h-3 w-3"
                                  aria-hidden="true"
                                />
                              </button>
                            </TableHead>
                            <TableHead
                              scope="col"
                              className={cn(
                                'text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground',
                                density === 'compact' ? 'w-[80px]' : 'w-[140px]',
                                density === 'comfortable' && 'crm-pin-right',
                              )}
                            >
                              Ações
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                      );
                    };

                    const renderRows = (items: typeof filtered) =>
                      items.map((lead) => {
                        const isNewest = lead.id === newestId;
                        const score = getLeadScore(lead, { interactionCount: interactionCounts[lead.id] ?? 0 });
                        const isChecked = selected.has(lead.id);
                        return (
                          <DraggableRow key={lead.id} id={lead.id}>
                            {({ setNodeRef, isDragging, grip, style }) => (
                          <TableRow
                            ref={setNodeRef as any}
                            tabIndex={0}
                            role="button"
                            aria-label={`Abrir detalhes de ${lead.name}, status ${lead.status}`}
                            aria-selected={isChecked}
                            className={cn(
                              'group cursor-pointer border-border/60 outline-none transition-colors',
                              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                              rowPad,
                              isNewest && '!bg-primary/5 hover:!bg-primary/10',
                              isChecked && '!bg-primary/[0.06] hover:!bg-primary/10',
                              score.urgent && 'border-l-2 border-l-destructive',
                              isDragging && 'opacity-40',
                            )}
                            style={style}
                            onClick={() => openDetail(lead)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(lead); } }}
                          >
                            <TableCell className="pl-2 pr-0 w-[20px]" onClick={(e) => e.stopPropagation()}>
                              {grip}
                            </TableCell>
                            <TableCell className="pl-2 pr-0" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleOne(lead.id)}
                                aria-label={`Selecionar ${lead.name}`}
                              />
                            </TableCell>
                            <TableCell className={cn('font-medium', density === 'comfortable' && 'crm-pin-left')}>
                              <div className="flex items-center gap-3">
                                <InitialsAvatar name={lead.name} size={density === 'compact' ? 'sm' : 'md'} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {isNewest && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" title="Lead mais recente" />
                                    )}
                                    <span className="text-sm font-semibold truncate">{lead.name}</span>
                                  </div>
                                  {density === 'comfortable' && (
                                    <span className="text-[11px] text-muted-foreground font-mono">{lead.phone ?? '—'}</span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className={cn('hidden lg:table-cell', density === 'compact' && 'lg:hidden')}>
                              {lead.origin ? (
                                <span className={cn('tag-cell', `tag-${colorForLabel(lead.origin)}`)}>{lead.origin}</span>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className={cn('hidden xl:table-cell text-xs text-muted-foreground max-w-[200px] truncate', density === 'compact' && 'xl:hidden')}>
                              {lead.product_interest ?? '—'}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} onUpdated={fetchLeads} />
                            </TableCell>
                            <TableCell>
                              <LeadScoreBadge lead={lead} interactionCount={interactionCounts[lead.id] ?? 0} size="sm" />
                            </TableCell>
                            <TableCell className={cn('hidden lg:table-cell', density === 'compact' && 'lg:hidden')}>
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
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                              className={cn(density === 'comfortable' && 'crm-pin-right')}
                            >
                              <div className="crm-row-actions flex justify-end gap-0.5">
                                {density !== 'compact' && (
                                  <QuickActionsPopover
                                    leadId={lead.id}
                                    leadName={lead.name}
                                    phone={lead.phone}
                                    onUpdated={fetchLeads}
                                  />
                                )}
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
                            )}
                          </DraggableRow>
                        );
                      });

                    const renderGroup = (items: typeof filtered, groupKey: string, showSizer: boolean) => {
                      const info = paged.paginate(items, groupKey);
                      return (
                        <>
                          {density !== 'compact' && (
                            <div className="flex items-center justify-end gap-1.5 px-1 pb-1 text-[11px] text-muted-foreground/70">
                              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">Shift</kbd>
                              <span>+ rolar para arrastar lateralmente</span>
                            </div>
                          )}
                          <div
                            ref={(node) => { tableGroupScrollRefs.current[groupKey] = node; }}
                            className={cn(
                              'crm-row-resize crm-smooth-scroll crm-dense-table min-w-0 max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset rounded-sm',
                              density === 'compact'
                                ? 'crm-compact-table overflow-x-hidden overflow-y-auto'
                                : 'crm-x-scroll-always overflow-x-auto overflow-y-auto',
                            )}
                            style={{ maxHeight: 'calc(100vh - 280px)', ['--row-h' as any]: `${rowHeight}px` }}
                            onWheel={(e) => {
                              // Shift + scroll → rola horizontal (atalho clássico)
                              if (e.shiftKey && e.deltaY !== 0) {
                                e.currentTarget.scrollLeft += e.deltaY;
                                e.preventDefault();
                              }
                            }}
                            onPointerDown={(e) => {
                              // Drag-resize: pointerdown nos últimos 5px da borda inferior de qualquer <tr>
                              const tr = (e.target as HTMLElement)?.closest('tr');
                              if (!tr || tr.parentElement?.tagName !== 'TBODY') return;
                              const rect = tr.getBoundingClientRect();
                              if (e.clientY < rect.bottom - 5 || e.clientY > rect.bottom + 2) return;
                              e.preventDefault();
                              e.stopPropagation();
                              const startY = e.clientY;
                              const startH = rowHeight;
                              const move = (ev: PointerEvent) => {
                                setRowHeightClamped(startH + (ev.clientY - startY));
                              };
                              const up = () => {
                                window.removeEventListener('pointermove', move);
                                window.removeEventListener('pointerup', up);
                                document.body.style.cursor = '';
                                document.body.style.userSelect = '';
                              };
                              window.addEventListener('pointermove', move);
                              window.addEventListener('pointerup', up);
                              document.body.style.cursor = 'ns-resize';
                              document.body.style.userSelect = 'none';
                            }}
                            onPointerMove={(e) => {
                              // Cursor ns-resize quando perto da borda inferior de uma <tr>
                              const tr = (e.target as HTMLElement)?.closest('tr');
                              if (!tr || tr.parentElement?.tagName !== 'TBODY') {
                                e.currentTarget.style.cursor = '';
                                return;
                              }
                              const rect = tr.getBoundingClientRect();
                              e.currentTarget.style.cursor =
                                e.clientY >= rect.bottom - 5 && e.clientY <= rect.bottom + 2
                                  ? 'ns-resize'
                                  : '';
                            }}
                            tabIndex={0}
                            role="region"
                            aria-label={`Tabela de leads — grupo ${groupKey}`}
                            data-refreshing={isRefreshing ? 'true' : 'false'}
                            onKeyDown={(e) => {
                              const tag = (e.target as HTMLElement)?.tagName;
                              if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
                              const el = e.currentTarget;
                              const step = Math.max(40, el.clientHeight * 0.8);
                              if (e.key === 'PageDown') { e.preventDefault(); el.scrollBy({ top: step, behavior: 'smooth' }); }
                              else if (e.key === 'PageUp') { e.preventDefault(); el.scrollBy({ top: -step, behavior: 'smooth' }); }
                              else if (e.key === 'Home') { e.preventDefault(); el.scrollTo({ top: 0, behavior: 'smooth' }); }
                              else if (e.key === 'End') { e.preventDefault(); el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }
                              else if (e.key === 'ArrowDown') { e.preventDefault(); el.scrollBy({ top: 48 }); }
                              else if (e.key === 'ArrowUp') { e.preventDefault(); el.scrollBy({ top: -48 }); }
                            }}
                          >
                            <Table>
                              {renderHeader(info.pageItems.map((i) => i.id))}
                              <TableBody>{renderRows(info.pageItems)}</TableBody>
                            </Table>
                          </div>
                          <LeadsPagination
                            page={info.page}
                            totalPages={info.totalPages}
                            rangeStart={info.rangeStart}
                            rangeEnd={info.rangeEnd}
                            total={info.total}
                            pageSize={paged.pageSize}
                            onPageChange={info.setPage}
                            onPageSizeChange={paged.setPageSize}
                            showPageSize={showSizer}
                          />
                        </>
                      );
                    };

                    // Marca o primeiro grupo visível para mostrar o seletor "por página"
                    let sizerShown = false;
                    return (
                      <>
                        {STATUS_GROUPS.map((g) => {
                          const items = grouped.map[g.key];
                          if (items.length === 0) return null;
                          const todayCount = items.filter((l) => isToday(l.created_at)).length;
                          const showSizer = !sizerShown;
                          sizerShown = true;
                          return (
                            <DroppableGroupHeader key={g.key} status={g.key}>
                              <GroupSection
                                title={g.title}
                                count={items.length}
                                color={g.color}
                                defaultOpen={g.key !== 'lost'}
                                meta={todayCount > 0 ? `${todayCount} hoje` : undefined}
                              >
                                {renderGroup(items, g.key, showSizer)}
                              </GroupSection>
                            </DroppableGroupHeader>
                          );
                        })}
                        {grouped.other.length > 0 && (
                          <GroupSection title="Outros" count={grouped.other.length} color="neutral" defaultOpen={false}>
                            {renderGroup(grouped.other, '__other__', !sizerShown)}
                          </GroupSection>
                        )}
                      </>
                    );
                  })()}
                  </LeadsDndProvider>
                </div>

                {/* Mobile — usa visão de Cards */}
                <div className="md:hidden">
                  {(() => {
                    const info = paged.paginate(filtered, '__mobile__');
                    return (
                      <>
                        <LeadsCards
                          leads={info.pageItems}
                          selected={selected}
                          onToggleOne={toggleOne}
                          newestId={newestId}
                          interactionCounts={interactionCounts}
                          onOpenDetail={openDetail}
                          onUpdated={fetchLeads}
                        />
                        <LeadsPagination
                          page={info.page}
                          totalPages={info.totalPages}
                          rangeStart={info.rangeStart}
                          rangeEnd={info.rangeEnd}
                          total={info.total}
                          pageSize={paged.pageSize}
                          onPageChange={info.setPage}
                          onPageSizeChange={paged.setPageSize}
                          showPageSize
                        />
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </ListState>
        </div>

        <LeadDetailSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} onUpdated={fetchLeads} />
        <NewLeadDialog open={newOpen} onOpenChange={setNewOpen} onCreated={fetchLeads} defaultStatus={newDefaultStatus} />
        <BulkActionsBar
          count={selected.size}
          onClear={clearSelection}
          onChangeStatus={bulkChangeStatus}
          onDelete={bulkDelete}
          onScheduleFollowup={bulkScheduleFollowup}
          onCopyPhones={bulkCopyPhones}
          onExport={bulkExport}
          onAssign={bulkAssign}
        />
      </div>
    </TooltipProvider>
  );
}
