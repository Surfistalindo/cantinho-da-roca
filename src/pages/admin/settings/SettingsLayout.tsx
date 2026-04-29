import { NavLink, Outlet } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { MSym } from '@/components/crm/MSym';

const ITEMS = [
  { to: '/admin/settings/profile', label: 'Meu perfil', icon: 'person', adminOnly: false },
  { to: '/admin/settings/users', label: 'Usuários', icon: 'group', adminOnly: true },
];

export default function SettingsLayout() {
  const { isAdmin } = useUserRole();
  const items = ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="font-crm h-full flex flex-col">
      <div className="px-6 py-5 border-b border-border bg-background">
        <h1 className="text-[22px] font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie seu perfil, equipe e preferências.</p>
      </div>

      <div className="flex-1 flex min-h-0">
        <nav className="w-56 shrink-0 border-r border-border p-3 space-y-0.5 bg-card/40">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <MSym name={it.icon} size={16} />
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
