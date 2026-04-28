import type { ReactNode } from 'react';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faFilterCircleXmark, faInbox } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

interface ListStateProps {
  loading: boolean;
  error?: unknown | null;
  onRetry?: () => void;

  /** Total de itens na fonte de dados, antes de aplicar filtros. */
  totalCount: number;
  /** Total de itens após aplicar filtros (o que será renderizado). */
  filteredCount: number;
  /** True quando há qualquer filtro/busca ativo. */
  hasActiveFilters: boolean;
  /** Limpa todos os filtros — chamado pelo botão padrão "Limpar filtros". */
  onClearFilters?: () => void;

  /** Texto/ícone para "lista totalmente vazia" (nenhum dado cadastrado). */
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: IconDefinition;
  emptyAction?: ReactNode;

  /** Variante do skeleton de loading. */
  loadingVariant?: 'spinner' | 'skeleton' | 'cards';

  /** Conteúdo a renderizar quando há dados após filtros. */
  children: ReactNode;
}

/**
 * Centraliza a sequência loading → erro → vazio total → vazio por filtro → dados.
 * Garante que filtros/busca nunca deixam a UI travada sem feedback.
 */
export default function ListState({
  loading,
  error,
  onRetry,
  totalCount,
  filteredCount,
  hasActiveFilters,
  onClearFilters,
  emptyTitle,
  emptyDescription,
  emptyIcon = faInbox,
  emptyAction,
  loadingVariant = 'skeleton',
  children,
}: ListStateProps) {
  if (loading) return <LoadingState variant={loadingVariant} />;

  if (error) {
    const detail = error instanceof Error ? error.message : undefined;
    return <ErrorState onRetry={onRetry} detail={detail} />;
  }

  if (filteredCount === 0) {
    // Lista totalmente vazia (nenhum dado cadastrado).
    if (totalCount === 0 || !hasActiveFilters) {
      return (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      );
    }
    // Há dados, mas filtros/busca não retornaram nada.
    return (
      <EmptyState
        icon={faFilterCircleXmark}
        title="Nenhum resultado para os filtros aplicados"
        description="Ajuste os filtros ou limpe a busca para ver mais registros."
        action={
          onClearFilters ? (
            <Button size="sm" variant="outline" onClick={onClearFilters}>
              <FontAwesomeIcon icon={faFilterCircleXmark} className="w-3 h-3 mr-1.5" />
              Limpar filtros
            </Button>
          ) : undefined
        }
      />
    );
  }

  return <>{children}</>;
}
