## Modo 2 — Reativação automática de leads via WhatsApp Cloud API

Camada **adicional** ao lado do Modo 1 (`ReengagementQueue` + `WhatsAppQuickAction` continuam funcionando como fallback manual). Nada do CRM atual é removido nem alterado em comportamento.

### Decisões confirmadas
- **Provedor**: Meta WhatsApp Cloud API (oficial)
- **Cron**: `pg_cron` a cada 5 min disparando edge function
- **Status fonte**: `contacted` (lead que já recebeu 1º contato e ficou sem resposta)
- **Status final**: mantém status atual + flag `regua_esgotada` registrada no histórico

---

### 1. Banco — 4 tabelas novas (sem tocar nas existentes)

```text
reactivation_rules         → 1 regra ativa por vez (config global)
  - active, source_status, days_step_1/2/3
  - msg_template_1/2/3, send_window_start/end (HH:MM)
  - daily_send_cap, final_action ('keep_status' | 'mark_lost')
  - timezone (default 'America/Sao_Paulo')

reactivation_queue         → fila de envios agendados
  - id, lead_id, attempt_number (1|2|3)
  - phone_e164, rendered_message
  - scheduled_at, sent_at, status
    ('pending'|'sent'|'failed'|'cancelled'|'replied')
  - error_message, provider_message_id
  - UNIQUE (lead_id, attempt_number)  ← idempotência

whatsapp_message_logs      → todo POST/erro do provedor
  - queue_id, request_payload, response_payload, http_status

whatsapp_webhook_events    → eventos crus recebidos do Meta
  - event_type, payload, processed_at, lead_id

leads (apenas adicionar 2 colunas opcionais, não muda dados)
  - automation_paused boolean default false
  - automation_finished_at timestamptz
```

RLS: todas com `has_role admin/vendedor` para SELECT/UPDATE; INSERT da fila/logs apenas via service role (edge functions).

### 2. Edge functions (4 novas)

```text
reactivation-enqueue       → roda no pg_cron a cada 5 min
  1. Lê reactivation_rules ativa
  2. SELECT leads WHERE status = source_status
       AND NOT automation_paused
       AND last_contact_at <= now() - days_step_N
       AND NOT EXISTS attempt N na queue
  3. Insere linhas pending na queue (scheduled_at respeita send_window)

reactivation-dispatch      → roda no pg_cron a cada 5 min
  1. SELECT queue WHERE status='pending' AND scheduled_at<=now()
  2. Respeita daily_send_cap (count sent hoje)
  3. Respeita janela horária da regra
  4. Renderiza template ({{nome}}, {{produto}}, {{origem}}, {{empresa}}, {{responsavel}}, {{link}})
  5. Chama Meta Graph API /messages
  6. Atualiza status sent/failed + provider_message_id
  7. Grava log em whatsapp_message_logs
  Lock: SELECT ... FOR UPDATE SKIP LOCKED

whatsapp-webhook           → endpoint público (verify_jwt=false)
  GET  → handshake hub.challenge do Meta
  POST → valida X-Hub-Signature-256 (HMAC SHA256 com APP_SECRET)
       Salva em whatsapp_webhook_events
       Se message inbound: marca queue.status='replied', cancela
       attempts futuros do mesmo lead, atualiza lead.last_contact_at
       e lead.status='negotiating', cria interaction
       Se status delivered/read: anexa ao log

reactivation-cancel        → invocada do front
  Cancela attempts pending de um lead (pause/convert/lost manual)
```

### 3. pg_cron (via insert tool, não migration)

```sql
select cron.schedule('reactivation-enqueue', '*/5 * * * *', $$
  select net.http_post(url:='…/reactivation-enqueue',
    headers:='{"apikey":"…"}'::jsonb) $$);
select cron.schedule('reactivation-dispatch', '*/5 * * * *', $$ … $$);
```

### 4. Cancelamento automático (trigger no banco)

Trigger `AFTER UPDATE ON leads`: se `status` muda para `converted | lost | negotiating` ou `automation_paused` vira true → `UPDATE reactivation_queue SET status='cancelled' WHERE lead_id = … AND status='pending'`. Garante que nem o front nem o cron precisam lembrar.

### 5. Frontend (3 telas/componentes novos)

```text
src/pages/admin/AutomationPage.tsx         (rota /admin/automation)
  Tabs:
    • "Em automação"  → leads ativos na régua
        colunas: lead | tentativa atual | próx. mensagem |
                 próx. envio | último envio | status | erro
        ações por linha: pausar | retomar | enviar agora | abrir WhatsApp
    • "Configurações" → form da reactivation_rules (toggle on/off,
        dias por tentativa, editor de templates com preview de variáveis,
        janela horária, cap diário, ação final)
    • "Histórico"     → últimos eventos (queue + logs + webhook)

src/components/admin/AutomationStatusBadge.tsx  (pendente/enviado/falhou/respondido)
src/components/admin/MessageTemplateEditor.tsx  (textarea + chips de variáveis + preview)
src/services/reactivationService.ts             (CRUD regra, pausa lead, lista fila)
```

Toggle no card do lead (`LeadDetailDrawer` existente): switch "Não enviar automação para este lead" → grava `automation_paused`. **Não toca no botão WhatsApp manual atual.**

Sidebar: novo item "Automação" com ícone, abaixo de "Pipeline". Visual Monday já aplicado é reaproveitado (`board-panel`, `crm-dense-table`, `status-cell`).

### 6. Secrets necessários (vou pedir via add_secret na implementação)

```text
META_WA_PHONE_NUMBER_ID    → ID do número no business manager
META_WA_ACCESS_TOKEN       → token permanente (System User)
META_WA_APP_SECRET         → para validar HMAC do webhook
META_WA_VERIFY_TOKEN       → string que você inventa, usada no handshake
```

URL do webhook que você cola no painel da Meta:
`https://saaxgpfdziqdjhvvtarp.supabase.co/functions/v1/whatsapp-webhook`

### 7. Segurança / anti-spam (já embutidos)

- Token só em edge function, nunca no frontend
- HMAC validado em todo POST do webhook
- `UNIQUE(lead_id, attempt_number)` impede duplicata
- `FOR UPDATE SKIP LOCKED` impede dois dispatches paralelos enviarem o mesmo
- Janela horária e cap diário lidos da regra a cada dispatch
- Telefone validado/normalizado para E.164 antes do enqueue (descarta inválido com `failed`)
- Trigger cancela automaticamente se lead responder/converter/perder/pausar
- RLS bloqueia leitura de logs para quem não é admin/vendedor

### 8. O que NÃO muda
- `ReengagementQueue.tsx`, `WhatsAppQuickAction.tsx`, `whatsappTemplates.ts`, `reengagement.ts` ficam intactos
- Botão WhatsApp manual no drawer/tabelas continua igual
- Status existentes (`new/contacted/negotiating/converted/lost`) não mudam
- Nenhuma RLS atual é alterada

### Ordem de execução (quando você aprovar)
1. Migração: 4 tabelas + 2 colunas em leads + trigger de cancelamento + RLS
2. Pedir os 4 secrets do Meta (`add_secret`)
3. Edge functions: enqueue, dispatch, webhook, cancel
4. Agendar pg_cron (insert tool)
5. Frontend: serviço + página `/admin/automation` + item de menu + toggle no drawer
6. Seed de uma `reactivation_rules` desativada com templates default
7. QA: criar lead `contacted` com `last_contact_at` antigo, rodar enqueue manual, verificar fila e dispatch em modo dry-run antes de ativar

Total estimado: ~12 arquivos novos, ~3 arquivos editados pontualmente.
