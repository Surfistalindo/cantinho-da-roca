import React from 'react';
import { MessageCircle, ArrowDownRight, Leaf } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import heroImg from '@/assets/hero-products.jpg';
import { Button } from '@/components/ui/button';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

interface HeroSectionProps {
  scrollY: number;
}

const leaves = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 14 + Math.random() * 18,
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 6,
  duration: 8 + Math.random() * 6,
  rotate: Math.random() * 360,
}));

const HeroSection: React.FC<HeroSectionProps> = () => {
  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="inicio" className="relative min-h-screen overflow-hidden py-20">
      <div className="relative z-20 mx-auto max-w-7xl px-6">
        {/* Top section with big title */}
        <div className="relative">
          <p className="absolute -top-4 left-20 text-sm font-medium tracking-wider text-muted-foreground">
            100% Natural
          </p>

          {/* Title with CSS animated leaves */}
          <div className="relative">
            {/* Floating leaves - pure CSS */}
            {leaves.map((leaf) => (
              <Leaf
                key={leaf.id}
                className="absolute text-primary/30 animate-leaf-float pointer-events-none"
                style={{
                  width: leaf.size,
                  height: leaf.size,
                  left: `${leaf.x}%`,
                  top: `${leaf.y}%`,
                  animationDelay: `${leaf.delay}s`,
                  animationDuration: `${leaf.duration}s`,
                  transform: `rotate(${leaf.rotate}deg)`,
                }}
              />
            ))}

            <h1
              className="text-primary relative z-20 text-center text-7xl font-bold tracking-[-7px] md:text-9xl md:tracking-[-14px] xl:text-[10rem] xl:tracking-[-1rem]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              PRODUTOS NATURAIS
            </h1>
          </div>

          <p
            className="absolute right-24 -bottom-12 hidden text-4xl font-thin tracking-[6px] xl:block text-foreground/60"
            style={{ fontFamily: "'Satisfy', cursive" }}
          >
            Cantım da Roça
          </p>
          <p
            className="absolute -bottom-12 left-24 text-4xl font-thin tracking-[6px] xl:hidden text-foreground/60"
            style={{ fontFamily: "'Satisfy', cursive" }}
          >
            Cantım da Roça
          </p>
        </div>

        {/* Middle section with image and services */}
        <div className="relative grid">
          <div className="flex justify-center gap-6 space-y-8 pt-20">
            <div className="bg-secondary/10 flex h-fit w-full max-w-xl items-end gap-6 space-y-2 p-10 text-xl font-bold md:text-2xl lg:text-3xl rounded-lg">
              <div className="text-xl font-semibold text-foreground">
                <div>/ CHÁS E ERVAS</div>
                <div>/ SUPLEMENTOS NATURAIS</div>
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
        <div className="mt-10 md:mt-40">
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
        className="absolute inset-0 z-0 block dark:hidden"
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
