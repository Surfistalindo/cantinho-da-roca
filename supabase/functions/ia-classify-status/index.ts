// ia-classify-status — sugere status (estágio do funil) para um lote de leads.
// Recebe { lead_ids: string[] } (1..20). Para cada lead, busca dados básicos +
// últimas interações, monta um prompt único, chama o AI Gateway com tool
// calling e devolve um array com {lead_id, suggested_status, confidence, reason}.
// Persiste em leads.ai_suggested_status / ai_status_confidence.

import {
  authenticate,
  callAIGateway,
  checkRateLimit,
  handlePreflight,
  jsonResponseFor,
  mapAIGatewayError,
} from "../_shared/aiGateway.ts";

const MODEL = "google/gemini-2.5-flash";
const MAX_LEADS = 20;
const VALID = ["new", "contacting", "negotiating", "won", "lost"] as const;
type ValidStatus = (typeof VALID)[number];

const SYSTEM_PROMPT = `Você é o Analista Comercial IA de "Cantinho da Roça".
Para cada lead recebido, com base nos dados e nas interações registradas,
sugira em qual estágio do funil ele DEVERIA estar agora.

Estágios disponíveis (use exatamente estes valores):
- "new"          → lead novo, nunca abordado de fato
- "contacting"   → em contato ativo, conversa em andamento
- "negotiating"  → discutindo proposta/preço/agendamento de retirada
- "won"          → fechou, comprou, virou cliente
- "lost"         → perdeu interesse, desistiu, sem resposta há muito tempo

Regras:
- Use SOMENTE as informações fornecidas. Não invente.
- Confiança ∈ [0, 1] reflete o quão claro o histórico é.
- Razão deve ser CURTA (até ~140 chars), em PT-BR, citando o sinal usado.
- Se o histórico for vazio/insuficiente, sugira "new" com confiança baixa.

Devolva via tool 'classify_leads' o array para TODOS os leads recebidos.`;

const TOOL = {
  type: "function" as const,
  function: {
    name: "classify_leads",
    description: "Sugere status (estágio do funil) para cada lead recebido.",
    parameters: {
      type: "object",
      properties: {
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              lead_id: { type: "string" },
              suggested_status: {
                type: "string",
                enum: VALID,
              },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              reason: { type: "string" },
            },
            required: ["lead_id", "suggested_status", "confidence", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;

    const limited = checkRateLimit(req, auth.userId);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const ids: unknown = body?.lead_ids;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_LEADS) {
      return jsonResponseFor(req, { error: "invalid_lead_ids", max: MAX_LEADS }, 400);
    }
    const leadIds = ids.filter((x): x is string => typeof x === "string");
    if (leadIds.length === 0) {
      return jsonResponseFor(req, { error: "invalid_lead_ids" }, 400);
    }

    const { data: leads, error: leadsErr } = await auth.supabase
      .from("leads")
      .select("id,name,phone,origin,product_interest,status,notes,created_at,last_contact_at")
      .in("id", leadIds);
    if (leadsErr || !leads || leads.length === 0) {
      return jsonResponseFor(req, { error: "leads_not_found" }, 404);
    }

    const { data: interactions } = await auth.supabase
      .from("interactions")
      .select("lead_id,contact_type,description,interaction_date")
      .in("lead_id", leads.map((l: any) => l.id))
      .order("interaction_date", { ascending: false });

    const intsByLead = new Map<string, any[]>();
    for (const i of interactions ?? []) {
      const arr = intsByLead.get(i.lead_id) ?? [];
      if (arr.length < 10) arr.push(i);
      intsByLead.set(i.lead_id, arr);
    }

    const blocks = leads.map((l: any) => {
      const ints = (intsByLead.get(l.id) ?? [])
        .map((i: any) => `  - [${new Date(i.interaction_date).toLocaleDateString("pt-BR")}] (${i.contact_type}) ${i.description}`)
        .join("\n") || "  (sem interações)";
      return `LEAD ${l.id}
  Nome: ${l.name}
  Status atual: ${l.status}
  Origem: ${l.origin ?? "—"}
  Produto: ${l.product_interest ?? "—"}
  Notas: ${(l.notes ?? "—").slice(0, 240)}
  Criado: ${new Date(l.created_at).toLocaleDateString("pt-BR")}
  Último contato: ${l.last_contact_at ? new Date(l.last_contact_at).toLocaleDateString("pt-BR") : "—"}
  Interações:
${ints}`;
    }).join("\n\n");

    const userPrompt = `Classifique os ${leads.length} leads abaixo. Devolva 1 entry por lead, mantendo o lead_id exato.

${blocks}`;

    const aiResp = await callAIGateway({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "classify_leads" } },
    });

    const mapped = mapAIGatewayError(aiResp);
    if (mapped) return mapped;

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("ia-classify-status: no tool call", JSON.stringify(aiJson).slice(0, 500));
      return jsonResponseFor(req, { error: "ai_no_output" }, 500);
    }

    let parsed: { results: Array<{ lead_id: string; suggested_status: string; confidence: number; reason: string }> };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return jsonResponseFor(req, { error: "ai_invalid_json" }, 500);
    }

    const validIds = new Set(leads.map((l: any) => l.id as string));
    const clean = (parsed.results ?? []).filter((r) =>
      r &&
      validIds.has(r.lead_id) &&
      (VALID as readonly string[]).includes(r.suggested_status) &&
      typeof r.confidence === "number" &&
      r.confidence >= 0 && r.confidence <= 1,
    );

    // Persistência: 1 update por lead
    await Promise.all(clean.map((r) =>
      auth.supabaseAdmin
        .from("leads")
        .update({
          ai_suggested_status: r.suggested_status as ValidStatus,
          ai_status_confidence: r.confidence,
          ai_score_reason: r.reason?.slice(0, 280) ?? null,
        })
        .eq("id", r.lead_id),
    ));

    return jsonResponseFor(req, { results: clean, generated_at: new Date().toISOString() });
  } catch (e) {
    console.error("ia-classify-status error:", e);
    return jsonResponseFor(req, { error: "internal", message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
