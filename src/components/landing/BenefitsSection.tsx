import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useMouseTilt } from '@/hooks/useMouseTilt';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeartPulse, faCertificate, faSeedling, faTruckFast } from '@fortawesome/free-solid-svg-icons';
import LeafSVG from './LeafSVG';
import imgSaude from '@/assets/benefit-saude.jpg';
import imgQualidade from '@/assets/benefit-qualidade.jpg';
import imgResultados from '@/assets/benefit-resultados.jpg';
import imgEntrega from '@/assets/benefit-entrega.jpg';

const benefits = [
  {
    title: 'Cuide da sua saúde',
    description: 'Produtos naturais que ajudam no emagrecimento, digestão e disposição no dia a dia.',
    icon: faHeartPulse,
    image: imgSaude,
  },
  {
    title: 'Qualidade garantida',
    description: 'Selecionamos cada produto com cuidado. Sem química, sem conservantes artificiais.',
    icon: faCertificate,
    image: imgQualidade,
  },
  {
    title: 'Resultados reais',
    description: 'Nossos clientes relatam mais energia, menos inchaço e melhora no bem-estar geral.',
    icon: faSeedling,
    image: imgResultados,
  },
  {
    title: 'Entrega rápida',
    description: 'Enviamos para todo o Brasil com agilidade e cuidado. Seu pedido chega fresquinho.',
    icon: faTruckFast,
    image: imgEntrega,
  },
];

function BenefitCard({ b, index, isVisible }: { b: typeof benefits[0]; index: number; isVisible: boolean }) {
  const { ref, tilt, onMouseMove, onMouseLeave } = useMouseTilt(15);

  return (
    <div
      ref={ref}
      className="group relative rounded-2xl overflow-hidden min-h-[220px] sm:min-h-[280px]"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        perspective: '800px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s`,
      }}
    >
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) translateZ(0)`,
          transition: tilt.rotateX === 0 ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.1s linear',
          transformStyle: 'preserve-3d',
          boxShadow: tilt.rotateX !== 0
            ? `${-tilt.rotateY * 1.5}px ${tilt.rotateX * 1.5}px 30px rgba(0,0,0,0.3)`
            : '0 4px 15px rgba(0,0,0,0.1)',
          willChange: 'transform',
        }}
      >
        {/* Background image */}
        <img
          src={b.image}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-700"
        />

        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/75 via-black/45 to-black/30 group-hover:from-black/80 transition-colors duration-500" />

        {/* Light reflection that follows mouse */}
        <div
          className="absolute inset-0 z-[3] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${tilt.lightX}% ${tilt.lightY}%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-[4] flex flex-col justify-end h-full p-6 sm:p-8" style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
          <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl mb-4 bg-white/15 text-white backdrop-blur-sm group-hover:bg-white/25 transition-all duration-500">
            <FontAwesomeIcon icon={b.icon} className="text-xl sm:text-2xl" />
          </div>

          <h3 className="text-lg sm:text-xl font-bold mb-1.5 text-white">{b.title}</h3>
          <p className="text-white/80 text-sm leading-relaxed">{b.description}</p>

          <button
            onClick={() => document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' })}
            className="mt-3 flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 cursor-pointer"
          >
            Saiba mais
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BenefitsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.08 });

  return (
    <section id="beneficios" className="py-16 relative overflow-hidden sm:py-0" style={{ background: '#f7f5f0' }}>
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
