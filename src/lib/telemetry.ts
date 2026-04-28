/**
 * Telemetria leve client-side.
 * Captura erros globais, falhas de Supabase, falhas de permissão e UI.
 * Persiste em memória + localStorage (últimos N eventos).
 */

export type TelemetryLevel = "error" | "warning" | "info";
export type TelemetryCategory =
  | "supabase"
  | "permission"
  | "ui"
  | "network"
  | "runtime"
  | "auth"
  | "unknown";

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  level: TelemetryLevel;
  category: TelemetryCategory;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
  url?: string;
}

const STORAGE_KEY = "cdr.telemetry.v1";
const MAX_EVENTS = 200;

type Listener = (events: TelemetryEvent[]) => void;

class TelemetryStore {
  private events: TelemetryEvent[] = [];
  private listeners = new Set<Listener>();
  private installed = false;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.events = JSON.parse(raw);
    } catch {
      this.events = [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events.slice(0, MAX_EVENTS)));
    } catch {
      /* ignore quota */
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn([...this.events]);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const snapshot = [...this.events];
    this.listeners.forEach((l) => l(snapshot));
  }

  track(event: Omit<TelemetryEvent, "id" | "timestamp" | "url"> & { timestamp?: number }) {
    const full: TelemetryEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: event.timestamp ?? Date.now(),
      url: typeof window !== "undefined" ? window.location.pathname : undefined,
      ...event,
    };
    this.events.unshift(full);
    if (this.events.length > MAX_EVENTS) this.events.length = MAX_EVENTS;
    this.persist();
    this.emit();

    // Sempre logar no console para visibilidade do dev
    const tag = `[telemetry:${full.category}]`;
    if (full.level === "error") console.error(tag, full.message, full.context ?? "");
    else if (full.level === "warning") console.warn(tag, full.message, full.context ?? "");
    else console.info(tag, full.message, full.context ?? "");
  }

  getAll(): TelemetryEvent[] {
    return [...this.events];
  }

  getSummary() {
    const byLevel = { error: 0, warning: 0, info: 0 } as Record<TelemetryLevel, number>;
    const byCategory: Record<string, number> = {};
    for (const e of this.events) {
      byLevel[e.level]++;
      byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
    }
    return {
      total: this.events.length,
      byLevel,
      byCategory,
      lastError: this.events.find((e) => e.level === "error") ?? null,
    };
  }

  clear() {
    this.events = [];
    this.persist();
    this.emit();
  }

  install() {
    if (this.installed || typeof window === "undefined") return;
    this.installed = true;

    window.addEventListener("error", (ev) => {
      this.track({
        level: "error",
        category: "runtime",
        message: ev.message || "Unhandled error",
        stack: ev.error?.stack,
        context: { filename: ev.filename, lineno: ev.lineno, colno: ev.colno },
      });
    });

    window.addEventListener("unhandledrejection", (ev) => {
      const reason: any = ev.reason;
      const msg =
        typeof reason === "string"
          ? reason
          : reason?.message ?? "Unhandled promise rejection";
      this.track({
        level: "error",
        category: this.detectCategory(reason),
        message: msg,
        stack: reason?.stack,
        context: serializeReason(reason),
      });
    });
  }

  private detectCategory(reason: any): TelemetryCategory {
    const msg = String(reason?.message ?? reason ?? "").toLowerCase();
    const code = String(reason?.code ?? "").toLowerCase();
    if (code.startsWith("pgrst") || code.startsWith("23") || msg.includes("supabase")) return "supabase";
    if (msg.includes("permission") || msg.includes("rls") || msg.includes("not allowed") || msg.includes("denied")) return "permission";
    if (msg.includes("fetch") || msg.includes("network")) return "network";
    return "unknown";
  }
}

function serializeReason(reason: any): Record<string, unknown> {
  if (!reason || typeof reason !== "object") return { value: reason };
  const out: Record<string, unknown> = {};
  for (const k of ["code", "details", "hint", "status", "statusCode", "name"]) {
    if (k in reason) out[k] = reason[k];
  }
  return out;
}

export const telemetry = new TelemetryStore();

/** Helpers semânticos */
export const trackSupabaseError = (message: string, error: any, context?: Record<string, unknown>) =>
  telemetry.track({
    level: "error",
    category: "supabase",
    message,
    context: { ...serializeReason(error), ...context },
    stack: error?.stack,
  });

export const trackPermissionError = (message: string, context?: Record<string, unknown>) =>
  telemetry.track({ level: "error", category: "permission", message, context });

export const trackUiError = (message: string, context?: Record<string, unknown>) =>
  telemetry.track({ level: "error", category: "ui", message, context });

export const trackInfo = (message: string, category: TelemetryCategory = "unknown", context?: Record<string, unknown>) =>
  telemetry.track({ level: "info", category, message, context });
