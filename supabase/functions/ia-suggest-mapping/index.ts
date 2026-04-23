// IA Suggest Mapping — sugere mapeamento de colunas via Lovable AI Gateway.
// Agora exige autenticação JWT, aplica rate limit e usa CORS allowlist.
import { authenticate, callAIGateway, checkRateLimit, handlePreflight, jsonResponseFor, mapAIGatewayError } from "../_shared/aiGateway.ts";

const FIELD_KEYS = ['name', 'phone', 'origin', 'product_interest', 'status', 'next_contact_at', 'notes', 'ignore'] as const;

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;

    const limited = checkRateLimit(req, auth.userId);
    if (limited) return limited;

    const body = await req.json().catch(() => ({}));
    const headers: string[] = Array.isArray(body?.headers) ? body.headers.slice(0, 50).map(String) : [];
    const samples: string[][] = Array.isArray(body?.samples)
      ? body.samples.slice(0, 5).map((r: unknown[]) => Array.isArray(r) ? r.slice(0, 50).map(v => v == null ? '' : String(v)) : [])
      : [];

    if (headers.length === 0) {
      return jsonResponseFor(req, { error: 'headers required' }, 400);
    }

    const systemPrompt = `Você é um especialista em CRM brasileiro. Receberá cabeçalhos e amostras de uma planilha e deve mapear cada coluna para um destes campos do CRM:
- name (nome do lead/cliente)
- phone (telefone/celular/whatsapp)
- origin (origem/canal/fonte)
- product_interest (produto/interesse)
- status (etapa do funil)
- next_contact_at (data do próximo contato/retorno)
- notes (observações/notas)
- ignore (coluna não relevante)

Retorne sempre um mapeamento por coluna com nível de confiança 0..1.`;

    const userMsg = `Cabeçalhos: ${JSON.stringify(headers)}\n\nAmostras (primeiras linhas):\n${samples.map((r, i) => `${i + 1}: ${JSON.stringify(r)}`).join('\n')}`;

    const aiResp = await callAIGateway({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'submit_mapping',
          description: 'Envia o mapeamento final das colunas',
          parameters: {
            type: 'object',
            properties: {
              mappings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    source: { type: 'string', description: 'Nome do cabeçalho original' },
                    target: { type: 'string', enum: [...FIELD_KEYS] },
                    confidence: { type: 'number' },
                  },
                  required: ['source', 'target', 'confidence'],
                  additionalProperties: false,
                },
              },
            },
            required: ['mappings'],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'submit_mapping' } },
    });

    const errResp = mapAIGatewayError(aiResp);
    if (errResp) return errResp;

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;
    const mappings = Array.isArray(parsed?.mappings) ? parsed.mappings : [];

    return jsonResponseFor(req, { mappings });
  } catch (e) {
    return jsonResponseFor(req, { error: e instanceof Error ? e.message : 'unknown' }, 500);
  }
});
