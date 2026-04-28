import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const TERMS: Array<{ term: string; def: string }> = [
  { term: 'Lead', def: 'Contato que demonstrou interesse, mas ainda não comprou.' },
  { term: 'Cliente', def: 'Pessoa que já realizou pelo menos uma compra.' },
  { term: 'Pipeline', def: 'Sequência de estágios pelos quais um lead passa até virar cliente.' },
  { term: 'Estágio', def: 'Cada etapa do pipeline (ex.: Novo, Em contato, Proposta, Fechado).' },
  { term: 'Score', def: 'Pontuação automática que estima quão "quente" um lead está.' },
  { term: 'Funil', def: 'Visão agregada de quantos leads existem em cada estágio.' },
  { term: 'Origem', def: 'De onde o lead veio (Instagram, indicação, formulário etc.).' },
  { term: 'Board (Quadro)', def: 'Tabela rica com colunas tipadas e grupos colapsáveis, estilo Monday.' },
];

export default function Glossary({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Glossário do CRM</SheetTitle>
          <SheetDescription>
            Os termos que você verá pelo sistema, em uma frase cada.
          </SheetDescription>
        </SheetHeader>
        <dl className="mt-5 space-y-4">
          {TERMS.map((t) => (
            <div key={t.term} className="rounded-lg border border-border bg-card/40 p-3">
              <dt className="text-[12.5px] font-semibold text-foreground">{t.term}</dt>
              <dd className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{t.def}</dd>
            </div>
          ))}
        </dl>
      </SheetContent>
    </Sheet>
  );
}
