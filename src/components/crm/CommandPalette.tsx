import { useEffect, useState, useMemo } from 'react';
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
  Search, LogOut, ExternalLink, Plus,
} from 'lucide-react';

type Lead = { id: string; name: string; phone: string | null };

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
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from('leads')
      .select('id,name,phone')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => setRecentLeads((data as Lead[]) ?? []));
  }, [open]);

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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar páginas, boards, leads…  ⌘K" />
      <CommandList className="max-h-[460px]">
        <CommandEmpty>Nada encontrado.</CommandEmpty>

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
                  value={`lead ${l.name} ${l.phone ?? ''}`}
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
      </CommandList>
    </CommandDialog>
  );
}
