import { Link } from 'react-router-dom';
import logo from '@/assets/logo-cantim.png';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function Footer() {
  const { ref, isVisible } = useScrollAnimation<HTMLElement>({ threshold: 0.2 });

  return (
    <footer
      ref={ref}
      className="bg-primary text-primary-foreground py-12"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="section-container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Cantim da Roça" className="h-10" />
            <div>
              <h3 className="text-xl font-heading font-bold">Cantim da Roça</h3>
              <p className="text-primary-foreground/60 text-sm mt-1">Saúde e bem-estar com produtos naturais. 🌿</p>
            </div>
          </div>
          <div className="text-sm text-primary-foreground/40 flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} Cantim da Roça</span>
            <Link
              to="/admin/login"
              className="hover:text-primary-foreground/70 transition-colors"
            >
              Área Administrativa
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
