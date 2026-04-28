import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useCrmTheme } from '@/hooks/useCrmTheme';
import { MSym } from './MSym';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
}

/**
 * CRM-only theme toggle. Light <-> Focus Dark.
 * Renders a single icon-button with smooth icon swap.
 */
export default function ThemeToggle({ className }: Props) {
  const { theme, toggle } = useCrmTheme();
  const isDark = theme === 'dark';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
            className,
          )}
        >
          <MSym name={isDark ? 'light_mode' : 'dark_mode'} size={18} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{isDark ? 'Tema claro' : 'Modo focus (escuro)'}</TooltipContent>
    </Tooltip>
  );
}
