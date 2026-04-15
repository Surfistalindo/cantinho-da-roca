import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { APP_CONFIG } from '@/config/app';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Warp } from '@paper-design/shaders-react';
import LeafSVG from './LeafSVG';
import FeatureCarousel from '@/components/ui/feature-carousel';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Oi! Quero saber mais sobre os produtos naturais 🌿')}`;

export default function ProductsSection() {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  return (
    <section id="produtos" className="py-24 bg-card relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <Warp speed={0.3} scale={0.7} colors={['#d4a373', '#e9c46a', '#f4e8c1']} />
      </div>

      <div className="absolute top-16 left-6 pointer-events-none animate-leaf-float opacity-15 z-[1]" style={{ animationDelay: '2s' }}>
        <LeafSVG size={20} id="prod1" style={{ transform: 'rotate(55deg)' }} />
      </div>
      <div className="absolute bottom-20 right-10 pointer-events-none animate-leaf-float opacity-20 z-[1]" style={{ animationDelay: '0.5s' }}>
        <LeafSVG size={16} id="prod2" style={{ transform: 'rotate(-25deg)' }} />
      </div>

      <div className="relative z-10" ref={ref}>
        <div
          className="text-center mb-12"
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
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="lg" className="gap-2 shadow-lg shadow-green-600/20 animate-pulse hover:animate-none">
              <FontAwesomeIcon icon={faCommentDots} className="h-5 w-5" />
              Falar no WhatsApp sobre produtos
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
