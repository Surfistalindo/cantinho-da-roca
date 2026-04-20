import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'vendedor' | 'usuario';

interface UseUserRoleResult {
  role: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useUserRole(): UseUserRoleResult {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (cancelled) return;

      const roles = (data ?? []).map((r) => r.role as AppRole);
      // priority: admin > vendedor > usuario
      const resolved: AppRole | null =
        roles.includes('admin') ? 'admin'
        : roles.includes('vendedor') ? 'vendedor'
        : roles.includes('usuario') ? 'usuario'
        : null;

      setRole(resolved);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return { role, isAdmin: role === 'admin', loading: loading || authLoading };
}
