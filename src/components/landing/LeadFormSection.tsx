import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '5571999999999';

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

function getUtmParams(): { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null } {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
  };
}

export default function LeadFormSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [origem, setOrigem] = useState('');
  const [interesse, setInteresse] = useState('');
  const [loading, setLoading] = useState(false);
  const [utmParams, setUtmParams] = useState<ReturnType<typeof getUtmParams>>({ utm_source: null, utm_medium: null, utm_campaign: null });

  useEffect(() => {
    setUtmParams(getUtmParams());
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (!isValidPhone(phone)) {
      toast.error('Telefone inválido', { description: 'Informe um número com DDD válido.' });
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const finalOrigem = origem || (utmParams.utm_source ? `utm:${utmParams.utm_source}` : 'direto');

      const { error } = await supabase.from('leads').insert({
        name: name.trim(),
        email: '',
        phone: cleanPhone,
        origem: finalOrigem,
        interesse: interesse.trim() || null,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
      });
      if (error) throw error;

      toast.success('Cadastro realizado!', { description: 'Em breve entraremos em contato.' });
      setName('');
      setPhone('');
      setOrigem('');
      setInteresse('');
    } catch {
      toast.error('Erro ao cadastrar', { description: 'Tente novamente mais tarde.' });
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá, vim pelo site Cantinho da Roça e gostaria de mais informações.')}`;

  return (
    <section id="lead-form" className="py-20">
      <div className="section-container">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3 font-heading">
            Fique por dentro das novidades
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Cadastre-se e receba ofertas exclusivas direto da roça.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={handlePhoneChange}
              required
            />
            <Select value={origem} onValueChange={setOrigem}>
              <SelectTrigger>
                <SelectValue placeholder="Como nos conheceu?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="indicacao">Indicação</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="O que você procura? (opcional)"
              value={interesse}
              onChange={(e) => setInteresse(e.target.value)}
            />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Enviando...' : 'Quero receber novidades'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Ou fale diretamente com a gente:</p>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg" className="gap-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground">
                <MessageCircle className="h-5 w-5" />
                Chamar no WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
