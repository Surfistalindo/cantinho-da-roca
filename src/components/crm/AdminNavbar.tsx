import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';

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
        <div>
          <h1 className="text-sm font-bold font-heading leading-tight">Cantinho da Roça</h1>
          <p className="text-[11px] text-muted-foreground leading-tight">CRM</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 px-2">
          <LogOut className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline text-xs">Sair</span>
        </Button>
      </div>
    </header>
  );
}
