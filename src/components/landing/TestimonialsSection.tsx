import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import LeafSVG from './LeafSVG';

const testimonials = [
  {
    name: 'Maria Aparecida',
    initials: 'MA',
    text: 'Comecei a tomar o chá e já senti diferença na primeira semana! Menos inchaço e mais disposição. Amei! 🌿',
  },
  {
    name: 'Carlos Eduardo',
    initials: 'CE',
    text: 'Os temperos são incríveis. Dá pra sentir que é natural de verdade. Minha família toda já virou cliente!',
  },
  {
    name: 'Ana Paula',
    initials: 'AP',
    text: 'Atendimento maravilhoso, sempre me orientam direitinho. Já emagreci 4kg em um mês com os produtos. Super recomendo!',
  },
];

function TestimonialCard({
  t,
  index,
  isVisible,
}: {
  t: typeof testimonials[0];
  index: number;
  isVisible: boolean;
}) {
  return (
    <div
      className="group relative rounded-2xl p-8 bg-card border border-clay transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_hsl(25_45%_22%/0.35)]"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.15}s`,
      }}
    >
      <FontAwesomeIcon
        icon={faQuoteLeft}
        className="absolute top-6 right-6 text-3xl text-clay opacity-30 group-hover:opacity-60 transition-opacity duration-300"
      />
      <div className="flex gap-1 mb-5">
        {[...Array(5)].map((_, j) => (
          <FontAwesomeIcon
            key={j}
            icon={faStar}
            className="h-4 w-4 text-honey"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'scale(1)' : 'scale(0)',
              transition: `all 0.3s ease ${index * 0.15 + j * 0.05 + 0.3}s`,
            }}
          />
        ))}
      </div>
      <p className="font-body-warm text-foreground/90 leading-relaxed mb-6 text-[15px]">
        "{t.text}"
      </p>
      <div className="flex items-center gap-3 pt-5 border-t border-clay">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-[hsl(var(--honey)/0.25)] text-[hsl(var(--cocoa))] font-display-warm">
          {t.initials}
        </div>
        <p className="font-display-warm font-semibold text-foreground">{t.name}</p>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section
      id="depoimentos"
      className="py-24 relative overflow-hidden bg-paper"
    >
      <div
        className="absolute top-10 right-16 pointer-events-none animate-leaf-float opacity-20 z-[1]"
        style={{ animationDelay: '2.5s' }}
      >
        <LeafSVG size={20} id="test1" style={{ transform: 'rotate(35deg)' }} />
      </div>

      <div className="section-container relative z-10">
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <p className="font-hand text-clay text-2xl text-center mb-1">
            o que dizem por aí
          </p>
          <h2 className="font-display-warm text-3xl sm:text-5xl text-center mb-3 text-foreground">
            O que nossos clientes dizem
          </h2>
          <p className="font-body-warm text-muted-foreground text-center max-w-xl mx-auto mb-16 text-lg">
            Mais de <strong className="text-foreground">500 clientes</strong> já cuidam da saúde com a gente.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
