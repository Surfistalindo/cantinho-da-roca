import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import logoImg from '@/assets/logo-cantim.png';

const VIDEO_SRC = '/hero-cantim-scroll.mp4';
const POSTER_SRC = '/hero-cantim-poster.webp';

const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
// Maps progress within [a, b] to 0..1
const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a));

const ScrollVideoHero: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const overlayTextRef = useRef<HTMLDivElement>(null);

  const [useStaticFallback, setUseStaticFallback] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const handleLoadedMetadata = () => {
      setIsVideoReady(true);
      try {
        v.pause();
        v.currentTime = Math.min(0.01, v.duration || 0.01);
        const playPromise = v.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.then(() => v.pause()).catch(() => v.pause());
        }
      } catch {}
    };

    const handleError = () => {
      setUseStaticFallback(true);
    };

    v.addEventListener('loadedmetadata', handleLoadedMetadata);
    v.addEventListener('error', handleError);

    if (v.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      v.load();
    }

    return () => {
      v.removeEventListener('loadedmetadata', handleLoadedMetadata);
      v.removeEventListener('error', handleError);
    };
  }, []);

  // Scroll-driven loop
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || useStaticFallback) return;

    let rafId = 0;
    let queued = false;
    let lastAppliedTime = -1;

    const update = () => {
      queued = false;
      const v = videoRef.current;
      if (!v || !isVideoReady || !v.duration || !Number.isFinite(v.duration)) return;

      const rect = wrapper.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const rawProgress = -rect.top / Math.max(1, total);
      const progress = clamp(rawProgress);

      const epsilon = Math.min(0.04, v.duration * 0.01);
      const targetTime = progress >= 1
        ? Math.max(v.duration - epsilon, 0)
        : progress <= 0
          ? 0.01
          : Math.min(v.duration * progress, v.duration - epsilon);

      if (Math.abs(targetTime - lastAppliedTime) > 0.016 && !v.seeking) {
        try {
          v.pause();
          v.currentTime = targetTime;
          lastAppliedTime = targetTime;
        } catch {}
      }

      // Headline 0.15 -> 0.45
      if (headlineRef.current) {
        const t = range(progress, 0.15, 0.45);
        headlineRef.current.style.opacity = String(t);
        headlineRef.current.style.transform = `translateY(${(1 - t) * 24}px)`;
      }

      // CTAs 0.35 -> 0.65
      if (ctaRef.current) {
        const t = range(progress, 0.35, 0.65);
        ctaRef.current.style.opacity = String(t);
        ctaRef.current.style.transform = `translateY(${(1 - t) * 16}px)`;
      }

      // Subtle text fade-out near the end
      if (overlayTextRef.current) {
        const t = range(progress, 0.85, 1);
        overlayTextRef.current.style.opacity = String(1 - t * 0.35);
      }
    };

    const schedule = () => {
      if (queued) return;
      queued = true;
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(rafId);
    };
  }, [isVideoReady, useStaticFallback]);

  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="inicio"
      ref={wrapperRef}
      className="relative w-full"
      style={{ height: '250vh' }}
      aria-label="Hero Cantim da Roça"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Background: video or static poster */}
        {useStaticFallback ? (
          <img
            src={POSTER_SRC}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={VIDEO_SRC}
            poster={POSTER_SRC}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
            disablePictureInPicture
          />
        )}

        {/* Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70 pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none mix-blend-soft-light"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.18)' }}
          aria-hidden="true"
        />

        {/* Content */}
        <div
          ref={overlayTextRef}
          className="relative z-10 flex h-full w-full flex-col"
        >
          {/* Logo top-left */}
          <div className="flex items-center justify-center sm:justify-start px-6 sm:px-10 pt-6 sm:pt-8 animate-fade-in">
            <img
              src={logoImg}
              alt="Cantim da Roça"
              className="h-auto w-[140px] sm:w-[160px] drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]"
              loading="eager"
            />
          </div>

          {/* Centered headline + CTAs */}
          <div className="flex-1 flex items-center justify-center px-6 sm:px-10">
            <div className="flex w-full max-w-5xl flex-col items-center text-center">
            <h1
              ref={headlineRef}
              className="max-w-[14ch] text-pretty text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.55)]"
              style={{
                fontFamily: "'Playfair Display', serif",
                opacity: 0,
                transform: 'translateY(24px)',
                willChange: 'opacity, transform',
              }}
            >
              Produtos naturais selecionados para cuidar de você
            </h1>

            <div
              ref={ctaRef}
              className="mt-7 flex w-full max-w-3xl flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center"
              style={{
                opacity: 0,
                transform: 'translateY(16px)',
                willChange: 'opacity, transform',
              }}
            >
              <Button
                size="lg"
                className="h-14 min-w-[240px] flex-1 uppercase tracking-wide px-8 shadow-lg shadow-black/30 sm:flex-none"
                onClick={scrollToProducts}
              >
                Conhecer produtos
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 min-w-[280px] flex-1 uppercase tracking-wide px-8 bg-white/10 backdrop-blur border-white/40 text-white hover:bg-white/20 hover:text-white sm:flex-none"
                asChild
              >
                <a
                  href="https://wa.me/5500000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
            </div>
          </div>

          {/* Subtle bottom hint */}
          <div className="pb-6 sm:pb-8 flex justify-center">
            <span className="text-[11px] sm:text-xs uppercase tracking-[3px] text-white/60">
              Role para descobrir
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScrollVideoHero;
