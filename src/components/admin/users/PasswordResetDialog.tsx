import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  email: string | null;
}

export default function PasswordResetDialog({ open, onOpenChange, userId, email }: Props) {
  const [mode, setMode] = useState<'new' | 'email'>('new');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'new') {
        if (password.length < 6) {
          toast.error('Mínimo 6 caracteres');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke('admin-users', {
          body: { action: 'update-password', user_id: userId, password },
        });
        if (error || data?.error) throw new Error(data?.error ?? error?.message);
        toast.success('Senha atualizada');
      } else {
        if (!email) {
          toast.error('Usuário sem email');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.functions.invoke('admin-users', {
          body: { action: 'send-password-reset', email, redirect_to: `${window.location.origin}/reset-password` },
        });
        if (error || data?.error) throw new Error(data?.error ?? error?.message);
        toast.success('Email de recuperação enviado');
      }
      setPassword('');
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trocar senha</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('new')}
              className="flex-1"
            >
              Definir nova senha
            </Button>
            <Button
              type="button"
              variant={mode === 'email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('email')}
              className="flex-1"
            >
              Enviar email de reset
            </Button>
          </div>

          {mode === 'new' ? (
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                A nova senha será aplicada imediatamente. Avise o usuário.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Um email será enviado para <strong className="text-foreground">{email}</strong> com um link para
              redefinir a senha.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Enviando...' : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
