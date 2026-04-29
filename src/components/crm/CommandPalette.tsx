import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { supabase } from '@/integrations/supabase/client';
import {
  Home, Inbox, Users, ListTodo, GitBranch, Sparkles, Bot,
  Upload, FileSpreadsheet, MessageSquare, Layers, Wand2,
  Search, ExternalLink, Plus, Tag, Filter,
} from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  product_interest: string | null;
  origin: string | null;
};
type Customer = { id: string; name: string; phone: string | null; product_bought: string | null };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNewLead?: () => void;
}

const NAV_ITEMS = [
  { label: 'Página inicial',  url: '/admin/dashboard',  icon: Home,            kbd: 'g d' },
  { label: 'Meu trabalho',    url: '/admin/my-work',    icon: Inbox,           kbd: 'g m' },
  { label: 'Leads',           url: '/admin/leads',      icon: Users,           kbd: 'g l' },
  { label: 'Pipeline',        url: '/admin/pipeline',   icon: GitBranch,       kbd: 'g p' },
  { label: 'Clientes',        url: '/admin/clients',    icon: ListTodo,        kbd: 'g c' },
];

const IA_ITEMS = [
  { label: 'Assistente de IA', url: '/admin/ia/assistant',   icon: Sparkles },
  { label: 'Insights (Vibe)',  url: '/admin/ia/insights',    icon: Wand2 },
  { label: 'Score IA',         url: '/admin/ia/score',       icon: Bot },
  { label: 'Importar Excel',   url: '/admin/ia/excel',       icon: FileSpreadsheet },
  { label: 'Importar CSV',     url: '/admin/ia/csv',         icon: Upload },
  { label: 'Colar texto',      url: '/admin/ia/paste',       icon: MessageSquare },
  { label: 'WhatsApp',         url: '/admin/ia/whatsapp',    icon: MessageSquare },
  { label: 'Duplicados',       url: '/admin/ia/duplicates',  icon: Layers },
];

export default function CommandPalette({ open, onOpenChange, onNewLead }: Props) {
  const navigate = useNavigate();
  const { workspaces, boards } = useWorkspaces();
  const [query, setQuery] = useState('');
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [searchedLeads, setSearchedLeads] = useState<Lead[]>([]);
  const [searchedCustomers, setSearchedCustomers] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Load recent leads when dialog opens with empty query
  useEffect(() => {
    if (!open) return;
    supabase
      .from('leads')
      .select('id,name,phone,product_interest,origin')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setRecentLeads((data as Lead[]) ?? []));
  }, [open]);

  // Debounced search across leads + customers
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setSearchedLeads([]);
      setSearchedCustomers([]);
      setSearching(false);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = window.setTimeout(async () => {
      const safe = q.replace(/[%,]/g, ' ').trim();
      const pattern = `%${safe}%`;
      const [leadsRes, custRes] = await Promise.all([
        supabase
          .from('leads')
          .select('id,name,phone,product_interest,origin')
          .or(`name.ilike.${pattern},phone.ilike.${pattern},product_interest.ilike.${pattern},origin.ilike.${pattern},notes.ilike.${pattern}`)
          .limit(8),
        supabase
          .from('customers')
          .select('id,name,phone,product_bought')
          .or(`name.ilike.${pattern},phone.ilike.${pattern},product_bought.ilike.${pattern},notes.ilike.${pattern}`)
          .limit(8),
      ]);
      setSearchedLeads((leadsRes.data as Lead[]) ?? []);
      setSearchedCustomers((custRes.data as Customer[]) ?? []);
      setSearching(false);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  const go = (url: string) => {
    onOpenChange(false);
    navigate(url);
  };

  const boardItems = useMemo(
    () => boards.slice(0, 20).map((b) => {
      const ws = workspaces.find((w) => w.id === b.workspace_id);
      return { ...b, wsName: ws?.name ?? '' };
    }),
    [boards, workspaces],
  );

  const trimmedQuery = query.trim();
  const showSearchResults = trimmedQuery.length >= 2;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar em tudo: leads, clientes, interesses, páginas…  ⌘K"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[460px]">
        <CommandEmpty>
          {searching ? 'Buscando…' : 'Nada encontrado.'}
        </CommandEmpty>

        {showSearchResults && (
          <CommandGroup heading="Atalhos da busca">
            <CommandItem
              value={`shortcut all-leads ${trimmedQuery}`}
              onSelect={() => go(`/admin/leads?q=${encodeURIComponent(trimmedQuery)}`)}
            >
              <Filter className="mr-2 h-4 w-4" />
              <span>Ver todos os leads que contêm</span>
              <span className="ml-1.5 font-semibold truncate">"{trimmedQuery}"</span>
            </CommandItem>
            <CommandItem
              value={`shortcut interest ${trimmedQuery}`}
              onSelect={() => go(`/admin/leads?interest=${encodeURIComponent(trimmedQuery)}`)}
            >
              <Tag className="mr-2 h-4 w-4" />
              <span>Filtrar por interesse exato:</span>
              <span className="ml-1.5 font-semibold truncate">"{trimmedQuery}"</span>
            </CommandItem>
          </CommandGroup>
        )}

        {showSearchResults && searchedLeads.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Leads (${searchedLeads.length})`}>
              {searchedLeads.map((l) => (
                <CommandItem
                  key={l.id}
                  value={`lead ${l.name} ${l.phone ?? ''} ${l.product_interest ?? ''} ${l.origin ?? ''}`}
                  onSelect={() => go(`/admin/leads?focus=${l.id}`)}
                >
                  <Users className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{l.name}</span>
                  {l.product_interest && (
                    <span className="ml-2 text-[11px] text-muted-foreground truncate max-w-[180px]">
                      · {l.product_interest}
                    </span>
                  )}
                  {l.phone && <span className="ml-auto text-[11px] text-muted-foreground font-mono">{l.phone}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {showSearchResults && searchedCustomers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`Clientes (${searchedCustomers.length})`}>
              {searchedCustomers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`customer ${c.name} ${c.phone ?? ''} ${c.product_bought ?? ''}`}
                  onSelect={() => go(`/admin/clients?focus=${c.id}`)}
                >
                  <ListTodo className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{c.name}</span>
                  {c.product_bought && (
                    <span className="ml-2 text-[11px] text-muted-foreground truncate max-w-[180px]">
                      · {c.product_bought}
                    </span>
                  )}
                  {c.phone && <span className="ml-auto text-[11px] text-muted-foreground font-mono">{c.phone}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {!showSearchResults && (
          <>
            <CommandGroup heading="Ações">
              <CommandItem onSelect={() => { onOpenChange(false); onNewLead?.(); }}>
                <Plus className="mr-2 h-4 w-4" /> Novo lead
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go('/admin/leads')}>
                <Search className="mr-2 h-4 w-4" /> Ir para busca de leads
                <CommandShortcut>/</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { onOpenChange(false); window.open('/', '_blank'); }}>
                <ExternalLink className="mr-2 h-4 w-4" /> Abrir site público
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navegação">
              {NAV_ITEMS.map((it) => (
                <CommandItem key={it.url} onSelect={() => go(it.url)}>
                  <it.icon className="mr-2 h-4 w-4" /> {it.label}
                  <CommandShortcut>{it.kbd}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="cantim IA">
              {IA_ITEMS.map((it) => (
                <CommandItem key={it.url} onSelect={() => go(it.url)}>
                  <it.icon className="mr-2 h-4 w-4" /> {it.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {boardItems.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Boards">
                  {boardItems.map((b) => (
                    <CommandItem
                      key={b.id}
                      value={`board ${b.name} ${b.wsName}`}
                      onSelect={() => go(b.kind === 'route' && b.route_path ? b.route_path : `/admin/boards/${b.id}`)}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      <span>{b.name}</span>
                      <span className="ml-2 text-[11px] text-muted-foreground">{b.wsName}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {recentLeads.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Leads recentes">
                  {recentLeads.map((l) => (
                    <CommandItem
                      key={l.id}
                      value={`recent lead ${l.name} ${l.phone ?? ''}`}
                      onSelect={() => go(`/admin/leads?focus=${l.id}`)}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>{l.name}</span>
                      {l.phone && <span className="ml-2 text-[11px] text-muted-foreground font-mono">{l.phone}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
