import { Heart, ShieldCheck, Sparkles, Truck, Clock, ThumbsUp } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef, useState, useCallback } from 'react';
import { Warp } from '@paper-design/shaders-react';

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
  {
    icon: Truck,
    title: 'Entrega rápida',
    description: 'Enviamos para todo o Brasil com agilidade e cuidado. Seu pedido chega fresquinho.',
  },
  {
    icon: Clock,
    title: 'Atendimento ágil',
    description: 'Respondemos rápido pelo WhatsApp. Tire dúvidas e faça pedidos a qualquer hora.',
  },
  {
    icon: ThumbsUp,
    title: 'Satisfação total',
    description: 'Mais de 500 clientes satisfeitos. Se não gostar, a gente resolve pra você.',
  },
];

const shaderConfigs = [
  {
    proportion: 0.35,
    softness: 1.0,
    distortion: 0.2,
    swirl: 0.7,
    swirlIterations: 10,
    shape: 'edge' as const,
    shapeScale: 0.06,
    colors: ['hsl(145, 60%, 18%)', 'hsl(160, 70%, 45%)', 'hsl(130, 55%, 35%)', 'hsl(170, 50%, 55%)'],
  },
  {
    proportion: 0.4,
    softness: 1.3,
    distortion: 0.25,
    swirl: 0.85,
    swirlIterations: 14,
    shape: 'stripes' as const,
    shapeScale: 0.1,
    colors: ['hsl(40, 80%, 30%)', 'hsl(45, 96%, 56%)', 'hsl(30, 70%, 45%)', 'hsl(55, 85%, 65%)'],
  },
  {
    proportion: 0.3,
    softness: 0.9,
    distortion: 0.18,
    swirl: 0.65,
    swirlIterations: 9,
    shape: 'checks' as const,
    shapeScale: 0.07,
    colors: ['hsl(125, 50%, 22%)', 'hsl(140, 65%, 50%)', 'hsl(110, 45%, 35%)', 'hsl(150, 55%, 60%)'],
  },
  {
    proportion: 0.38,
    softness: 1.1,
    distortion: 0.22,
    swirl: 0.9,
    swirlIterations: 12,
    shape: 'edge' as const,
    shapeScale: 0.09,
    colors: ['hsl(10, 60%, 30%)', 'hsl(25, 80%, 55%)', 'hsl(15, 65%, 40%)', 'hsl(35, 75%, 60%)'],
  },
  {
    proportion: 0.32,
    softness: 0.85,
    distortion: 0.16,
    swirl: 0.75,
    swirlIterations: 11,
    shape: 'stripes' as const,
    shapeScale: 0.08,
    colors: ['hsl(200, 50%, 25%)', 'hsl(180, 60%, 50%)', 'hsl(190, 45%, 35%)', 'hsl(170, 55%, 55%)'],
  },
  {
    proportion: 0.42,
    softness: 1.2,
    distortion: 0.2,
    swirl: 0.8,
    swirlIterations: 13,
    shape: 'checks' as const,
    shapeScale: 0.11,
    colors: ['hsl(280, 40%, 25%)', 'hsl(300, 50%, 50%)', 'hsl(260, 45%, 35%)', 'hsl(320, 40%, 55%)'],
  },
];

function BenefitCard({ b, index, isVisible }: { b: typeof benefits[0]; index: number; isVisible: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -10, y: x * 10 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const config = shaderConfigs[index % shaderConfigs.length];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="group relative rounded-2xl overflow-hidden border border-border/30 cursor-pointer"
      style={{
        perspective: '800px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0px)`
          : `rotateY(90deg) translateZ(80px)`,
        transition: isHovered
          ? `opacity 0.6s ease ${index * 0.1}s, transform 0.15s ease`
          : `opacity 0.6s ease ${index * 0.1}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? '0 25px 60px -15px rgba(0,0,0,0.2), 0 0 0 1px rgba(34,102,51,0.1)'
          : '0 2px 10px -3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Shader background — fills entire card */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: isHovered ? 0.6 : 0.2 }}
      >
        <Warp
          speed={isHovered ? 0.6 : 0.2}
          {...config}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Gradient overlay for readability */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isHovered
            ? 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.75) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative p-7 sm:p-8 h-full flex flex-col" style={{ transform: 'translateZ(30px)' }}>
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 transition-all duration-500"
          style={{
            background: isHovered
              ? 'hsl(125, 47%, 33%)'
              : 'rgba(34, 102, 51, 0.1)',
            color: isHovered ? '#fff' : 'hsl(125, 47%, 33%)',
            transform: isHovered ? 'scale(1.1) translateZ(10px)' : 'scale(1)',
          }}
        >
          <b.icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg sm:text-xl font-serif mb-2 text-foreground">{b.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed flex-1">{b.description}</p>
        
        {/* Hover arrow indicator */}
        <div
          className="mt-4 flex items-center gap-2 text-primary text-sm font-medium"
          style={{
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? 'translateX(0)' : 'translateX(-10px)',
            transition: 'all 0.3s ease',
          }}
        >
          Saiba mais
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function BenefitsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.08 });

  return (
    <section id="beneficios" className="py-24" style={{ background: '#f7f5f0' }}>
      <div className="section-container">
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <p className="text-primary text-sm font-semibold tracking-widest uppercase text-center mb-3">
            Por que nos escolher
          </p>
          <h2 className="text-3xl sm:text-5xl font-serif text-center mb-4 text-foreground">
            Por que escolher o Cantim da Roça?
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
            Simplicidade, qualidade e resultado. É isso que a gente entrega.
          </p>
        </div>
        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} b={b} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
