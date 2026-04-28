// ia-lead-insights — gera resumo + próximos passos + msg WhatsApp para um lead.
// - valida JWT (helper)
// - rate-limit em memória
// - lê lead + interações (RLS)
// - chama Lovable AI Gateway com tool calling (saída estruturada)
// - persiste em leads.ai_summary (JSON) + ai_summary_updated_at
// - devolve { summary, next_steps[], whatsapp_message, lead_id, generated_at }

import {
  authenticate,
  callAIGateway,
  checkRateLimit,
  handlePreflight,
  jsonResponseFor,
  mapAIGatewayError,
} from "../_shared/aiGateway.ts";

const MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT = `Você é o Analista Comercial IA de "Cantinho da Roça" (vendas rurais/artesanais).
Dado o histórico de UM lead, produza:
1) Resumo OBJETIVO de no máximo 2 linhas (até ~220 caracteres).
2) 2 a 4 PRÓXIMOS PASSOS comerciais bem específicos e acionáveis.
3) Mensagem curta de follow-up por WhatsApp (cordial, PT-BR, máx ~280 chars), com nome do lead e produto quando houver.

Regras:
- Use SOMENTE as informações fornecidas. Não invente fatos.
- Direto, sem floreios. Português do Brasil.
- Se faltar histórico, diga isso no resumo e proponha passos de descoberta.`;

const TOOL = {
  type: "function" as const,
  function: {
    name: "lead_insight",
    description: "Devolve resumo, próximos passos e mensagem de WhatsApp para o lead.",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Resumo objetivo de no máximo 2 linhas (~220 chars)." },
        next_steps: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          items: { type: "string" },
          description: "2 a 4 próximos passos comerciais acionáveis.",
        },
        whatsapp_message: {
          type: "string",
          description: "Mensagem de follow-up curta para WhatsApp (PT-BR, ~280 chars).",
        },
      },
      required: ["summary", "next_steps", "whatsapp_message"],
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
    const leadId: string | undefined = body?.lead_id;
    if (!leadId || typeof leadId !== "string") {
      return jsonResponseFor(req, { error: "missing lead_id" }, 400);
    }

    const { data: lead, error: leadErr } = await auth.supabase
      .from("leads")
      .select("id,name,phone,origin,product_interest,status,notes,created_at,last_contact_at,next_contact_at")
      .eq("id", leadId)
      .maybeSingle();
    if (leadErr || !lead) {
      return jsonResponseFor(req, { error: "lead_not_found" }, 404);
    }

    const { data: interactions } = await auth.supabase
      .from("interactions")
      .select("contact_type,description,interaction_date")
      .eq("lead_id", leadId)
      .order("interaction_date", { ascending: false })
      .limit(20);

    const ints = (interactions ?? [])
      .map((i: any) => `- [${new Date(i.interaction_date).toLocaleDateString("pt-BR")}] (${i.contact_type}) ${i.description}`)
      .join("\n") || "(sem interações registradas)";

    const userPrompt = `LEAD
Nome: ${lead.name}
Telefone: ${lead.phone ?? "—"}
Status: ${lead.status}
Origem: ${lead.origin ?? "—"}
Produto de interesse: ${lead.product_interest ?? "—"}
Notas: ${lead.notes ?? "—"}
Cadastro: ${new Date(lead.created_at).toLocaleDateString("pt-BR")}
Último contato: ${lead.last_contact_at ? new Date(lead.last_contact_at).toLocaleDateString("pt-BR") : "—"}
Próximo contato: ${lead.next_contact_at ? new Date(lead.next_contact_at).toLocaleDateString("pt-BR") : "—"}

HISTÓRICO DE INTERAÇÕES (mais recentes primeiro):
${ints}

Chame a tool 'lead_insight' com o resultado.`;

    const aiResp = await callAIGateway({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "lead_insight" } },
    });

    const mapped = mapAIGatewayError(aiResp);
    if (mapped) return mapped;

    const aiJson = await aiResp.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("ia-lead-insights: no tool call", JSON.stringify(aiJson).slice(0, 500));
      return jsonResponseFor(req, { error: "ai_no_output" }, 500);
    }

    let parsed: { summary: string; next_steps: string[]; whatsapp_message: string };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return jsonResponseFor(req, { error: "ai_invalid_json" }, 500);
    }

    const payload = {
      summary: parsed.summary,
      next_steps: parsed.next_steps,
      whatsapp_message: parsed.whatsapp_message,
    };

    const generatedAt = new Date().toISOString();
    await auth.supabaseAdmin
      .from("leads")
      .update({
        ai_summary: JSON.stringify(payload),
        ai_summary_updated_at: generatedAt,
      })
      .eq("id", leadId);

    return jsonResponseFor(req, { ...payload, lead_id: leadId, generated_at: generatedAt });
  } catch (e) {
    console.error("ia-lead-insights error:", e);
    return jsonResponseFor(req, { error: "internal", message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
