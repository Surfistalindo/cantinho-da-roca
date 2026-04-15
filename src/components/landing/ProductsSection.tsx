import { Leaf, Flame, Cookie, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Oi! Quero saber mais sobre os produtos naturais 🌿')}`;

const products = [
  {
    icon: Leaf,
    title: 'Chás Naturais',
    description: 'Chás funcionais para emagrecer, desinflamar, relaxar e melhorar a digestão. Tudo 100% natural.',
  },
  {
    icon: Flame,
    title: 'Temperos & Especiarias',
    description: 'Temperos frescos e selecionados pra dar sabor e saúde às suas refeições do dia a dia.',
  },
  {
    icon: Cookie,
    title: 'Produtos Artesanais',
    description: 'Farinhas, grãos, mel e outros itens naturais produzidos com cuidado e sem aditivos.',
  },
];

export default function ProductsSection() {
  return (
    <section id="produtos" className="py-20">
      <div className="section-container">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Conheça nossos produtos
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Tudo pensado pra quem quer viver melhor de forma simples e natural.
        </p>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {products.map((p) => (
            <div
              key={p.title}
              className="bg-card rounded-xl p-8 text-center border border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent text-primary mb-5">
                <p.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="lg" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp sobre produtos
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
