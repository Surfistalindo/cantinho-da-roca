import { cn } from '@/lib/utils';

interface Props {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Wrap body in horizontal-scroll container (default true) */
  scroll?: boolean;
}

/**
 * Painel "board" estilo Monday: header com título/ações, toolbar
 * opcional e corpo com scroll horizontal. Apenas estrutura visual.
 */
export default function DataBoard({
  title,
  subtitle,
  actions,
  toolbar,
  children,
  className,
  bodyClassName,
  scroll = true,
}: Props) {
  return (
    <section className={cn('board-panel flex flex-col', className)}>
      {(title || actions || subtitle) && (
        <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold text-foreground leading-tight truncate">{title}</h2>
            )}
            {subtitle && (
              <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </header>
      )}
      {toolbar}
      <div
        className={cn(
          scroll ? 'overflow-x-auto' : '',
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
