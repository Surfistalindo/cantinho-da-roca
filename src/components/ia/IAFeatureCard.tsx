import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faLock } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface IAFeatureCardProps {
  icon: IconDefinition;
  title: string;
  description: string;
  status: 'available' | 'soon';
  to?: string;
  accentClass?: string;
}

export default function IAFeatureCard({ icon, title, description, status, to, accentClass = 'from-primary/15 to-primary/5 text-primary' }: IAFeatureCardProps) {
  const isAvailable = status === 'available' && to;
  const Wrapper: any = isAvailable ? Link : 'div';
  const props = isAvailable ? { to } : {};

  return (
    <Wrapper
      {...props}
      className={cn(
        'group relative block rounded-xl border bg-card p-5 transition-all',
        isAvailable
          ? 'border-border hover:border-primary/40 hover:shadow-md cursor-pointer'
          : 'border-dashed border-border/60 opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br', accentClass)}>
          <FontAwesomeIcon icon={icon} className="h-5 w-5" />
        </div>
        {status === 'available' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-soft text-success text-[10px] font-medium uppercase tracking-wider">
            Disponível
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
            <FontAwesomeIcon icon={faLock} className="h-2.5 w-2.5" />
            Em breve
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-3">{description}</p>
      {isAvailable && (
        <div className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-primary group-hover:gap-2.5 transition-all">
          Abrir
          <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
        </div>
      )}
    </Wrapper>
  );
}
