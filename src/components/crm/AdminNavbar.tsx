import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, Link } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import logo from '@/assets/logo-cantim.png';

export default function AdminNavbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" />
        <img src={logo} alt="Cantim da Roça" className="h-8" />
        <div>
          <h1 className="text-sm font-bold font-heading leading-tight">Cantim da Roça</h1>
          <p className="text-[11px] text-muted-foreground leading-tight">CRM</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link to="/">
            <FontAwesomeIcon icon={faUpRightFromSquare} className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline text-xs">Ver Site</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 px-2">
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline text-xs">Sair</span>
        </Button>
      </div>
    </header>
  );
}
