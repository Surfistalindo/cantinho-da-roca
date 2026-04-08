import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="section-container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h3 className="text-xl font-heading font-bold">Cantinho da Roça</h3>
            <p className="text-primary-foreground/60 text-sm mt-1">O melhor do campo para sua mesa.</p>
          </div>
          <div className="text-sm text-primary-foreground/40 flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} Cantinho da Roça</span>
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
