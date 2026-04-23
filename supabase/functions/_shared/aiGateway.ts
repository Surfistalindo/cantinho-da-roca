// Helper compartilhado para edge functions de IA.
// - CORS aberto
// - validação de JWT via Supabase
// - chamadas ao Lovable AI Gateway com tratamento padronizado de 429/402

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const DEFAULT_MODEL = "google/gemini-3-flash-preview";

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
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
 * - `supabase`: client autenticado como o usuário (respeita RLS).
 * - `supabaseAdmin`: client com service role (bypass RLS, use com cuidado).
 */
export async function authenticate(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "unauthorized" }, 401);
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
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  return {
    userId: data.user.id as string,
    authHeader,
    supabase,
    supabaseAdmin,
  };
}

export interface AIChatOptions {
  model?: string;
  messages: Array<{ role: string; content: unknown; tool_calls?: unknown; tool_call_id?: string; name?: string }>;
  tools?: unknown[];
  tool_choice?: unknown;
  stream?: boolean;
  reasoning?: { effort: "minimal" | "low" | "medium" | "high" | "xhigh" | "none" };
}

/**
 * Chama o Lovable AI Gateway com tratamento padronizado de erros.
 * Devolve a Response bruta (útil para streaming) — o caller decide como consumir.
 */
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

/** Converte 429/402/etc. em respostas JSON amigáveis. Devolve null se status OK. */
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
