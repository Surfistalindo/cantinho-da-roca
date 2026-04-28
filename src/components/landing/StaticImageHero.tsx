import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';
import heroBg from '@/assets/hero-cantim-clean.png';
import heroLqip from '@/assets/hero-cantim-bg-lqip.webp';
import logoOficial from '@/assets/logo-cantim-oficial.png';
import { useReveal } from '@/hooks/useReveal';
import { cn } from '@/lib/utils';
import { Stamp } from './Stamp';

const LeafAccent = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
    <path
      d="M8 56 C 14 28, 32 10, 56 8 C 56 32, 38 50, 12 56 Z"
      fill="currentColor"
      opacity="0.92"
    />
    <path
      d="M10 54 C 22 42, 36 28, 52 14"
      stroke="currentColor"
      strokeOpacity="0.5"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const StaticImageHero: React.FC = () => {
  const [bgLoaded, setBgLoaded] = useState(false);

  // Pré-carrega a imagem ANTES de renderizar como background, evitando flash.
  useEffect(() => {
    const img = new Image();
    img.decoding = 'async';
    (img as any).fetchPriority = 'high';
    img.src = heroBg;
    if (img.complete) setBgLoaded(true);
    else img.onload = () => setBgLoaded(true);
  }, []);

  const badge = useReveal<HTMLSpanElement>({ threshold: 0.1 });
  const title = useReveal<HTMLHeadingElement>({ threshold: 0.1 });
  const subtitle = useReveal<HTMLParagraphElement>({ threshold: 0.1 });
  const ctas = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const hint = useReveal<HTMLDivElement>({ threshold: 0.1 });
  const logo = useReveal<HTMLImageElement>({ threshold: 0.1 });

  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollToContato = () => {
    document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  const reveal = (visible: boolean, delay = 0) =>
    cn(
      'transition-all duration-700 ease-out will-change-transform',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
    ) + (delay ? ` [transition-delay:${delay}ms]` : '');

  return (
    <section
      id="inicio"
      className="relative w-full min-h-screen overflow-hidden bg-[#1a1410]"
      aria-label="Hero Cantim da Roça"
    >
      {/* LQIP — aparece instantaneamente, evita flash */}
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center scale-110 blur-xl"
        style={{ backgroundImage: `url(${heroLqip})` }}
        aria-hidden="true"
      />

      {/* Background hi-res, fade-in quando carregado */}
      <div
        className={cn(
          'absolute inset-0 bg-no-repeat bg-cover transition-opacity duration-500',
          'bg-center sm:bg-fixed lg:bg-[position:75%_center] xl:bg-[position:80%_center]',
          bgLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden="true"
      />

      {/* Overlay de legibilidade — vertical no mobile, horizontal em desktop */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/15 via-black/25 to-black/75 lg:bg-gradient-to-r lg:from-black/70 lg:via-black/45 lg:to-transparent"
        aria-hidden="true"
      />

      {/* Conteúdo */}
      <div
        className={cn(
          'relative z-10 flex min-h-screen flex-col px-6 sm:px-10 lg:px-16 xl:px-24',
          'items-center justify-center sm:justify-end lg:items-start lg:justify-center',
          'pb-12 sm:pb-24 lg:pb-0 pt-24 sm:pt-28 md:pt-32 lg:pt-24'
        )}
        style={{ paddingTop: 'max(6rem, env(safe-area-inset-top) + 4rem)' }}
      >
        <div className="w-full max-w-3xl lg:max-w-2xl text-center lg:text-left">

          <span
            ref={badge.ref}
            className={cn('inline-block', reveal(badge.visible))}
            style={{ transitionDelay: '60ms' }}
          >
            <Stamp className="text-base text-honey">
              <LeafAccent className="h-4 w-4 text-moss" />
              colhido na semana
            </Stamp>
          </span>

          <h1
            ref={title.ref}
            className={cn(
              'mt-6 text-pretty font-display-warm text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.55)]',
              reveal(title.visible),
            )}
            style={{ transitionDelay: '120ms' }}
          >
            Sabores e cuidados direto da{' '}
            <span
              className="font-hand text-honey not-italic inline-flex items-baseline gap-1 align-baseline"
              style={{ fontWeight: 600 }}
            >
              roça
              <LeafAccent className="h-7 w-7 sm:h-9 sm:w-9 text-moss -translate-y-1 -rotate-12" />
            </span>{' '}
            para você
          </h1>

          <p
            ref={subtitle.ref}
            className={cn(
              'mx-auto lg:mx-0 mt-5 max-w-xl font-body-warm text-sm sm:text-base md:text-lg text-white/85 leading-relaxed',
              reveal(subtitle.visible),
            )}
            style={{ transitionDelay: '240ms' }}
          >
            Chás artesanais, mel puro e suplementos naturais selecionados
            para trazer mais bem-estar ao seu dia a dia.
          </p>

          <div
            ref={ctas.ref}
            className={cn(
              'mt-8 flex w-full flex-col items-stretch justify-center lg:justify-start gap-3 sm:flex-row sm:items-center',
              reveal(ctas.visible),
            )}
            style={{ transitionDelay: '360ms' }}
          >
            <Button
              size="lg"
              className="h-14 font-body-warm uppercase tracking-wide px-8 shadow-lg shadow-black/30 bg-clay hover:bg-clay/90 text-white transition-shadow hover:shadow-[0_12px_32px_-8px_hsl(var(--clay)/0.55)]"
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

        <div
          ref={hint.ref}
          className={cn('mt-12 sm:mt-16 lg:mt-20 flex w-full justify-center lg:justify-start', reveal(hint.visible))}
          style={{ transitionDelay: '500ms' }}
        >
          <span className="text-[11px] sm:text-xs uppercase tracking-[3px] text-white/70">
            Role para descobrir
          </span>
        </div>
      </div>
    </section>
  );
};

export default StaticImageHero;
