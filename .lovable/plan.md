## Implementar 3 páginas IA hoje em "Em construção"

A Central de IA já tem o módulo **Insights** (lead_insights) ativo. Faltam **três** capacidades anunciadas que abrem em telas "Em construção":

1. `/admin/ia/duplicates` — Duplicados globais
2. `/admin/ia/score` — Score automático
3. `/admin/ia/classify` — Classificação de status

Tudo será implementado seguindo a mesma arquitetura do `IAInsightsPage`/`ia-lead-insights`: edge function autenticada via `_shared/aiGateway.ts`, persistência nas colunas `ai_*` que já existem na tabela `leads`, UI com `IAPageShell` e `useRealtimeTable`.

---

### 1. Score automático (`/admin/ia/score`)

**Lógica**: usar a função pura `getLeadScore()` que já existe em `src/lib/leadScore.ts` (rule-based, determinística, com `reasons`). Não precisa de IA — o cálculo é mais consistente, transparente e gratuito. Persistência em `ai_score` + `ai_score_reason` + `ai_score_updated_at`.

**Frontend `IAScorePage.tsx`** (substitui `ComingSoonStub`):
- Tabela de leads com colunas: nome, status, último contato, score atual (badge), score calculado (badge).
- Filtros: busca por nome/telefone, filtro por nível (hot/warm/cold), "apenas sem score" / "apenas desatualizados (>7d)".
- Distribuição visual no topo: 4 KPI cards (Quentes ≥80, Mornos, Frios, Sem score) com contagens.
- Top 10 quentes destacados num bloco lateral com link para o detalhe do lead.
- Botões: **"Recalcular visíveis"** (loop client-side com progress bar — calcula localmente e faz `supabase.update()` em batches de 50) e **"Recalcular este"** por linha.
- Realtime via `useRealtimeTable('leads')` para refletir mudanças.

**Hook `useLeadScoring.ts`** novo:
- `recomputeOne(leadId)` — busca lead + count de interações, roda `getLeadScore`, faz `update`.
- `recomputeBatch(leadIds, onProgress)` — paraleliza em chunks de 5, suporta cancelamento.

**Sem edge function**: cálculo 100% client-side (pure function já testada). Mais rápido e sem custo de IA.

---

### 2. Classificação de status (`/admin/ia/classify`)

**Edge function `ia-classify-status/index.ts`** (nova):
- Recebe `{ lead_ids: string[] }` (1 a 20 leads).
- Para cada lead: busca campos + últimas 10 interações.
- 1 chamada AI Gateway com `google/gemini-2.5-flash` + tool calling devolvendo array `[{lead_id, suggested_status, confidence, reason}]`. Status válidos: `new|contacting|negotiating|won|lost`.
- Persiste em `ai_suggested_status` + `ai_status_confidence`.
- Validação: confidence ∈ [0,1], status ∈ enum. Filtra inválidos.
- Auth via `_shared/aiGateway.ts` (mesmo padrão do `ia-lead-insights`).
- Adicionar bloco em `supabase/config.toml`.

**Frontend `IAClassifyPage.tsx`**:
- Tabela: nome, status atual (badge), status sugerido (badge), confiança (barra %), razão (tooltip), ações.
- Filtros: busca, "apenas com sugestão", "apenas conflito (sugerido ≠ atual)", "confiança mínima" (slider 0–100%).
- Botões em massa: **"Classificar visíveis"** (chunks de 10, progress bar, cancelável), **"Aplicar todas com confiança ≥ 80%"**, "Limpar sugestões".
- Por linha: "Aplicar" (atualiza `status` para `ai_suggested_status` e zera sugestão), "Ignorar" (zera sugestão).
- KPI no topo: total / com sugestão / em conflito / aplicáveis automaticamente.

**Hook `useLeadClassification.ts`** novo: `classifyBatch(ids, onProgress)`, `applyOne(leadId)`, `applyHighConfidence(threshold)`.

---

### 3. Duplicados globais (`/admin/ia/duplicates`)

**Lógica**: 100% client-side, sem IA — usa `normalizePhone()` que já existe em `src/lib/ia/phoneFormat.ts` e similaridade de nome via Levenshtein normalizado.

**Service `src/services/ia/globalDuplicateDetector.ts`** novo:
- `findDuplicateGroups(leads)`: agrupa por `normalizePhone(phone)` exato; depois, para leads com nome ≥4 chars, agrupa por similaridade ≥0.85 quando telefone é igual ou ausente. Devolve `Array<DuplicateGroup>` onde cada grupo tem ≥2 leads e um motivo (`phone_exact` | `name_similar`).
- `mergeLeads(keepId, mergeIds)`: 
  - Concatena `notes` dos descartados ao `keep`.
  - Faz `update interactions set lead_id = keepId where lead_id in (mergeIds)` para preservar histórico.
  - Faz `update lead_notes set lead_id = keepId where lead_id in (mergeIds)`.
  - Faz `delete from leads where id in (mergeIds)`.
  - Tudo usando o supabase client (RLS já permite admins/vendedores).

**Frontend `IADuplicatesPage.tsx`** (substitui `ComingSoonStub`):
- Botão **"Varrer base"** dispara o algoritmo em memória (busca todos os leads, agrupa).
- KPIs: grupos encontrados / leads duplicados / interações afetadas.
- Lista de grupos como cards lado-a-lado:
  - Cada lead do grupo aparece como mini-card (nome, telefone, status, criado em, # interações).
  - Radio "Manter este" — escolhe o canônico (default: o mais antigo com mais interações).
  - Botão "Mesclar grupo" → confirm dialog → executa `mergeLeads`.
  - Botão "Ignorar grupo" some da lista (estado local).
- Filtros: motivo (telefone vs nome), tamanho mínimo (≥2, ≥3).
- Mostra warning quando o telefone é vazio ("agrupado só por nome — confira").

**Sem edge function**: tudo client-side. Mais rápido e auditável.

---

### Detalhes técnicos comuns

- **Realtime**: as 3 páginas usam `useRealtimeTable('leads')` para invalidar/recarregar.
- **Toasts**: usar `sonner` (`toast.success` / `toast.error`) — padrão do projeto.
- **Erros**: 429 → "limite de IA, aguarde"; 402 → "créditos esgotados"; outros → mensagem genérica.
- **Layout**: tabelas em `Card` com `Table` shadcn, badges em `LeadStatusBadge`/`LeadScoreBadge` quando aplicável (já existem). KPIs como cards pequenos no topo (mesma linguagem do `IAInsightsPage`).
- **Sem mudanças de schema**: todas as colunas necessárias já existem (`ai_score`, `ai_score_reason`, `ai_score_updated_at`, `ai_suggested_status`, `ai_status_confidence`).
- **Card da home `IAHomePage.tsx`**: já marca os 3 como `available` com links corretos — não precisa mexer.

### Arquivos a criar / editar

Criar:
- `src/hooks/useLeadScoring.ts`
- `src/hooks/useLeadClassification.ts`
- `src/services/ia/globalDuplicateDetector.ts`
- `supabase/functions/ia-classify-status/index.ts`

Reescrever (remove `ComingSoonStub`):
- `src/pages/admin/ia/IAScorePage.tsx`
- `src/pages/admin/ia/IAClassifyPage.tsx`
- `src/pages/admin/ia/IADuplicatesPage.tsx`

Editar:
- `supabase/config.toml` — adicionar bloco `[functions.ia-classify-status]` com `verify_jwt = false`.

### Fora de escopo (deixar para depois)

- "Aplicar todas as sugestões em background"/cron — manter como ação manual por enquanto.
- "Mesclar inteligente com IA" — usamos heurística determinística, mais previsível.
- Histórico de merges desfazíveis — adiciona complexidade sem pedido explícito.