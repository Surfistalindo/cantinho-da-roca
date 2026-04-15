import React from 'react';
import { MessageCircle, ArrowDownRight, Leaf } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import heroImg from '@/assets/hero-products.jpg';
import logoImg from '@/assets/logo-cantim.png';
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
      {/* Logo watermark background */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <img
          src={logoImg}
          alt=""
          className="w-[500px] md:w-[700px] lg:w-[900px] opacity-[0.06]"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-6">
        {/* Top section with big title */}
        <div className="relative pb-14">
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
            Produtos Naturais e Suplementos
          </p>
        </div>

        {/* Middle section with image and services */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Services */}
          <div className="bg-secondary/10 p-8 sm:p-10 rounded-lg flex items-center">
            <div className="text-lg sm:text-xl font-semibold text-foreground space-y-2">
              <div>/ CHÁS E ERVAS</div>
              <div>/ SUPLEMENTOS NATURAIS</div>
              <div>/ BEM-ESTAR</div>
            </div>
          </div>

          {/* Image */}
          <div className="rounded-lg overflow-hidden">
            <img
              alt="Produtos naturais - chás, suplementos e ervas"
              className="h-[300px] sm:h-[400px] w-full object-cover"
              src={heroImg}
            />
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
