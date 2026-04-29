import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AvatarUploader from './AvatarUploader';

export interface UserRow {
  id: string;
  email: string | null;
  role: 'admin' | 'vendedor' | 'usuario' | null;
  profile: {
    name: string | null;
    avatar_url: string | null;
    phone: string | null;
    bio: string | null;
    job_title: string | null;
    is_active: boolean;
  } | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: UserRow | null; // null = criar
  onSaved: () => void;
}

export default function UserFormDialog({ open, onOpenChange, user, onSaved }: Props) {
  const isCreate = !user;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'vendedor' | 'usuario'>('vendedor');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(user?.email ?? '');
      setPassword('');
      setName(user?.profile?.name ?? '');
      setPhone(user?.profile?.phone ?? '');
      setJobTitle(user?.profile?.job_title ?? '');
      setBio(user?.profile?.bio ?? '');
      setAvatarUrl(user?.profile?.avatar_url ?? null);
      setRole(user?.role ?? 'vendedor');
      setIsActive(user?.profile?.is_active ?? true);
    }
  }, [open, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCreate) {
        if (!email || !password) {
          toast.error('Email e senha obrigatórios');
          setSaving(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke('admin-users', {
          body: { action: 'create-user', email, password, name, role },
        });
        if (error || data?.error) throw new Error(data?.error ?? error?.message);
        const newId = data.user_id as string;
        if (avatarUrl || phone || jobTitle || bio) {
          await supabase.functions.invoke('admin-users', {
            body: {
              action: 'update-user',
              user_id: newId,
              profile: { avatar_url: avatarUrl, phone, job_title: jobTitle, bio, is_active: isActive },
            },
          });
        }
        toast.success('Usuário criado');
      } else {
        // update
        const { data, error } = await supabase.functions.invoke('admin-users', {
          body: {
            action: 'update-user',
            user_id: user!.id,
            profile: { name, phone, job_title: jobTitle, bio, avatar_url: avatarUrl, is_active: isActive },
          },
        });
        if (error || data?.error) throw new Error(data?.error ?? error?.message);

        if (role !== user!.role) {
          const r = await supabase.functions.invoke('admin-users', {
            body: { action: 'set-role', user_id: user!.id, role },
          });
          if (r.error || r.data?.error) throw new Error(r.data?.error ?? r.error?.message);
        }
        toast.success('Usuário atualizado');
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // Para upload no momento de CRIAR (sem userId), bloqueamos avatar até salvar
  const tempUserId = user?.id ?? '__pending__';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Novo usuário' : 'Editar usuário'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isCreate && (
            <AvatarUploader
              userId={tempUserId}
              currentUrl={avatarUrl}
              name={name || email}
              onUploaded={(url) => setAvatarUrl(url || null)}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isCreate}
                placeholder="email@exemplo.com"
              />
            </div>
            {isCreate && (
              <div className="col-span-2">
                <Label>Senha inicial</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>Cargo</Label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex.: Vendedor" />
            </div>
            <div className="col-span-2">
              <Label>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="Sobre o usuário..." />
            </div>
            <div>
              <Label>Papel</Label>
              <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isCreate && (
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <Label className="m-0">Ativo</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : isCreate ? 'Criar usuário' : 'Salvar alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
