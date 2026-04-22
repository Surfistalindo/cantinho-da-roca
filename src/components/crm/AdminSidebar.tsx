import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGaugeHigh,
  faUserGroup,
  faTableColumns,
  faUserCheck,
  faUpRightFromSquare,
  faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getContactRecency } from '@/lib/contactRecency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import logo from '@/assets/logo-cantim.png';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { cn } from '@/lib/utils';

const menuItems: { title: string; url: string; icon: IconDefinition; key: string }[] = [
  { title: 'Painel', url: '/admin/dashboard', icon: faGaugeHigh, key: 'dashboard' },
  { title: 'Leads', url: '/admin/leads', icon: faUserGroup, key: 'leads' },
  { title: 'Pipeline', url: '/admin/pipeline', icon: faTableColumns, key: 'pipeline' },
  { title: 'Clientes', url: '/admin/clients', icon: faUserCheck, key: 'clients' },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [overdueCount, setOverdueCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const fetchOverdue = useCallback(async () => {
    const { data } = await supabase.from('leads').select('status, last_contact_at, created_at');
    if (!data) return;
    const count = data.reduce((acc, l) => {
      const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
      return info.level === 'overdue' ? acc + 1 : acc;
    }, 0);
    setOverdueCount(count);
  }, []);

  useEffect(() => {
    fetchOverdue();
  }, [fetchOverdue]);
  useRealtimeTable('leads', fetchOverdue);

  const initials = (user?.email ?? '?')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="h-9 w-9 shrink-0 rounded-xl bg-sidebar-accent flex items-center justify-center overflow-hidden">
            <img src={logo} alt="Cantinho da Roça" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="text-[13px] font-semibold text-sidebar-foreground truncate">Cantinho da Roça</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/55">CRM</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/45 px-2">
              Navegação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-9 rounded-lg px-2.5 text-[13px] font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors duration-150">
                    <NavLink
                      to={item.url}
                      end
                      activeClassName="!bg-sidebar-accent !text-sidebar-foreground relative before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-full before:bg-sidebar-primary"
                    >
                      <FontAwesomeIcon icon={item.icon} className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.key === 'leads' && overdueCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-mono font-semibold">
                              {overdueCount}
                            </span>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-2">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/45 px-2">
              Atalhos
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-9 rounded-lg px-2.5 text-[13px] text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors duration-150">
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={faUpRightFromSquare} className="h-3.5 w-3.5" />
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
          <div className={cn('flex items-center gap-2 px-1.5 py-1.5 rounded-lg', !collapsed && 'bg-sidebar-accent/40')}>
            <div className="h-8 w-8 shrink-0 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[11px] font-semibold flex items-center justify-center">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 leading-tight">
                  <p className="text-[12px] font-medium text-sidebar-foreground truncate">{user?.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSignOut}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      aria-label="Sair"
                    >
                      <FontAwesomeIcon icon={faArrowRightFromBracket} className="h-3.5 w-3.5" />
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
