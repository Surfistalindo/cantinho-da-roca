import React, { useEffect, useRef } from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import logo from '@/assets/logo-cantim.png';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

const HeroSection: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = (window.innerWidth / 2 - e.pageX) / 25;
      const y = (window.innerHeight / 2 - e.pageY) / 25;

      canvas.style.transform = `rotateX(${55 + y / 2}deg) rotateZ(${-25 + x / 2}deg)`;

      layersRef.current.forEach((layer, index) => {
        if (!layer) return;
        const depth = (index + 1) * 15;
        const moveX = x * (index + 1) * 0.2;
        const moveY = y * (index + 1) * 0.2;
        layer.style.transform = `translateZ(${depth}px) translate(${moveX}px, ${moveY}px)`;
      });
    };

    canvas.style.opacity = '0';
    canvas.style.transform = 'rotateX(90deg) rotateZ(0deg) scale(0.8)';

    const timeout = setTimeout(() => {
      canvas.style.transition = 'all 2.5s cubic-bezier(0.16, 1, 0.3, 1)';
      canvas.style.opacity = '1';
      canvas.style.transform = 'rotateX(55deg) rotateZ(-25deg) scale(1)';
    }, 300);

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        @keyframes flow {
          0%, 100% { transform: scaleY(0); transform-origin: top; }
          50% { transform: scaleY(1); transform-origin: top; }
          51% { transform: scaleY(1); transform-origin: bottom; }
        }
      `}</style>

      <section
        className="relative w-full min-h-screen overflow-hidden flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #1a1a18 0%, #0a0a08 100%)' }}
      >
        {/* SVG Filter for Grain */}
        <svg className="hidden">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </svg>

        {/* Grain overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-[100]"
          style={{ filter: 'url(#grain)', opacity: 0.04, mixBlendMode: 'overlay' }}
        />

        {/* UI Overlay */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Top bar */}
          <div className="flex justify-between items-start p-6 sm:p-10">
            <p
              className="text-white/80 text-xs sm:text-sm tracking-[0.3em] uppercase pointer-events-auto"
              style={{ fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace" }}
            >
              CANTIM_DA_ROÇA
            </p>

            <div className="text-right" style={{ fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace" }}>
              <p className="text-[#22c55e] text-[10px] sm:text-xs tracking-wider">PROD. NATURAIS</p>
              <p className="text-[#22c55e] text-[10px] sm:text-xs tracking-wider">& SUPLEMENTOS</p>
            </div>
          </div>

          {/* Title overlay */}
          <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2">
            <h1
              className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white leading-[0.9] tracking-tight"
              style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
            >
              CANTIM
              <br />
              DA ROÇA
            </h1>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex justify-between items-end">
            <div style={{ fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace" }}>
              <p className="text-white/40 text-[10px] sm:text-xs tracking-wider uppercase">
                [ SAÚDE NATURAL ]
              </p>
              <p className="text-white/40 text-[10px] sm:text-xs tracking-wider uppercase mt-1">
                CHÁS, TEMPEROS & SUPLEMENTOS
              </p>
            </div>

            <div className="flex gap-3 pointer-events-auto">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <button className="bg-white text-[#0a0a08] px-5 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold tracking-wider uppercase hover:bg-white/90 transition-all flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WHATSAPP
                </button>
              </a>
              <button
                onClick={scrollToProducts}
                className="border border-white/20 text-white px-5 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-medium tracking-wider uppercase hover:bg-white/5 transition-all flex items-center gap-2"
              >
                PRODUTOS
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div className="relative" style={{ perspective: '1200px', perspectiveOrigin: '50% 50%' }}>
          <div
            ref={canvasRef}
            className="relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(55deg) rotateZ(-25deg)',
              width: 'clamp(320px, 55vw, 700px)',
              height: 'clamp(220px, 40vw, 500px)',
            }}
          >
            {/* Layer 0: Base shadow */}
            <div
              className="absolute inset-0 bg-black/40 blur-2xl"
              style={{ transform: 'translateZ(-10px) scale(1.1)' }}
            />

            {/* Layer 1: Logo image */}
            <div
              ref={(el) => (layersRef.current[0] = el!)}
              className="absolute inset-0 overflow-hidden"
              style={{ transform: 'translateZ(15px)', backfaceVisibility: 'hidden' }}
            >
              <img
                src={logo}
                alt="Cantim da Roça"
                className="w-full h-full object-contain bg-white/95 p-8 sm:p-12"
              />
              {/* Vignette */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, transparent 30%, rgba(0,0,0,0.3) 100%)',
                }}
              />
            </div>

            {/* Layer 2: Scan line effect */}
            <div
              ref={(el) => (layersRef.current[1] = el!)}
              className="absolute inset-0 pointer-events-none"
              style={{ transform: 'translateZ(30px)' }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)',
                }}
              />
            </div>

            {/* Layer 3: Animated accent line */}
            <div
              ref={(el) => (layersRef.current[2] = el!)}
              className="absolute left-0 top-0 w-[2px] h-full pointer-events-none"
              style={{ transform: 'translateZ(45px)' }}
            >
              <div
                className="w-full h-full bg-[#22c55e]"
                style={{ animation: 'flow 4s ease-in-out infinite' }}
              />
            </div>

            {/* Border frame */}
            <div
              className="absolute inset-0 border border-white/10 pointer-events-none"
              style={{ transform: 'translateZ(50px)' }}
            />
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a08] to-transparent z-10" />
      </section>
    </>
  );
};

export default HeroSection;
