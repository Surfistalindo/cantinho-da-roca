import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTag, faMagnifyingGlass, faWandMagicSparkles, faXmark, faCheck,
  faCircleQuestion, faTriangleExclamation, faBroom, faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import IAPageShell from '@/components/ia/IAPageShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useLeadClassification } from '@/hooks/useLeadClassification';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';
import type { LeadStatus } from '@/config/app';

interface Row {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  ai_suggested_status: string | null;
  ai_status_confidence: number | null;
  ai_score_reason: string | null;
  updated_at: string;
}

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'with', label: 'Com sugestão' },
  { value: 'conflict', label: 'Em conflito' },
  { value: 'none', label: 'Sem sugestão' },
];

export default function IAClassifyPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [minConfidence, setMinConfidence] = useState(0);
  const { classifyBatch, applyOne, dismissOne, applyHighConfidence, cancel, running, progress } = useLeadClassification();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('leads')
      .select('id,name,phone,status,ai_suggested_status,ai_status_confidence,ai_score_reason,updated_at')
      .order('updated_at', { ascending: false });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useRealtimeTable('leads', fetchRows);

  const stats = useMemo(() => {
    let withSug = 0, conflict = 0, autoApplicable = 0;
    for (const r of rows) {
      if (r.ai_suggested_status) {
        withSug += 1;
        if (r.ai_suggested_status !== r.status) conflict += 1;
        if (r.ai_suggested_status !== r.status && (r.ai_status_confidence ?? 0) >= 0.8) autoApplicable += 1;
      }
    }
    return { total: rows.length, withSug, conflict, autoApplicable };
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.phone ?? '').toLowerCase().includes(q)) return false;
      if (filter === 'with' && !r.ai_suggested_status) return false;
      if (filter === 'conflict' && !(r.ai_suggested_status && r.ai_suggested_status !== r.status)) return false;
      if (filter === 'none' && r.ai_suggested_status) return false;
      if (minConfidence > 0 && (r.ai_status_confidence ?? 0) < minConfidence / 100) return false;
      return true;
    });
  }, [rows, search, filter, minConfidence]);

  const onClassifyVisible = async () => {
    if (visible.length === 0) { toast.info('Nada para classificar.'); return; }
    if (visible.length > 200) {
      toast.warning('Limite muito alto. Filtre para no máximo 200 leads.');
      return;
    }
    await classifyBatch(visible.map((r) => r.id));
    fetchRows();
  };

  const onApplyHigh = async () => {
    await applyHighConfidence(rows, 0.8);
    fetchRows();
  };

  const onClearAll = async () => {
    const ids = rows.filter((r) => r.ai_suggested_status).map((r) => r.id);
    if (ids.length === 0) return;
    await supabase
      .from('leads')
      .update({ ai_suggested_status: null, ai_status_confidence: null })
      .in('id', ids);
    toast.success(`${ids.length} sugest${ids.length === 1 ? 'ão limpa' : 'ões limpas'}.`);
    fetchRows();
  };

  return (
    <IAPageShell
      title="Classificação de status"
      subtitle="A IA lê histórico e sugere em qual estágio do funil cada lead deveria estar. Você revisa e aplica."
      breadcrumbs={[{ label: 'Classificação' }]}
      backTo="/admin/ia"
      actions={<Badge variant="secondary" className="gap-1.5"><FontAwesomeIcon icon={faTag} className="h-3 w-3" /> {stats.total} leads</Badge>}
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={faTag} label="Total" value={stats.total} accent="text-foreground" />
          <Kpi icon={faWandMagicSparkles} label="Com sugestão" value={stats.withSug} accent="text-info" />
          <Kpi icon={faTriangleExclamation} label="Em conflito" value={stats.conflict} accent="text-warning" />
          <Kpi icon={faCheck} label="Auto-aplicáveis (≥80%)" value={stats.autoApplicable} accent="text-success" />
        </div>

        {/* Toolbar */}
        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone…" className="pl-9" />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3 min-w-[200px]">
              <span className="text-[12px] text-muted-foreground whitespace-nowrap">Min. confiança</span>
              <Slider value={[minConfidence]} onValueChange={(v) => setMinConfidence(v[0])} max={100} step={5} className="flex-1" />
              <span className="text-[12px] tabular-nums w-10 text-right">{minConfidence}%</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {running ? (
              <>
                <div className="w-44">
                  <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} />
                  <p className="text-[11px] text-muted-foreground mt-1 tabular-nums">{progress.done}/{progress.total}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={cancel}>
                  <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5 mr-1" /> Parar
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={onClassifyVisible} disabled={visible.length === 0}>
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5 mr-2" />
                  Classificar visíveis ({visible.length})
                </Button>
                <Button size="sm" variant="outline" onClick={onApplyHigh} disabled={stats.autoApplicable === 0}>
                  <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5 mr-2" />
                  Aplicar ≥80% ({stats.autoApplicable})
                </Button>
                <Button size="sm" variant="ghost" onClick={onClearAll} disabled={stats.withSug === 0} className="ml-auto">
                  <FontAwesomeIcon icon={faBroom} className="h-3.5 w-3.5 mr-2" />
                  Limpar todas
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Tabela */}
        <Card className="overflow-hidden min-w-0 max-w-full">
          <div
            className="surface-table-wrap has-sticky-first"
            style={{ ['--table-max-h' as string]: 'calc(100vh - 360px)' }}
          >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Status atual</TableHead>
                <TableHead>Sugerido</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Razão</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">Carregando…</TableCell></TableRow>
              )}
              {!loading && visible.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">Nenhum lead corresponde aos filtros.</TableCell></TableRow>
              )}
              {visible.map((r) => {
                const conflict = r.ai_suggested_status && r.ai_suggested_status !== r.status;
                const conf = r.ai_status_confidence ?? 0;
                return (
                  <TableRow key={r.id} className={conflict ? 'bg-warning/[0.02]' : undefined}>
                    <TableCell>
                      <div className="font-medium text-foreground text-sm">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground tabular-nums">{r.phone ?? '—'}</div>
                    </TableCell>
                    <TableCell><LeadStatusBadge status={r.status} /></TableCell>
                    <TableCell>
                      {r.ai_suggested_status ? (
                        <div className="flex items-center gap-1">
                          <LeadStatusBadge status={r.ai_suggested_status} />
                          {conflict && <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5 text-warning" />}
                        </div>
                      ) : (
                        <span className="text-[12px] text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="w-[140px]">
                      {r.ai_suggested_status ? (
                        <div className="flex items-center gap-2">
                          <Progress value={conf * 100} className="h-1.5 flex-1" />
                          <span className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">{Math.round(conf * 100)}%</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      {r.ai_score_reason && r.ai_suggested_status ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-[12px] text-muted-foreground truncate cursor-help inline-flex items-center gap-1">
                                <FontAwesomeIcon icon={faCircleQuestion} className="h-2.5 w-2.5 opacity-60 shrink-0" />
                                {r.ai_score_reason}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs"><p className="text-[12px]">{r.ai_score_reason}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : <span className="text-[11px] text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.ai_suggested_status ? (
                        <div className="inline-flex gap-1">
                          {conflict && (
                            <ApplyConfirm
                              currentLabel={r.status}
                              nextLabel={r.ai_suggested_status}
                              onConfirm={async () => { await applyOne(r.id, r.ai_suggested_status as LeadStatus); fetchRows(); }}
                            />
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={async () => { await dismissOne(r.id); fetchRows(); }}>
                            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground" onClick={async () => { await classifyBatch([r.id]); fetchRows(); }}>
                          <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3 w-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      </div>
    </IAPageShell>
  );
}

function Kpi({ icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${accent}`}>
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className={`text-xl font-semibold tabular-nums ${accent}`}>{value}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
      </div>
    </Card>
  );
}

function ApplyConfirm({ currentLabel, nextLabel, onConfirm }: { currentLabel: string; nextLabel: string; onConfirm: () => void | Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="h-7 px-2 text-[11.5px]">
          <FontAwesomeIcon icon={faCheck} className="h-3 w-3 mr-1" /> Aplicar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aplicar sugestão de status?</AlertDialogTitle>
          <AlertDialogDescription>
            O status do lead será alterado de <b>{currentLabel}</b> para <b>{nextLabel}</b>. Você pode reverter a qualquer momento na tela de Leads.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Aplicar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
