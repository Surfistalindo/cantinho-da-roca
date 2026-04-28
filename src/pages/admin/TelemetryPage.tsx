import { useEffect, useMemo, useState } from "react";
import {
  telemetry,
  type TelemetryEvent,
  type TelemetryLevel,
} from "@/lib/telemetry";
import PageHeader from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Bug,
  Info,
  ShieldAlert,
  Trash2,
  Activity,
} from "lucide-react";

const levelMeta: Record<
  TelemetryLevel,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  error: { label: "Erro", className: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle },
  warning: { label: "Aviso", className: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: ShieldAlert },
  info: { label: "Info", className: "bg-primary/10 text-primary border-primary/20", icon: Info },
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("pt-BR");
}

export default function TelemetryPage() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => telemetry.subscribe(setEvents), []);

  const summary = useMemo(() => telemetry.getSummary(), [events]);

  const categories = useMemo(() => {
    const set = new Set(events.map((e) => e.category));
    return ["all", ...Array.from(set)];
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (levelFilter !== "all" && e.level !== levelFilter) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      return true;
    });
  }, [events, levelFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telemetria"
        description="Resumo de erros e eventos críticos capturados em tempo real."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                throw new Error("Telemetria: erro de teste disparado manualmente");
              }}
            >
              <Bug className="mr-2 h-4 w-4" />
              Disparar erro de teste
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => telemetry.clear()}
              disabled={events.length === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar histórico
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Total" value={summary.total} icon={Activity} />
        <SummaryCard label="Erros" value={summary.byLevel.error} tone="error" icon={AlertTriangle} />
        <SummaryCard label="Avisos" value={summary.byLevel.warning} tone="warning" icon={ShieldAlert} />
        <SummaryCard label="Info" value={summary.byLevel.info} tone="info" icon={Info} />
      </div>

      {summary.lastError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Último erro registrado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{summary.lastError.message}</div>
            <div className="text-xs text-muted-foreground">
              {formatTime(summary.lastError.timestamp)} · {summary.lastError.category}
              {summary.lastError.url ? ` · ${summary.lastError.url}` : ""}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <CardTitle className="text-base">Eventos</CardTitle>
          <div className="flex gap-2">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos níveis</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
                <SelectItem value="warning">Avisos</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === "all" ? "Todas categorias" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[480px]">
            {filtered.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Nenhum evento registrado.
              </div>
            ) : (
              <ul className="divide-y">
                {filtered.map((e) => {
                  const meta = levelMeta[e.level];
                  const Icon = meta.icon;
                  return (
                    <li key={e.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {e.message}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {formatTime(e.timestamp)}
                              {e.url ? ` · ${e.url}` : ""}
                            </div>
                            {e.context && Object.keys(e.context).length > 0 && (
                              <pre className="mt-2 max-w-xl overflow-auto rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                                {JSON.stringify(e.context, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className={meta.className}>
                            {meta.label}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {e.category}
                          </Badge>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone?: "error" | "warning" | "info";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClass =
    tone === "error"
      ? "text-destructive"
      : tone === "warning"
      ? "text-amber-600"
      : tone === "info"
      ? "text-primary"
      : "text-foreground";
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
        </div>
        <Icon className={`h-5 w-5 ${toneClass}`} />
      </CardContent>
    </Card>
  );
}
