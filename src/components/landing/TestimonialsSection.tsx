import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Maria Aparecida',
    text: 'Comecei a tomar o chá e já senti diferença na primeira semana! Menos inchaço e mais disposição. Amei! 💚',
  },
  {
    name: 'Carlos Eduardo',
    text: 'Os temperos são incríveis. Dá pra sentir que é natural de verdade. Minha família toda já virou cliente!',
  },
  {
    name: 'Ana Paula',
    text: 'Atendimento maravilhoso, sempre me orientam direitinho. Já emagreci 4kg em um mês com os produtos. Super recomendo!',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-accent">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            O que nossos clientes dizem
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Mais de <strong className="text-foreground">500 clientes</strong> já cuidam da saúde com a gente.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name} className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6 flex flex-col gap-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-highlight text-highlight" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed">
                  "{t.text}"
                </p>
                <div className="mt-auto pt-4 border-t border-border/40">
                  <p className="font-semibold text-foreground">{t.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
