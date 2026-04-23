

## Corrigir o chatbot IA travado em "Pensando…"

### Diagnóstico

O chat fica eternamente em "Pensando…" quando o usuário envia uma mensagem (visto no session replay). Investigando:

1. **Sem logs de edge function** (`supabase--analytics_query` vazio, `edge_function_logs` vazio para `ia-assistant-chat`) → a função **não está respondendo** (não está sendo invocada com sucesso ou está falhando antes de logar).

2. **`supabase/config.toml` está vazio** — só contém `project_id`. Após o endurecimento de segurança, as edge functions `ia-assistant-chat`, `ia-parse-text` e `ia-suggest-mapping` não têm nenhuma entrada explícita. Sem `verify_jwt = false` declarado e sem o gateway implícito do Lovable Cloud reconhecer essas funções como ativas, o request 404 silencioso ou bloqueia no preflight CORS.

3. **Bug funcional secundário no loop de tools**: em `ia-assistant-chat/index.ts` linha 220–268, se o modelo usa **todos os 4 loops chamando tools** (sem nunca parar), o `break` nunca é atingido e o `convo` final ainda contém `tool_calls` pendentes sem suas respostas correspondentes. Quando a chamada final em streaming acontece (linha 271), o gateway pode rejeitar (mensagem assistant com `tool_calls` sem follow-up) → resposta sem corpo de stream → cliente fica pendurado.

4. **Bug menor na UI** (warnings no console): `SuggestedQuestions` e `MessageBubble` (componentes function) recebem `ref` implícita do React 18 em algum ponto. Não é a causa do travamento mas suja o console — corrigir junto.

### Correções

**A. Declarar as edge functions no `config.toml`** (causa principal)

Adicionar blocos de configuração para as três funções de IA, garantindo que o sistema as reconheça e as deploye com a config correta. Como elas validam JWT explicitamente em código (via `authenticate()`), declarar `verify_jwt = false` para evitar dupla validação que pode estar bloqueando o request.

```toml
project_id = "saaxgpfdziqdjhvvtarp"

[functions.ia-assistant-chat]
verify_jwt = false

[functions.ia-parse-text]
verify_jwt = false

[functions.ia-suggest-mapping]
verify_jwt = false
```

**B. Garantir resposta final correta mesmo com loop de tools esgotado**

Em `supabase/functions/ia-assistant-chat/index.ts`:

- Após sair do `for` loop de tool calling, **se a última mensagem do assistant ainda contém `tool_calls` sem resposta** (caso o limite de 4 loops tenha sido estourado), substituir por uma mensagem instrutiva (`"Forneça a melhor resposta possível com os dados já coletados."`) antes da chamada final em streaming.
- Adicionar `console.error` simples (sem dados sensíveis) em pontos de falha para que erros futuros apareçam nos logs da edge function.
- Garantir que mesmo quando `data.choices[0].message.content` vier preenchido sem tool calls (modelo decidiu responder direto na primeira passagem), enviamos esse conteúdo via SSE em vez de fazer uma segunda chamada vazia. Hoje sempre fazemos a 2ª chamada em stream, o que dobra latência e pode falhar.

**C. Forwardar `ref` em `SuggestedQuestions` e `MessageBubble`**

Trocar export para `forwardRef` (ou aceitar a ref no props) — elimina os warnings vermelhos do console que poluem debug.

**D. Re-deploy explícito das 3 edge functions** após mudanças do `config.toml`.

**E. Validação manual (após deploy)**

1. Login no preview, abrir `/admin/ia/assistant`.
2. Clicar em "Como está minha base hoje?".
3. Verificar nos logs (`supabase--edge_function_logs ia-assistant-chat`) que a função foi invocada e retornou 200.
4. Confirmar que a resposta aparece com tabela/contagens reais.

### Arquivos modificados

- `supabase/config.toml` — adicionar 3 blocos `[functions.*]`.
- `supabase/functions/ia-assistant-chat/index.ts` — fallback para tool loop esgotado, atalho quando 1ª resposta já é final, logs de erro.
- `src/components/ia/assistant/SuggestedQuestions.tsx` — `forwardRef`.
- `src/components/ia/assistant/MessageBubble.tsx` — usar `forwardRef` no `memo`.

### Sem mudanças

- RLS, schema, autenticação, fluxo de login.
- Hook `useAIChat`, `aiAssistantService` (parser SSE já está correto).
- Outros módulos da IA (Excel, paste, WhatsApp).

### Resultado esperado

Chat responde em 2-5 segundos com dados reais da base. Logs da edge function passam a aparecer. Console limpo sem warnings de ref. Caso o modelo entre em loop de tools, ainda assim devolve uma resposta útil (não trava).

