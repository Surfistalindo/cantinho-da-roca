import { cn } from '@/lib/utils';

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Avatar circular gerado pelas iniciais do nome.
 * Cor de fundo determinística (hash do nome) para variar.
 */
export default function InitialsAvatar({ name, size = 'md', className }: Props) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

  // Hash determinístico simples → escolhe um dos 6 tons
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const palette = [
    'bg-primary/12 text-primary',
    'bg-info-soft text-info',
    'bg-warning-soft text-warning',
    'bg-success-soft text-success',
    'bg-secondary/15 text-secondary',
    'bg-accent text-accent-foreground',
  ];
  const tone = palette[Math.abs(hash) % palette.length];

  const sizing = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  }[size];

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold shrink-0 select-none',
        sizing,
        tone,
        className,
      )}
    >
      {initials}
    </span>
  );
}
