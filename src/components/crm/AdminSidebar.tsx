import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGaugeHigh, faUserGroup, faTableColumns, faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
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
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const menuItems: { title: string; url: string; icon: IconDefinition }[] = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: faGaugeHigh },
  { title: 'Leads', url: '/admin/leads', icon: faUserGroup },
  { title: 'Pipeline', url: '/admin/pipeline', icon: faTableColumns },
  { title: 'Clientes', url: '/admin/clients', icon: faUserCheck },
];

export default function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

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
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
