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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { APP_CONFIG } from '@/config/app';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

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

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Vim pelo site e quero saber mais sobre os produtos naturais 🌿')}`;

export default function LeadFormSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [origin, setOrigin] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
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

      if (existing && existing.length > 0) {
        toast.info('Você já está cadastrado! 😊', { description: 'Em breve entraremos em contato.' });
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
        description: 'Quer falar agora no WhatsApp?',
        action: {
          label: 'Abrir WhatsApp',
          onClick: () => window.open(whatsappUrl, '_blank'),
        },
        duration: 8000,
      });

      setName('');
      setPhone('');
      setOrigin('');
      setProductInterest('');
      setMessage('');
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
            Contato
          </p>
          <h2 className="text-3xl sm:text-5xl font-serif text-center mb-3 text-foreground">
            Fale com a gente agora
          </h2>
          <p className="text-muted-foreground text-center mb-10 text-lg">
            Tire dúvidas, peça recomendações ou faça seu pedido. Estamos aqui pra te ajudar! 💚
          </p>

          <div className="text-center mb-8">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="lg" className="gap-2 w-full sm:w-auto shadow-lg shadow-green-600/20">
                <FontAwesomeIcon icon={faCommentDots} className="h-5 w-5" />
                Chamar no WhatsApp
              </Button>
            </a>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f7f5f0] px-3 text-muted-foreground">ou deixe seus dados</span>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-xl border border-border/30">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100} className="bg-background/50" />
              <Input type="tel" placeholder="(00) 00000-0000" value={phone} onChange={handlePhoneChange} required className="bg-background/50" />
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Como nos conheceu?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="O que você procura? (opcional)" value={productInterest} onChange={(e) => setProductInterest(e.target.value)} maxLength={200} className="bg-background/50" />
              <Textarea placeholder="Alguma mensagem ou observação? (opcional)" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} className="bg-background/50" />
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Enviando...' : 'Quero receber novidades'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
