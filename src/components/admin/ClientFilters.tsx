import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark, faHeart } from '@fortawesome/free-solid-svg-icons';

export type ClientRecencyFilter = 'all' | 'recent' | 'attention' | 'inactive30' | 'inactive90';
export type ClientPurchaseFilter = 'all' | 'p30' | 'p90' | 'p180' | 'p180plus';
export type ClientStageFilter = 'all' | 'active' | 'watch' | 'inactive' | 'dormant';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  recencyFilter: ClientRecencyFilter;
  onRecencyChange: (v: ClientRecencyFilter) => void;
  purchaseFilter: ClientPurchaseFilter;
  onPurchaseChange: (v: ClientPurchaseFilter) => void;
  stageFilter: ClientStageFilter;
  onStageChange: (v: ClientStageFilter) => void;
  reactivationMode?: boolean;
  onReactivationToggle?: (v: boolean) => void;
}

export default function ClientFilters({
  search, onSearchChange,
  recencyFilter, onRecencyChange,
  purchaseFilter, onPurchaseChange,
  stageFilter, onStageChange,
  reactivationMode, onReactivationToggle,
}: Props) {
  const hasFilters =
    search.length > 0 ||
    recencyFilter !== 'all' ||
    purchaseFilter !== 'all' ||
    stageFilter !== 'all' ||
    reactivationMode;

  const clearAll = () => {
    onSearchChange('');
    onRecencyChange('all');
    onPurchaseChange('all');
    onStageChange('all');
    onReactivationToggle?.(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-5">
      <div className="relative flex-1 min-w-[220px]">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
        />
        <Input
          placeholder="Buscar por nome, telefone ou produto..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 bg-muted/40 border-transparent focus-visible:bg-card focus-visible:border-input"
        />
      </div>

      <Select value={stageFilter} onValueChange={(v) => onStageChange(v as ClientStageFilter)}>
        <SelectTrigger className="w-[160px] h-10 text-xs bg-muted/40 border-transparent">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos status</SelectItem>
          <SelectItem value="active">Ativos</SelectItem>
          <SelectItem value="watch">Em atenção</SelectItem>
          <SelectItem value="inactive">Inativos</SelectItem>
          <SelectItem value="dormant">Adormecidos</SelectItem>
        </SelectContent>
      </Select>

      <Select value={recencyFilter} onValueChange={(v) => onRecencyChange(v as ClientRecencyFilter)}>
        <SelectTrigger className="w-[180px] h-10 text-xs bg-muted/40 border-transparent">
          <SelectValue placeholder="Contato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo contato</SelectItem>
          <SelectItem value="recent">Recente (≤7d)</SelectItem>
          <SelectItem value="attention">Atenção (8–30d)</SelectItem>
          <SelectItem value="inactive30">Sem contato 30+ dias</SelectItem>
          <SelectItem value="inactive90">Sem contato 90+ dias</SelectItem>
        </SelectContent>
      </Select>

      <Select value={purchaseFilter} onValueChange={(v) => onPurchaseChange(v as ClientPurchaseFilter)}>
        <SelectTrigger className="w-[180px] h-10 text-xs bg-muted/40 border-transparent">
          <SelectValue placeholder="Última compra" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda compra</SelectItem>
          <SelectItem value="p30">≤ 30 dias</SelectItem>
          <SelectItem value="p90">31–90 dias</SelectItem>
          <SelectItem value="p180">91–180 dias</SelectItem>
          <SelectItem value="p180plus">180+ dias</SelectItem>
        </SelectContent>
      </Select>

      {onReactivationToggle && (
        <Button
          variant={reactivationMode ? 'default' : 'outline'}
          size="sm"
          onClick={() => onReactivationToggle(!reactivationMode)}
          className="h-10 text-xs"
        >
          <FontAwesomeIcon icon={faHeart} className="h-3 w-3 mr-1.5" />
          Reativação
        </Button>
      )}

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-10 text-xs text-muted-foreground hover:text-foreground"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3 mr-1.5" />
          Limpar
        </Button>
      )}
    </div>
  );
}
