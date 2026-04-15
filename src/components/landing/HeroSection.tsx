import React from 'react';
import { MessageCircle, ArrowDownRight } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import heroImg from '@/assets/hero-products.jpg';
import logoImg from '@/assets/logo-cantim.png';
import { Button } from '@/components/ui/button';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

interface HeroSectionProps {
  scrollY: number;
}

// Leaves positioned along an elliptical orbit, staggered with animation delay
const orbitLeaves = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  delay: (i / 6) * -30,
  size: 20 + (i % 3) * 5,
}));

const LeafSVG = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path
      d="M16 2C16 2 6 8 6 18C6 24 10 28 16 30C22 28 26 24 26 18C26 8 16 2 16 2Z"
      fill="hsl(125 47% 42%)"
      opacity="0.7"
    />
    <path
      d="M16 2C16 2 6 8 6 18C6 24 10 28 16 30C22 28 26 24 26 18C26 8 16 2 16 2Z"
      fill="url(#leafGrad)"
      opacity="0.5"
    />
    <path d="M16 6V26" stroke="hsl(125 47% 28%)" strokeWidth="0.6" opacity="0.5" />
    <path d="M16 10C13 13 10 16 8 19" stroke="hsl(125 47% 28%)" strokeWidth="0.4" opacity="0.3" />
    <path d="M16 14C19 16 22 18 24 20" stroke="hsl(125 47% 28%)" strokeWidth="0.4" opacity="0.3" />
    <defs>
      <linearGradient id="leafGrad" x1="6" y1="2" x2="26" y2="30">
        <stop offset="0%" stopColor="hsl(100 50% 55%)" />
        <stop offset="100%" stopColor="hsl(130 50% 30%)" />
      </linearGradient>
    </defs>
  </svg>
);

const HeroSection: React.FC<HeroSectionProps> = () => {
  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="inicio" className="relative min-h-screen overflow-hidden py-20">
      {/* Logo watermark background - left aligned */}
      <div className="absolute inset-y-0 left-0 z-0 flex items-center pointer-events-none pl-4 md:pl-12">
        <img
          src={logoImg}
          alt=""
          className="w-[350px] md:w-[500px] lg:w-[650px] opacity-[0.1]"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-6">
        {/* Top section with big title */}
        <div className="relative pb-14">
          <p className="absolute -top-4 left-20 text-sm font-medium tracking-wider text-muted-foreground">
            100% Natural
          </p>

          {/* Title with orbiting leaves */}
          <div className="relative flex items-center justify-center py-6">
            {/* Orbit ring - leaves travel the full elliptical path around the text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              {orbitLeaves.map((leaf) => (
                <div
                  key={leaf.id}
                  className="absolute animate-leaf-orbit"
                  style={{ animationDelay: `${leaf.delay}s` }}
                >
                  <LeafSVG size={leaf.size} />
                </div>
              ))}
            </div>

            <h1
              className="hero-title-shimmer relative z-20 text-center text-6xl font-bold tracking-[-2px] md:text-8xl md:tracking-[-6px] xl:text-9xl xl:tracking-[-8px]"
              style={{ fontFamily: "'Satisfy', cursive" }}
            >
              Cantım da Roça
            </h1>
          </div>

          <p
            className="mt-4 text-center text-sm sm:text-base md:text-lg font-medium tracking-[3px] sm:tracking-[4px] uppercase text-foreground/50"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Produtos Naturais
            <br />
            e Suplementos
          </p>
        </div>

        {/* Middle section with image and services */}
        <div className="relative grid">
          <div className="flex justify-center gap-6 space-y-8 pt-20">
            <div className="bg-secondary/10 flex h-fit w-full max-w-xl items-end gap-6 space-y-2 p-10 text-xl font-bold md:text-2xl lg:text-3xl rounded-lg">
              <div className="text-lg sm:text-xl font-semibold text-foreground space-y-2">
                <div>/ CHÁS E ERVAS</div>
                <div>/ SUPLEMENTOS<br />NATURAIS</div>
                <div>/ BEM-ESTAR</div>
              </div>

              {/* Image - Desktop */}
              <div className="bg-secondary/10 absolute -top-10 left-1/2 hidden w-fit overflow-hidden md:flex rounded-lg">
                <img
                  alt="Produtos naturais - chás, suplementos e ervas"
                  className="h-[400px] w-full object-cover"
                  src={heroImg}
                />
                <div className="rotate-180 p-2 text-left text-xs font-medium tracking-widest [writing-mode:vertical-rl] text-muted-foreground">
                  SAÚDE E BEM-ESTAR
                </div>
              </div>
            </div>
          </div>

          {/* Image - Mobile */}
          <div className="bg-secondary/10 -top-10 left-1/2 flex w-full overflow-hidden md:hidden md:w-fit rounded-lg">
            <img
              alt="Produtos naturais - chás, suplementos e ervas"
              className="h-[400px] w-full object-cover"
              src={heroImg}
            />
            <div className="rotate-180 p-2 text-left text-xs font-medium tracking-widest [writing-mode:vertical-rl] text-muted-foreground">
              SAÚDE E BEM-ESTAR
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-14 md:mt-20">
          <p className="mx-auto max-w-2xl text-center font-sans text-sm font-medium tracking-wide md:text-base text-foreground/80">
            Mais disposição, menos inchaço e bem-estar no dia a dia.
            <br />
            Produtos naturais com orientação direta pelo WhatsApp,
            <br />
            sem complicação.
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center gap-3 pt-6">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="lg" className="uppercase gap-2">
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </Button>
          </a>
          <Button variant="outline" size="lg" className="uppercase" onClick={scrollToProducts}>
            Ver produtos
          </Button>
        </div>

        {/* Bottom section */}
        <div className="mt-20 items-end justify-between md:flex">
          <div className="relative">
            <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              + de 500 clientes satisfeitos
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 md:justify-end">
              <span className="text-lg font-medium tracking-wider text-foreground">NOSSOS PRODUTOS</span>
              <ArrowDownRight className="size-6" />
            </div>
            <div className="mt-3 md:text-right">
              <h2
                className="text-5xl tracking-[-4px] uppercase text-foreground"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Saúde sem Limites
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Grid background */}
      <div
        className="absolute inset-0 z-[1] block dark:hidden"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          maskImage:
            'repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px), repeating-linear-gradient(black 0px, black 3px, transparent 3px, transparent 8px), radial-gradient(70% 60% at 50% 0%, rgb(0,0,0) 60%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      />
    </section>
  );
};

export default HeroSection;
