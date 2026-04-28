interface Props {
  label?: string;
  variant?: 'spinner' | 'skeleton' | 'cards';
}

export default function LoadingState({ variant = 'skeleton' }: Props) {
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="animate-spin h-7 w-7 border-2 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 h-9 rounded-md bg-muted/40 animate-pulse">
          <div className="h-6 w-6 rounded-full bg-muted" />
          <div className="flex-1 space-y-1">
            <div className="h-2.5 w-1/3 bg-muted rounded" />
            <div className="h-2 w-1/4 bg-muted rounded" />
          </div>
          <div className="h-4 w-14 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}
