import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-cantim-bg.png';

const StaticImageHero: React.FC = () => {
  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollToContato = () => {
    document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="inicio"
      className="relative w-full min-h-screen overflow-hidden"
      aria-label="Hero Cantim da Roça"
    >
      {/* Fixed background image */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center sm:bg-fixed"
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden="true"
      />

      {/* Soft gradient overlay for legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70 pointer-events-none"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-end pb-16 sm:pb-24 px-6 sm:px-10 pt-28 sm:pt-32">
        <div className="w-full max-w-3xl text-center animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-[11px] sm:text-xs uppercase tracking-[3px] text-white/90">
            100% Natural
          </span>

          <h1
            className="mt-5 text-pretty text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.55)]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Sabores e cuidados <br className="hidden sm:block" />
            direto da{' '}
            <span className="italic text-[hsl(var(--primary-foreground))]" style={{ color: '#a7e08c' }}>
              roça
            </span>{' '}
            para você
          </h1>

          <p
            className="mx-auto mt-5 max-w-xl text-sm sm:text-base md:text-lg text-white/85 leading-relaxed"
            style={{ fontFamily: "'Source Sans 3', sans-serif" }}
          >
            Chás artesanais, mel puro e suplementos naturais selecionados
            para trazer mais bem-estar ao seu dia a dia.
          </p>

          <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="h-14 uppercase tracking-wide px-8 shadow-lg shadow-black/30"
              onClick={scrollToProducts}
            >
              Conhecer produtos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 uppercase tracking-wide px-8 bg-white/10 backdrop-blur border-white/40 text-white hover:bg-white/20 hover:text-white"
              onClick={scrollToContato}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Falar conosco
            </Button>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="mt-12 sm:mt-16 flex justify-center">
          <span className="text-[11px] sm:text-xs uppercase tracking-[3px] text-white/70">
            Role para descobrir
          </span>
        </div>
      </div>
    </section>
  );
};

export default StaticImageHero;
