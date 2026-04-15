import { Leaf, Flame, Cookie, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Oi! Quero saber mais sobre os produtos naturais 🌿')}`;

const products = [
  {
    icon: Leaf,
    title: 'Chás Naturais',
    description: 'Chás funcionais para emagrecer, desinflamar, relaxar e melhorar a digestão. Tudo 100% natural.',
    badge: 'Mais vendido',
  },
  {
    icon: Flame,
    title: 'Temperos & Especiarias',
    description: 'Temperos frescos e selecionados pra dar sabor e saúde às suas refeições do dia a dia.',
    badge: '100% Natural',
  },
  {
    icon: Cookie,
    title: 'Produtos Artesanais',
    description: 'Farinhas, grãos, mel e outros itens naturais produzidos com cuidado e sem aditivos.',
    badge: 'Artesanal',
  },
];

export default function ProductsSection() {
  return (
    <section id="produtos" className="py-24 bg-card">
      <div className="section-container">
        <p className="text-primary text-sm font-semibold tracking-widest uppercase text-center mb-3">
          Nossos produtos
        </p>
        <h2 className="text-3xl sm:text-5xl font-serif text-center mb-4 text-foreground">
          Conheça nossos produtos
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
          Tudo pensado pra quem quer viver melhor de forma simples e natural.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {products.map((p, i) => (
            <div
              key={p.title}
              className={`group relative rounded-2xl p-8 border border-border/40 bg-background hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 ${
                i === 1 ? 'md:-translate-y-4' : ''
              }`}
            >
              {/* Badge */}
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">
                {p.badge}
              </span>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <p.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-serif mb-3">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="lg" className="gap-2 shadow-lg shadow-green-600/20 animate-pulse hover:animate-none">
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp sobre produtos
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
