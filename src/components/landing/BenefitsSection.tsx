import { Heart, ShieldCheck, Sparkles } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useRef, useState, useCallback } from 'react';
import { Warp } from '@paper-design/shaders-react';

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

const shaderConfigs = [
  {
    proportion: 0.3,
    softness: 0.8,
    distortion: 0.15,
    swirl: 0.6,
    swirlIterations: 8,
    shape: 'checks' as const,
    shapeScale: 0.08,
    colors: ['hsl(125, 47%, 25%)', 'hsl(140, 60%, 55%)', 'hsl(100, 40%, 30%)', 'hsl(130, 50%, 65%)'],
  },
  {
    proportion: 0.4,
    softness: 1.2,
    distortion: 0.2,
    swirl: 0.9,
    swirlIterations: 12,
    shape: 'dots' as const,
    shapeScale: 0.12,
    colors: ['hsl(120, 50%, 20%)', 'hsl(45, 96%, 56%)', 'hsl(35, 80%, 40%)', 'hsl(50, 90%, 65%)'],
  },
  {
    proportion: 0.35,
    softness: 0.9,
    distortion: 0.18,
    swirl: 0.7,
    swirlIterations: 10,
    shape: 'checks' as const,
    shapeScale: 0.1,
    colors: ['hsl(125, 47%, 33%)', 'hsl(123, 38%, 57%)', 'hsl(140, 50%, 40%)', 'hsl(100, 45%, 60%)'],
  },
];

function BenefitCard({ b, index, isVisible }: { b: typeof benefits[0]; index: number; isVisible: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const config = shaderConfigs[index % shaderConfigs.length];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative rounded-2xl overflow-hidden border border-border/40 hover:shadow-xl transition-shadow duration-300 ${b.span}`}
      style={{
        perspective: '800px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? `rotateY(0deg) translateZ(0px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
          : `rotateY(90deg) translateZ(80px)`,
        transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Shader background */}
      <div className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
        <Warp
          speed={0.3}
          {...config}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Card content */}
      <div className="relative p-8 sm:p-10 bg-card/70 backdrop-blur-sm h-full" style={{ transform: 'translateZ(20px)' }}>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
          <b.icon className="w-7 h-7" />
        </div>
        <h3 className="text-xl sm:text-2xl font-serif mb-3">{b.title}</h3>
        <p className="text-muted-foreground leading-relaxed">{b.description}</p>
      </div>
    </div>
  );
}

export default function BenefitsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

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
        <div ref={ref} className="grid md:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} b={b} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
