import { useEffect, useMemo, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLightbulb,
  faMagnifyingGlass,
  faWandMagicSparkles,
  faRotate,
  faCopy,
  faCheck,
  faSpinner,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import IAPageShell from '@/components/ia/IAPageShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/useRealtimeTable';
import { useLeadInsights } from '@/hooks/useLeadInsights';
import { APP_CONFIG } from '@/config/app';
import { getLeadStatusConfig } from '@/lib/leadStatus';
import { getLeadScore, type LeadScoreLevel } from '@/lib/leadScore';
import { parseInsight, buildWhatsAppUrl } from '@/lib/leadInsights';

interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  origin: string | null;
  product_interest: string | null;
  status: string;
  created_at: string;
  last_contact_at: string | null;
  next_contact_at: string | null;
  ai_summary: string | null;
  ai_summary_updated_at: string | null;
}

const PRIORITY_LABEL: Record<LeadScoreLevel, string> = {
  hot: 'Quente',
  warm: 'Morno',
  cold: 'Frio',
  closed: 'Encerrado',
};

export default function IAInsightsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { generateOne, generateMany, cancelBatch, generatingIds, batch } = useLeadInsights();

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select(
        'id,name,phone,origin,product_interest,status,created_at,last_contact_at,next_contact_at,ai_summary,ai_summary_updated_at',
      )
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      toast.error('Falha ao carregar leads.');
      setLoading(false);
      return;
    }
    setLeads((data ?? []) as LeadRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);
  useRealtimeTable('leads', fetchLeads);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (q) {
        const hay = `${l.name} ${l.phone ?? ''} ${l.product_interest ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const score = getLeadScore(l);
      if (priorityFilter !== 'all' && score.level !== priorityFilter) return false;
      if (onlyMissing && l.ai_summary) return false;
      return true;
    });
  }, [leads, search, statusFilter, priorityFilter, onlyMissing]);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success('Mensagem copiada.');
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1800);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  };

  const handleBatch = () => {
    const ids = filtered.map((l) => l.id);
    if (ids.length === 0) return;
    if (ids.length > 30) {
      toast.message(`Gerando ${ids.length} resumos. Pode levar alguns minutos.`);
    }
    generateMany(ids);
  };

  const missingCount = filtered.filter((l) => !l.ai_summary).length;

  return (
    <IAPageShell
      title="Insights e resumos"
      subtitle="Resumos automáticos do histórico de cada lead e próximos passos sugeridos."
      breadcrumbs={[{ label: 'Insights' }]}
      backTo="/admin/ia"
      actions={
        <Button
          onClick={handleBatch}
          disabled={!!batch || filtered.length === 0}
          className="rounded-xl"
        >
          <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5 mr-2" />
          Gerar para visíveis ({filtered.length})
        </Button>
      }
    >
      {/* Toolbar de filtros */}
      <div className="rounded-2xl border bg-card p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
          />
          <Input
            placeholder="Buscar por nome, telefone ou produto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {APP_CONFIG.leadStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as prioridades</SelectItem>
            <SelectItem value="hot">Quente</SelectItem>
            <SelectItem value="warm">Morno</SelectItem>
            <SelectItem value="cold">Frio</SelectItem>
            <SelectItem value="closed">Encerrado</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 px-2">
          <Switch id="only-missing" checked={onlyMissing} onCheckedChange={setOnlyMissing} />
          <Label htmlFor="only-missing" className="text-[13px] cursor-pointer">
            Apenas sem resumo {missingCount > 0 && <span className="text-muted-foreground">({missingCount})</span>}
          </Label>
        </div>
      </div>

      {/* Progresso do lote */}
      {batch && (
        <div className="mt-3 rounded-2xl border bg-card p-3 sm:p-4 flex items-center gap-3">
          <FontAwesomeIcon icon={faSpinner} spin className="h-4 w-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium">
              Gerando resumos… {batch.done} de {batch.total}
            </p>
            <Progress value={(batch.done / batch.total) * 100} className="h-1.5 mt-1.5" />
          </div>
          <Button variant="ghost" size="sm" onClick={cancelBatch}>
            <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5 mr-1.5" />
            Parar
          </Button>
        </div>
      )}

      {/* Lista de leads */}
      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border bg-card p-5 h-[140px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <FontAwesomeIcon icon={faLightbulb} className="h-7 w-7 text-muted-foreground/60 mb-3" />
            <p className="text-[14px] font-medium">Nenhum lead corresponde aos filtros.</p>
            <p className="text-[12.5px] text-muted-foreground mt-1">Ajuste a busca ou limpe os filtros.</p>
          </div>
        ) : (
          filtered.map((lead) => (
            <LeadInsightCard
              key={lead.id}
              lead={lead}
              isGenerating={generatingIds.has(lead.id)}
              copied={copiedId === lead.id}
              onGenerate={() => generateOne(lead.id)}
              onCopy={(text) => handleCopy(lead.id, text)}
            />
          ))
        )}
      </div>
    </IAPageShell>
  );
}

interface CardProps {
  lead: LeadRow;
  isGenerating: boolean;
  copied: boolean;
  onGenerate: () => void;
  onCopy: (text: string) => void;
}

function LeadInsightCard({ lead, isGenerating, copied, onGenerate, onCopy }: CardProps) {
  const insight = parseInsight(lead.ai_summary);
  const score = getLeadScore(lead);
  const statusCfg = getLeadStatusConfig(lead.status);
  const updatedLabel = lead.ai_summary_updated_at
    ? formatDistanceToNow(new Date(lead.ai_summary_updated_at), { addSuffix: true, locale: ptBR })
    : null;

  const waUrl = insight?.whatsapp_message
    ? buildWhatsAppUrl(lead.phone, insight.whatsapp_message)
    : null;

  return (
    <article className="rounded-2xl border bg-card p-4 sm:p-5 transition-shadow hover:shadow-card">
      <header className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-semibold text-foreground truncate">{lead.name}</h3>
            <Badge variant="secondary" className={`text-[10.5px] ${statusCfg.color}`}>
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className={`text-[10.5px] ${score.toneClass}`}>
              {PRIORITY_LABEL[score.level]}
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            {lead.product_interest ?? 'Sem produto informado'}
            {lead.phone && <span> · {lead.phone}</span>}
            {updatedLabel && <span> · resumo {updatedLabel}</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating}
            className="rounded-lg h-8"
          >
            <FontAwesomeIcon
              icon={isGenerating ? faSpinner : insight ? faRotate : faWandMagicSparkles}
              spin={isGenerating}
              className="h-3 w-3 mr-1.5"
            />
            {isGenerating ? 'Gerando…' : insight ? 'Regerar' : 'Gerar'}
          </Button>
        </div>
      </header>

      {/* Resumo */}
      <div className="mt-3">
        {insight?.summary ? (
          <p className="text-[13.5px] text-foreground/90 leading-relaxed">{insight.summary}</p>
        ) : (
          <p className="text-[12.5px] italic text-muted-foreground">
            Sem resumo ainda. Clique em <span className="font-medium not-italic">Gerar</span> para criar.
          </p>
        )}
      </div>

      {/* Próximos passos */}
      {insight && insight.next_steps.length > 0 && (
        <div className="mt-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Próximos passos
          </p>
          <ul className="space-y-1.5">
            {insight.next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-foreground/85">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* WhatsApp */}
      {insight?.whatsapp_message && (
        <div className="mt-3 rounded-xl border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mensagem sugerida
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11.5px]"
                onClick={() => onCopy(insight.whatsapp_message)}
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="h-3 w-3 mr-1" />
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
              {waUrl && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 px-2 text-[11.5px] bg-success text-success-foreground hover:bg-success/90"
                  asChild
                >
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon icon={faWhatsapp} className="h-3 w-3 mr-1" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
          <p className="text-[12.5px] text-foreground/85 leading-relaxed whitespace-pre-line">
            {insight.whatsapp_message}
          </p>
        </div>
      )}
    </article>
  );
}
