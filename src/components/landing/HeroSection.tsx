import React, { useEffect, useRef } from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import logo from '@/assets/logo-cantim.png';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

interface HeroSectionProps {
  scrollY: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ scrollY }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement[]>([]);

  // Parallax values based on scroll
  const heroOpacity = Math.max(0, 1 - scrollY / 600);
  const heroTranslateY = scrollY * 0.3;
  const titleScale = Math.max(0.85, 1 - scrollY / 2000);

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
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <section
        id="inicio"
        className="relative w-full min-h-screen overflow-hidden flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #f7f5f0 0%, #eef5ee 40%, #f0f7f0 100%)' }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(125 47% 33%) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Parallax content wrapper */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            opacity: heroOpacity,
            transform: `translate3d(0, ${heroTranslateY}px, 0)`,
            willChange: 'transform, opacity',
          }}
        >
          {/* Top bar */}
          <div className="flex justify-between items-start px-6 sm:px-10 pt-20 sm:pt-24">
            <p
              className="text-foreground/60 text-xs sm:text-sm tracking-[0.3em] uppercase pointer-events-auto font-medium"
              style={{ fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace" }}
            >
              CANTIM_DA_ROÇA
            </p>
            <div className="text-right" style={{ fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace" }}>
              <p className="text-primary/70 text-[10px] sm:text-xs tracking-wider">PROD. NATURAIS</p>
              <p className="text-primary/70 text-[10px] sm:text-xs tracking-wider">& SUPLEMENTOS</p>
            </div>
          </div>

          {/* Title */}
          <div
            className="absolute left-6 sm:left-10 top-[52%] -translate-y-1/2"
            style={{
              transform: `translateY(-50%) scale(${titleScale})`,
              transformOrigin: 'left center',
            }}
          >
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-foreground leading-[0.9] tracking-tight">
              CANTIM
              <br />
              <span className="text-primary">DA ROÇA</span>
            </h1>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex justify-between items-end">
            <div style={{ fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace" }}>
              <p className="text-foreground/30 text-[10px] sm:text-xs tracking-wider uppercase">
                [ SAÚDE NATURAL ]
              </p>
              <p className="text-foreground/30 text-[10px] sm:text-xs tracking-wider uppercase mt-1">
                ATENDIMENTO PERSONALIZADO
              </p>
            </div>

            <div className="flex gap-3 pointer-events-auto">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <button className="bg-primary text-primary-foreground px-5 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold tracking-wider uppercase hover:bg-primary/90 transition-all flex items-center gap-2 rounded-md shadow-lg shadow-primary/20">
                  <MessageCircle className="h-4 w-4" />
                  WHATSAPP
                </button>
              </a>
              <button
                onClick={scrollToProducts}
                className="border border-foreground/20 text-foreground px-5 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm font-medium tracking-wider uppercase hover:bg-foreground/5 transition-all flex items-center gap-2 rounded-md"
              >
                PRODUTOS
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3D Canvas */}
        <div
          className="relative mt-10 sm:mt-16"
          style={{
            perspective: '1200px',
            perspectiveOrigin: '50% 50%',
            opacity: heroOpacity,
            transform: `translate3d(0, ${heroTranslateY * 0.5}px, 0)`,
            willChange: 'transform, opacity',
          }}
        >
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
            {/* Shadow */}
            <div
              className="absolute inset-0 blur-2xl"
              style={{ transform: 'translateZ(-10px) scale(1.1)', background: 'rgba(34,102,51,0.1)' }}
            />

            {/* Logo image */}
            <div
              ref={(el) => (layersRef.current[0] = el!)}
              className="absolute inset-0 overflow-hidden rounded-lg"
              style={{ transform: 'translateZ(15px)', backfaceVisibility: 'hidden' }}
            >
              <div className="w-full h-full bg-white flex items-center justify-center p-8 sm:p-12">
                <img src={logo} alt="Cantim da Roça" className="w-full h-full object-contain" />
              </div>
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(34,102,51,0.08) 100%)' }}
              />
            </div>

            {/* Scan lines */}
            <div
              ref={(el) => (layersRef.current[1] = el!)}
              className="absolute inset-0 pointer-events-none rounded-lg"
              style={{ transform: 'translateZ(30px)' }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(34,102,51,0.03) 3px, rgba(34,102,51,0.03) 4px)',
                }}
              />
            </div>

            {/* Accent line */}
            <div
              ref={(el) => (layersRef.current[2] = el!)}
              className="absolute left-0 top-0 w-[2px] h-full pointer-events-none"
              style={{ transform: 'translateZ(45px)' }}
            >
              <div
                className="w-full h-full bg-primary"
                style={{ animation: 'flow 4s ease-in-out infinite' }}
              />
            </div>

            {/* Border */}
            <div
              className="absolute inset-0 border border-primary/15 rounded-lg pointer-events-none"
              style={{ transform: 'translateZ(50px)' }}
            />
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f7f5f0] to-transparent z-10" />
      </section>
    </>
  );
};

export default HeroSection;
