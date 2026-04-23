// IA Suggest Mapping — sugere mapeamento de colunas via Lovable AI Gateway
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const FIELD_KEYS = ['name', 'phone', 'origin', 'product_interest', 'status', 'next_contact_at', 'notes', 'ignore'] as const;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const headers: string[] = Array.isArray(body?.headers) ? body.headers.slice(0, 50).map(String) : [];
    const samples: string[][] = Array.isArray(body?.samples) ? body.samples.slice(0, 5).map((r: unknown[]) => Array.isArray(r) ? r.slice(0, 50).map(v => v == null ? '' : String(v)) : []) : [];

    if (headers.length === 0) {
      return new Response(JSON.stringify({ error: 'headers required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

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

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
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
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: 'rate_limited', message: 'Limite de requisições da IA atingido. Tente novamente em instantes.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: 'payment_required', message: 'Créditos da IA esgotados. Adicione créditos no workspace.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error', aiResp.status, t);
      return new Response(JSON.stringify({ error: 'ai_error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;
    const mappings = Array.isArray(parsed?.mappings) ? parsed.mappings : [];

    return new Response(JSON.stringify({ mappings }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('ia-suggest-mapping error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
