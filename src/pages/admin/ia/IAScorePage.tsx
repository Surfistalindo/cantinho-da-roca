import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartSimple, faMagnifyingGlass, faBolt, faRotate, faFire,
  faCircleHalfStroke, faSnowflake, faXmark, faSpinner, faArrowRight, faCircleCheck,
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useLeadScoring } from '@/hooks/useLeadScoring';
import { getLeadScore, type LeadScoreLevel } from '@/lib/leadScore';
import LeadStatusBadge from '@/components/admin/LeadStatusBadge';

interface Row {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
  ai_score: number | null;
  ai_score_reason: string | null;
  ai_score_updated_at: string | null;
  ai_priority: string | null;
  _interactions: number;
}

const LEVEL_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'hot', label: 'Quentes (≥65)' },
  { value: 'warm', label: 'Mornos' },
  { value: 'cold', label: 'Frios' },
  { value: 'none', label: 'Sem score' },
  { value: 'stale', label: 'Desatualizados (>7d)' },
];

const STALE_MS = 7 * 24 * 60 * 60 * 1000;

export default function IAScorePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { recomputeOne, recomputeBatch, cancel, running, progress } = useLeadScoring();

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data: leads } = await supabase
      .from('leads')
      .select('id,name,phone,origin,status,created_at,last_contact_at,next_contact_at,ai_score,ai_score_reason,ai_score_updated_at,ai_priority')
      .order('created_at', { ascending: false });

    const ids = (leads ?? []).map((l: any) => l.id);
    const counts = new Map<string, number>();
    if (ids.length > 0) {
      const { data: ints } = await supabase
        .from('interactions')
        .select('lead_id')
        .in('lead_id', ids);
      for (const r of ints ?? []) {
        counts.set(r.lead_id as string, (counts.get(r.lead_id as string) ?? 0) + 1);
      }
    }

    setRows((leads ?? []).map((l: any) => ({ ...l, _interactions: counts.get(l.id) ?? 0 })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useRealtimeTable('leads', fetchRows);

  // computações de visualização
  const enriched = useMemo(() => rows.map((r) => {
    const live = getLeadScore(r, { interactionCount: r._interactions });
    return { ...r, _live: live };
  }), [rows]);

  const stats = useMemo(() => {
    let hot = 0, warm = 0, cold = 0, none = 0;
    for (const r of enriched) {
      if (r.ai_score == null) { none += 1; continue; }
      if (r.ai_score >= 65) hot += 1;
      else if (r.ai_score >= 35) warm += 1;
      else cold += 1;
    }
    return { hot, warm, cold, none, total: enriched.length };
  }, [enriched]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.phone ?? '').toLowerCase().includes(q)) return false;
      if (filter === 'hot' && (r.ai_score ?? 0) < 65) return false;
      if (filter === 'warm' && !((r.ai_score ?? -1) >= 35 && (r.ai_score ?? 0) < 65)) return false;
      if (filter === 'cold' && !(r.ai_score != null && r.ai_score < 35)) return false;
      if (filter === 'none' && r.ai_score != null) return false;
      if (filter === 'stale') {
        const stale = !r.ai_score_updated_at || (Date.now() - new Date(r.ai_score_updated_at).getTime()) > STALE_MS;
        if (!stale) return false;
      }
      return true;
    });
  }, [enriched, search, filter]);

  const top10 = useMemo(() =>
    [...enriched]
      .filter((r) => r.ai_score != null)
      .sort((a, b) => (b.ai_score ?? 0) - (a.ai_score ?? 0))
      .slice(0, 10),
    [enriched]);

  const onRecomputeVisible = async () => {
    if (visible.length === 0) {
      toast.info('Nada para recalcular.');
      return;
    }
    await recomputeBatch(visible.map((r) => r.id));
    fetchRows();
  };

  const onRecomputeAll = async () => {
    await recomputeBatch(enriched.map((r) => r.id));
    fetchRows();
  };

  return (
    <IAPageShell
      title="Score automático"
      subtitle="Pontuação 0–100 com cálculo determinístico baseado em status, recência, interações, origem e agenda."
      breadcrumbs={[{ label: 'Score' }]}
      backTo="/admin/ia"
      actions={
        <Badge variant="secondary" className="gap-1.5">
          <FontAwesomeIcon icon={faChartSimple} className="h-3 w-3" />
          {stats.total} leads
        </Badge>
      }
    >
      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={faFire} label="Quentes (≥65)" value={stats.hot} accent="text-success" />
          <Kpi icon={faCircleHalfStroke} label="Mornos" value={stats.warm} accent="text-warning" />
          <Kpi icon={faSnowflake} label="Frios" value={stats.cold} accent="text-muted-foreground" />
          <Kpi icon={faBolt} label="Sem score" value={stats.none} accent="text-info" />
        </div>

        {/* Toolbar */}
        <Card className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone…" className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEVEL_FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto">
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
                <Button size="sm" variant="outline" onClick={onRecomputeVisible} disabled={visible.length === 0}>
                  <FontAwesomeIcon icon={faRotate} className="h-3.5 w-3.5 mr-2" />
                  Recalcular visíveis ({visible.length})
                </Button>
                <Button size="sm" onClick={onRecomputeAll} disabled={enriched.length === 0}>
                  <FontAwesomeIcon icon={faBolt} className="h-3.5 w-3.5 mr-2" /> Recalcular tudo
                </Button>
              </>
            )}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Tabela */}
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score salvo</TableHead>
                  <TableHead className="text-right">Score recalculado</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
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
                  const drift = r.ai_score != null && Math.abs(r.ai_score - r._live.score) >= 5;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium text-foreground text-sm">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground tabular-nums">{r.phone ?? '—'} · {r._interactions} int.</div>
                      </TableCell>
                      <TableCell><LeadStatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-right">
                        <ScoreCell score={r.ai_score} level={(r.ai_priority as LeadScoreLevel | null) ?? null} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex flex-col items-end">
                          <ScoreCell score={r._live.score} level={r._live.level} />
                          {drift && <span className="text-[10px] text-warning mt-0.5">desatualizado</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11.5px] text-muted-foreground">
                        {r.ai_score_updated_at
                          ? formatDistanceToNow(new Date(r.ai_score_updated_at), { addSuffix: true, locale: ptBR })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost" size="sm" className="h-7 px-2"
                          onClick={async () => { await recomputeOne(r.id); fetchRows(); }}
                        >
                          <FontAwesomeIcon icon={faRotate} className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Top 10 */}
          <Card className="p-4 h-fit">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-7 w-7 rounded-md bg-success-soft text-success flex items-center justify-center">
                <FontAwesomeIcon icon={faFire} className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Top 10 quentes</p>
                <p className="text-[11px] text-muted-foreground">Maior score salvo</p>
              </div>
            </div>
            {top10.length === 0 ? (
              <p className="text-[12px] text-muted-foreground py-4 text-center">
                Ninguém pontuado ainda. Clique em <b>Recalcular tudo</b>.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {top10.map((r, i) => (
                  <li key={r.id}>
                    <Link
                      to={`/admin/leads`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                    >
                      <span className="text-[10.5px] text-muted-foreground font-mono w-4">{i + 1}</span>
                      <span className="flex-1 text-[12.5px] truncate text-foreground">{r.name}</span>
                      <ScoreCell score={r.ai_score} level={(r.ai_priority as LeadScoreLevel | null) ?? null} compact />
                      <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5 text-muted-foreground/50" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </IAPageShell>
  );
}

/* ----- helpers ----- */

function Kpi({ icon, label, value, accent }: { icon: any; label: string; value: number; accent: string }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <span className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${accent}`}>
        <FontAwesomeIcon icon={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className={`text-xl font-semibold tabular-nums ${accent}`}>{value}</p>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}

function ScoreCell({
  score, level, compact,
}: { score: number | null; level: LeadScoreLevel | null; compact?: boolean }) {
  if (score == null) {
    return <span className="text-[11px] text-muted-foreground italic">—</span>;
  }
  const tone =
    level === 'hot'  ? 'bg-success-soft text-success border-success/25'
    : level === 'warm' ? 'bg-warning-soft text-warning border-warning/30'
    : level === 'closed' ? 'bg-muted text-muted-foreground border-border'
    : 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11.5px] font-semibold tabular-nums ${tone}`}>
      <FontAwesomeIcon icon={level === 'hot' ? faFire : level === 'warm' ? faCircleHalfStroke : faSnowflake} className="h-2.5 w-2.5" />
      {score}
      {!compact && level === 'closed' && <FontAwesomeIcon icon={faCircleCheck} className="h-2.5 w-2.5 ml-0.5" />}
    </span>
  );
}
