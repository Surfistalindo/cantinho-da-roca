import { Heart, ShieldCheck, Sparkles, Truck, Clock, ThumbsUp } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef, useState, useCallback } from 'react';
import { Warp } from '@paper-design/shaders-react';

const benefits = [
  {
    icon: Heart,
    title: 'Cuide da sua saúde',
    description: 'Produtos naturais que ajudam no emagrecimento, digestão e disposição no dia a dia.',
    gradient: 'linear-gradient(135deg, hsl(145, 60%, 88%), hsl(160, 70%, 82%))',
    hoverGradient: 'linear-gradient(135deg, hsl(145, 65%, 20%), hsl(160, 75%, 42%))',
  },
  {
    icon: ShieldCheck,
    title: 'Qualidade garantida',
    description: 'Selecionamos cada produto com cuidado. Sem química, sem conservantes artificiais.',
    gradient: 'linear-gradient(135deg, hsl(40, 80%, 90%), hsl(45, 96%, 85%))',
    hoverGradient: 'linear-gradient(135deg, hsl(40, 80%, 30%), hsl(45, 96%, 56%))',
  },
  {
    icon: Sparkles,
    title: 'Resultados reais',
    description: 'Nossos clientes relatam mais energia, menos inchaço e melhora no bem-estar geral.',
    gradient: 'linear-gradient(135deg, hsl(125, 50%, 88%), hsl(140, 65%, 83%))',
    hoverGradient: 'linear-gradient(135deg, hsl(125, 50%, 22%), hsl(140, 65%, 50%))',
  },
  {
    icon: Truck,
    title: 'Entrega rápida',
    description: 'Enviamos para todo o Brasil com agilidade e cuidado. Seu pedido chega fresquinho.',
    gradient: 'linear-gradient(135deg, hsl(10, 60%, 90%), hsl(25, 80%, 85%))',
    hoverGradient: 'linear-gradient(135deg, hsl(10, 60%, 30%), hsl(25, 80%, 55%))',
  },
  {
    icon: Clock,
    title: 'Atendimento ágil',
    description: 'Respondemos rápido pelo WhatsApp. Tire dúvidas e faça pedidos a qualquer hora.',
    gradient: 'linear-gradient(135deg, hsl(200, 50%, 88%), hsl(180, 60%, 83%))',
    hoverGradient: 'linear-gradient(135deg, hsl(200, 50%, 25%), hsl(180, 60%, 50%))',
  },
  {
    icon: ThumbsUp,
    title: 'Satisfação total',
    description: 'Mais de 500 clientes satisfeitos. Se não gostar, a gente resolve pra você.',
    gradient: 'linear-gradient(135deg, hsl(280, 40%, 90%), hsl(300, 50%, 85%))',
    hoverGradient: 'linear-gradient(135deg, hsl(280, 40%, 25%), hsl(300, 50%, 50%))',
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
      {/* CSS gradient background */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: isHovered ? b.hoverGradient : b.gradient,
          opacity: isHovered ? 0.6 : 0.4,
        }}
      />

      {/* Gradient overlay for readability */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isHovered
            ? 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.15) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.45) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative p-7 sm:p-8 h-full flex flex-col" style={{ transform: 'translateZ(30px)' }}>
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
    <section id="beneficios" className="py-24 relative overflow-hidden" style={{ background: '#f7f5f0' }}>
      {/* Warp shader background */}
      <div className="absolute inset-0 z-0 opacity-15">
        <Warp
          speed={0.3}
          scale={0.6}
          colors={['#95d5b2', '#b7e4c7', '#d8f3dc']}
        />
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
        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" style={{ perspective: '1200px' }}>
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} b={b} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
