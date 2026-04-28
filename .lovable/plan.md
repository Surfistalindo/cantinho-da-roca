## WhatsApp Cloud API + Régua de Cadência + Tela de gestão

Implementação completa de envio oficial via **Meta WhatsApp Cloud API**, régua de cadência automática para leads `contacting` sem resposta, e nova página `/admin/whatsapp` com todas as funções de operação.

---

### Decisões já fixadas pelo usuário
- **Provedor**: Meta WhatsApp Cloud API (oficial)
- **Cron**: `pg_cron` a cada 5 min via Lovable Cloud
- **Status fonte da régua**: `contacting` (lead já recebeu 1º contato e ficou sem resposta)
- **Status final após esgotar régua**: **mantém `contacting`** + flag `cadence_exhausted = true`

---

### 1. Schema (migration única)

**Tabela `whatsapp_templates`** — templates aprovados pela Meta usados na régua.
- `id uuid pk`, `name text unique`, `meta_name text` (nome no Meta), `language text default 'pt_BR'`, `category text` (`MARKETING|UTILITY`), `body_preview text`, `variables jsonb` (lista de placeholders esperados), `step_order int` (1, 2, 3…), `delay_hours int` (gap até o próximo passo), `is_active bool default true`, `created_at`, `updated_at`.
- Seed de 3 passos padrão: `regua_dia_2`, `regua_dia_5`, `regua_dia_10`.

**Tabela `whatsapp_messages`** — log de cada disparo (in/out).
- `id`, `lead_id`, `direction text` (`out|in`), `status text` (`queued|sent|delivered|read|failed|received`), `template_name text null`, `body text`, `wa_message_id text` (id da Meta), `error_code text`, `error_message text`, `cadence_step int null`, `created_at`, `updated_at`.

**Colunas novas em `leads`**:
- `cadence_state text default 'idle'` — `idle | active | paused | exhausted | replied`
- `cadence_step int default 0`
- `cadence_next_at timestamptz null`
- `cadence_started_at timestamptz null`
- `cadence_exhausted bool default false` ⭐ flag final pedida
- `cadence_last_sent_at timestamptz null`
- `whatsapp_opt_out bool default false`

**RLS** (admins+vendedores leem/escrevem; service role bypassa para o cron):
- `whatsapp_templates`: select para auth, manage só admin.
- `whatsapp_messages`: select admin+vendedor, insert via edge function (service role).
- Adicionar policy de SELECT para o cron usar `whatsapp_messages` se necessário.

**Realtime**: `ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;` para a UI atualizar live.

---

### 2. Edge functions (4 novas)

Todas usando `_shared/aiGateway.ts` (auth/CORS/rate-limit).

#### `wa-send` — disparo manual ou programático
- Body: `{ lead_id, template_name?, body?, variables? }` (template OU body livre).
- Carrega lead, normaliza telefone (usa `normalizePhone`), checa `whatsapp_opt_out`.
- Chama Meta Graph API `POST /{PHONE_NUMBER_ID}/messages` com:
  - `template` (com components/parameters) quando `template_name` informado.
  - `text` quando body livre (só funciona dentro da janela de 24h — valida olhando `whatsapp_messages` última `direction='in'`).
- Insere `whatsapp_messages` com `wa_message_id`.
- Retorna status. Mapeia 401/403 da Meta para mensagem clara.

#### `wa-cadence-tick` — chamada pelo cron a cada 5 min
- Sem auth de usuário (service role). Verifica header secreto `X-Cron-Secret` contra `WA_CRON_SECRET`.
- Query: `leads where status='contacting' AND cadence_state IN ('idle','active') AND whatsapp_opt_out=false AND cadence_exhausted=false AND (cadence_next_at IS NULL OR cadence_next_at <= now())`.
- Para cada lead:
  - Se `cadence_step = 0` → primeiro tick: marca `cadence_state='active'`, `cadence_started_at=now()`, agenda próximo passo.
  - Senão: pega template ordem N, dispara via lógica do `wa-send`, incrementa `cadence_step`, agenda `cadence_next_at = now + delay_hours do próximo passo`.
  - Se já passou do último passo: seta `cadence_state='exhausted'`, `cadence_exhausted=true`, `cadence_next_at=null` (mantém status `contacting`).
- Limita a 30 leads por tick (rate limit Meta + cron de 5min).
- Loga cada decisão em `whatsapp_messages` (mesmo skips com `status='skipped'`).

#### `wa-webhook` — receber respostas e status callbacks da Meta
- `verify_jwt = false` (Meta envia GET de verificação sem token).
- GET: verifica `hub.verify_token` contra `WA_VERIFY_TOKEN`, devolve `hub.challenge`.
- POST: parse `entry[].changes[].value`:
  - `messages[]` (entrada): cria `whatsapp_messages` direction='in', encontra lead pelo `from` (telefone normalizado), seta `cadence_state='replied'` no lead (pausa régua), atualiza `last_contact_at`. Cria `interactions` com `contact_type='whatsapp'`.
  - `statuses[]`: atualiza `whatsapp_messages.status` por `wa_message_id`.

#### `wa-cadence-control` — controle manual (auth normal)
- Body: `{ lead_id, action: 'start'|'pause'|'resume'|'reset'|'stop' }`.
- Valida role (admin/vendedor), faz `update leads` apropriado.

---

### 3. Cron job

Usar **insert tool** (não migration — chave secreta no SQL):

```sql
select cron.schedule(
  'wa-cadence-tick-5min',
  '*/5 * * * *',
  $$ select net.http_post(
    url := 'https://saaxgpfdziqdjhvvtarp.supabase.co/functions/v1/wa-cadence-tick',
    headers := '{"Content-Type":"application/json","X-Cron-Secret":"<gerada>"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);
```

Habilitar `pg_cron` e `pg_net` na migration do schema.

---

### 4. Secrets (uso do `add_secret`)

Solicito 3 secrets ao usuário:
- `WA_PHONE_NUMBER_ID` — ID do número no painel Meta (Business Settings → WhatsApp Accounts).
- `WA_ACCESS_TOKEN` — token permanente de System User com escopos `whatsapp_business_messaging` + `whatsapp_business_management`.
- `WA_VERIFY_TOKEN` — string aleatória definida pelo usuário, colada também no callback URL do app na Meta.

Já existentes auto-gerenciadas: `LOVABLE_API_KEY`, `SUPABASE_*`. Vou gerar `WA_CRON_SECRET` no momento da criação do cron e armazená-lo via `add_secret`.

---

### 5. Frontend — nova rota `/admin/whatsapp`

Adicionar item no `AdminSidebar` (ícone `chat`, abaixo de "Clientes") e rota em `App.tsx`.

#### Layout: 4 abas no `IAPageShell`

**Aba 1 · Régua ativa** (default)
- KPIs: leads em régua / pausados / esgotados / respondentes (últimos 7d).
- Tabela: lead, telefone, passo atual (badge "1/3"), próximo envio (em X horas), última msg, status badge (`active|paused|exhausted|replied`), ações (pausar/retomar/reset).
- Filtro de status + busca por nome.
- Botão "Iniciar régua" para múltiplos leads selecionados (chips).

**Aba 2 · Conversas**
- Lista de leads com mensagens recentes (left) + thread direita estilo chat (texto enviado/recebido com timestamps + status `sent/delivered/read`).
- Composer no rodapé: textarea + select de template + botão enviar (chama `wa-send`).
- Avisa se está fora da janela de 24h (template obrigatório).
- Realtime: subscribe em `whatsapp_messages` filtrado pelo `lead_id` selecionado.

**Aba 3 · Templates**
- Lista de `whatsapp_templates` em cards: nome, language, category, preview do body, ordem na régua, delay para o próximo, toggle `is_active`.
- Botões: "Novo template" (form com nome, meta_name, body_preview, variables JSON, step_order, delay_hours), editar, excluir.
- Aviso destacado: "Templates devem estar APROVADOS na Meta com o mesmo nome em `meta_name`. O cadastro aqui é só o espelho local + ordem da régua."

**Aba 4 · Configurações**
- Status da integração: testa conectividade (chama `wa-send` em modo dry-run para o número do admin).
- Mostra `WA_PHONE_NUMBER_ID` (mascarado) e instrução para configurar webhook.
- Webhook URL pronta para copiar: `{VITE_SUPABASE_URL}/functions/v1/wa-webhook`.
- Verify token (mascarado) com botão "copiar".
- Opt-outs: lista leads com `whatsapp_opt_out=true` e botão "Reativar".

#### Hooks/services novos
- `src/hooks/useWhatsApp.ts` — `sendMessage`, `startCadence`, `pauseCadence`, `resumeCadence`, `resetCadence`.
- `src/services/whatsappService.ts` — wraps das tabelas.

---

### 6. Integrações pequenas no CRM existente

- **`LeadDetailSheet`**: novo bloco "WhatsApp" com switch "incluir na régua", botão "Enviar mensagem" abrindo o composer da nova aba via deep-link `/admin/whatsapp?lead=<id>`.
- **`LeadStatusBadge`**: quando `cadence_exhausted=true` mostra mini-tag honey "régua esgotada".
- **`LeadFilters`**: novo filtro "Régua: ativa | esgotada | sem régua".

---

### 7. Ordem de execução

1. Migration: tabelas + colunas + RLS + extensions + seed templates + realtime publication.
2. Pedir secrets via `add_secret` (`WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `WA_VERIFY_TOKEN`) — **pausa** até o usuário preencher.
3. Edge functions `wa-send`, `wa-cadence-tick`, `wa-webhook`, `wa-cadence-control` + bloco no `supabase/config.toml` (apenas `wa-webhook` precisa `verify_jwt = false`).
4. Cron job via insert tool (gera + grava `WA_CRON_SECRET`).
5. Frontend: rota, sidebar, página com 4 abas, hooks, integrações no `LeadDetailSheet`.
6. Smoke test: `supabase--curl_edge_functions` no `wa-cadence-tick` com header secreto, depois `wa-send` real para 1 número de teste.

---

### Fora de escopo (deixar para depois)
- Métricas avançadas (taxa de entrega/leitura por template).
- Conversas em grupo / mídia (foto/áudio) — só texto e templates aprovados.
- Multi-número WhatsApp Business (1 número por instalação).
- A/B test de templates.
- Botões interativos de template (Quick Reply, CTA URL) — passo 2.

### Riscos conhecidos
- **Janela de 24h**: fora dela só template aprovado funciona — UI precisa avisar e desabilitar texto livre.
- **Aprovação de templates** depende da Meta (~24h). Os 3 seeds só viram realidade quando aprovados lá; até lá, a régua roda mas pula leads cujo template não está aprovado (`status='failed'` no log).
- **Cron secret no SQL** fica armazenado em `cron.job` — RLS de `cron` schema é restrita por padrão, mas vamos rotacionar via `add_secret` se vazar.