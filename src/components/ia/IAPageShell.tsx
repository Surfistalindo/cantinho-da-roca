import { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faArrowLeft, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface IAPageShellProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; to?: string }[];
  backTo?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function IAPageShell({ title, subtitle, breadcrumbs = [], backTo, actions, children }: IAPageShellProps) {
  return (
    <div className="space-y-6 animate-fade-in-up min-w-0 max-w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2.5 min-w-0">
          <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground font-medium">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-primary/10 text-primary">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="h-2.5 w-2.5" />
            </span>
            <Link to="/admin/ia" className="hover:text-foreground transition-colors">Central de IA</Link>
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faChevronRight} className="h-2 w-2 opacity-60" />
                {b.to ? (
                  <Link to={b.to} className="hover:text-foreground transition-colors">{b.label}</Link>
                ) : (
                  <span className="text-foreground">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {backTo && (
              <Button asChild variant="ghost" size="icon" className="h-9 w-9 -ml-1 rounded-lg hover:bg-muted">
                <Link to={backTo} aria-label="Voltar">
                  <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-[24px] md:text-[26px] font-semibold tracking-tight text-foreground leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div className="min-w-0 max-w-full">{children}</div>
    </div>
  );
}
