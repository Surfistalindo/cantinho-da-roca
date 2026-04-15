import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faArrowRightLong, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import logo from '@/assets/logo-cantim.png';
import { APP_CONFIG } from '@/config/app';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Vim pelo site 🌿')}`;
const instagramUrl = 'https://instagram.com/cantimdarocaa';

const sections = [
  {
    title: 'Produtos',
    links: [
      { label: 'Chás Naturais', href: '#produtos' },
      { label: 'Temperos', href: '#produtos' },
      { label: 'Artesanais', href: '#produtos' },
      { label: 'Suplementos', href: '#produtos' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nós', href: '#beneficios' },
      { label: 'Depoimentos', href: '#depoimentos' },
      { label: 'Contato', href: '#contato' },
    ],
  },
  {
    title: 'Conecte-se',
    links: [
      { label: 'WhatsApp', href: whatsappUrl, external: true },
      { label: 'Instagram', href: instagramUrl, external: true },
    ],
  },
];

export default function Footer() {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>({ threshold: 0.1 });

  const handleAnchor = (href: string) => {
    if (href.startsWith('#')) {
      const id = href.replace('#', '');
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      ref={ref}
      className="relative bg-[#1a2e1a] text-white/90 overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="section-container relative py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt="Cantim da Roça" className="h-12 brightness-0 invert" />
              <span className="text-xl font-heading font-bold tracking-tight">Cantim da Roça</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-8">
              Produtos naturais selecionados com cuidado pra quem quer viver com mais saúde, energia e bem-estar. 🌿
            </p>

            {/* Addresses */}
            <div className="space-y-4 mb-8">
              <div className="flex gap-2.5">
                <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-white/40 text-xs leading-relaxed">
                  <p className="text-white/60 font-semibold text-sm mb-0.5">Unidade 1</p>
                  Centro, Rua B, 22, Loja 10.<br />Lot. Encanto das Árvores
                </div>
              </div>
              <div className="flex gap-2.5">
                <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-white/40 text-xs leading-relaxed">
                  <p className="text-white/60 font-semibold text-sm mb-0.5">Unidade 2</p>
                  CIA 2, Av Via Universitária, 347.<br />Shopping Vivaz Center - Loja 03
                </div>
              </div>
              <p className="text-white/40 text-xs ml-6">Simões Filho / BA</p>
            </div>

            {/* WhatsApp CTA */}
            <div className="flex items-center gap-0 max-w-xs">
              <div className="flex-1 relative">
                <FontAwesomeIcon icon={faCommentDots} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  placeholder="Fale conosco no WhatsApp"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-l-lg py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors cursor-pointer"
                  readOnly
                  onClick={() => window.open(whatsappUrl, '_blank')}
                />
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/80 text-primary-foreground px-4 py-2.5 rounded-r-lg transition-colors flex items-center"
              >
                <FontAwesomeIcon icon={faArrowRightLong} className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {sections.map((section) => (
            <div key={section.title} className="lg:col-span-2">
              <h4
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-5"
                style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}
              >
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                      >
                        <span className="h-px w-0 bg-primary group-hover:w-3 transition-all duration-300" />
                        {link.label}
                      </a>
                    ) : (
                      <button
                        onClick={() => handleAnchor(link.href)}
                        className="group flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                      >
                        <span className="h-px w-0 bg-primary group-hover:w-3 transition-all duration-300" />
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p
            className="text-white/20 text-xs tracking-wider"
            style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}
          >
            // &copy; {new Date().getFullYear()} CANTIM_DA_ROÇA
          </p>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-primary transition-colors">
                <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4" />
              </a>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-white/25 hover:text-primary transition-colors">
                <FontAwesomeIcon icon={faInstagram} className="h-4 w-4" />
              </a>
            </div>

            <span className="h-3 w-px bg-white/10" />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-white/30 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Online
              </div>
              <Link to="/admin/login" className="text-white/15 hover:text-white/40 text-xs transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
