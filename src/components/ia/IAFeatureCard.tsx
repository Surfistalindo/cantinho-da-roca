import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faLock, faSparkles } from '@fortawesome/free-solid-svg-icons';
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
  tag?: string; // e.g. "Inteligente", "Automatizado"
}

export default function IAFeatureCard({
  icon,
  title,
  description,
  status,
  to,
  accentClass = 'from-primary/15 to-primary/5 text-primary',
  tag,
}: IAFeatureCardProps) {
  const isAvailable = status === 'available' && to;
  const Wrapper: any = isAvailable ? Link : 'div';
  const props = isAvailable ? { to } : {};

  return (
    <Wrapper
      {...props}
      className={cn(
        'group relative block rounded-2xl border bg-card p-5 ia-card-lift overflow-hidden',
        isAvailable
          ? 'border-border hover:border-primary/40 cursor-pointer ia-active-glow'
          : 'border-dashed border-border/70 opacity-80',
      )}
    >
      {/* Top row: icon + status pill */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br ring-1 ring-inset',
            accentClass,
            isAvailable ? 'ring-border/40' : 'ring-border/30',
          )}
        >
          <FontAwesomeIcon icon={icon} className="h-[18px] w-[18px]" />
        </div>

        {status === 'available' ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-success-soft text-success text-[10px] font-semibold uppercase tracking-[0.08em]">
            <span className="relative h-1.5 w-1.5 rounded-full bg-success ia-dot-live" />
            Disponível
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.08em]">
            <FontAwesomeIcon icon={faLock} className="h-2 w-2" />
            Em breve
          </span>
        )}
      </div>

      {/* Title + tag */}
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <h3 className="text-[15.5px] font-semibold text-foreground tracking-tight">{title}</h3>
        {tag && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/8 text-primary text-[9.5px] font-medium uppercase tracking-wider">
            <FontAwesomeIcon icon={faSparkles} className="h-2 w-2" />
            {tag}
          </span>
        )}
      </div>

      <p className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-3 min-h-[54px]">
        {description}
      </p>

      {isAvailable && (
        <div className="mt-4 pt-4 border-t border-border/70 flex items-center justify-between">
          <span className="text-[12px] font-semibold text-primary inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
            Abrir módulo
            <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
            v1.0
          </span>
        </div>
      )}
    </Wrapper>
  );
}
