import { cn } from '@/lib/utils';

type Role = 'admin' | 'vendedor' | 'usuario' | null | undefined;

const STYLES: Record<string, string> = {
  admin: 'bg-primary/15 text-primary border-primary/30',
  vendedor: 'bg-tag-blue/15 text-tag-blue border-tag-blue/30',
  usuario: 'bg-muted text-muted-foreground border-border',
};

const LABELS: Record<string, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor',
  usuario: 'Usuário',
};

export default function RoleBadge({ role, className }: { role: Role; className?: string }) {
  const key = role ?? 'usuario';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 h-5 rounded-full border text-[10.5px] font-semibold uppercase tracking-wide',
        STYLES[key] ?? STYLES.usuario,
        className,
      )}
    >
      {LABELS[key] ?? 'Usuário'}
    </span>
  );
}
