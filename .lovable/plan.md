

## Plano: ativar todas as funções de IA do módulo (pacote completo)

Implementação de **9 features de IA** marcadas como "em breve", organizadas em 3 ondas com base nas suas escolhas: gravar resultados em **colunas novas em `leads`** + Assistente Comercial com **acesso total (RAG)** sobre leads/interações.

Zero impacto em pipeline, dashboard, clientes, auth, landing.

---

### 1. Mudanças de schema (1 migração)

Adicionar colunas em `leads` (todas opcionais, sem default destrutivo):

```sql
ALTER TABLE public.leads
  ADD COLUMN ai_score             smallint,         -- 0..100
  ADD COLUMN ai_score_reason      text,             -- explicação curta
  ADD COLUMN ai_score_updated_at  timestamptz,
  ADD COLUMN ai_suggested_status  text,             -- LeadStatus sugerido
  ADD COLUMN ai_status_confidence numeric,          -- 0..1
  ADD COLUMN ai_summary           text,             -- resumo gerado
  ADD COLUMN ai_summary_updated_at timestamptz,
  ADD COLUMN ai_priority          text;             -- 'alta'|'media'|'baixa'
```

Nova tabela para conversas do Assistente:

```sql
CREATE TABLE public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages select" ON public.ai_chat_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own messages insert" ON public.ai_chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own messages delete" ON public.ai_chat_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ON public.ai_chat_messages (conversation_id, created_at);
```

Estender `ia_import_logs.source` (apenas valores aceitos — `text` permanece): `'excel' | 'csv' | 'paste' | 'whatsapp'`.

Nenhuma alteração em RLS de `leads` — colunas novas herdam policies existentes.

---

### 2. Edge functions novas (8, todas via Lovable AI Gateway)

Cada uma valida JWT em código, usa CORS aberto, modelo padrão `google/gemini-3-flash-preview` (subir para `gemini-2.5-flash` no assistente RAG), trata 429/402.

```
supabase/functions/
├── ia-suggest-mapping/         (já existe)
├── ia-parse-csv/               1. CSV avançado: detecta delimitador/encoding + reusa fluxo Excel
├── ia-parse-text/              2. Texto colado: extrai leads de texto livre via tool calling
├── ia-parse-whatsapp/          3. Lista WhatsApp: parser de export do WhatsApp
├── ia-detect-duplicates/       4. Duplicados globais: varredura full base + propostas de merge
├── ia-classify-lead/           5. Sugere status + prioridade (single ou batch)
├── ia-score-lead/              6. Score 0..100 + razão (single ou batch)
├── ia-summarize-lead/          7. Resumo + próximos passos (single)
└── ia-assistant-chat/          8. Chat RAG streaming (SSE) com acesso a leads/interactions
```

**`ia-assistant-chat` (RAG, o mais importante):**
- Recebe `{ messages: [...], conversation_id }`.
- Valida JWT → usa `SERVICE_ROLE_KEY` para ler leads/interactions do usuário (RLS já permite a authenticated, mas service role garante consistência se rodar em background).
- Antes de chamar o LLM, executa **tool calling em loop** com 4 tools expostas:
  - `search_leads({ query?, status?, stale_days?, limit })` → retorna até 25 leads relevantes
  - `get_lead_detail({ lead_id })` → lead + últimas 10 interações + notas
  - `count_leads_by_status()` → snapshot do funil
  - `list_stale_leads({ days })` → leads sem contato há N dias
- Streaming SSE token-a-token (padrão documentado).
- Persiste user msg + assistant final em `ai_chat_messages`.

---

### 3. Novas páginas e rotas

```
/admin/ia                      (refator: cards "soon" viram "available")
/admin/ia/csv                  ← submódulo CSV (reusa hook excel + parser CSV)
/admin/ia/paste                ← submódulo Texto colado
/admin/ia/whatsapp             ← submódulo Lista WhatsApp
/admin/ia/duplicates           ← varredura global de duplicados
/admin/ia/classify             ← rodar classificação em massa (sugestão de status)
/admin/ia/score                ← rodar scoring em massa
/admin/ia/insights             ← painel de resumos por lead + insights agregados
/admin/ia/assistant            ← Assistente Comercial (chat RAG)
```

Sidebar ganha **subitens colapsáveis** sob "IA" para evitar poluição do menu principal.

---

### 4. Componentes novos (organização por feature)

```
src/components/ia/
├── csv/              CsvUploader, CsvDelimiterPicker
├── paste/            PasteTextZone, ExtractedLeadsPreview
├── whatsapp/         WhatsAppPaste, WhatsAppParserResult
├── duplicates/       GlobalDuplicateScanner, DuplicateGroupCard, MergeDialog
├── classify/         BatchClassifyPanel, StatusSuggestionRow, ApplyAllBar
├── score/            BatchScorePanel, ScoreDistributionChart, LeadScoreCell
├── insights/         LeadSummaryCard, InsightsOverview, NextStepsList
└── assistant/        AssistantChatShell, MessageBubble, ToolCallTrace,
                      SuggestedQuestions, ConversationSidebar
```

Componentes reusados de leads:
- `LeadDetailSheet` ganha 3 novas tabs: **Resumo IA**, **Score**, **Sugestões**.
- `LeadCard` (pipeline) ganha mini-badge de score se `ai_score != null`.

---

### 5. Hooks e serviços

```
src/services/ai/
├── aiClassifyService.ts     classify(leadId) | classifyBatch(ids[])
├── aiScoreService.ts        score(leadId)    | scoreBatch(ids[])
├── aiSummarizeService.ts    summarize(leadId)
├── aiDuplicatesService.ts   scanGlobal(), mergeLeads(idA, idB, strategy)
└── aiAssistantService.ts    streamChat(messages, conversationId, onDelta, onDone)

src/hooks/
├── useAIBatchJob.ts         orquestra processamento em lotes c/ progresso (reusa padrão do importExecutor)
├── useAIChat.ts             estado da conversa, persistência, abort controller
└── useLeadAIMeta.ts         lê ai_score/ai_summary/etc. de um lead
```

Sem alterar `leadService`, `interactionService`, `clientService`.

---

### 6. Detalhamento por feature

**CSV avançado** (`/admin/ia/csv`)
- Edge `ia-parse-csv`: amostra 4KB do arquivo → IA infere delimitador (`, ; \t |`) e encoding (`utf-8 / latin1`).
- A partir daí entra **exatamente no mesmo fluxo Excel** (mapping → strategy → review → dedup → import). Reaproveita 95% do hook `useExcelImport` renomeado para `useTabularImport` com `source: 'csv' | 'excel'`.

**Texto colado** (`/admin/ia/paste`)
- Textarea grande + botão "Extrair leads".
- Edge `ia-parse-text` recebe texto livre → tool calling devolve `{ leads: [{ name, phone, notes }] }`.
- Resultado entra no mesmo fluxo (mapping pulado, vai direto a strategy → review → dedup → import).

**Lista do WhatsApp** (`/admin/ia/whatsapp`)
- Aceita texto colado de export `.txt` do WhatsApp ou colado direto de uma lista de contatos.
- Edge `ia-parse-whatsapp` reconhece formato `[data hora] Nome: msg` e listas de contatos (nome + número).
- Mesma cauda do fluxo (review → dedup → import).

**Duplicados Inteligentes globais** (`/admin/ia/duplicates`)
- Botão "Escanear base agora" → edge `ia-detect-duplicates` ou heurística client-side (telefone normalizado igual + nome com Levenshtein ≥ 0.85).
- IA é chamada apenas para **sugestão de merge** (qual nome manter, conciliar notas) — não para o match.
- UI: lista de grupos de duplicados, lado-a-lado, ação Mesclar / Manter ambos / Ignorar.
- Mesclar: cria interaction "merged from [outro lead]", copia notas+interactions, deleta o secundário.

**Sugestão de status** (`/admin/ia/classify`)
- Lista todos leads (filtro: "todos" / "só sem ai_suggested_status" / "status atual conflita com sugestão").
- Botão "Classificar selecionados (N)" → roda `ia-classify-lead` em lotes de 20.
- Cada linha mostra: status atual → status sugerido + confiança. Ação: Aplicar (vira o real) / Ignorar.
- Bulk "Aplicar todas com confiança ≥ 80%".

**Score automático** (`/admin/ia/score`)
- Roda `ia-score-lead` em lotes. Considera: recência do último contato, quantidade de interações, status atual, tempo no funil, presença de telefone, origem.
- Grava `ai_score` (0–100) + `ai_score_reason` (1 frase) + `ai_score_updated_at`.
- Painel mostra distribuição (chart de barras), top 10, leads ≥80 (quentes), leads ≤30 (frios).
- Pipeline e tabela de leads passam a exibir badge de score.

**Follow-up automático** (botão dentro de `LeadDetailSheet` + página `/admin/ia/insights`)
- Para um lead, gera **sugestão de mensagem** (WhatsApp) personalizada via IA, considerando histórico.
- Não envia automaticamente — abre `WhatsAppQuickAction` já existente com mensagem pré-preenchida.
- Lista de "leads precisando de follow-up" gerada por regra (sem contato há ≥7d em status ativo) + botão "Sugerir mensagem" inline.

**Assistente Comercial IA** (`/admin/ia/assistant`)
- UI estilo chat (sidebar com conversas + área central com `MessageBubble` markdown).
- Suggested prompts: "Quem está parado há mais de 7 dias?", "Resuma os top 5 leads quentes", "Quais leads estão prontos para fechar?", "Faça uma triagem da minha base de hoje".
- Streaming SSE token-a-token.
- Mostra trace colapsável das tool calls executadas (transparência: "consultei `list_stale_leads(days=7)` → 12 leads").
- Cada conversa persiste em `ai_chat_messages`, identificada por `conversation_id`.

**Insights de leads / Resumos** (`/admin/ia/insights`)
- Grid de `LeadSummaryCard`: nome, score, status, resumo de 2 linhas, próximos passos sugeridos.
- Botão "Gerar resumo" por card (ou batch no header) → `ia-summarize-lead` → grava `ai_summary` + `ai_summary_updated_at`.
- Filtro por: prioridade, score, status, sem resumo ainda.
- Tab adicional no `LeadDetailSheet` mostra o resumo + botão "Atualizar".

---

### 7. Hub `/admin/ia` redesenhado

- Todos os cards "em breve" passam a **available** com rota real.
- Hero ganha 2º CTA secundário: "Abrir Assistente IA".
- Nova seção **"Saúde da base com IA"** no topo: 3 KPIs (% leads com score / % com resumo / leads quentes) + botão "Atualizar tudo agora".
- Roadmap antigo é removido (não há mais "soon").

---

### 8. Dependências e configuração

- **Nenhuma dep nova de NPM.** Tudo client-side já temos (`react-markdown` precisa ser adicionado para o chat → 1 dep nova).
- **1 dep nova:** `react-markdown` (~50KB) — para renderizar respostas do Assistente.
- `supabase/config.toml`: adiciona blocos `[functions.X]` apenas se necessário (padrão `verify_jwt = false` já cobre, JWT validado em código).

---

### 9. Garantias e limites

- Zero alteração em pipeline/dashboard/clientes/landing/auth.
- `leadService`/`interactionService`/`clientService` permanecem intocados.
- Colunas IA são todas opcionais → app continua funcionando se nunca rodar IA.
- RLS estrito em `ai_chat_messages` (só dono lê/insere/deleta).
- Custos de IA controlados: batch jobs só processam IDs explicitamente selecionados; assistente roda sob demanda.
- Erros 429/402 do Gateway propagados com toasts amigáveis em todas as features.
- Streaming do assistente respeita o parser SSE robusto (linha-a-linha, partial JSON, [DONE], CRLF).

---

### 10. Ordem de execução (em mensagens)

**Mensagem 1 — Fundação:**
1. Migração: colunas IA em `leads` + tabela `ai_chat_messages` + RLS.
2. Refator hub `/admin/ia` (cards viram available, sidebar com subitens).
3. Helper compartilhado `aiGatewayHelper.ts` para edge functions (CORS, JWT, 429/402).

**Mensagem 2 — Importações expandidas (CSV / Texto / WhatsApp):**
4. Generaliza `useExcelImport` → `useTabularImport`.
5. Edge `ia-parse-csv`, `ia-parse-text`, `ia-parse-whatsapp`.
6. Páginas `/admin/ia/csv`, `/paste`, `/whatsapp`.

**Mensagem 3 — Inteligência sobre leads (Score / Status / Resumos / Duplicados globais):**
7. Edges `ia-classify-lead`, `ia-score-lead`, `ia-summarize-lead`, `ia-detect-duplicates`.
8. Páginas `/admin/ia/classify`, `/score`, `/insights`, `/duplicates`.
9. Tabs novas no `LeadDetailSheet` + badge de score em `LeadCard`.

**Mensagem 4 — Assistente Comercial RAG + Follow-up:**
10. Edge `ia-assistant-chat` com tool calling em loop (4 tools).
11. Página `/admin/ia/assistant` com chat streaming + persistência.
12. Sugestões de follow-up integradas a `WhatsAppQuickAction`.

