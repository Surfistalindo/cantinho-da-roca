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
    <section className="relative min-h-screen bg-gradient-to-b from-[#f0f7f0] to-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0iIzIyNjYzMyIvPjwvc3ZnPg==')]" />

      {/* Navbar */}
      <nav className="relative z-20 w-full border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex-shrink-0">
              <img src={logo} alt="Cantim da Roça" className="h-10 sm:h-12" />
            </a>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              <a href="#" className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-lg hover:bg-primary/5 transition">
                Início
              </a>

              {/* Products dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProductsOpen(!productsOpen)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-lg hover:bg-primary/5 transition"
                >
                  Produtos
                  <ChevronDown className={`h-4 w-4 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
                </button>
                {productsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-border py-2 z-50">
                    <a href="#produtos" onClick={() => setProductsOpen(false)} className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/5 hover:text-foreground transition">
                      Chás Naturais
                    </a>
                    <a href="#produtos" onClick={() => setProductsOpen(false)} className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/5 hover:text-foreground transition">
                      Temperos
                    </a>
                    <a href="#produtos" onClick={() => setProductsOpen(false)} className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/5 hover:text-foreground transition">
                      Suplementos
                    </a>
                    <a href="#produtos" onClick={() => setProductsOpen(false)} className="block px-4 py-2 text-sm text-foreground/80 hover:bg-primary/5 hover:text-foreground transition">
                      Grãos e Cereais
                    </a>
                  </div>
                )}
              </div>

              <a href="#depoimentos" className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-lg hover:bg-primary/5 transition">
                Depoimentos
              </a>
              <a href="#contato" className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground rounded-lg hover:bg-primary/5 transition">
                Contato
              </a>

              {/* Close button (hidden on desktop, visible in mobile) */}
            </div>

            {/* Desktop CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium transition"
            >
              <MessageCircle className="h-4 w-4" />
              Fale Conosco
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden text-foreground p-2 rounded-lg hover:bg-primary/5 transition"
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
          <div className="fixed inset-0 z-50 bg-white md:hidden">
            <div ref={menuRef} className="flex flex-col h-full">
              <div className="flex items-center justify-between px-4 h-16 border-b border-border">
                <img src={logo} alt="Cantim da Roça" className="h-10" />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-foreground p-2 rounded-lg hover:bg-primary/5 transition"
                  aria-label="Fechar menu"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col p-4 gap-1">
                <a href="#" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-base font-medium text-foreground rounded-lg hover:bg-primary/5 transition">
                  Início
                </a>
                <a href="#produtos" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-base font-medium text-foreground rounded-lg hover:bg-primary/5 transition">
                  Produtos
                </a>
                <a href="#depoimentos" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-base font-medium text-foreground rounded-lg hover:bg-primary/5 transition">
                  Depoimentos
                </a>
                <a href="#contato" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-base font-medium text-foreground rounded-lg hover:bg-primary/5 transition">
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

      {/* Announcement bar */}
      <div className="relative z-10 flex justify-center py-4 sm:py-6">
        <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-full px-4 py-1.5">
          <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">Novo</span>
          <span className="text-xs sm:text-sm text-foreground/70">Produtos naturais com entrega para todo Brasil</span>
          <a href="#produtos" className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            Ver mais
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
            Saúde e bem-estar com produtos{' '}
            <span className="text-primary">naturais</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed max-w-xl mx-auto">
            Chás, temperos e suplementos naturais selecionados pra cuidar da sua saúde. Atendimento próximo, personalizado e com carinho. 💚
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-lg text-base font-semibold transition shadow-lg shadow-primary/20">
                <MessageCircle className="h-5 w-5" />
                Falar no WhatsApp
              </button>
            </a>
            <button
              onClick={scrollToProducts}
              className="inline-flex items-center justify-center gap-2 border border-border hover:bg-primary/5 text-foreground px-8 py-3.5 rounded-lg text-base font-medium transition"
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
