import { Leaf, Flame, Cookie, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef, useState, useCallback } from 'react';
import { Warp } from '@paper-design/shaders-react';
import LeafSVG from './LeafSVG';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Oi! Quero saber mais sobre os produtos naturais 🌿')}`;

const products = [
  {
    icon: Leaf,
    title: 'Chás Naturais',
    description: 'Chás funcionais para emagrecer, desinflamar, relaxar e melhorar a digestão. Tudo 100% natural.',
    badge: 'Mais vendido',
    gradient: 'linear-gradient(135deg, hsl(145, 65%, 85%), hsl(160, 75%, 78%))',
    hoverGradient: 'linear-gradient(135deg, hsl(145, 65%, 20%), hsl(170, 55%, 52%))',
  },
  {
    icon: Flame,
    title: 'Temperos & Especiarias',
    description: 'Temperos frescos e selecionados pra dar sabor e saúde às suas refeições do dia a dia.',
    badge: '100% Natural',
    gradient: 'linear-gradient(135deg, hsl(15, 70%, 88%), hsl(30, 85%, 82%))',
    hoverGradient: 'linear-gradient(135deg, hsl(15, 70%, 28%), hsl(40, 80%, 58%))',
  },
  {
    icon: Cookie,
    title: 'Produtos Artesanais',
    description: 'Farinhas, grãos, mel e outros itens naturais produzidos com cuidado e sem aditivos.',
    badge: 'Artesanal',
    gradient: 'linear-gradient(135deg, hsl(35, 70%, 88%), hsl(45, 90%, 82%))',
    hoverGradient: 'linear-gradient(135deg, hsl(35, 70%, 25%), hsl(50, 80%, 60%))',
  },
];

function ProductCard({ p, index, isVisible }: { p: typeof products[0]; index: number; isVisible: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl overflow-hidden border border-border/30 cursor-pointer"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? `translateZ(0) scale(1) ${index === 1 ? 'translateY(-16px)' : ''}`
          : `scale(0.8) translateZ(-50px) rotateY(${index === 0 ? '-10' : index === 2 ? '10' : '0'}deg)`,
        transition: `opacity 0.6s ease ${index * 0.2}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.2}s, box-shadow 0.3s ease`,
        transformOrigin: 'center center',
        boxShadow: isHovered
          ? '0 30px 60px -15px rgba(0,0,0,0.2), 0 0 0 1px rgba(34,102,51,0.08)'
          : '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}
    >
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: isHovered ? p.hoverGradient : p.gradient,
          opacity: isHovered ? 0.6 : 0.4,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isHovered
            ? 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.2) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.5) 100%)',
        }}
      />
      <span className="absolute top-4 right-4 z-10 text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-3 py-1 rounded-full backdrop-blur-sm">
        {p.badge}
      </span>
      <div className="relative p-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-all duration-500"
          style={{
            background: isHovered ? 'hsl(125, 47%, 33%)' : 'hsl(120, 30%, 93%)',
            color: isHovered ? '#fff' : 'hsl(125, 47%, 33%)',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          }}
        >
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
    <section id="produtos" className="py-24 bg-card relative overflow-hidden">
      {/* Warp shader background */}
      <div className="absolute inset-0 z-0 opacity-10">
        <Warp speed={0.3} scale={0.7} colors={['#d4a373', '#e9c46a', '#f4e8c1']} />
      </div>

      {/* Scattered decorative leaves */}
      <div className="absolute top-16 left-6 pointer-events-none animate-leaf-float opacity-15 z-[1]" style={{ animationDelay: '2s' }}>
        <LeafSVG size={20} id="prod1" style={{ transform: 'rotate(55deg)' }} />
      </div>
      <div className="absolute bottom-20 right-10 pointer-events-none animate-leaf-float opacity-20 z-[1]" style={{ animationDelay: '0.5s' }}>
        <LeafSVG size={16} id="prod2" style={{ transform: 'rotate(-25deg)' }} />
      </div>

      <div className="section-container relative z-10">
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
        <div ref={ref} className="grid md:grid-cols-3 gap-6 mb-14" style={{ perspective: '1200px' }}>
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
