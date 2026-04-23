import { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faEye,
  faEyeSlash,
  faSpinner,
  faEnvelope,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import LeafSVG from '@/components/landing/LeafSVG';
import logoCantinho from '@/assets/logo-cantinho.png';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const { signIn, session, loading: authLoading, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!authLoading && session) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const validateEmail = (value: string) => {
    if (!value) return null;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return ok ? null : 'Informe um e-mail válido';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    setLoading(true);
    try {
      await signIn(email, password);
      toast({ title: 'Bem-vindo de volta!', description: 'Login realizado com sucesso.' });
      navigate('/admin/dashboard');
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      toast({
        title: 'Erro ao entrar',
        description: 'Verifique suas credenciais e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast({ title: 'E-mail inválido', variant: 'destructive' });
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSent(true);
    } catch {
      // Mensagem genérica para não vazar quais e-mails existem.
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-background">
      {/* Animated background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Radial gradient base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 800px at 10% 10%, hsl(120 30% 93%) 0%, transparent 60%), radial-gradient(900px 700px at 90% 90%, hsl(45 96% 56% / 0.18) 0%, transparent 55%), radial-gradient(700px 600px at 80% 10%, hsl(123 38% 57% / 0.18) 0%, transparent 60%)',
          }}
        />
        {/* Blobs */}
        <div
          className="motion-safe-anim absolute -left-24 top-10 h-96 w-96 rounded-full bg-primary/25 blur-3xl"
          style={{ animation: 'drift 16s ease-in-out infinite' }}
        />
        <div
          className="motion-safe-anim absolute right-[-6rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-secondary/25 blur-3xl"
          style={{ animation: 'drift 20s ease-in-out infinite reverse' }}
        />
        <div
          className="motion-safe-anim absolute bottom-[-5rem] left-1/3 h-80 w-80 rounded-full bg-highlight/25 blur-3xl"
          style={{ animation: 'drift 24s ease-in-out infinite' }}
        />
        {/* Floating leaves */}
        <LeafSVG
          id="loginLeaf1"
          size={48}
          className="motion-safe-anim absolute left-[8%] top-[18%] opacity-25"
          style={{ animation: 'float 7s ease-in-out infinite', transform: 'rotate(-20deg)' }}
        />
        <LeafSVG
          id="loginLeaf2"
          size={36}
          className="motion-safe-anim absolute right-[12%] bottom-[22%] opacity-20"
          style={{ animation: 'float 9s ease-in-out infinite', transform: 'rotate(25deg)' }}
        />
        <LeafSVG
          id="loginLeaf3"
          size={28}
          className="motion-safe-anim absolute left-[42%] top-[8%] opacity-15 hidden md:block"
          style={{ animation: 'float 11s ease-in-out infinite', transform: 'rotate(10deg)' }}
        />
      </div>

      {/* Layout */}
      <div className="relative z-10 grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
        {/* Side panel (desktop only) */}
        <aside className="hidden md:flex flex-col justify-between p-10 lg:p-14">
          <div className="flex items-center gap-2 text-foreground/80">
            <LeafSVG id="brandLeafSide" size={28} />
            <span className="text-sm font-semibold tracking-wide uppercase">Cantinho da Roça</span>
          </div>

          <div className="max-w-md">
            <p
              className="text-5xl lg:text-6xl leading-tight text-primary"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Do campo<br />para sua mesa.
            </p>
            <p className="mt-6 text-base text-muted-foreground max-w-sm">
              Sistema de gestão da família Cantinho da Roça. Tudo o que você precisa para cuidar dos
              clientes que confiam no nosso trabalho artesanal.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Cantinho da Roça
          </p>
        </aside>

        {/* Login card */}
        <main className="flex items-center justify-center p-4 sm:p-8 md:p-10">
          <div
            className={`w-full max-w-md rounded-2xl border border-white/50 bg-card/70 p-7 sm:p-9 backdrop-blur-xl animate-fade-in ${
              shake ? 'animate-[wiggle_0.45s_ease-in-out]' : ''
            }`}
            style={{
              boxShadow:
                '0 20px 60px -15px hsl(125 47% 33% / 0.25), 0 4px 20px -8px hsl(125 47% 33% / 0.15)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-7">
              <img
                src={logoCantinho}
                alt="Cantinho da Roça"
                className="mx-auto h-24 sm:h-28 w-auto mb-4 motion-safe-anim drop-shadow-[0_8px_24px_hsl(125_47%_33%/0.22)]"
                style={{ animation: 'float 5s ease-in-out infinite' }}
              />
              <p className="text-sm text-muted-foreground">Área administrativa</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  E-mail
                </Label>
                <div
                  className={`relative rounded-md transition-all duration-200 focus-within:-translate-y-px ${
                    emailError
                      ? 'shadow-[0_0_0_4px_hsl(32_95%_50%/0.12)]'
                      : 'focus-within:shadow-[0_0_0_4px_hsl(125_47%_33%/0.10)]'
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(validateEmail(e.target.value));
                    }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    autoComplete="email"
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    className={`pl-10 h-11 bg-background/80 ${
                      emailError ? 'border-warning focus-visible:ring-warning/40' : ''
                    }`}
                  />
                </div>
                {emailError && (
                  <p id="email-error" className="text-xs text-warning pl-1">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs font-medium text-primary hover:underline underline-offset-2"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative rounded-md transition-all duration-200 focus-within:-translate-y-px focus-within:shadow-[0_0_0_4px_hsl(125_47%_33%/0.10)]">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pl-10 pr-11 h-11 bg-background/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <FontAwesomeIcon icon={faEyeSlash} className="h-4 w-4" /> : <FontAwesomeIcon icon={faEye} className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-b from-primary to-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4" />
                    Entrando…
                  </>
                ) : (
                  <>
                    Entrar
                    <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4 mr-1.5" />
                  Voltar para o site
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Forgot password modal — fluxo real de reset por e-mail */}
      <Dialog open={forgotOpen} onOpenChange={(open) => { setForgotOpen(open); if (!open) { setForgotSent(false); setForgotEmail(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Informe seu e-mail e enviaremos um link para você criar uma nova senha.
            </DialogDescription>
          </DialogHeader>

          {!forgotSent ? (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? <><FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4 mr-2" />Enviando…</> : 'Enviar link'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/60 p-4 text-sm text-foreground">
                Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha em alguns instantes. Verifique também a caixa de spam.
              </div>
              <DialogFooter>
                <Button onClick={() => setForgotOpen(false)} className="w-full">Entendi</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
