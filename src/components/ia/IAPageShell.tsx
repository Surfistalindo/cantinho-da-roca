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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2 min-w-0">
          <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3 w-3 text-primary" />
            <Link to="/admin/ia" className="hover:text-foreground transition-colors">IA</Link>
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faChevronRight} className="h-2.5 w-2.5" />
                {b.to ? <Link to={b.to} className="hover:text-foreground transition-colors">{b.label}</Link> : <span className="text-foreground">{b.label}</span>}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {backTo && (
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 -ml-1">
                <Link to={backTo} aria-label="Voltar">
                  <FontAwesomeIcon icon={faArrowLeft} className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{title}</h1>
              {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
