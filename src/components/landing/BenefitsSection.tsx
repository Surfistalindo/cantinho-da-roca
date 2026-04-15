import { Heart, ShieldCheck, Sparkles } from 'lucide-react';

const benefits = [
  {
    icon: Heart,
    title: 'Cuide da sua saúde',
    description: 'Produtos naturais que ajudam no emagrecimento, digestão e disposição no dia a dia.',
    span: 'md:col-span-2',
  },
  {
    icon: ShieldCheck,
    title: 'Qualidade garantida',
    description: 'Selecionamos cada produto com cuidado. Sem química, sem conservantes artificiais.',
    span: '',
  },
  {
    icon: Sparkles,
    title: 'Resultados reais',
    description: 'Nossos clientes relatam mais energia, menos inchaço e melhora no bem-estar geral.',
    span: 'md:col-span-3',
  },
];

export default function BenefitsSection() {
  return (
    <section id="beneficios" className="py-24" style={{ background: '#f7f5f0' }}>
      <div className="section-container">
        <p className="text-primary text-sm font-semibold tracking-widest uppercase text-center mb-3">
          Por que nos escolher
        </p>
        <h2 className="text-3xl sm:text-5xl font-serif text-center mb-4 text-foreground">
          Por que escolher o Cantim da Roça?
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
          Simplicidade, qualidade e resultado. É isso que a gente entrega.
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {benefits.map((b) => (
            <div
              key={b.title}
              className={`group relative rounded-2xl p-8 sm:p-10 border border-border/40 bg-card/80 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${b.span}`}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <b.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-serif mb-3">{b.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
