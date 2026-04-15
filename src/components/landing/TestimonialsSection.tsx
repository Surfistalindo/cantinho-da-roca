import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Maria Aparecida',
    initials: 'MA',
    color: 'bg-primary/20 text-primary',
    text: 'Comecei a tomar o chá e já senti diferença na primeira semana! Menos inchaço e mais disposição. Amei! 💚',
  },
  {
    name: 'Carlos Eduardo',
    initials: 'CE',
    color: 'bg-highlight/20 text-highlight-foreground',
    text: 'Os temperos são incríveis. Dá pra sentir que é natural de verdade. Minha família toda já virou cliente!',
  },
  {
    name: 'Ana Paula',
    initials: 'AP',
    color: 'bg-secondary/20 text-secondary',
    text: 'Atendimento maravilhoso, sempre me orientam direitinho. Já emagreci 4kg em um mês com os produtos. Super recomendo!',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-24" style={{ background: '#eef5ee' }}>
      <div className="section-container">
        <p className="text-primary text-sm font-semibold tracking-widest uppercase text-center mb-3">
          Depoimentos
        </p>
        <h2 className="text-3xl sm:text-5xl font-serif text-center mb-3 text-foreground">
          O que nossos clientes dizem
        </h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16 text-lg">
          Mais de <strong className="text-foreground">500 clientes</strong> já cuidam da saúde com a gente.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative rounded-2xl p-8 bg-card border border-border/30 hover:shadow-lg transition-all duration-300"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-highlight text-highlight" />
                ))}
              </div>
              <p className="text-foreground/90 leading-relaxed mb-6 text-[15px]">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3 pt-5 border-t border-border/30">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${t.color}`}>
                  {t.initials}
                </div>
                <p className="font-semibold text-foreground">{t.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
