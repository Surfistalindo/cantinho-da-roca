## Objetivo

Tirar a página `/admin/ia/insights` do estado "Em construção" e entregar a feature prometida no card:

- Resumo de 2 linhas por lead
- Lista de próximos passos sugeridos
- Filtro por prioridade, score, status, "sem resumo"
- Mensagem de follow-up integrada ao WhatsApp

Usa a IA via Lovable AI Gateway (modelo padrão `google/gemini-2.5-flash`). Os campos `ai_summary` e `ai_summary_updated_at` da tabela `leads` já existem — vão ser reaproveitados, sem migração.

## O que será criado / alterado

### 1. Edge function `ia-lead-insights`

`supabase/functions/ia-lead-insights/index.ts` + entrada em `supabase/config.toml`.

- Valida JWT (reusa `_shared/aiGateway.ts`).
- Recebe `{ lead_id }`.
- Lê o lead (RLS) e até 20 interações mais recentes.
- Chama o gateway com **tool calling** (`lead_insight`) para garantir saída estruturada:
  - `summary` (≤ ~220 chars, 2 linhas)
  - `next_steps` (2 a 4 itens)
  - `whatsapp_message` (PT-BR, ≤ ~280 chars)
- Persiste em `leads.ai_summary` (JSON serializado) + `ai_summary_updated_at` (cache).
- Retorna o JSON ao cliente.
- Tratamento padronizado de 429/402 (já vem do helper).

### 2. Página `IAInsightsPage` reescrita

Substitui o `ComingSoonStub` por:

- **Toolbar** com:
  - Busca por nome/telefone
  - Filtro de status (reusa `APP_CONFIG.leadStatuses`)
  - Filtro de prioridade (reusa `getLeadScore` → `hot/warm/cold`)
  - Toggle "Apenas sem resumo"
  - Botão "Gerar para visíveis" (lote, com barra de progresso, sequencial respeitando rate-limit)
- **Lista densa** de cards de lead, cada card com:
  - Nome, status, badge de prioridade, "atualizado há X"
  - Resumo de 2 linhas (do cache `ai_summary`); placeholder se ainda não tem
  - Chips com `next_steps`
  - Botões: "Gerar / Regerar", "Copiar mensagem", "Abrir WhatsApp" (preenche `wa.me/?text=...`)
- Realtime via `useRealtimeTable('leads', refetch)` (já existe no projeto) para refletir resumos novos.
- Loading state dedicado por lead durante a geração.
- Toasts para sucesso, rate-limit (429) e créditos esgotados (402) usando `sonner`.

### 3. Hook `useLeadInsights`

`src/hooks/useLeadInsights.ts` — encapsula `supabase.functions.invoke('ia-lead-insights', { body: { lead_id } })`, mapeia erros (`rate_limited`, `payment_required`) e expõe `generateOne(leadId)` + `generateMany(ids)` com progresso.

### 4. Helper de parsing

`src/lib/leadInsights.ts` — `parseInsight(ai_summary: string | null)` que retorna `{ summary, next_steps, whatsapp_message } | null` com try/catch (resumo legado em texto puro vira `summary`).

## Detalhes técnicos

- **Modelo**: `google/gemini-2.5-flash` (rápido + barato; bom o suficiente para resumo curto).
- **Saída estruturada**: tool calling com `tool_choice` forçado para evitar resposta livre.
- **Persistência**: `ai_summary` em texto JSON; `ai_summary_updated_at` como timestamp. Sem migração necessária.
- **Lote**: cliente faz requisições sequenciais com 350 ms entre elas; progresso visível; cancelável via `AbortController`.
- **Sem mocks**: tudo usa Lovable AI real.
- **Sem alteração no CRM Monday clean** além desta página.
- **Sem novos secrets** (LOVABLE_API_KEY já está provisionado).

## Estrutura final

```text
supabase/
  functions/
    ia-lead-insights/index.ts        (novo)
  config.toml                        (+ bloco verify_jwt = true por padrão; sem alteração)

src/
  hooks/useLeadInsights.ts           (novo)
  lib/leadInsights.ts                (novo)
  pages/admin/ia/IAInsightsPage.tsx  (reescrita)
```

## Fora de escopo

- Geração agendada/cron de resumos.
- Persistir `next_steps` em coluna própria (mantém-se serializado em `ai_summary` para evitar migração).
- Alterações em outras páginas IA.
