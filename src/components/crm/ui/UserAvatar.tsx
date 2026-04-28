import { cn } from '@/lib/utils';

interface Props {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-[13px]',
};

const PALETTE = [
  'from-tag-blue to-tag-indigo',
  'from-tag-purple to-tag-pink',
  'from-tag-orange to-tag-red',
  'from-tag-teal to-tag-cyan',
  'from-tag-green to-tag-teal',
  'from-tag-yellow to-tag-orange',
];

/**
 * Avatar circular com gradiente determinístico baseado no nome.
 * Wrapper visual; não substitui o InitialsAvatar legado, apenas oferece
 * estética Monday-like para tabelas densas.
 */
export default function UserAvatar({ name, size = 'sm', className }: Props) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';

  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const grad = PALETTE[Math.abs(hash) % PALETTE.length];

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 select-none ring-2 ring-card bg-gradient-to-br',
        SIZES[size],
        grad,
        className,
      )}
      title={name}
    >
      {initials}
    </span>
  );
}
