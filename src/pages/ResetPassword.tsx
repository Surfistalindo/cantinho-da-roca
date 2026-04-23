import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faLock, faSpinner, faCheck } from '@fortawesome/free-solid-svg-icons';
import LeafSVG from '@/components/landing/LeafSVG';
import logoCantinho from '@/assets/logo-cantinho.png';
import { logger } from '@/lib/logger';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // O Supabase processa o token do hash (#access_token...) automaticamente
    // e dispara onAuthStateChange com event 'PASSWORD_RECOVERY'.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setValidSession(true);
      }
    });
    // Também verifica se já existe sessão ativa (caso o evento já tenha rodado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValidSession(true);
      else if (validSession === null) {
        // Aguarda 1.5s pelo evento; senão considera inválido
        setTimeout(() => setValidSession((prev) => prev ?? false), 1500);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: 'Senha muito curta', description: 'Use pelo menos 8 caracteres.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Senhas diferentes', description: 'A confirmação não confere.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast({ title: 'Senha redefinida!', description: 'Você já pode entrar com a nova senha.' });
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (e) {
      logger.error('resetPassword failed', e);
      toast({
        title: 'Não foi possível redefinir',
        description: 'O link pode ter expirado. Solicite um novo na tela de login.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background flex items-center justify-center p-4">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 800px at 10% 10%, hsl(120 30% 93%) 0%, transparent 60%), radial-gradient(900px 700px at 90% 90%, hsl(45 96% 56% / 0.18) 0%, transparent 55%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/50 bg-card/80 p-8 backdrop-blur-xl shadow-xl">
        <div className="text-center mb-6">
          <img src={logoCantinho} alt="Cantinho da Roça" className="mx-auto h-20 w-auto mb-3" />
          <h1 className="text-xl font-semibold text-foreground">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha uma nova senha para sua conta</p>
        </div>

        {validSession === false && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Link inválido ou expirado. Solicite um novo link de recuperação na tela de login.
            </p>
            <Button asChild className="w-full">
              <Link to="/admin/login">Ir para login</Link>
            </Button>
          </div>
        )}

        {validSession === null && (
          <div className="text-center py-6">
            <FontAwesomeIcon icon={faSpinner} spin className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        {validSession === true && !done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nova senha
              </Label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Confirmar senha
              </Label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12">
              {loading ? <><FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4 mr-2" />Redefinindo…</> : 'Redefinir senha'}
            </Button>
          </form>
        )}

        {done && (
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center">
              <FontAwesomeIcon icon={faCheck} className="h-5 w-5" />
            </div>
            <p className="text-sm text-foreground font-medium">Senha redefinida com sucesso!</p>
            <p className="text-xs text-muted-foreground">Redirecionando para o login…</p>
          </div>
        )}

        <div className="mt-5 text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/login">
              <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-1.5" />
              Voltar ao login
            </Link>
          </Button>
        </div>
      </div>

      <div aria-hidden>
        <LeafSVG id="resetLeaf" size={32} className="absolute top-10 left-10 opacity-20" />
      </div>
    </div>
  );
}
