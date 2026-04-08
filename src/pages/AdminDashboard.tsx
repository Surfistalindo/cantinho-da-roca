import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, BarChart3, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const cards = [
    { icon: Users, label: 'Leads', value: '—', description: 'Total de leads capturados' },
    { icon: BarChart3, label: 'Conversões', value: '—', description: 'Taxa de conversão' },
    { icon: MessageSquare, label: 'Interações', value: '—', description: 'Contatos realizados' },
  ];

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-heading">Cantinho da Roça</h1>
          <p className="text-xs text-muted-foreground">CRM &middot; {user?.email}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </header>

      <main className="section-container py-8">
        <h2 className="text-2xl font-bold mb-6">Painel</h2>
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {cards.map((c) => (
            <div key={c.label} className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <c.icon className="w-5 h-5" />
                </div>
                <span className="font-semibold">{c.label}</span>
              </div>
              <p className="text-3xl font-bold font-heading">{c.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Leads recentes</h3>
          <p className="text-muted-foreground text-sm">
            A listagem de leads será implementada na próxima etapa.
          </p>
        </div>
      </main>
    </div>
  );
}
