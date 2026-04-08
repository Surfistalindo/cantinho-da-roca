import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function LeadFormSection() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('leads').insert({ name, email, phone: phone || null });
      if (error) throw error;

      toast({ title: 'Cadastro realizado!', description: 'Em breve entraremos em contato.' });
      setName('');
      setEmail('');
      setPhone('');
    } catch {
      toast({ title: 'Erro ao cadastrar', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="lead-form" className="py-20">
      <div className="section-container">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
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
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="tel"
              placeholder="WhatsApp (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Enviando...' : 'Cadastrar'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
