import { Button } from '@/components/ui/button';

export default function HeroSection() {
  const scrollToForm = () => {
    document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70" />
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')]" />
      
      <div className="section-container relative z-10 py-20">
        <div className="max-w-2xl">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium tracking-wide uppercase bg-primary-foreground/15 text-primary-foreground rounded-full backdrop-blur-sm">
            Direto do produtor para você
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
            O sabor autêntico da <span className="italic">roça</span> na sua mesa
          </h1>
          <p className="text-lg sm:text-xl text-primary-foreground/85 mb-8 font-body leading-relaxed max-w-xl">
            Produtos artesanais, frescos e feitos com carinho. Descubra o melhor do campo e transforme suas refeições.
          </p>
          <Button variant="hero" size="lg" onClick={scrollToForm}>
            Quero conhecer
          </Button>
        </div>
      </div>
    </section>
  );
}
