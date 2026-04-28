import { useScrollAnimation } from '@/hooks/useScrollAnimation';
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
  return (
    <div
      className="group relative rounded-2xl overflow-hidden min-h-[200px] sm:min-h-[280px] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_18px_40px_-20px_hsl(25_45%_22%/0.4)] shadow-[0_4px_15px_-8px_hsl(25_45%_22%/0.2)]"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s`,
      }}
    >
      <img
        src={b.image}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-700"
      />

      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[hsl(25_45%_15%/0.85)] via-[hsl(25_45%_15%/0.5)] to-[hsl(25_45%_15%/0.25)] group-hover:from-[hsl(25_45%_15%/0.9)] transition-colors duration-500" />

      <div className="relative z-[4] flex flex-col justify-end h-full p-6 sm:p-8">
        <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl mb-4 bg-[hsl(var(--honey)/0.9)] text-[hsl(var(--cocoa))] group-hover:bg-[hsl(var(--honey))] transition-all duration-500 shadow-[0_4px_14px_hsl(38_85%_30%/0.4)]">
          <FontAwesomeIcon icon={b.icon} className="text-xl sm:text-2xl" />
        </div>

        <h3 className="font-display-warm text-lg sm:text-2xl font-bold mb-1.5 text-white">{b.title}</h3>
        <p className="font-body-warm text-white/85 text-sm leading-relaxed">{b.description}</p>
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
          <p className="font-hand text-clay text-2xl text-center mb-1 pt-[40px]">
            por que nos escolher
          </p>
          <h2 className="font-display-warm text-3xl sm:text-5xl text-center mb-4 text-foreground">
            Por que escolher o Cantim da Roça?
          </h2>
          <p className="font-body-warm text-muted-foreground text-center mb-10 sm:mb-16 max-w-xl mx-auto text-base sm:text-lg">
            Simplicidade, qualidade e resultado. É isso que a gente entrega.
          </p>
        </div>
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {benefits.map((b, i) => (
            <BenefitCard key={b.title} b={b} index={i} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
