// IA Suggest Mapping — sugere mapeamento de colunas via Lovable AI Gateway.
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

    const systemPrompt = `Você é um especialista em CRM brasileiro analisando planilhas reais de prospecção e vendas.

Cada coluna deve ser mapeada para UM destes campos:
- name → nome do lead/cliente. Sinônimos: cliente, clientes, responsável, comprador, lead
- phone → telefone/celular/whatsapp. Sinônimos: contato (quando valores são numéricos), número de contato, fone, whats
- origin → canal/origem do lead. Inclui: loja, veículo, marca, mídia, canal, fonte, campanha
- product_interest → produto que o lead quer ou nicho de interesse. Inclui: produto, produtos, nicho, ticket, pedido, item
- status → etapa do funil. Sinônimos brasileiros: processo de venda, situação, etapa, fase. Valores típicos: "novo", "em contato", "negociação", "vendido", "venda concluída", "sem resposta", "vai passar na loja"
- next_contact_at → data de retorno/próximo contato. Inclui: próximo contato, retorno, follow-up, data
- notes → observações livres. Inclui: vendedor, observações, comentários, último contato, histórico
- ignore → coluna sem valor para o CRM

REGRAS DE INFERÊNCIA:
1. Use TANTO o nome do header QUANTO os valores das amostras para decidir.
2. Se o header for ambíguo (ex: "CONTATO"), olhe as amostras: se forem numéricas → phone; se forem nomes próprios → name.
3. Valores como "VENDA CONCLUÍDA", "SEM RESPOSTA", "Vai passar na loja" são status, mesmo se o header não disser "status".
4. "LOJA" e "VEÍCULO" em planilhas de prospecção mapeiam para origin (canal de captação).
5. Cada target (exceto ignore) deve ser usado no máximo uma vez. Em caso de conflito, escolha o melhor candidato.
6. Devolva confiança ≥ 0.5 sempre que o conteúdo das amostras permitir inferir, mesmo sem header óbvio.`;

    const userMsg = `Cabeçalhos: ${JSON.stringify(headers)}\n\nAmostras (primeiras linhas, alinhadas aos cabeçalhos):\n${samples.map((r, i) => `${i + 1}: ${JSON.stringify(r)}`).join('\n')}`;

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
    console.error('ia-suggest-mapping error', e instanceof Error ? e.message : e);
    return jsonResponseFor(req, { error: e instanceof Error ? e.message : 'unknown' }, 500);
  }
});
