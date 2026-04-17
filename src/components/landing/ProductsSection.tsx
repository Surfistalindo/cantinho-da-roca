import logoImg from '@/assets/logo-cantim.png';
import { Button } from '@/components/ui/button';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Warp } from '@paper-design/shaders-react';
import LeafSVG from './LeafSVG';
import FeatureCarousel from '@/components/ui/feature-carousel';

interface ProductsSectionProps {
  scrollY?: number;
}

export default function ProductsSection({ scrollY = 0 }: ProductsSectionProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
  const scrollToContato = () => {
    document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="produtos" className="py-16 sm:py-24 bg-card relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <Warp speed={0.3} scale={0.7} colors={['#d4a373', '#e9c46a', '#f4e8c1']} />
      </div>

      <div className="absolute top-16 left-6 pointer-events-none animate-leaf-float opacity-15 z-[1]" style={{ animationDelay: '2s' }}>
        <LeafSVG size={20} id="prod1" style={{ transform: 'rotate(55deg)' }} />
      </div>
      <div className="absolute bottom-20 right-10 pointer-events-none animate-leaf-float opacity-20 z-[1]" style={{ animationDelay: '0.5s' }}>
        <LeafSVG size={16} id="prod2" style={{ transform: 'rotate(-25deg)' }} />
      </div>

      {/* Decorative parallax logo */}
      <div
        className="absolute -right-20 top-1/3 pointer-events-none opacity-[0.04] z-[1]"
        style={{
          transform: `translateY(${scrollY * -0.15}px) rotate(15deg)`,
          willChange: 'transform',
        }}
      >
        <img src={logoImg} alt="" className="w-[300px] sm:w-[400px]" aria-hidden="true" />
      </div>

      <div className="relative z-10" ref={ref}>
        <div
          className="text-center mb-10 sm:mb-14 px-4"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <p className="text-primary text-sm font-semibold tracking-widest uppercase mb-3">
            Nossos produtos
          </p>
          <h2 className="text-3xl sm:text-5xl font-serif text-foreground mb-4">
            Conheça nossos produtos
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Tudo pensado pra quem quer viver melhor de forma simples e natural.
          </p>
        </div>

        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          }}
        >
          <FeatureCarousel />
        </div>

        <div
          className="text-center mt-14"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease 0.6s',
          }}
        >
          <Button size="lg" onClick={scrollToContato} className="shadow-lg">
            Quero esses produtos
          </Button>
        </div>
      </div>
    </section>
  );
}
