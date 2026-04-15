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

// 8 leaves orbiting in a circle around the title
const orbitLeaves = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  delay: (i / 8) * -20, // stagger evenly around the orbit
  size: i % 2 === 0 ? 28 : 22,
}));

const HeroSection: React.FC<HeroSectionProps> = () => {
  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="inicio" className="relative min-h-screen overflow-hidden py-20">
      {/* Logo watermark background - left aligned, more visible */}
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
          <div className="relative flex items-center justify-center">
            {/* Orbit container */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[320px] h-[120px] sm:w-[500px] sm:h-[160px] md:w-[700px] md:h-[200px] xl:w-[900px] xl:h-[240px]">
                {orbitLeaves.map((leaf) => (
                  <div
                    key={leaf.id}
                    className="absolute top-1/2 left-1/2 animate-leaf-orbit"
                    style={{
                      animationDelay: `${leaf.delay}s`,
                      width: 0,
                      height: 0,
                    }}
                  >
                    {/* SVG leaf shape */}
                    <svg
                      width={leaf.size}
                      height={leaf.size}
                      viewBox="0 0 24 24"
                      fill="none"
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                    >
                      <path
                        d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8.17 20C12.17 20 15.87 14.5 17 8Z"
                        fill="hsl(125 47% 40%)"
                        opacity="0.6"
                      />
                      <path
                        d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8.17 20C12.17 20 15.87 14.5 17 8Z"
                        stroke="hsl(125 47% 30%)"
                        strokeWidth="0.5"
                        fill="none"
                        opacity="0.4"
                      />
                      {/* Leaf vein */}
                      <path
                        d="M6 18C8 14 11 11 17 8"
                        stroke="hsl(125 47% 30%)"
                        strokeWidth="0.4"
                        fill="none"
                        opacity="0.3"
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <h1
              className="relative z-20 text-center text-6xl font-bold tracking-[-2px] md:text-8xl md:tracking-[-6px] xl:text-9xl xl:tracking-[-8px]"
              style={{
                fontFamily: "'Satisfy', cursive",
                background: 'linear-gradient(135deg, hsl(125 47% 33%) 0%, hsl(125 47% 45%) 40%, hsl(80 60% 50%) 70%, hsl(125 47% 33%) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
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
                <div className="whitespace-nowrap">/ SUPLEMENTOS NATURAIS</div>
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
