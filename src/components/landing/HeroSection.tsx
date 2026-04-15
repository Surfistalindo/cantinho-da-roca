import React, { lazy, Suspense } from 'react';
import { MessageCircle, ArrowDownRight } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import heroImg from '@/assets/hero-products.jpg';
import { Button } from '@/components/ui/button';

const FloatingLeaves3D = lazy(() => import('./FloatingLeaves3D'));

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

interface HeroSectionProps {
  scrollY: number;
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="inicio" className="relative min-h-screen overflow-hidden bg-background">
      <div className="relative z-20 mx-auto max-w-7xl px-6 pt-28 pb-16">
        {/* Title area with 3D leaves */}
        <div className="relative flex flex-col items-center">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-4">
            100% Natural
          </p>

          {/* Big title with 3D leaves around it */}
          <div className="relative w-full" style={{ minHeight: '220px' }}>
            <Suspense fallback={null}>
              <FloatingLeaves3D />
            </Suspense>
            <h1
              className="relative z-20 text-center text-6xl sm:text-8xl lg:text-9xl font-bold tracking-tight text-primary leading-none"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              PRODUTOS
              <br />
              NATURAIS
            </h1>
          </div>

          {/* Brand name */}
          <p
            className="mt-6 text-3xl sm:text-4xl tracking-wide text-foreground/40"
            style={{ fontFamily: "'Satisfy', cursive" }}
          >
            Cantım da Roça
          </p>
        </div>

        {/* Content grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Services + Image */}
          <div className="flex flex-col gap-6">
            <div className="bg-accent rounded-xl p-8">
              <div className="text-lg sm:text-xl font-bold text-foreground space-y-2">
                <div>/ CHÁS E ERVAS</div>
                <div>/ SUPLEMENTOS NATURAIS</div>
                <div>/ BEM-ESTAR</div>
              </div>
            </div>
          </div>

          {/* Product image */}
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              alt="Produtos naturais - chás, suplementos e ervas"
              className="w-full h-72 sm:h-80 object-cover"
              src={heroImg}
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-14 text-center">
          <p className="mx-auto max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Mais disposição, menos inchaço e bem-estar no dia a dia.
            <br />
            Produtos naturais com orientação direta pelo WhatsApp, sem complicação.
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-3 mt-8">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="lg" className="gap-2">
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </Button>
          </a>
          <Button variant="outline" size="lg" onClick={scrollToProducts}>
            Ver produtos
          </Button>
        </div>

        {/* Bottom section */}
        <div className="mt-20 flex flex-col md:flex-row items-end justify-between gap-6">
          <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            + de 500 clientes satisfeitos
          </span>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-base font-semibold tracking-wider text-foreground">NOSSOS PRODUTOS</span>
              <ArrowDownRight className="size-5" />
            </div>
            <h2
              className="mt-2 text-4xl sm:text-5xl tracking-tight uppercase text-foreground"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Saúde sem Limites
            </h2>
          </div>
        </div>
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage:
            'radial-gradient(70% 60% at 50% 0%, rgb(0,0,0) 40%, transparent 100%)',
          opacity: 0.5,
        }}
      />
    </section>
  );
};

export default HeroSection;
