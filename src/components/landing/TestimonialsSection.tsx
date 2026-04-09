import { Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Maria Aparecida',
    location: 'Salvador - BA',
    text: 'Produtos fresquinhos e com gosto de comida de vó. Virei cliente fiel!',
  },
  {
    name: 'Carlos Eduardo',
    location: 'Feira de Santana - BA',
    text: 'A qualidade é incomparável. Desde que conheci o Cantinho da Roça, não compro em outro lugar.',
  },
  {
    name: 'Ana Paula',
    location: 'Lauro de Freitas - BA',
    text: 'Atendimento nota 10 e entrega sempre no prazo. Super recomendo para toda a família.',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="section-container">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3 font-heading">
          O que dizem nossos clientes
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Quem experimenta, não troca mais.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col gap-4">
                <Quote className="h-6 w-6 text-primary/40" />
                <p className="text-foreground/90 leading-relaxed italic">
                  "{t.text}"
                </p>
                <div className="mt-auto pt-4 border-t border-border/40">
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
