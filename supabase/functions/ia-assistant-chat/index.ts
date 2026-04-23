// ia-assistant-chat — chat RAG streaming sobre leads/interactions do usuário.
// - Valida JWT
// - Expõe 4 tools (tool calling em loop) que consultam DB com SERVICE ROLE
// - Stream final SSE token-a-token para o cliente
// - Cliente persiste user msg + assistant final em ai_chat_messages

import {
  authenticate,
  callAIGateway,
  checkRateLimit,
  getCorsHeaders,
  handlePreflight,
  jsonResponseFor,
  mapAIGatewayError,
} from "../_shared/aiGateway.ts";

const MODEL = "google/gemini-2.5-flash";
const MAX_TOOL_LOOPS = 4;

const SYSTEM_PROMPT = `Você é o Assistente Comercial IA de "Cantinho da Roça", um CRM de vendas rurais/artesanais.
Você tem acesso à base de leads e interações do usuário através das ferramentas (tools) disponíveis.

Princípios:
- Seja conciso, direto e prático. Responda em português do Brasil.
- SEMPRE use as ferramentas para consultar dados reais — NUNCA invente leads, status ou números.
- Quando responder com listas de leads, use markdown (tabela ou lista) e inclua nome + status + dado-chave.
- Cite a fonte: ao listar leads frios, parados, etc., sempre execute a tool antes.
- Para perguntas amplas ("como está minha base?"), comece por count_leads_by_status e depois aprofunde.
- Se o usuário pedir uma ação (ex: "envie msg"), responda com SUGESTÃO de mensagem — você não envia nada.
- Status possíveis: new (Novo), contacting (Em contato), negotiating (Negociando), won (Ganho), lost (Perdido).

Sempre execute as ferramentas necessárias antes de responder.`;

interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "search_leads",
      description: "Busca leads por nome/telefone, status e/ou inatividade. Devolve no máximo 25 leads.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Busca textual em nome ou telefone (case-insensitive). Opcional." },
          status: {
            type: "string",
            enum: ["new", "contacting", "negotiating", "won", "lost"],
            description: "Filtra por status. Opcional.",
          },
          stale_days: {
            type: "number",
            description: "Apenas leads sem contato há ao menos N dias. Opcional.",
          },
          limit: { type: "number", description: "Máx 25 (default 10)." },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lead_detail",
      description: "Detalha um lead: dados + últimas 10 interações + últimas 5 notas.",
      parameters: {
        type: "object",
        properties: {
          lead_id: { type: "string", description: "UUID do lead." },
        },
        required: ["lead_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "count_leads_by_status",
      description: "Snapshot do funil — total de leads por status.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_stale_leads",
      description: "Lista leads ainda no funil ativo (não won/lost) sem contato há N dias. Default 7.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Dias de inatividade (default 7)." },
          limit: { type: "number", description: "Máx 25 (default 15)." },
        },
        additionalProperties: false,
      },
    },
  },
];

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

async function execTool(
  name: string,
  args: Record<string, unknown>,
  db: SupabaseClient,
): Promise<unknown> {
  try {
    if (name === "search_leads") {
      const limit = Math.min(Number(args.limit) || 10, 25);
      let q = db
        .from("leads")
        .select("id,name,phone,status,origin,product_interest,last_contact_at,next_contact_at,ai_score,ai_priority,created_at")
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (typeof args.status === "string") q = q.eq("status", args.status);
      if (typeof args.query === "string" && args.query.trim()) {
        const term = String(args.query).replace(/[%_]/g, "");
        q = q.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
      }
      if (typeof args.stale_days === "number" && args.stale_days > 0) {
        const cutoff = new Date(Date.now() - args.stale_days * 86400000).toISOString();
        q = q.or(`last_contact_at.lt.${cutoff},last_contact_at.is.null`);
      }
      const { data, error } = await q;
      if (error) return { error: error.message };
      return { count: data?.length ?? 0, leads: data ?? [] };
    }

    if (name === "get_lead_detail") {
      const leadId = String(args.lead_id);
      const [leadRes, intRes, noteRes] = await Promise.all([
        db.from("leads").select("*").eq("id", leadId).maybeSingle(),
        db.from("interactions").select("id,description,contact_type,interaction_date").eq("lead_id", leadId).order("interaction_date", { ascending: false }).limit(10),
        db.from("lead_notes").select("id,content,created_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(5),
      ]);
      if (leadRes.error) return { error: leadRes.error.message };
      if (!leadRes.data) return { error: "lead_not_found" };
      return {
        lead: leadRes.data,
        interactions: intRes.data ?? [],
        notes: noteRes.data ?? [],
      };
    }

    if (name === "count_leads_by_status") {
      const { data, error } = await db
        .from("leads")
        .select("status");
      if (error) return { error: error.message };
      const counts: Record<string, number> = {};
      for (const r of data ?? []) {
        const s = (r as { status: string }).status ?? "unknown";
        counts[s] = (counts[s] ?? 0) + 1;
      }
      return { total: data?.length ?? 0, by_status: counts };
    }

    if (name === "list_stale_leads") {
      const days = Number(args.days) || 7;
      const limit = Math.min(Number(args.limit) || 15, 25);
      const cutoff = new Date(Date.now() - days * 86400000).toISOString();
      const { data, error } = await db
        .from("leads")
        .select("id,name,phone,status,last_contact_at,next_contact_at,ai_score")
        .not("status", "in", "(won,lost)")
        .or(`last_contact_at.lt.${cutoff},last_contact_at.is.null`)
        .order("last_contact_at", { ascending: true, nullsFirst: true })
        .limit(limit);
      if (error) return { error: error.message };
      return { days, count: data?.length ?? 0, leads: data ?? [] };
    }

    return { error: `unknown_tool:${name}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "tool_error" };
  }
}

interface IncomingMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;

    const limited = checkRateLimit(req, auth.userId);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const incoming: IncomingMsg[] = Array.isArray(body?.messages) ? body.messages : [];
    if (incoming.length === 0) {
      return jsonResponseFor(req, { error: "messages_required" }, 400);
    }

    // Conversa enviada para o LLM (acumulada com tool_calls e tool results)
    // deno-lint-ignore no-explicit-any
    const convo: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...incoming.map((m) => ({ role: m.role, content: m.content })),
    ];

    const toolTrace: Array<{ name: string; args: Record<string, unknown> }> = [];

    // Loop de tool calling — não-streaming até o modelo decidir parar de chamar tools.
    for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
      const resp = await callAIGateway({
        model: MODEL,
        messages: convo,
        tools: TOOLS,
      });
      const errResp = mapAIGatewayError(resp);
      if (errResp) return errResp;

      const data = await resp.json();
      const choice = data?.choices?.[0];
      const message = choice?.message;
      if (!message) {
        return jsonResponseFor(req, { error: "ai_empty_response" }, 500);
      }

      const toolCalls = message.tool_calls;
      if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
        // Sem mais tool calls — agora chamamos novamente com stream=true para a resposta final.
        // (Re-incluímos a mensagem que veio para preservar contexto, mas usamos stream)
        break;
      }

      // Empurra a mensagem do assistant (com tool_calls) e executa cada tool
      convo.push({
        role: "assistant",
        content: message.content ?? "",
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        const fnName = tc?.function?.name;
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = typeof tc?.function?.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : (tc?.function?.arguments ?? {});
        } catch { /* ignore */ }
        toolTrace.push({ name: fnName, args: parsedArgs });
        // Usa supabaseAdmin (service role) — RLS já está OK para authenticated, mas service role
        // garante consistência mesmo se RLS futura mudar.
        const result = await execTool(fnName, parsedArgs, auth.supabaseAdmin);
        convo.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Chamada final em streaming — sem tools, força resposta natural
    const finalResp = await callAIGateway({
      model: MODEL,
      messages: convo,
      stream: true,
    });
    const finalErr = mapAIGatewayError(finalResp);
    if (finalErr) return finalErr;
    if (!finalResp.body) {
      return jsonResponseFor(req, { error: "no_stream_body" }, 500);
    }

    // Prepende um evento custom com o trace das tools (linha SSE do tipo "data: {trace:...}")
    const tracePayload = `data: ${JSON.stringify({ __trace: toolTrace })}\n\n`;
    const encoder = new TextEncoder();
    const upstream = finalResp.body;

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(tracePayload));
        const reader = upstream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch {
          // upstream stream error — silenciado em prod
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
  } catch (e) {
    return jsonResponseFor(req, { error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
