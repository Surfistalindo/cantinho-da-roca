import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders } from '@fortawesome/free-solid-svg-icons';

interface TableShellProps {
  children: ReactNode;
  /** Conteúdo de toolbar/filtros renderizado no topo, fora do scroll. */
  toolbar?: ReactNode;
  /** Painel lateral fixo (templates, configurações, detalhes). Vira drawer no mobile. */
  side?: ReactNode;
  /** Título do drawer mobile do painel lateral. */
  sideTitle?: string;
  /** Rótulo do botão que abre o drawer no mobile. */
  sideToggleLabel?: string;
  /** Header do bloco (acima do toolbar). */
  header?: ReactNode;
  /** Altura máxima do scroller da tabela. Default 70vh. */
  maxHeight?: string;
  /** Fixa a primeira coluna durante scroll horizontal. */
  stickyFirstColumn?: boolean;
  /** Classes extras no wrapper externo. */
  className?: string;
  /** Classes extras no scroller da tabela. */
  scrollerClassName?: string;
  /** Quando true, NÃO aplica wrapper de tabela (útil quando o filho já é uma tabela com seus próprios containers). */
  unstyled?: boolean;
}

/**
 * TableShell — padrão de layout para qualquer tabela/grid/lista larga.
 *
 * Garante:
 *  - O conteúdo grande rola dentro do próprio container (overflow-x/y).
 *  - Header de tabela sticky e (opcionalmente) primeira coluna sticky.
 *  - Painéis laterais fixos visíveis em desktop; viram drawer no mobile.
 *  - O layout da página não cresce por causa de tabelas (min-width:0 + max-width:100%).
 */
export default function TableShell({
  children,
  toolbar,
  side,
  sideTitle = 'Painel',
  sideToggleLabel = 'Painel',
  header,
  maxHeight = '70vh',
  stickyFirstColumn = false,
  className,
  scrollerClassName,
  unstyled = false,
}: TableShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={cn('surface-split', className)}>
      <div className="surface-main surface-shell">
        {header}

        {(toolbar || side) && (
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <div className="min-w-0 flex-1">{toolbar}</div>
            {side && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="lg:hidden h-8 gap-1.5 shrink-0"
                onClick={() => setDrawerOpen(true)}
              >
                <FontAwesomeIcon icon={faSliders} className="h-3 w-3" />
                {sideToggleLabel}
              </Button>
            )}
          </div>
        )}

        {unstyled ? (
          <div className="min-w-0 max-w-full">{children}</div>
        ) : (
          <div
            className={cn(
              'surface-table-wrap rounded-md border border-border',
              stickyFirstColumn && 'has-sticky-first',
              scrollerClassName,
            )}
            style={{ ['--table-max-h' as string]: maxHeight }}
          >
            {children}
          </div>
        )}
      </div>

      {side && (
        <>
          <aside className="surface-side-panel hidden lg:block">{side}</aside>
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
              <SheetHeader className="px-5 py-4 border-b">
                <SheetTitle className="text-[15px]">{sideTitle}</SheetTitle>
              </SheetHeader>
              <div className="p-4">{side}</div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
