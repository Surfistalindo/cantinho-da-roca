import React from 'react';
import { MessageCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import logo from '@/assets/logo-cantim.png';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [productsOpen, setProductsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClickOutside);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen bg-[#0a0a08] overflow-hidden">
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,102,51,0.15)_0%,_transparent_70%)]" />

      {/* Navbar */}
      <nav className="relative z-20 w-full border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex-shrink-0">
              <img src={logo} alt="Cantim da Roça" className="h-10 sm:h-12 brightness-0 invert" />
            </a>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition">
                Início
              </a>
              <div className="relative">
                <button
                  onClick={() => setProductsOpen(!productsOpen)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition"
                >
                  Produtos
                  <ChevronDown className={`h-4 w-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
                </button>
                {productsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-[#1a1a18] rounded-xl shadow-lg border border-white/10 py-2 z-50">
                    <a href="#produtos" onClick={() => setProductsOpen(false)} className="block px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition">
                      Chás Naturais
                    </a>
                    <a href="#produtos" onClick={() => setProductsOpen(false)} className="block px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition">
                      Temperos
                    </a>
                    <a href="#produtos" onClick={() => setProductsOpen(false)} className="block px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition">
                      Suplementos
                    </a>
                    <a href="#produtos" onClick={() => setProductsOpen(false)} className="block px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition">
                      Grãos e Cereais
                    </a>
                  </div>
                )}
              </div>
              <a href="#depoimentos" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition">
                Depoimentos
              </a>
              <a href="#contato" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white rounded-lg hover:bg-white/5 transition">
                Contato
              </a>
            </div>

            {/* Desktop CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 bg-white hover:bg-white/90 text-[#0a0a08] px-5 py-2.5 rounded-lg text-sm font-medium transition"
            >
              <MessageCircle className="h-4 w-4" />
              Fale Conosco
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition"
              aria-label="Abrir menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="14" x2="20" y2="14" />
                <line x1="4" y1="20" x2="20" y2="20" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-[#0a0a08] md:hidden">
            <div ref={menuRef} className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
                <img src={logo} alt="Cantim da Roça" className="h-10 brightness-0 invert" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-white p-2 rounded-lg hover:bg-white/10 transition"
                  aria-label="Fechar menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col p-4 gap-1">
                <a href="#" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-base font-medium text-white rounded-lg hover:bg-white/5 transition">
                  Início
                </a>
                <a href="#produtos" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-base font-medium text-white rounded-lg hover:bg-white/5 transition">
                  Produtos
                </a>
                <a href="#depoimentos" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-base font-medium text-white rounded-lg hover:bg-white/5 transition">
                  Depoimentos
                </a>
                <a href="#contato" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-base font-medium text-white rounded-lg hover:bg-white/5 transition">
                  Contato
                </a>
              </div>
              <div className="mt-auto p-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full py-3 rounded-lg text-base font-semibold transition shadow-lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Announcement pill */}
      <div className="relative z-10 flex justify-center pt-12 sm:pt-16 pb-6">
        <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2 backdrop-blur-sm">
          <span className="text-sm text-white/70">Produtos 100% naturais com entrega para todo Brasil</span>
          <a href="#produtos" className="text-sm text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
            Ver mais
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex items-center justify-center px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-8">
            Saúde e bem-estar com produtos{' '}
            <span className="italic">naturais</span>
          </h1>

          <p className="text-base sm:text-lg text-white/50 mb-12 leading-relaxed max-w-xl mx-auto">
            Chás, temperos e suplementos naturais selecionados pra cuidar da sua saúde. Atendimento próximo, personalizado e com carinho. 💚
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-[#0a0a08] px-8 py-3.5 rounded-full text-base font-semibold transition">
                <MessageCircle className="h-5 w-5" />
                Falar no WhatsApp
              </button>
            </a>
            <button
              onClick={scrollToProducts}
              className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 hover:bg-white/5 text-white px-8 py-3.5 rounded-full text-base font-medium transition"
            >
              Conhecer produtos
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
