interface Props {
  label?: string;
}

export default function LoadingState({ label = 'Carregando...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="animate-spin h-7 w-7 border-2 border-primary/30 border-t-primary rounded-full" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
