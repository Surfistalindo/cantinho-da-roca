import { useState } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Warp } from '@paper-design/shaders-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartPulse, faCertificate, faSeedling, faTruckFast } from '@fortawesome/free-solid-svg-icons';
import LeafSVG from './LeafSVG';

const benefits = [
  {
    title: 'Cuide da sua saúde',
    description: 'Produtos naturais que ajudam no emagrecimento, digestão e disposição no dia a dia.',
    icon: faHeartPulse,
    fallbackGradient: 'from-green-800 via-green-700 to-emerald-600',
    shaderConfig: {
      proportion: 0.35,
      softness: 0.9,
      distortion: 0.18,
      swirl: 0.7,
      swirlIterations: 10,
      shape: 'checks' as const,
      shapeScale: 0.1,
      colors: ['hsl(120, 40%, 20%)', 'hsl(140, 50%, 35%)', 'hsl(100, 35%, 25%)', 'hsl(130, 45%, 40%)'],
    },
  },
  {
    title: 'Qualidade garantida',
    description: 'Selecionamos cada produto com cuidado. Sem química, sem conservantes artificiais.',
    icon: faCertificate,
    fallbackGradient: 'from-amber-900 via-amber-800 to-yellow-700',
    shaderConfig: {
      proportion: 0.45,
      softness: 1.1,
      distortion: 0.22,
      swirl: 0.8,
      swirlIterations: 15,
      shape: 'stripes' as const,
      shapeScale: 0.09,
      colors: ['hsl(30, 60%, 25%)', 'hsl(40, 70%, 40%)', 'hsl(35, 55%, 30%)', 'hsl(45, 65%, 45%)'],
    },
  },
  {
    title: 'Resultados reais',
    description: 'Nossos clientes relatam mais energia, menos inchaço e melhora no bem-estar geral.',
    icon: faSeedling,
    fallbackGradient: 'from-emerald-900 via-emerald-800 to-green-700',
    shaderConfig: {
      proportion: 0.3,
      softness: 0.8,
      distortion: 0.15,
      swirl: 0.6,
      swirlIterations: 8,
      shape: 'checks' as const,
      shapeScale: 0.08,
      colors: ['hsl(150, 40%, 20%)', 'hsl(140, 50%, 30%)', 'hsl(160, 35%, 25%)', 'hsl(145, 45%, 35%)'],
    },
  },
  {
    title: 'Entrega rápida',
    description: 'Enviamos para todo o Brasil com agilidade e cuidado. Seu pedido chega fresquinho.',
    icon: faTruckFast,
    fallbackGradient: 'from-stone-800 via-stone-700 to-amber-800',
    shaderConfig: {
      proportion: 0.42,
      softness: 1.0,
      distortion: 0.19,
      swirl: 0.75,
      swirlIterations: 9,
      shape: 'edge' as const,
      shapeScale: 0.13,
      colors: ['hsl(25, 50%, 25%)', 'hsl(35, 60%, 35%)', 'hsl(30, 45%, 30%)', 'hsl(20, 55%, 40%)'],
    },
  },
];

function BenefitCard({ b, index, isVisible }: { b: typeof benefits[0]; index: number; isVisible: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 min-h-[220px] sm:min-h-[280px]`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s, box-shadow 0.4s ease`,
      }}
    >
      {/* CSS gradient fallback */}
      <div className={`absolute inset-0 z-0 bg-gradient-to-br ${b.fallbackGradient}`} />

      {/* Shader layer — speed increases on hover */}
      <div className="absolute inset-0 z-[1]" style={{ width: '100%', height: '100%' }}>
        <Warp
          speed={hovered ? 0.8 : 0.15}
          scale={hovered ? 0.6 : 0.4}
          {...b.shaderConfig}
          distortion={hovered ? (b.shaderConfig.distortion ?? 0.18) * 2.5 : b.shaderConfig.distortion}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-[2] bg-black/30 group-hover:bg-black/40 transition-colors duration-500" />

      {/* Content */}
      <div className="relative z-[3] flex flex-col justify-end h-full p-6 sm:p-8">
        <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl mb-4 bg-white/15 text-white backdrop-blur-sm group-hover:bg-white/25 transition-all duration-500">
          <FontAwesomeIcon icon={b.icon} className="text-xl sm:text-2xl" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold mb-1.5 text-white">{b.title}</h3>
        <p className="text-white/80 text-sm leading-relaxed">{b.description}</p>

        <div className="mt-3 flex items-center gap-2 text-white/70 text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
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
    <section id="beneficios" className="py-16 sm:py-24 relative overflow-hidden" style={{ background: '#f7f5f0' }}>
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
          <h2 className="text-2xl sm:text-5xl font-serif text-center mb-4 text-foreground">
            Por que escolher o Cantim da Roça?
          </h2>
          <p className="text-muted-foreground text-center mb-10 sm:mb-16 max-w-xl mx-auto text-base sm:text-lg">
            Simplicidade, qualidade e resultado. É isso que a gente entrega.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} b={b} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
