import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SECTIONS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'Geral',
    items: [
      { keys: ['⌘', 'K'], label: 'Abrir paleta de comandos' },
      { keys: ['/'], label: 'Focar busca' },
      { keys: ['N'], label: 'Novo lead' },
      { keys: ['?'], label: 'Mostrar atalhos' },
    ],
  },
  {
    title: 'Tela de Leads',
    items: [
      { keys: ['1'], label: 'Visão Tabela' },
      { keys: ['2'], label: 'Visão Kanban' },
      { keys: ['3'], label: 'Visão Cards' },
    ],
  },
  {
    title: 'Navegação (g + tecla)',
    items: [
      { keys: ['G', 'D'], label: 'Página inicial' },
      { keys: ['G', 'M'], label: 'Meu trabalho' },
      { keys: ['G', 'L'], label: 'Leads' },
      { keys: ['G', 'P'], label: 'Pipeline' },
      { keys: ['G', 'C'], label: 'Clientes' },
      { keys: ['G', 'I'], label: 'cantim IA' },
    ],
  },
];

export default function ShortcutsHelp({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Atalhos de teclado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <div key={s.title}>
              <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">{s.title}</h3>
              <ul className="space-y-1.5">
                {s.items.map((it) => (
                  <li key={it.label} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/90">{it.label}</span>
                    <span className="flex items-center gap-1">
                      {it.keys.map((k) => (
                        <kbd key={k} className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-muted border border-border rounded shadow-sm">
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
