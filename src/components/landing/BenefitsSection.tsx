import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Heart,
    title: 'Cuide da sua saúde',
    description: 'Produtos naturais que ajudam no emagrecimento, digestão e disposição no dia a dia.',
  },
  {
    icon: ShieldCheck,
    title: 'Qualidade garantida',
    description: 'Selecionamos cada produto com cuidado. Sem química, sem conservantes artificiais.',
  },
  {
    icon: Sparkles,
    title: 'Resultados reais',
    description: 'Nossos clientes relatam mais energia, menos inchaço e melhora no bem-estar geral.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 bg-accent">
      <div className="section-container">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Por que escolher o Cantim da Roça?
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Simplicidade, qualidade e resultado. É isso que a gente entrega.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-card rounded-xl p-8 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mb-5">
                <b.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{b.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
