import { useState } from 'react';
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
import { APP_CONFIG } from '@/config/app';

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

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Vim pelo site e quero saber mais sobre os produtos naturais 🌿')}`;

export default function LeadFormSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [origin, setOrigin] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [loading, setLoading] = useState(false);

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
      const { error } = await supabase.from('leads').insert({
        name: name.trim(),
        phone: cleanPhone,
        origin: origin || 'direto',
        product_interest: productInterest.trim() || null,
      });
      if (error) throw error;

      toast.success('Cadastro realizado! 🎉', { description: 'Em breve entraremos em contato.' });
      setName('');
      setPhone('');
      setOrigin('');
      setProductInterest('');
    } catch {
      toast.error('Erro ao cadastrar', { description: 'Tente novamente mais tarde.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="lead-form" className="py-20">
      <div className="section-container">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3">
            Fale com a gente agora
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Tire dúvidas, peça recomendações ou faça seu pedido. Estamos aqui pra te ajudar! 💚
          </p>

          <div className="text-center mb-8">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="lg" className="gap-2 w-full sm:w-auto">
                <MessageCircle className="h-5 w-5" />
                Chamar no WhatsApp
              </Button>
            </a>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">ou deixe seus dados</span>
            </div>
          </div>

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
            <Select value={origin} onValueChange={setOrigin}>
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
              value={productInterest}
              onChange={(e) => setProductInterest(e.target.value)}
            />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Enviando...' : 'Quero receber novidades'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
