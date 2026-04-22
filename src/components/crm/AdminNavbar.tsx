import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpRightFromSquare, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Painel',
  leads: 'Leads',
  pipeline: 'Pipeline',
  clients: 'Clientes',
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
  const currentLabel = ROUTE_LABELS[segment] ?? 'Painel';
  const initials = (user?.email ?? '?').split('@')[0].slice(0, 2).toUpperCase();

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <div className="hidden sm:flex items-center gap-1.5 text-[13px] min-w-0">
          <span className="text-muted-foreground">CRM</span>
          <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5 text-muted-foreground/60" />
          <span className="font-semibold text-foreground truncate">{currentLabel}</span>
        </div>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-muted-foreground hover:text-foreground">
                <Link to="/" target="_blank" rel="noopener noreferrer" aria-label="Ver site público">
                  <FontAwesomeIcon icon={faUpRightFromSquare} className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir site público</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Menu do usuário"
              >
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold flex items-center justify-center">
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
                Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </header>
  );
}
