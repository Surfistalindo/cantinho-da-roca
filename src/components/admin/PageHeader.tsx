import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export default function PageHeader({ title, description, actions, meta }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
      <div className="min-w-0 space-y-1">
        <h1 className="text-[18px] sm:text-[20px] font-semibold text-foreground leading-tight tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[12.5px] text-muted-foreground max-w-2xl leading-snug">{description}</p>
        )}
        {meta && <div className="pt-0.5">{meta}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
