import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarsStaggered, faXmark } from '@fortawesome/free-solid-svg-icons';
import logo from '@/assets/logo-cantim.png';

const links = [
  { label: 'Início', href: '#inicio' },
  { label: 'Benefícios', href: '#beneficios' },
  { label: 'Produtos', href: '#produtos' },
  { label: 'Depoimentos', href: '#depoimentos' },
  { label: 'Contato', href: '#contato' },
];

interface NavbarProps {
  scrollY?: number;
}

export default function Navbar({ scrollY: _scrollY }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const showNavbar = scrollY > 150;
  const navbarOpacity = Math.min(1, Math.max(0, (scrollY - 100) / 100));
  const navbarTranslateY = showNavbar ? 0 : -100;

  const handleClick = (href: string) => {
    setOpen(false);
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        opacity: navbarOpacity,
        transform: `translateY(${navbarTranslateY}%)`,
        transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
        pointerEvents: showNavbar ? 'auto' : 'none',
      }}
    >
      <div
        className="absolute inset-0 bg-[#f7f5f0]/85 backdrop-blur-xl shadow-lg shadow-black/[0.03]"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      />
      <div className="section-container relative flex items-center justify-between h-16 sm:h-[72px]">
        <div className="flex items-center h-full">
          <img
            src={logo}
            alt="Cantim da Roça"
            className="h-[136px] sm:h-[136px]"
            style={{
              opacity: showNavbar ? 1 : 0,
              transform: showNavbar ? 'scale(1)' : 'scale(0.8)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map((l, i) => (
            <li key={l.href}>
              <button
                onClick={() => handleClick(l.href)}
                className="text-sm font-medium text-foreground/60 hover:text-primary transition-colors tracking-wide relative group"
                style={{
                  opacity: showNavbar ? 1 : 0,
                  transform: showNavbar ? 'translateY(0)' : 'translateY(-8px)',
                  transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s`,
                }}
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-300" />
              </button>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground/70 relative"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <FontAwesomeIcon icon={open ? faXmark : faBarsStaggered} className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      <div
        className="md:hidden overflow-hidden"
        style={{
          maxHeight: open ? '400px' : '0',
          opacity: open ? 1 : 0,
          transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        }}
      >
        <div className="bg-[#f7f5f0]/95 backdrop-blur-xl border-t border-border/30">
          <ul className="flex flex-col py-4">
            {links.map((l, i) => (
              <li key={l.href}>
                <button
                  onClick={() => handleClick(l.href)}
                  className="w-full text-left px-6 py-3 text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors font-medium"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 0.3s ease ${i * 0.06}s`,
                  }}
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
