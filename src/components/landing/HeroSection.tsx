import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import logo from '@/assets/logo-cantim.png';

const whatsappUrl = `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encodeURIComponent('Olá! Quero saber mais sobre os produtos do Cantim da Roça 🌿')}`;

export default function HeroSection() {
  const scrollToProducts = () => {
    document.getElementById('produtos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
      <div className="absolute inset-0 opacity-[0.06] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMyIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />

      <div className="section-container relative z-10 py-20">
        <div className="max-w-2xl">
          <img src={logo} alt="Cantim da Roça" className="h-24 sm:h-28 mb-6 drop-shadow-lg" />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Saúde e bem-estar com produtos{' '}
            <span className="text-highlight">100% naturais</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/85 mb-8 leading-relaxed max-w-xl">
            Chás, temperos e produtos naturais selecionados pra cuidar da sua saúde. Atendimento próximo, personalizado e com carinho. 💚
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
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
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              Conhecer produtos
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
