// Helper compartilhado para edge functions de IA.
// - CORS com allowlist
// - validação de JWT via Supabase
// - chamadas ao Lovable AI Gateway com tratamento padronizado de 429/402
// - rate limit em memória por usuário

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = [
  "https://cantinho-da-roca.lovable.app",
  "https://cantimdarocaa.com.br",
  "https://www.cantimdarocaa.com.br",
  "http://localhost:5173",
  "http://localhost:8080",
];

function buildCorsHeaders(origin: string | null): Record<string, string> {
  // Permite domínios da allowlist + qualquer subdomínio *.lovable.app
  // (necessário para previews e domínios de publish do Lovable).
  let allowOrigin = "null";
  if (origin) {
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin) ||
      /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i.test(origin)
    ) {
      allowOrigin = origin;
    }
  }
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// CORS headers padrão (usado quando não há request — fallback).
// Não exporte como objeto fixo: prefira getCorsHeaders(req).
export const corsHeaders = buildCorsHeaders(null);

export function getCorsHeaders(req: Request): Record<string, string> {
  return buildCorsHeaders(req.headers.get("Origin"));
}

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

export function jsonResponseFor(req: Request, body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json", ...extraHeaders },
  });
}

export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response(null, { headers: getCorsHeaders(req) });
  return null;
}

export interface AuthContext {
  userId: string;
  authHeader: string;
  supabase: ReturnType<typeof createClient>;
  supabaseAdmin: ReturnType<typeof createClient>;
}

/**
 * Valida o JWT do request e devolve clients Supabase prontos para uso.
 */
export async function authenticate(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponseFor(req, { error: "unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    return jsonResponseFor(req, { error: "unauthorized" }, 401);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  return {
    userId: data.user.id as string,
    authHeader,
    supabase,
    supabaseAdmin,
  };
}

// ---------- Rate limiting em memória por usuário ----------
// Janela deslizante: max N requests por janela de tempo.
// Não persistente — reinicia quando a função é redeployada. Para algo
// robusto seria preciso uma tabela. Aqui o objetivo é evitar abuso óbvio.
interface RateBucket { count: number; resetAt: number }
const rateBuckets = new Map<string, RateBucket>();
const RATE_WINDOW_MS = 60_000; // 1 minuto
const RATE_MAX = 30;            // 30 requests/min/usuário

export function checkRateLimit(req: Request, userId: string): Response | null {
  const now = Date.now();
  const bucket = rateBuckets.get(userId);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }
  bucket.count += 1;
  if (bucket.count > RATE_MAX) {
    return jsonResponseFor(
      req,
      { error: "rate_limited", message: "Muitas requisições. Aguarde alguns segundos e tente novamente." },
      429,
      { "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)) },
    );
  }
  return null;
}

// Limpa buckets antigos periodicamente (best effort)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) if (v.resetAt < now) rateBuckets.delete(k);
}, 5 * 60_000);

export interface AIChatOptions {
  model?: string;
  messages: Array<{ role: string; content: unknown; tool_calls?: unknown; tool_call_id?: string; name?: string }>;
  tools?: unknown[];
  tool_choice?: unknown;
  stream?: boolean;
  reasoning?: { effort: "minimal" | "low" | "medium" | "high" | "xhigh" | "none" };
}

export async function callAIGateway(opts: AIChatOptions): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  return await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages: opts.messages,
      ...(opts.tools ? { tools: opts.tools } : {}),
      ...(opts.tool_choice ? { tool_choice: opts.tool_choice } : {}),
      ...(opts.stream ? { stream: true } : {}),
      ...(opts.reasoning ? { reasoning: opts.reasoning } : {}),
    }),
  });
}

export function mapAIGatewayError(resp: Response): Response | null {
  if (resp.ok) return null;
  if (resp.status === 429) {
    return jsonResponse(
      { error: "rate_limited", message: "Limite de requisições da IA atingido. Tente novamente em instantes." },
      429,
    );
  }
  if (resp.status === 402) {
    return jsonResponse(
      { error: "payment_required", message: "Créditos da IA esgotados. Adicione créditos no workspace." },
      402,
    );
  }
  return jsonResponse({ error: "ai_error", status: resp.status }, 500);
}
