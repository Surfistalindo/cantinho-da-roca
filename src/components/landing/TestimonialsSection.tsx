import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useMouseTilt } from '@/hooks/useMouseTilt';
import { Warp } from '@paper-design/shaders-react';
import LeafSVG from './LeafSVG';

const testimonials = [
  {
    name: 'Maria Aparecida',
    initials: 'MA',
    color: 'bg-primary/20 text-primary',
    text: 'Comecei a tomar o chá e já senti diferença na primeira semana! Menos inchaço e mais disposição. Amei! 💚',
  },
  {
    name: 'Carlos Eduardo',
    initials: 'CE',
    color: 'bg-highlight/20 text-highlight-foreground',
    text: 'Os temperos são incríveis. Dá pra sentir que é natural de verdade. Minha família toda já virou cliente!',
  },
  {
    name: 'Ana Paula',
    initials: 'AP',
    color: 'bg-secondary/20 text-secondary',
    text: 'Atendimento maravilhoso, sempre me orientam direitinho. Já emagreci 4kg em um mês com os produtos. Super recomendo!',
  },
];

function TestimonialCard({ t, index, isVisible }: { t: typeof testimonials[0]; index: number; isVisible: boolean }) {
  const { ref, tilt, onMouseMove, onMouseLeave } = useMouseTilt(8);

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative rounded-2xl p-8 bg-card border border-border/30 group"
      style={{
        perspective: '600px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translateY(0) rotateX(0deg)'
          : 'translateY(60px) rotateX(-15deg)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
        transformOrigin: 'bottom center',
      }}
    >
      <div
        className="relative w-full h-full"
        style={{
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
          transition: tilt.rotateX === 0 ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 0.1s linear',
          willChange: 'transform',
        }}
      >
        {/* Light reflection */}
        <div
          className="absolute -inset-8 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${tilt.lightX}% ${tilt.lightY}%, rgba(255,255,255,0.08) 0%, transparent 50%)`,
          }}
        />

        <FontAwesomeIcon icon={faQuoteLeft} className="absolute top-0 right-0 text-3xl text-primary/10 group-hover:text-primary/20 transition-colors duration-300" />
        <div className="flex gap-1 mb-5">
          {[...Array(5)].map((_, j) => (
            <FontAwesomeIcon
              key={j}
              icon={faStar}
              className="h-4 w-4 text-highlight"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0)',
                transition: `all 0.3s ease ${index * 0.15 + j * 0.05 + 0.3}s`,
              }}
            />
          ))}
        </div>
        <p className="text-foreground/90 leading-relaxed mb-6 text-[15px]">
          "{t.text}"
        </p>
        <div className="flex items-center gap-3 pt-5 border-t border-border/30">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${t.color}`}>
            {t.initials}
          </div>
          <p className="font-semibold text-foreground">{t.name}</p>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="depoimentos" className="py-24 relative overflow-hidden" style={{ background: '#eef5ee' }}>
      {isVisible && (
        <div className="absolute inset-0 z-0 opacity-10">
          <Warp speed={0.1} scale={0.5} colors={['#b7e4c7', '#d8f3dc', '#eef5ee']} />
        </div>
      )}

      <div className="absolute top-10 right-16 pointer-events-none animate-leaf-float opacity-20 z-[1]" style={{ animationDelay: '2.5s' }}>
        <LeafSVG size={20} id="test1" style={{ transform: 'rotate(35deg)' }} />
      </div>

      <div className="section-container relative z-10">
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) rotateX(0deg)' : 'translateY(40px) rotateX(10deg)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            perspective: '1000px',
          }}
        >
          <p className="text-primary text-sm font-semibold tracking-widest uppercase text-center mb-3">
            Depoimentos
          </p>
          <h2 className="text-3xl sm:text-5xl font-serif text-center mb-3 text-foreground">
            O que nossos clientes dizem
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16 text-lg">
            Mais de <strong className="text-foreground">500 clientes</strong> já cuidam da saúde com a gente.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ perspective: '1200px' }}>
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
