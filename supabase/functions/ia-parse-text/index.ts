// ia-parse-text — extrai leads estruturados de texto livre via Lovable AI Gateway.
import { authenticate, callAIGateway, handlePreflight, jsonResponse, mapAIGatewayError } from "../_shared/aiGateway.ts";

const MAX_INPUT_CHARS = 20_000;

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;

    const body = await req.json().catch(() => ({}));
    const text: string = typeof body?.text === "string" ? body.text.slice(0, MAX_INPUT_CHARS) : "";
    if (!text.trim()) {
      return jsonResponse({ error: "text_required", message: "Cole algum texto antes de extrair." }, 400);
    }

    const systemPrompt = `Você é um extrator especialista de leads de CRM brasileiro. Receberá um texto livre (lista, e-mail, conversa, anotação) e deve extrair TODOS os possíveis leads mencionados.
Para cada lead identifique:
- name (nome da pessoa, obrigatório — se ausente, NÃO inclua)
- phone (telefone/celular/WhatsApp, normalizado SOMENTE com dígitos e prefixo +55 se brasileiro; se não houver, deixe null)
- origin (canal/fonte, ex: "WhatsApp", "Indicação", "Instagram"; null se não claro)
- product_interest (produto/interesse mencionado; null se não claro)
- notes (resumo de 1 frase com qualquer contexto extra relevante; null se nada)

Não invente. Não duplique. Ignore linhas em branco.`;

    const aiResp = await callAIGateway({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Texto:\n\n${text}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "submit_leads",
          description: "Devolve a lista de leads extraídos do texto.",
          parameters: {
            type: "object",
            properties: {
              leads: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    phone: { type: ["string", "null"] },
                    origin: { type: ["string", "null"] },
                    product_interest: { type: ["string", "null"] },
                    notes: { type: ["string", "null"] },
                  },
                  required: ["name", "phone", "origin", "product_interest", "notes"],
                  additionalProperties: false,
                },
              },
            },
            required: ["leads"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "submit_leads" } },
    });

    const errResp = mapAIGatewayError(aiResp);
    if (errResp) return errResp;

    const data = await aiResp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const leads = Array.isArray(parsed?.leads) ? parsed.leads : [];

    return jsonResponse({ leads, count: leads.length });
  } catch (e) {
    console.error("ia-parse-text error", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});
