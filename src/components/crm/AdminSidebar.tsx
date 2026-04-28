import { useCallback, useEffect, useState } from 'react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useAuth } from '@/contexts/AuthContext';
import { getContactRecency } from '@/lib/contactRecency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MSym } from './MSym';
import { cn } from '@/lib/utils';
import cantimLogo from '@/assets/cantim-logo.png';

interface NavItem {
  title: string;
  url: string;
  icon: string;
  key: string;
  badgeKey?: 'overdue';
}

const primaryItems: NavItem[] = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: 'dashboard', key: 'dashboard' },
  { title: 'Leads', url: '/admin/leads', icon: 'person_search', key: 'leads', badgeKey: 'overdue' },
  { title: 'Pipeline', url: '/admin/pipeline', icon: 'view_kanban', key: 'pipeline' },
  { title: 'Clientes', url: '/admin/clients', icon: 'group', key: 'clients' },
  { title: 'IA', url: '/admin/ia', icon: 'auto_awesome', key: 'ia' },
];

const iaSubItems: { title: string; url: string; icon: string }[] = [
  { title: 'Visão geral', url: '/admin/ia', icon: 'auto_awesome' },
  { title: 'Excel', url: '/admin/ia/excel', icon: 'table_view' },
  { title: 'CSV', url: '/admin/ia/csv', icon: 'description' },
  { title: 'Texto colado', url: '/admin/ia/paste', icon: 'content_paste' },
  { title: 'WhatsApp', url: '/admin/ia/whatsapp', icon: 'chat' },
  { title: 'Duplicados', url: '/admin/ia/duplicates', icon: 'content_copy' },
  { title: 'Sugestão de status', url: '/admin/ia/classify', icon: 'sell' },
  { title: 'Score automático', url: '/admin/ia/score', icon: 'leaderboard' },
  { title: 'Insights', url: '/admin/ia/insights', icon: 'lightbulb' },
  { title: 'Assistente', url: '/admin/ia/assistant', icon: 'forum' },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [overdueCount, setOverdueCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isOnIA = location.pathname.startsWith('/admin/ia');
  const [iaOpen, setIaOpen] = useState(isOnIA);
  useEffect(() => { if (isOnIA) setIaOpen(true); }, [isOnIA]);

  const fetchOverdue = useCallback(async () => {
    const { data } = await supabase.from('leads').select('status, last_contact_at, created_at');
    if (!data) return;
    const count = data.reduce((acc, l) => {
      const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
      return info.level === 'overdue' ? acc + 1 : acc;
    }, 0);
    setOverdueCount(count);
  }, []);

  useEffect(() => { fetchOverdue(); }, [fetchOverdue]);
  useRealtimeTable('leads', fetchOverdue);

  const initials = (user?.email ?? '?').split('@')[0].slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const renderItem = (item: NavItem) => {
    const isIA = item.key === 'ia';
    const badgeValue = item.badgeKey === 'overdue' ? overdueCount : 0;

    if (isIA && !collapsed) {
      return (
        <SidebarMenuItem key={item.key}>
          <button
            type="button"
            onClick={() => setIaOpen((v) => !v)}
            className={cn(
              'group relative flex items-center w-full h-9 rounded-md px-3 text-[12.5px] font-medium gap-3 transition-colors',
              isOnIA
                ? 'sidebar-item-active text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground',
            )}
          >
            <MSym name={item.icon} size={18} className={cn(isOnIA && 'text-sidebar-primary')} filled={isOnIA} />
            <span className="flex-1 text-left">{item.title}</span>
            <MSym name="expand_more" size={16} className={cn('transition-transform opacity-60', iaOpen && 'rotate-180')} />
          </button>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.key}>
        <SidebarMenuButton asChild className="h-9 rounded-md px-3 text-[12.5px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground transition-colors">
          <NavLink
            to={item.url}
            end={item.key !== 'ia'}
            activeClassName="sidebar-item-active !text-sidebar-accent-foreground [&_.material-symbols-outlined]:text-sidebar-primary"
          >
            <MSym name={item.icon} size={18} />
            {!collapsed && (
              <span className="flex-1 flex items-center justify-between">
                <span>{item.title}</span>
                {badgeValue > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1.5 rounded-full bg-destructive/20 text-destructive text-[10px] font-semibold">
                    {badgeValue}
                  </span>
                )}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="px-3 pt-3 pb-3 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="h-9 w-9 shrink-0 rounded-lg bg-card ring-1 ring-sidebar-border flex items-center justify-center overflow-hidden p-0.5">
            <img src={cantimLogo} alt="Cantim da Roça" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="text-[13.5px] font-bold text-sidebar-accent-foreground truncate">Cantim da Roça</p>
              <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-0.5">Workspace</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {primaryItems.map(renderItem)}

              {!collapsed && iaOpen && (
                <div className="ml-3 mt-0.5 mb-1 pl-3 border-l border-sidebar-border/70 space-y-0.5">
                  {iaSubItems.map((sub) => (
                    <SidebarMenuItem key={sub.url}>
                      <SidebarMenuButton asChild className="h-7 rounded-md px-2 text-[11.5px] text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground transition-colors">
                        <NavLink
                          to={sub.url}
                          end
                          activeClassName="sidebar-item-active !text-sidebar-accent-foreground [&_.material-symbols-outlined]:text-sidebar-primary"
                        >
                          <MSym name={sub.icon} size={14} className="opacity-70" />
                          <span>{sub.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-3">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-9 rounded-md px-3 text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground transition-colors">
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <MSym name="open_in_new" size={18} />
                    {!collapsed && <span>Site público</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <TooltipProvider delayDuration={300}>
          <div className={cn('flex items-center gap-2.5 rounded-md', !collapsed && 'p-1.5 hover:bg-sidebar-accent/60 transition-colors')}>
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-[11px] font-bold flex items-center justify-center">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[12px] font-semibold text-sidebar-accent-foreground truncate">{user?.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSignOut}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Sair"
                    >
                      <MSym name="logout" size={16} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Sair</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      </SidebarFooter>
    </Sidebar>
  );
}
