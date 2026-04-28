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
import ThemeToggle from './ThemeToggle';
import HelpButton from '@/components/tutorial/HelpButton';
import { cn } from '@/lib/utils';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  pipeline: 'Pipeline',
  clients: 'Clientes',
  ia: 'IA',
  whatsapp: 'WhatsApp',
  'my-work': 'Meu trabalho',
  audit: 'Auditoria',
  telemetry: 'Telemetria',
};

const IA_SUB_LABELS: Record<string, string> = {
  excel: 'Excel',
  csv: 'CSV',
  paste: 'Texto colado',
  whatsapp: 'WhatsApp',
  duplicates: 'Duplicados',
  classify: 'Sugestão de status',
  score: 'Score automático',
  insights: 'Insights',
  assistant: 'Assistente',
};

interface Props {
  onOpenPalette?: () => void;
  onShowHelp?: () => void;
}

export default function AdminNavbar({ onOpenPalette, onShowHelp }: Props) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Build dynamic breadcrumb from path segments
  const segments = location.pathname.split('/').filter(Boolean);
  const adminIdx = segments.indexOf('admin');
  const after = adminIdx >= 0 ? segments.slice(adminIdx + 1) : [];
  const crumbs: { label: string; href: string }[] = [];
  if (after.length > 0) {
    const root = after[0];
    crumbs.push({
      label: ROUTE_LABELS[root] ?? root.charAt(0).toUpperCase() + root.slice(1),
      href: `/admin/${root}`,
    });
    if (root === 'ia' && after[1]) {
      crumbs.push({
        label: IA_SUB_LABELS[after[1]] ?? after[1],
        href: `/admin/ia/${after[1]}`,
      });
    }
  }

  const initials = (user?.email ?? '?').split('@')[0].slice(0, 2).toUpperCase();
  const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform);

  return (
    <header
      className={cn(
        'h-14 border-b border-hairline bg-card/80 backdrop-blur-md',
        'flex items-center justify-between px-3 sm:px-5 shrink-0 sticky top-0 z-30',
        'supports-[backdrop-filter]:bg-card/70',
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors duration-crm ease-crm -ml-1" />

        {/* Dynamic editorial breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="hidden sm:flex items-center gap-1.5 text-[13px] min-w-0"
        >
          <Link
            to="/admin/dashboard"
            className="text-muted-foreground hover:text-foreground transition-colors duration-crm ease-crm font-medium"
          >
            Workspace
          </Link>
          {crumbs.map((c, i) => (
            <div key={c.href} className="flex items-center gap-1.5 min-w-0">
              <MSym name="chevron_right" size={14} className="text-muted-foreground/50 shrink-0" />
              {i === crumbs.length - 1 ? (
                <span
                  className="font-semibold text-foreground truncate tracking-tight"
                  style={{ fontSize: '14px', letterSpacing: '-0.01em' }}
                >
                  {c.label}
                </span>
              ) : (
                <Link
                  to={c.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-crm ease-crm font-medium truncate"
                >
                  {c.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Command palette trigger */}
        <div className="hidden md:flex items-center gap-2 ml-auto sm:ml-3 flex-1 max-w-md">
          <button
            type="button"
            onClick={onOpenPalette}
            className={cn(
              'group flex items-center gap-2.5 w-full h-9 pl-3 pr-2 rounded-lg',
              'bg-surface-2 border border-hairline hover:border-hairline-strong hover:bg-card text-left',
              'transition-[background-color,border-color,box-shadow] duration-crm ease-crm',
              'hover:shadow-soft',
            )}
            aria-label="Abrir paleta de comandos"
          >
            <MSym name="search" size={16} className="text-muted-foreground group-hover:text-foreground transition-colors duration-crm ease-crm" />
            <span className="flex-1 text-[12.5px] text-muted-foreground">
              Buscar leads, clientes, comandos…
            </span>
            <kbd className="hidden lg:inline-flex kbd-chip">
              {isMac ? '⌘' : 'Ctrl'}
            </kbd>
            <kbd className="hidden lg:inline-flex kbd-chip">K</kbd>
          </button>
        </div>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/admin/ia/assistant"
                className={cn(
                  'hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg',
                  'bg-primary/10 hover:bg-primary/15 text-primary text-[12.5px] font-semibold',
                  'transition-colors duration-crm ease-crm',
                )}
              >
                <MSym name="auto_awesome" size={16} filled />
                <span>Ask AI</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Abrir assistente IA</TooltipContent>
          </Tooltip>

          <ThemeToggle />

          <HelpButton onOpenShortcuts={() => onShowHelp?.()} variant="navbar" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-crm ease-crm"
                aria-label="Notificações"
              >
                <MSym name="notifications" size={18} />
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
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-crm ease-crm"
              >
                <MSym name="open_in_new" size={18} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Abrir site público</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-full hover:bg-muted transition-colors duration-crm ease-crm ml-1"
                aria-label="Menu do usuário"
              >
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent-brand text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-crm-sm ring-2 ring-card">
                  {initials}
                </span>
                <span className="hidden md:inline text-xs font-medium text-foreground/80 max-w-[140px] truncate">
                  {user?.email?.split('@')[0]}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-xl border-hairline shadow-floating">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-semibold leading-none">Sessão ativa</p>
                  <p className="text-[11px] text-muted-foreground leading-none truncate mt-1">{user?.email}</p>
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
