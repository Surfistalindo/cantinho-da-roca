import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MSym } from '@/components/crm/MSym';
import RoleBadge from '@/components/admin/users/RoleBadge';
import UserFormDialog, { UserRow } from '@/components/admin/users/UserFormDialog';
import PasswordResetDialog from '@/components/admin/users/PasswordResetDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<UserRow | null>(null);
  const [delTarget, setDelTarget] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'list-users' },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? 'Erro ao carregar usuários');
      return;
    }
    setUsers(data.users ?? []);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.profile?.name?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const handleNew = () => { setEditing(null); setEditOpen(true); };
  const handleEdit = (u: UserRow) => { setEditing(u); setEditOpen(true); };

  const handleDelete = async () => {
    if (!delTarget) return;
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete-user', user_id: delTarget.id },
    });
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? 'Erro ao excluir');
      return;
    }
    toast.success('Usuário excluído');
    setDelTarget(null);
    fetchUsers();
  };

  return (
    <div className="p-6 font-crm">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <MSym name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-9 h-9"
          />
        </div>
        <Button onClick={handleNew} size="sm">
          <MSym name="add" size={16} className="mr-1.5" />
          Novo usuário
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">Usuário</th>
              <th className="text-left font-semibold px-4 py-2.5">Papel</th>
              <th className="text-left font-semibold px-4 py-2.5">Cargo</th>
              <th className="text-left font-semibold px-4 py-2.5">Último acesso</th>
              <th className="text-right font-semibold px-4 py-2.5 w-[1%]">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário</td></tr>
            )}
            {!loading && filtered.map((u) => {
              const name = u.profile?.name || u.email?.split('@')[0] || '?';
              const initials = name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
              return (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0">
                        {u.profile?.avatar_url ? (
                          <img src={u.profile.avatar_url} alt={name} className="w-full h-full object-cover" />
                        ) : initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.profile?.job_title ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">
                    {/* @ts-expect-error campo extra do listUsers */}
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar" onClick={() => handleEdit(u)}>
                        <MSym name="edit" size={16} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Trocar senha" onClick={() => setPwTarget(u)}>
                        <MSym name="key" size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Excluir"
                        disabled={u.id === me?.id}
                        onClick={() => setDelTarget(u)}
                      >
                        <MSym name="delete" size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <UserFormDialog open={editOpen} onOpenChange={setEditOpen} user={editing} onSaved={fetchUsers} />

      {pwTarget && (
        <PasswordResetDialog
          open={!!pwTarget}
          onOpenChange={(v) => !v && setPwTarget(null)}
          userId={pwTarget.id}
          email={pwTarget.email}
        />
      )}

      <AlertDialog open={!!delTarget} onOpenChange={(v) => !v && setDelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{delTarget?.profile?.name ?? delTarget?.email}</strong> será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
