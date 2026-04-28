import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { trackPermissionError } from '@/lib/telemetry';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading, role } = useUserRole();

  useEffect(() => {
    if (!authLoading && !roleLoading && session && !isAdmin) {
      trackPermissionError('Acesso negado ao painel admin', { role, userId: session.user?.id });
    }
  }, [authLoading, roleLoading, session, isAdmin, role]);

  if (authLoading || (session && roleLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm bg-card rounded-xl border border-border p-6 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
            <FontAwesomeIcon icon={faLock} className="w-5 h-5 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-2xl mb-1">Acesso restrito</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Sua conta {role ? `(${role})` : ''} não tem permissão para acessar o painel administrativo.
          </p>
          <Button variant="outline" size="sm" onClick={signOut}>Sair e tentar outra conta</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
