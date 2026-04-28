import { cn } from '@/lib/utils';

export interface PageTab {
  value: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: PageTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Abas horizontais estilo Monday: pill underline azul.
 * Componente puramente visual e controlado — não roteia.
 */
export default function PageTabs({ tabs, value, onChange, className }: Props) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-border overflow-x-auto', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative h-9 px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5',
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className={cn(
                'inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded text-[10px] font-semibold',
                active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
              )}>
                {tab.count}
              </span>
            )}
            {active && (
              <span className="absolute inset-x-1 -bottom-px h-[2px] rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
