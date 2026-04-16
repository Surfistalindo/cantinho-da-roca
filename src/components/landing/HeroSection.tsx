import React, { useLayoutEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faArrowTurnDown } from '@fortawesome/free-solid-svg-icons';
import { APP_CONFIG } from '@/config/app';
import heroImg from '@/assets/hero-products.jpg';
import logoImg from '@/assets/logo-cantim.png';
import { Button } from '@/components/ui/button';
import { Warp } from '@paper-design/shaders-react';
import LeafSVG from './LeafSVG';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;
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
  const titleTextRef = useRef<HTMLSpanElement>(null);
  const [titleLeafPosition, setTitleLeafPosition] = useState<{ left: number; top: number; size: number } | null>(null);

  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  const imgScale = 1 + scrollY * 0.0003;
  const imgTranslateY = scrollY * 0.15;

  useLayoutEffect(() => {
    const updateTitleLeafPosition = () => {
      const titleElement = titleRef.current;
      const titleTextElement = titleTextRef.current;
      const textNode = titleTextElement?.firstChild;

      if (!titleElement || !titleTextElement || !textNode || textNode.nodeType !== Node.TEXT_NODE) return;

      const titleStyles = window.getComputedStyle(titleElement);
      const titleRect = titleElement.getBoundingClientRect();
      const fontSize = parseFloat(titleStyles.fontSize);
      const range = document.createRange();

      range.setStart(textNode, heroTitleIIndex);
      range.setEnd(textNode, heroTitleIIndex + 1);

      const glyphRect = range.getBoundingClientRect();

      if (!glyphRect.width && !glyphRect.height) return;

      setTitleLeafPosition({
        left: glyphRect.left - titleRect.left + glyphRect.width * 0.34,
        top: glyphRect.top - titleRect.top + fontSize * 0.12,
        size: fontSize * 0.22,
      });
    };

    updateTitleLeafPosition();

    const titleElement = titleRef.current;
    if (!titleElement) return;

    const resizeObserver = new ResizeObserver(updateTitleLeafPosition);
    resizeObserver.observe(titleElement);
    window.addEventListener('resize', updateTitleLeafPosition);

    if ('fonts' in document) {
      void document.fonts.ready.then(updateTitleLeafPosition);
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateTitleLeafPosition);
    };
  }, []);

  return (
    <section id="inicio" className="relative min-h-screen overflow-hidden py-16 sm:py-20">
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

      {/* Logo watermark background */}
      <div className="absolute inset-y-0 left-[5%] z-[1] flex items-center pointer-events-none -ml-16 sm:-ml-20 md:-ml-10 lg:-ml-6">
        <img
          src={logoImg}
          alt=""
          className="w-[250px] sm:w-[350px] md:w-[500px] lg:w-[650px] opacity-[0.1]"
          aria-hidden="true"
          loading="lazy"
          style={{
            transform: `translateY(${scrollY * -0.1}px) scale(${1 + scrollY * 0.0002})`,
            willChange: 'transform',
          }}
        />
      </div>

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
              className="hero-title-shimmer relative z-20 text-center text-4xl sm:text-6xl font-bold tracking-[-1px] sm:tracking-[-2px] md:text-8xl md:tracking-[-6px] xl:text-9xl xl:tracking-[-8px]"
              style={{
                fontFamily: "'Satisfy', cursive",
                transform: `translateY(${scrollY * 0.4}px)`,
                willChange: 'transform',
              }}
            >
              <span ref={titleTextRef}>{heroTitleText}</span>
              {titleLeafPosition && (
                <span
                  className="pointer-events-none absolute z-30"
                  style={{
                    top: `${titleLeafPosition.top}px`,
                    left: `${titleLeafPosition.left}px`,
                    transform: 'translate(-50%, -50%) rotate(-20deg)',
                  }}
                  aria-hidden="true"
                >
                  <LeafSVG size={titleLeafPosition.size} id="title-leaf-mark" />
                </span>
              )}
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
            {' '}Produtos naturais com orientação direta pelo WhatsApp,
            <br className="hidden sm:block" />
            {' '}sem complicação.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-6">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="whatsapp" size="lg" className="uppercase gap-2 w-full sm:w-auto">
              <FontAwesomeIcon icon={faCommentDots} className="h-5 w-5" />
              Falar no WhatsApp
            </Button>
          </a>
          <Button variant="outline" size="lg" className="uppercase w-full sm:w-auto" onClick={scrollToProducts}>
            Ver produtos
          </Button>
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
