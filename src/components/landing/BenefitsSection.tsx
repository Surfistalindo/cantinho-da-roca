import { Leaf, Heart, Truck } from 'lucide-react';

const benefits = [
  {
    icon: Leaf,
    title: 'Natural e Artesanal',
    description: 'Produtos feitos à mão, sem conservantes artificiais, direto da nossa produção.',
  },
  {
    icon: Heart,
    title: 'Feito com Amor',
    description: 'Cada item é preparado com dedicação, seguindo receitas tradicionais da roça.',
  },
  {
    icon: Truck,
    title: 'Entrega Facilitada',
    description: 'Receba na sua casa com praticidade e frescor garantido.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 bg-surface-warm">
      <div className="section-container">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Por que escolher o Cantinho da Roça?
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Qualidade, tradição e sabor em cada detalhe.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-card rounded-lg p-8 text-center shadow-sm hover:shadow-md transition-shadow"
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
