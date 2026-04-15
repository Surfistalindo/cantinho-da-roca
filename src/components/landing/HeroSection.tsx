import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight, Leaf, ChevronDown } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import logo from '@/assets/logo-cantim.png';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

export default function HeroSection() {
  const [menuOpen, setMenuOpen] = React.useState(false);
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

  const scrollToContact = () => {
    document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[85vh] flex flex-col overflow-hidden bg-gradient-to-br from-primary to-primary/80">
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />

      {/* Navbar */}
      <nav className="relative z-20 w-full">
        <div className="section-container">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <img src={logo} alt="Cantim da Roça" className="h-10 sm:h-12 drop-shadow-md" />
            </a>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#produtos" className="text-sm text-white/80 hover:text-white transition-colors font-medium">
                Produtos
              </a>
              <a href="#beneficios" className="text-sm text-white/80 hover:text-white transition-colors font-medium">
                Benefícios
              </a>
              <a href="#depoimentos" className="text-sm text-white/80 hover:text-white transition-colors font-medium">
                Depoimentos
              </a>
              <a href="#contato" className="text-sm text-white/80 hover:text-white transition-colors font-medium">
                Contato
              </a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" size="sm" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-white p-2 rounded-md hover:bg-white/10 transition"
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

        {/* Mobile menu overlay */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-primary/95 backdrop-blur-sm md:hidden">
            <div ref={menuRef} className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between mb-8">
                <img src={logo} alt="Cantim da Roça" className="h-10" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-white p-2 rounded-md hover:bg-white/10 transition"
                  aria-label="Fechar menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-6">
                <a href="#produtos" onClick={() => setMenuOpen(false)} className="text-lg text-white/90 hover:text-white transition-colors font-medium">
                  Produtos
                </a>
                <a href="#beneficios" onClick={() => setMenuOpen(false)} className="text-lg text-white/90 hover:text-white transition-colors font-medium">
                  Benefícios
                </a>
                <a href="#depoimentos" onClick={() => setMenuOpen(false)} className="text-lg text-white/90 hover:text-white transition-colors font-medium">
                  Depoimentos
                </a>
                <a href="#contato" onClick={() => setMenuOpen(false)} className="text-lg text-white/90 hover:text-white transition-colors font-medium">
                  Contato
                </a>
              </div>
              <div className="mt-auto">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="whatsapp" size="lg" className="w-full gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Falar no WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Announcement bar */}
      <div className="relative z-10 flex justify-center py-3">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
          <Leaf className="h-3.5 w-3.5 text-highlight" />
          <span className="text-xs sm:text-sm text-white/90">Produtos 100% naturais com entrega para todo Brasil</span>
          <a href="#produtos" className="text-xs text-highlight hover:text-highlight/80 font-medium flex items-center gap-1 ml-1">
            Ver mais
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="section-container py-12 sm:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Saúde e bem-estar com produtos{' '}
              <span className="text-highlight">100% naturais</span>
            </h1>
            <p className="text-base sm:text-lg text-white/80 mb-10 leading-relaxed max-w-xl mx-auto">
              Chás, temperos e suplementos naturais selecionados pra cuidar da sua saúde. Atendimento próximo, personalizado e com carinho. 💚
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="hero" size="lg" className="w-full sm:w-auto gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Falar no WhatsApp
                </Button>
              </a>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToProducts}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white gap-2"
              >
                Conhecer produtos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
