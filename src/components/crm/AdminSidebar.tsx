import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGaugeHigh, faUserGroup, faTableColumns, faUserCheck, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { getContactRecency } from '@/lib/contactRecency';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const menuItems: { title: string; url: string; icon: IconDefinition; key: string }[] = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: faGaugeHigh, key: 'dashboard' },
  { title: 'Leads', url: '/admin/leads', icon: faUserGroup, key: 'leads' },
  { title: 'Pipeline', url: '/admin/pipeline', icon: faTableColumns, key: 'pipeline' },
  { title: 'Clientes', url: '/admin/clients', icon: faUserCheck, key: 'clients' },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const [overdueCount, setOverdueCount] = useState(0);

  const fetchOverdue = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('status, last_contact_at, created_at');
    if (!data) return;
    const count = data.reduce((acc, l) => {
      const info = getContactRecency(l.last_contact_at, l.status, l.created_at);
      return info.level === 'overdue' ? acc + 1 : acc;
    }, 0);
    setOverdueCount(count);
  }, []);

  useEffect(() => { fetchOverdue(); }, [fetchOverdue]);
  useRealtimeTable('leads', fetchOverdue);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <FontAwesomeIcon icon={item.icon} className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.key === 'leads' && overdueCount > 0 && (
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive border-0 h-5 px-1.5 text-[10px] font-semibold">
                              {overdueCount}
                            </Badge>
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

        <SidebarGroup>
          <SidebarGroupLabel>Outros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:bg-sidebar-accent/50"
                  >
                    <FontAwesomeIcon icon={faUpRightFromSquare} className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Site público</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
