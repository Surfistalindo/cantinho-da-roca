import React from 'react';
import { MessageCircle, ArrowDown } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import heroImg from '@/assets/hero-products.jpg';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

interface HeroSectionProps {
  scrollY: number;
}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="inicio"
      className="relative w-full min-h-screen flex items-center"
      style={{ background: 'linear-gradient(160deg, #f7f5f0 0%, #eef5ee 40%, #f0f7f0 100%)' }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Text */}
        <div className="flex flex-col gap-6 sm:gap-8 z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-foreground leading-tight">
            Mais disposição, menos inchaço e{' '}
            <span className="text-primary">bem-estar no dia a dia</span>
          </h1>

          <p className="text-base sm:text-lg text-foreground/70 max-w-lg leading-relaxed">
            Produtos naturais com orientação direta pelo WhatsApp, sem complicação.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <button className="bg-[#25D366] text-white px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-semibold hover:bg-[#20bd5a] transition-colors flex items-center gap-2.5 rounded-lg shadow-md">
                <MessageCircle className="h-5 w-5" />
                Falar no WhatsApp
              </button>
            </a>
            <button
              onClick={scrollToProducts}
              className="border border-foreground/20 text-foreground px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-medium hover:bg-foreground/5 transition-colors flex items-center gap-2 rounded-lg"
            >
              Ver produtos
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src={heroImg}
              alt="Produtos naturais - chás, suplementos e ervas sobre mesa de madeira"
              width={1920}
              height={1080}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f7f5f0] to-transparent" />
    </section>
  );
};

export default HeroSection;
