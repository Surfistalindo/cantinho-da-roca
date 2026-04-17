import React, { useLayoutEffect, useRef, useState } from 'react';
import heroImg from '@/assets/hero-products.jpg';
import logoImg from '@/assets/logo-cantim.png';
import { Button } from '@/components/ui/button';
import { Warp } from '@paper-design/shaders-react';
import LeafSVG from './LeafSVG';

const heroTitleText = 'Cantim da Roça';
const heroTitleIIndex = heroTitleText.indexOf('i');

interface HeroSectionProps {
  scrollY: number;
}

const orbitLeaves = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  delay: (i / 8) * -30,
  size: 14 + (i % 3) * 7,
}));

const scatteredLeaves = [
  { top: '8%', left: '5%', size: 20, speed: 0.1, delay: '0s', rotate: 25, id: 'hs1' },
  { top: '15%', right: '8%', size: 16, speed: 0.15, delay: '1.5s', rotate: -35, id: 'hs2' },
  { top: '45%', left: '3%', size: 24, speed: 0.25, delay: '3s', rotate: 60, id: 'hs3' },
  { top: '55%', right: '5%', size: 18, speed: 0.12, delay: '2s', rotate: -15, id: 'hs4' },
  { top: '75%', left: '10%', size: 14, speed: 0.2, delay: '4s', rotate: 45, id: 'hs5' },
  { top: '80%', right: '12%', size: 22, speed: 0.08, delay: '0.5s', rotate: -50, id: 'hs6' },
];

const HeroSection: React.FC<HeroSectionProps> = ({ scrollY }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [leafPos, setLeafPos] = useState<{ left: number; top: number; size: number } | null>(null);

  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollToContato = () => {
    document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  const imgScale = 1 + scrollY * 0.0003;
  const imgTranslateY = scrollY * 0.15;

  useLayoutEffect(() => {
    const measure = () => {
      const h1 = titleRef.current;
      const textNode = h1?.querySelector('[data-title]')?.firstChild;
      if (!h1 || !textNode || textNode.nodeType !== Node.TEXT_NODE) return;

      const h1Rect = h1.getBoundingClientRect();
      const fontSize = parseFloat(getComputedStyle(h1).fontSize);
      const range = document.createRange();
      range.setStart(textNode, heroTitleIIndex);
      range.setEnd(textNode, heroTitleIIndex + 1);
      const r = range.getBoundingClientRect();
      if (!r.width) return;

      setLeafPos({
        left: r.left - h1Rect.left + r.width * 0.5,
        top: r.top - h1Rect.top + fontSize * 0.06,
        size: fontSize * 0.2,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (titleRef.current) ro.observe(titleRef.current);
    window.addEventListener('resize', measure);
    if ('fonts' in document) void document.fonts.ready.then(measure);

    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  return (
    <section id="inicio" className="relative min-h-screen overflow-hidden pt-16 sm:pt-20 pb-0">
      {/* Warp shader background */}
      <div className="absolute inset-0 z-0 opacity-20">
        <Warp speed={0.15} scale={0.8} colors={['#2d6a4f', '#40916c', '#95d5b2']} />
      </div>

      {/* Scattered floating leaves with parallax */}
      {scatteredLeaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute z-[2] pointer-events-none animate-leaf-float"
          style={{
            top: leaf.top,
            left: leaf.left,
            right: (leaf as any).right,
            transform: `translateY(${scrollY * leaf.speed}px) rotate(${leaf.rotate}deg)`,
            animationDelay: leaf.delay,
            animationDuration: `${6 + Math.random() * 4}s`,
            opacity: 0.2,
            willChange: 'transform',
          }}
        >
          <LeafSVG size={leaf.size} id={leaf.id} />
        </div>
      ))}

      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top section with big title */}
        <div className="relative pb-10 sm:pb-14">
          <p className="absolute -top-4 left-4 sm:left-20 text-xs sm:text-sm font-medium tracking-wider text-muted-foreground">
            100% Natural
          </p>

          {/* Title with orbiting leaves + parallax */}
          <div className="relative flex items-center justify-center py-4 sm:py-6">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
              {orbitLeaves.map((leaf) => (
                <div
                  key={leaf.id}
                  className="absolute animate-leaf-orbit"
                  style={{ animationDelay: `${leaf.delay}s`, willChange: 'transform' }}
                >
                  <LeafSVG size={leaf.size} id={`orbit${leaf.id}`} />
                </div>
              ))}
            </div>

            <h1
              ref={titleRef}
              className="hero-title-shimmer relative z-20 text-center text-4xl sm:text-6xl font-bold leading-[1.15] pb-2 sm:pb-3 tracking-[-1px] sm:tracking-[-2px] md:text-8xl md:tracking-[-6px] xl:text-9xl xl:tracking-[-8px]"
              style={{
                fontFamily: "'Satisfy', cursive",
                transform: `translateY(${scrollY * 0.4}px)`,
                willChange: 'transform',
              }}
            >
              <span data-title>{heroTitleText}</span>
            </h1>
          </div>

          <p
            className="mt-3 sm:mt-4 text-center text-xs sm:text-base md:text-lg font-medium tracking-[2px] sm:tracking-[4px] uppercase text-foreground/50"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              transform: `translateY(${scrollY * 0.2}px)`,
              willChange: 'transform',
            }}
          >
            Produtos Naturais
            <br />
            e Suplementos
          </p>
        </div>

        {/* Middle section with image and services */}
        <div className="relative grid">
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-10 sm:pt-20">
            <div className="bg-secondary/10 flex flex-col sm:flex-row h-fit w-full max-w-xl items-start sm:items-end gap-4 sm:gap-6 p-6 sm:p-10 text-lg sm:text-xl font-bold md:text-2xl lg:text-3xl rounded-lg">
              <div className="text-base sm:text-lg font-semibold text-foreground space-y-2">
                <div>/ CHÁS E ERVAS</div>
                <div>/ SUPLEMENTOS<br />NATURAIS</div>
                <div>/ BEM-ESTAR</div>
              </div>

              {/* Image - Desktop with parallax + scale */}
              <div className="bg-secondary/10 absolute -top-10 left-1/2 hidden w-fit overflow-hidden md:flex rounded-lg">
                <img
                  alt="Produtos naturais - chás, suplementos e ervas"
                  className="h-[400px] w-full object-cover"
                  src={heroImg}
                  loading="lazy"
                  style={{
                    transform: `translateY(${imgTranslateY}px) scale(${imgScale})`,
                    willChange: 'transform',
                    transition: 'transform 0.1s linear',
                  }}
                />
                <div className="rotate-180 p-2 text-left text-xs font-medium tracking-widest [writing-mode:vertical-rl] text-muted-foreground">
                  SAÚDE E BEM-ESTAR
                </div>
              </div>
            </div>
          </div>

          {/* Image - Mobile */}
          <div className="bg-secondary/10 flex w-full overflow-hidden md:hidden rounded-lg mt-4">
            <img
              alt="Produtos naturais - chás, suplementos e ervas"
              className="h-[280px] sm:h-[400px] w-full object-cover"
              src={heroImg}
              loading="lazy"
              style={{
                transform: `scale(${imgScale})`,
                willChange: 'transform',
              }}
            />
            <div className="rotate-180 p-2 text-left text-xs font-medium tracking-widest [writing-mode:vertical-rl] text-muted-foreground">
              SAÚDE E BEM-ESTAR
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-10 sm:mt-14 md:mt-20">
          <p
            className="mx-auto max-w-2xl text-center font-sans text-xs sm:text-sm font-medium tracking-wide md:text-base text-foreground/80"
          >
            Mais disposição, menos inchaço e bem-estar no dia a dia.
            <br className="hidden sm:block" />
            {' '}Cadastre-se e receba dicas, novidades e ofertas
            <br className="hidden sm:block" />
            {' '}direto no seu WhatsApp.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
          <Button size="lg" className="uppercase w-full sm:w-auto" onClick={scrollToContato}>
            Quero receber novidades
          </Button>
          <Button variant="outline" size="lg" className="uppercase w-full sm:w-auto" onClick={scrollToProducts}>
            Ver produtos
          </Button>
        </div>

        {/* Logo below CTA - compact background mark */}
        <div className="flex justify-center mt-6 sm:mt-8 my-0 pr-0 pt-[20px]">
          <img
            src={logoImg}
            alt="Cantim da Roça"
            className="block h-auto w-[180px] sm:w-[200px] md:w-[220px] opacity-20 pointer-events-none object-contain m-0 p-0"
            loading="lazy"
          />
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
