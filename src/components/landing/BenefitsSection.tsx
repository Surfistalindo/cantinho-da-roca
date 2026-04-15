import { Heart, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef, useState, useCallback } from 'react';
import { Warp } from '@paper-design/shaders-react';
import LeafSVG from './LeafSVG';

const benefits = [
  {
    icon: Heart,
    title: 'Cuide da sua saúde',
    description: 'Produtos naturais que ajudam no emagrecimento, digestão e disposição no dia a dia.',
    shaderConfig: {
      proportion: 0.35,
      softness: 0.9,
      distortion: 0.18,
      swirl: 0.7,
      swirlIterations: 10,
      shape: 'checks' as const,
      shapeScale: 0.1,
      colors: ['hsl(120, 100%, 25%)', 'hsl(140, 100%, 60%)', 'hsl(100, 90%, 30%)', 'hsl(130, 100%, 70%)'],
    },
  },
  {
    icon: ShieldCheck,
    title: 'Qualidade garantida',
    description: 'Selecionamos cada produto com cuidado. Sem química, sem conservantes artificiais.',
    shaderConfig: {
      proportion: 0.45,
      softness: 1.1,
      distortion: 0.22,
      swirl: 0.8,
      swirlIterations: 15,
      shape: 'dots' as const,
      shapeScale: 0.09,
      colors: ['hsl(30, 100%, 35%)', 'hsl(50, 100%, 65%)', 'hsl(40, 90%, 40%)', 'hsl(45, 100%, 75%)'],
    },
  },
  {
    icon: Sparkles,
    title: 'Resultados reais',
    description: 'Nossos clientes relatam mais energia, menos inchaço e melhora no bem-estar geral.',
    shaderConfig: {
      proportion: 0.3,
      softness: 0.8,
      distortion: 0.15,
      swirl: 0.6,
      swirlIterations: 8,
      shape: 'checks' as const,
      shapeScale: 0.08,
      colors: ['hsl(150, 60%, 25%)', 'hsl(140, 70%, 50%)', 'hsl(160, 50%, 30%)', 'hsl(145, 80%, 60%)'],
    },
  },
  {
    icon: Truck,
    title: 'Entrega rápida',
    description: 'Enviamos para todo o Brasil com agilidade e cuidado. Seu pedido chega fresquinho.',
    shaderConfig: {
      proportion: 0.42,
      softness: 1.0,
      distortion: 0.19,
      swirl: 0.75,
      swirlIterations: 9,
      shape: 'dots' as const,
      shapeScale: 0.13,
      colors: ['hsl(25, 70%, 35%)', 'hsl(40, 80%, 55%)', 'hsl(35, 60%, 40%)', 'hsl(30, 90%, 65%)'],
    },
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
          : `rotateX(15deg) translateY(60px) scale(0.9)`,
        transition: isHovered
          ? `opacity 0.6s ease ${index * 0.1}s, transform 0.15s ease`
          : `opacity 0.6s ease ${index * 0.1}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? '0 25px 60px -15px rgba(0,0,0,0.2), 0 0 0 1px rgba(34,102,51,0.1)'
          : '0 2px 10px -3px rgba(0,0,0,0.08)',
      }}
    >
      <div className="absolute inset-0 z-0" style={{ opacity: isHovered ? 0.35 : 0.2 }}>
        <Warp speed={0.2} scale={0.5} {...b.shaderConfig} />
      </div>
      <div
        className="absolute inset-0 z-[1] transition-opacity duration-500"
        style={{
          background: isHovered
            ? 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)',
        }}
      />
      <div className="relative z-[2] p-7 sm:p-8 h-full flex flex-col" style={{ transform: 'translateZ(30px)' }}>
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5 transition-all duration-500"
          style={{
            background: isHovered ? 'hsl(125, 47%, 33%)' : 'rgba(34, 102, 51, 0.1)',
            color: isHovered ? '#fff' : 'hsl(125, 47%, 33%)',
            transform: isHovered ? 'scale(1.1) translateZ(10px)' : 'scale(1)',
          }}
        >
          <b.icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg sm:text-xl font-serif mb-2 text-foreground">{b.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed flex-1">{b.description}</p>
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
    <section id="beneficios" className="py-24 relative overflow-hidden" style={{ background: '#f7f5f0' }}>
      {/* Scattered decorative leaves */}
      <div className="absolute top-8 right-10 pointer-events-none animate-leaf-float opacity-20 z-[1]" style={{ animationDelay: '1s' }}>
        <LeafSVG size={22} id="ben1" style={{ transform: 'rotate(-30deg)' }} />
      </div>
      <div className="absolute bottom-12 left-8 pointer-events-none animate-leaf-float opacity-15 z-[1]" style={{ animationDelay: '3.5s' }}>
        <LeafSVG size={18} id="ben2" style={{ transform: 'rotate(40deg)' }} />
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
            Por que nos escolher
          </p>
          <h2 className="text-3xl sm:text-5xl font-serif text-center mb-4 text-foreground">
            Por que escolher o Cantim da Roça?
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-lg">
            Simplicidade, qualidade e resultado. É isso que a gente entrega.
          </p>
        </div>
        <div ref={ref} className="grid sm:grid-cols-2 gap-5" style={{ perspective: '1200px' }}>
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} b={b} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
