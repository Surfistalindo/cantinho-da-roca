import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AvatarUploader from '@/components/admin/users/AvatarUploader';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile, refresh, loading } = useProfile();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // popular ao carregar
  if (profile && !loading && name === '' && phone === '' && bio === '' && jobTitle === '' && avatarUrl === null) {
    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
    setBio(profile.bio ?? '');
    setJobTitle(profile.job_title ?? '');
    setAvatarUrl(profile.avatar_url ?? null);
  }

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name, phone, bio, job_title: jobTitle, avatar_url: avatarUrl })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Perfil atualizado');
    refresh();
  };

  const handleChangePassword = async () => {
    if (password.length < 6) {
      toast.error('Mínimo 6 caracteres');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Senha alterada');
    setPassword('');
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-8 font-crm">
      <section className="space-y-4">
        <header>
          <h2 className="text-base font-semibold">Foto e dados pessoais</h2>
          <p className="text-xs text-muted-foreground">Estas informações aparecem no painel.</p>
        </header>

        {user && (
          <AvatarUploader
            userId={user.id}
            currentUrl={avatarUrl}
            name={name || user.email}
            onUploaded={(url) => setAvatarUrl(url || null)}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Bio</Label>
            <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ''} disabled />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar perfil'}
          </Button>
        </div>
      </section>

      <hr className="border-border" />

      <section className="space-y-4">
        <header>
          <h2 className="text-base font-semibold">Trocar senha</h2>
          <p className="text-xs text-muted-foreground">Defina uma nova senha de acesso.</p>
        </header>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Nova senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleChangePassword} disabled={saving || password.length < 6}>
            Trocar senha
          </Button>
        </div>
      </section>
    </div>
  );
}
