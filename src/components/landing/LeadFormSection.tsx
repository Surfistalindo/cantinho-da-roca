import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/app';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import logo from '@/assets/logo-cantim.png';
import { ChevronDown } from 'lucide-react';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || digits.length === 11;
}

const RATE_LIMIT_MS = 30_000;

const buildWhatsappUrl = (firstName: string) =>
  `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    `Olá! Acabei de me cadastrar pelo site, sou ${firstName} 🌿`
  )}`;

export default function LeadFormSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [origin, setOrigin] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const lastSubmitRef = useRef<number>(0);

  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error('Nome muito curto', { description: 'Informe pelo menos 2 caracteres.' });
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error('Telefone inválido', { description: 'Informe um número com DDD válido.' });
      return;
    }

    const now = Date.now();
    if (now - lastSubmitRef.current < RATE_LIMIT_MS) {
      toast.error('Aguarde um momento', { description: 'Você já enviou um cadastro recentemente.' });
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');

      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', cleanPhone)
        .limit(1);

      const firstName = trimmedName.split(' ')[0];
      const waUrl = buildWhatsappUrl(firstName);

      if (existing && existing.length > 0) {
        toast.info('Você já está cadastrado! 😊', { description: 'Abrindo o WhatsApp pra continuar a conversa.' });
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('leads').insert({
        name: trimmedName,
        phone: cleanPhone,
        origin: origin || 'direto',
        product_interest: productInterest.trim() || null,
        notes: message.trim() || null,
      });
      if (error) throw error;

      lastSubmitRef.current = now;

      toast.success('Cadastro realizado! 🎉', {
        description: 'Abrindo o WhatsApp pra te dar boas-vindas.',
        duration: 6000,
      });
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setName('');
      setPhone('');
      setOrigin('');
      setProductInterest('');
      setMessage('');
      setShowOptional(false);
    } catch {
      toast.error('Erro ao cadastrar', { description: 'Tente novamente mais tarde.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contato" className="py-24 relative" style={{ background: '#f7f5f0' }}>
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(125 47% 33%) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div ref={ref} className="section-container relative">
        <div
          className="max-w-lg mx-auto"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible
              ? 'scale3d(1, 1, 1) translateY(0)'
              : 'scale3d(0.9, 0.9, 0.9) translateY(40px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <p className="text-primary text-sm font-semibold tracking-widest uppercase text-center mb-3">
            Cadastre-se
          </p>
          <h2 className="text-3xl sm:text-5xl font-serif text-center mb-3 text-foreground">
            Receba ofertas e novidades no WhatsApp
          </h2>
          <p className="text-muted-foreground text-center mb-10 text-lg">
            Deixe seu nome e WhatsApp pra receber dicas, lançamentos e promoções dos nossos produtos naturais. <img src={logo} alt="" className="inline h-5 w-5 align-text-bottom" />
          </p>

          {/* Form card with floating animation + glow border */}
          <div
            className="relative rounded-2xl"
            style={{
              animation: 'float 6s ease-in-out infinite',
            }}
          >
            {/* Pulsing glow border */}
            <div
              className="absolute -inset-[1px] rounded-2xl opacity-60"
              style={{
                background: 'linear-gradient(135deg, hsl(125 47% 33% / 0.3), hsl(45 96% 56% / 0.2), hsl(125 47% 33% / 0.3))',
                animation: 'pulse-glow 3s ease-in-out infinite',
                filter: 'blur(4px)',
              }}
            />
            <div className="relative bg-card rounded-2xl p-6 sm:p-8 shadow-xl border border-border/30">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} className="bg-background/50" />
                <Input type="tel" placeholder="(00) 00000-0000" value={phone} onChange={handlePhoneChange} required className="bg-background/50" />

                <button
                  type="button"
                  onClick={() => setShowOptional((v) => !v)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showOptional ? 'rotate-180' : ''}`} />
                  {showOptional ? 'Ocultar detalhes' : 'Adicionar mais detalhes (opcional)'}
                </button>

                {showOptional && (
                  <div className="space-y-4 pt-1">
                    <Select value={origin} onValueChange={setOrigin}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Como nos conheceu?" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="indicacao">Indicação</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="O que você procura?" value={productInterest} onChange={(e) => setProductInterest(e.target.value)} maxLength={200} className="bg-background/50" />
                    <Textarea placeholder="Alguma mensagem ou observação?" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} className="bg-background/50" />
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? 'Enviando...' : 'Quero receber novidades 🌿'}
                </Button>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Não enviamos spam. Você pode sair quando quiser.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
