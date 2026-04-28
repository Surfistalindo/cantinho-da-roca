import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MSym } from './MSym';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  pipeline: 'Pipeline',
  clients: 'Clientes',
  ia: 'IA',
};

export default function AdminNavbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const segment = location.pathname.split('/').filter(Boolean)[1] ?? 'dashboard';
  const currentLabel = ROUTE_LABELS[segment] ?? 'Dashboard';
  const initials = (user?.email ?? '?').split('@')[0].slice(0, 2).toUpperCase();

  return (
    <header className="h-12 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="hidden sm:flex items-center gap-1.5 text-[12px] min-w-0">
          <span className="text-muted-foreground">Workspace</span>
          <MSym name="chevron_right" size={14} className="text-muted-foreground/60" />
          <span className="font-semibold text-foreground truncate">{currentLabel}</span>
          <span className="ml-2 inline-flex items-center gap-1 px-2 h-5 rounded-md bg-success/15 text-success text-[10px] font-bold uppercase tracking-wide">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            On track
          </span>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 ml-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <MSym name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar leads, clientes…"
              className="w-full h-8 pl-9 pr-3 rounded-md bg-surface-3 border border-transparent focus:border-primary/40 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-[12.5px] placeholder:text-muted-foreground transition-colors"
            />
          </div>
        </div>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/admin/ia/assistant"
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/10 hover:bg-primary/15 text-primary text-[12px] font-semibold transition-colors"
              >
                <MSym name="auto_awesome" size={16} filled />
                <span>Ask AI</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Abrir assistente IA</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MSym name="notifications" size={20} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Notificações</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver site público"
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <MSym name="open_in_new" size={18} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Abrir site público</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full hover:bg-muted transition-colors ml-1"
                aria-label="Menu do usuário"
              >
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-[11px] font-bold flex items-center justify-center">
                  {initials}
                </span>
                <span className="hidden md:inline text-xs font-medium text-foreground/80 max-w-[140px] truncate">
                  {user?.email?.split('@')[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-medium leading-none">Sessão ativa</p>
                  <p className="text-[11px] text-muted-foreground leading-none truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer text-xs">
                <MSym name="logout" size={16} className="mr-2" />
                Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </header>
  );
}
