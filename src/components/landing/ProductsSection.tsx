import { Leaf, Flame, Cookie, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef, useState, useCallback } from 'react';

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

function ProductCard({ p, index, isVisible }: { p: typeof products[0]; index: number; isVisible: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    card.style.setProperty('--mouse-x', `${x * 100}%`);
    card.style.setProperty('--mouse-y', `${y * 100}%`);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative rounded-2xl p-8 border border-border/40 bg-background transition-shadow duration-300 ${
        index === 1 ? 'md:-translate-y-4' : ''
      }`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? `translateZ(0) scale(1) ${index === 1 ? 'translateY(-16px)' : ''}`
          : `translateZ(100px) scale(0.85)`,
        transition: `opacity 0.6s ease ${index * 0.2}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.2}s, box-shadow 0.3s ease`,
        boxShadow: hover
          ? '0 25px 50px -12px rgba(34,102,51,0.15), 0 0 0 1px rgba(34,102,51,0.05)'
          : '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}
    >
      {/* Spotlight effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(34,102,51,0.08) 0%, transparent 60%)',
        }}
      />
      <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full">
        {p.badge}
      </span>
      <div className="relative">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          <p.icon className="w-8 h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-serif mb-3">{p.title}</h3>
        <p className="text-muted-foreground leading-relaxed">{p.description}</p>
      </div>
    </div>
  );
}

export default function ProductsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="produtos" className="py-24 bg-card">
      <div className="section-container">
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <p className="text-primary text-sm font-semibold tracking-widest uppercase text-center mb-3">
            Nossos produtos
          </p>
          <h2 className="text-3xl sm:text-5xl font-serif text-center mb-4 text-foreground">
            Conheça nossos produtos
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
            Tudo pensado pra quem quer viver melhor de forma simples e natural.
          </p>
        </div>
        <div ref={ref} className="grid md:grid-cols-3 gap-6 mb-14">
          {products.map((p, i) => (
            <ProductCard key={p.title} p={p} index={i} isVisible={isVisible} />
          ))}
        </div>
        <div
          className="text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease 0.6s',
          }}
        >
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
