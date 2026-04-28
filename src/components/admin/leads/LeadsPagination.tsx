import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/hooks/useLeadsPaged';

interface LeadsPaginationProps {
  page: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  total: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: PageSize) => void;
  showPageSize?: boolean;
}

/** Build a compact list of page numbers with ellipses: 1 … 4 5 6 … 12 */
function buildRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) out.push('ellipsis');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push('ellipsis');
  out.push(total);
  return out;
}

export default function LeadsPagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSize = false,
}: LeadsPaginationProps) {
  if (total <= pageSize && !showPageSize) return null;
  const items = buildRange(page, totalPages);

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 border-t border-border/60 bg-card text-xs">
      <div className="text-muted-foreground tabular-nums font-mono">
        {rangeStart}–{rangeEnd} de {total}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
        </Button>

        {items.map((it, idx) =>
          it === 'ellipsis' ? (
            <span key={`e-${idx}`} className="px-1 text-muted-foreground select-none">
              …
            </span>
          ) : (
            <button
              key={it}
              onClick={() => onPageChange(it)}
              className={cn(
                'h-7 min-w-7 px-2 rounded-md text-xs font-medium tabular-nums transition-colors',
                it === page
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
              aria-current={it === page ? 'page' : undefined}
            >
              {it}
            </button>
          ),
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
        </Button>
      </div>

      {showPageSize && onPageSizeChange ? (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <span className="hidden sm:inline">Por página</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
            className="h-7 rounded-md border border-border bg-background px-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
            aria-label="Itens por página"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="w-[1px]" />
      )}
    </div>
  );
}
