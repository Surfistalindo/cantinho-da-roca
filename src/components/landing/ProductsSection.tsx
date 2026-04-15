import { Leaf, Flame, Cookie, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef, useState, useCallback } from 'react';
import { Warp } from '@paper-design/shaders-react';

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

const productShaderConfigs = [
  {
    proportion: 0.3,
    softness: 0.9,
    distortion: 0.15,
    swirl: 0.6,
    swirlIterations: 10,
    shape: 'edge' as const,
    shapeScale: 0.07,
    colors: ['hsl(145, 65%, 20%)', 'hsl(160, 75%, 42%)', 'hsl(130, 60%, 30%)', 'hsl(170, 55%, 52%)'],
  },
  {
    proportion: 0.38,
    softness: 1.1,
    distortion: 0.2,
    swirl: 0.8,
    swirlIterations: 12,
    shape: 'stripes' as const,
    shapeScale: 0.09,
    colors: ['hsl(15, 70%, 28%)', 'hsl(30, 85%, 52%)', 'hsl(20, 75%, 38%)', 'hsl(40, 80%, 58%)'],
  },
  {
    proportion: 0.35,
    softness: 1.0,
    distortion: 0.18,
    swirl: 0.7,
    swirlIterations: 11,
    shape: 'checks' as const,
    shapeScale: 0.08,
    colors: ['hsl(35, 70%, 25%)', 'hsl(45, 90%, 55%)', 'hsl(40, 65%, 35%)', 'hsl(50, 80%, 60%)'],
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

  const config = productShaderConfigs[index % productShaderConfigs.length];

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
          : `translateZ(100px) scale(0.85)`,
        transition: `opacity 0.6s ease ${index * 0.2}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.2}s, box-shadow 0.3s ease`,
        boxShadow: isHovered
          ? '0 30px 60px -15px rgba(0,0,0,0.2), 0 0 0 1px rgba(34,102,51,0.08)'
          : '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}
    >
      {/* Shader background */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: isHovered ? 0.55 : 0.15 }}
      >
        <Warp
          speed={isHovered ? 0.5 : 0.15}
          {...config}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isHovered
            ? 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.35) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.8) 100%)',
        }}
      />

      {/* Badge */}
      <span className="absolute top-4 right-4 z-10 text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-3 py-1 rounded-full backdrop-blur-sm">
        {p.badge}
      </span>

      {/* Content */}
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
