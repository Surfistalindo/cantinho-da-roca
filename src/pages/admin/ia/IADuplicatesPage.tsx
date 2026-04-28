import { useCallback, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSitemap, faMagnifyingGlass, faPhone, faSignature, faBroom, faSpinner,
  faObjectGroup, faTriangleExclamation, faXmark, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import IAPageShell from '@/components/ia/IAPageShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import LeadStatusBadge from '@/components/admin/LeadStatusBadge';
import {
  loadAllLeads, findDuplicateGroups, mergeLeads,
  type DuplicateGroup, type LeadLite,
} from '@/services/ia/globalDuplicateDetector';
import { formatPhoneDisplay, normalizePhone } from '@/lib/ia/phoneFormat';

export default function IADuplicatesPage() {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'phone_exact' | 'name_similar'>('all');
  const [merging, setMerging] = useState<string | null>(null);
  const [keepMap, setKeepMap] = useState<Record<string, string>>({});

  const scan = useCallback(async () => {
    setScanning(true);
    try {
      const all = await loadAllLeads();
      const found = findDuplicateGroups(all);
      setGroups(found);
      setScanned(true);
      // Default keep = mais antigo
      const k: Record<string, string> = {};
      for (const g of found) {
        const oldest = [...g.leads].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
        k[g.key] = oldest.id;
      }
      setKeepMap(k);
      if (found.length === 0) toast.success('Nenhum duplicado encontrado. Base limpa! 🎉');
      else toast.success(`${found.length} grupo${found.length === 1 ? '' : 's'} de duplicados encontrado${found.length === 1 ? '' : 's'}.`);
    } catch (e) {
      console.error(e);
      toast.error('Falha ao varrer a base.');
    } finally {
      setScanning(false);
    }
  }, []);

  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      if (filter !== 'all' && g.reason !== filter) return false;
      if (q) {
        const hit = g.leads.some((l) =>
          l.name.toLowerCase().includes(q) || (l.phone ?? '').toLowerCase().includes(q)
        );
        if (!hit) return false;
      }
      return true;
    });
  }, [groups, search, filter]);

  const stats = useMemo(() => {
    const totalLeads = groups.reduce((acc, g) => acc + g.leads.length, 0);
    const phoneGroups = groups.filter((g) => g.reason === 'phone_exact').length;
    const nameGroups = groups.filter((g) => g.reason === 'name_similar').length;
    return { groups: groups.length, leads: totalLeads, phoneGroups, nameGroups };
  }, [groups]);

  const onMerge = async (g: DuplicateGroup) => {
    const keepId = keepMap[g.key];
    if (!keepId) return;
    setMerging(g.key);
    try {
      const result = await mergeLeads(keepId, g.leads);
      toast.success(
        `Grupo mesclado: ${result.removedIds.length} lead${result.removedIds.length === 1 ? '' : 's'} removido${result.removedIds.length === 1 ? '' : 's'}, ${result.movedInteractions} interaç${result.movedInteractions === 1 ? 'ão movida' : 'ões movidas'}.`,
      );
      setGroups((prev) => prev.filter((x) => x.key !== g.key));
    } catch (e) {
      console.error(e);
      toast.error('Falha ao mesclar grupo.');
    } finally {
      setMerging(null);
    }
  };

  const onIgnore = (g: DuplicateGroup) => {
    setGroups((prev) => prev.filter((x) => x.key !== g.key));
  };

  return (
    <IAPageShell
      title="Duplicados em todo o CRM"
      subtitle="Varredura completa por telefone normalizado e similaridade de nome. Você revisa cada grupo e decide qual versão manter."
      breadcrumbs={[{ label: 'Duplicados globais' }]}
      backTo="/admin/ia"
      actions={
        scanned && (
          <Badge variant="secondary" className="gap-1.5">
            <FontAwesomeIcon icon={faSitemap} className="h-3 w-3" /> {stats.groups} grupo{stats.groups === 1 ? '' : 's'}
          </Badge>
        )
      }
    >
      <div className="space-y-6">
        {/* Hero / Scan */}
        {!scanned && (
          <Card className="p-8 text-center space-y-4 border-dashed">
            <span className="mx-auto h-14 w-14 rounded-2xl bg-info/10 text-info flex items-center justify-center">
              <FontAwesomeIcon icon={faSitemap} className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <h3 className="text-[18px] font-semibold text-foreground">Encontre duplicados em toda a base</h3>
              <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
                A varredura agrupa leads com o mesmo telefone normalizado e nomes muito parecidos.
                Nada é alterado até você confirmar cada mesclagem.
              </p>
            </div>
            <Button size="lg" onClick={scan} disabled={scanning}>
              {scanning ? (
                <><FontAwesomeIcon icon={faSpinner} className="h-4 w-4 mr-2 animate-spin" /> Varrendo…</>
              ) : (
                <><FontAwesomeIcon icon={faSitemap} className="h-4 w-4 mr-2" /> Varrer base agora</>
              )}
            </Button>
          </Card>
        )}

        {scanned && (
          <>
            {/* KPIs */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi icon={faObjectGroup} label="Grupos" value={stats.groups} accent="text-info" />
              <Kpi icon={faSitemap} label="Leads duplicados" value={stats.leads} accent="text-warning" />
              <Kpi icon={faPhone} label="Por telefone" value={stats.phoneGroups} accent="text-success" />
              <Kpi icon={faSignature} label="Por nome" value={stats.nameGroups} accent="text-foreground" />
            </div>

            {/* Toolbar */}
            <Card className="p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone…" className="pl-9" />
              </div>
              <div className="inline-flex rounded-md border bg-background p-0.5">
                {([
                  { v: 'all', label: 'Todos' },
                  { v: 'phone_exact', label: 'Telefone' },
                  { v: 'name_similar', label: 'Nome' },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setFilter(opt.v as any)}
                    className={`px-3 py-1.5 text-[12px] rounded-sm transition-colors ${
                      filter === opt.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={scan} disabled={scanning} className="ml-auto">
                {scanning ? (
                  <><FontAwesomeIcon icon={faSpinner} className="h-3.5 w-3.5 mr-2 animate-spin" /> Varrendo…</>
                ) : (
                  <><FontAwesomeIcon icon={faBroom} className="h-3.5 w-3.5 mr-2" /> Varrer de novo</>
                )}
              </Button>
            </Card>

            {/* Empty state */}
            {visibleGroups.length === 0 && (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                {groups.length === 0 ? 'Nenhum duplicado encontrado.' : 'Nenhum grupo corresponde aos filtros.'}
              </Card>
            )}

            {/* Grupos */}
            <div className="space-y-4">
              {visibleGroups.map((g) => (
                <GroupCard
                  key={g.key}
                  group={g}
                  keepId={keepMap[g.key]}
                  onChangeKeep={(id) => setKeepMap((m) => ({ ...m, [g.key]: id }))}
                  onMerge={() => onMerge(g)}
                  onIgnore={() => onIgnore(g)}
                  busy={merging === g.key}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </IAPageShell>
  );
}

/* ---------- subcomponents ---------- */

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

function GroupCard({
  group, keepId, onChangeKeep, onMerge, onIgnore, busy,
}: {
  group: DuplicateGroup;
  keepId: string;
  onChangeKeep: (id: string) => void;
  onMerge: () => void;
  onIgnore: () => void;
  busy: boolean;
}) {
  const keep = group.leads.find((l) => l.id === keepId);
  const others = group.leads.filter((l) => l.id !== keepId);
  const phoneless = group.reason === 'name_similar' && group.leads.some((l) => !normalizePhone(l.phone));

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="gap-1.5">
          {group.reason === 'phone_exact' ? (
            <><FontAwesomeIcon icon={faPhone} className="h-2.5 w-2.5" /> Telefone idêntico</>
          ) : (
            <><FontAwesomeIcon icon={faSignature} className="h-2.5 w-2.5" /> Nome similar</>
          )}
        </Badge>
        <span className="text-[12px] text-muted-foreground">{group.leads.length} leads no grupo</span>
        {phoneless && (
          <span className="inline-flex items-center gap-1 text-[11px] text-warning">
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-2.5 w-2.5" />
            confira manualmente — nem todos têm telefone
          </span>
        )}
      </div>

      <RadioGroup value={keepId} onValueChange={onChangeKeep} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {group.leads.map((l) => (
          <LeadMiniCard key={l.id} lead={l} selected={l.id === keepId} />
        ))}
      </RadioGroup>

      <div className="flex items-center gap-2 pt-1">
        <p className="text-[12px] text-muted-foreground flex-1">
          Mantendo: <b className="text-foreground">{keep?.name}</b> · descartando {others.length} ·
          interações dos descartados serão reapontadas.
        </p>
        <Button size="sm" variant="ghost" onClick={onIgnore} disabled={busy}>
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3 mr-1.5" /> Ignorar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" disabled={busy || !keep}>
              {busy ? (
                <><FontAwesomeIcon icon={faSpinner} className="h-3 w-3 mr-1.5 animate-spin" /> Mesclando…</>
              ) : (
                <><FontAwesomeIcon icon={faObjectGroup} className="h-3 w-3 mr-1.5" /> Mesclar grupo</>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mesclar este grupo?</AlertDialogTitle>
              <AlertDialogDescription>
                <b>{keep?.name}</b> permanece no CRM. Os outros {others.length} leads serão removidos
                e suas interações + notas serão reapontadas para o lead mantido. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onMerge}>Mesclar agora</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

function LeadMiniCard({ lead, selected }: { lead: LeadLite; selected: boolean }) {
  return (
    <Label
      htmlFor={`keep-${lead.id}`}
      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
        selected ? 'border-primary bg-primary/[0.04]' : 'border-border bg-card hover:bg-muted/50'
      }`}
    >
      <RadioGroupItem value={lead.id} id={`keep-${lead.id}`} className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-[13px] text-foreground truncate">{lead.name}</p>
          {selected && <FontAwesomeIcon icon={faCheck} className="h-2.5 w-2.5 text-primary shrink-0" />}
        </div>
        <p className="text-[11.5px] text-muted-foreground tabular-nums">
          {lead.phone ? formatPhoneDisplay(normalizePhone(lead.phone)) : '— sem telefone'}
        </p>
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          <LeadStatusBadge status={lead.status} />
          <span className="text-[10.5px] text-muted-foreground">
            criado {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      </div>
    </Label>
  );
}
