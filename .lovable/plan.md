
# Vistoria completa — Cantinho da Roça

Rodei o scanner de segurança, o linter do banco, revisei `App.tsx`, edge functions, `LeadsPage`, hooks, e mapeei o que está publicado em Realtime. Encontrei **3 falhas críticas de segurança**, 7 avisos de hardening, 4 oportunidades reais de performance e alguns bugs pequenos. Plano abaixo, agrupado por prioridade.

---

## 🔴 P0 — Segurança crítica (corrigir já)

### 1. Realtime aberto a qualquer usuário autenticado
Hoje as tabelas `leads`, `customers`, `whatsapp_messages` e `whatsapp_templates` estão publicadas em `supabase_realtime` **sem nenhuma policy em `realtime.messages`**. Qualquer conta autenticada (mesmo sem role `vendedor`/`admin`) consegue se inscrever no canal e receber telefones, mensagens e dados de clientes em tempo real.

**Fix (migration):** habilitar RLS em `realtime.messages` e adicionar policy `SELECT` exigindo `has_role(auth.uid(),'admin') OR has_role(auth.uid(),'vendedor')`.

### 2. Insert público de leads sem sanitização de campos sensíveis
A policy `Anyone can submit a lead` usa `WITH CHECK (true)` — o trigger `sanitize_public_lead_insert` já zera vários campos, mas anônimo consegue gravar `assigned_to`, `ai_score`, etc. antes do trigger correr, e não há validação de tamanho/charset do `phone`.

**Fix:** reescrever a policy para listar **apenas** colunas mínimas permitidas via `WITH CHECK` (name + phone + origin + product_interest todos com bounds), e ampliar o trigger para também resetar `assigned_to`, validar formato do telefone (regex apenas dígitos/+/espaço/-/parênteses) e rejeitar payloads >2KB.

### 3. Storage `video` e `skill` sem nenhuma RLS
Buckets marcados como privados, mas `storage.objects` não tem policy → **qualquer autenticado lê/sobe/apaga qualquer arquivo de qualquer bucket**.

**Fix (migration):** adicionar 4 policies em `storage.objects` (SELECT/INSERT/UPDATE/DELETE) restritas a admin (e dono do objeto via `owner = auth.uid()` quando aplicável). Decidir buckets onde só admin pode escrever.

---

## 🟠 P1 — Hardening de banco e funções

### 4. `SECURITY DEFINER` executável por anônimo/auth
Linter aponta 8 ocorrências (4 anônimas + 4 autenticadas). Funções afetadas: `assign_default_role`, `handle_new_user`, `sanitize_public_lead_insert`, `sync_last_contact_from_interaction`, `has_role`, `update_updated_at_column`.

**Fix:** as 5 primeiras só rodam via trigger — `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated`. `has_role` precisa continuar callable por `authenticated` (usada em policies), só revogar de `anon`.

### 5. Policy SELECT incompleta em `lead_notes`
Vendedores não enxergam notas escritas por outros vendedores — gap funcional do CRM.

**Fix:** adicionar policy `SELECT` para `vendedor`/`admin` (manter restrição de DELETE só ao autor/admin).

### 6. `instance_id` do WhatsApp em texto plano
`whatsapp_config.instance_id` exposto a todo admin e legível em queries.

**Fix:** mover `instance_id` para o secret manager (já existe `ZAPI_INSTANCE_TOKEN`) e referenciá-lo apenas nas edge functions. Manter na tabela só o flag `is_configured` + `provider`.

### 7. Extensões em schema `public`
Mover extensões instaladas para schema `extensions` (criar se não existir). Baixo risco mas remove o warning do linter.

---

## 🟡 P2 — Performance e otimização

### 8. `LeadsPage.tsx` com 1056 linhas e re-render pesado
Arquivo monolítico, vários `useEffect` em sequência, sem `React.memo` nas linhas da tabela. Ações:
- Extrair `LeadsTableGroup`, `LeadsTableRow` (memoizado), `LeadsToolbar` em arquivos próprios.
- Memoizar handlers passados a cada linha (`useCallback`) para evitar invalidar `memo`.
- Trocar `localStorage.setItem` direto por `useDebouncedEffect` onde estiver em loop de resize.

### 9. `QueryClient` sem defaults
Hoje `new QueryClient()` cru → cada hook refaz fetch a cada focus, sem retry inteligente.

**Fix:** definir `staleTime: 30s`, `gcTime: 5min`, `refetchOnWindowFocus: false`, `retry: 1`.

### 10. Bundle bloated por dependências não usadas
Detectei no `package.json`: `@react-three/drei`, `three`, `@paper-design/shaders-react`, `@fortawesome/*` (com `lucide-react` já cobrindo ícones), `embla-carousel-react`. Vou rodar `rg` por uso real e remover as efetivamente órfãs antes de mexer.

**Fix:** `bun remove` das não usadas + adicionar `React.lazy` + `Suspense` para todas as páginas `/admin/ia/*` e `/admin/telemetry`/`audit-ui` (raramente abertas) no `App.tsx`.

### 11. Webfonts: dois requests para Fontshare
Hoje carrega Recoleta + General Sans num CSS único — manter. Mas há `Material Symbols Outlined` carregado em todo o site e usado só em poucos pontos. Verificar uso e, se possível, remover (já temos `lucide-react`).

---

## 🟢 P3 — Bugs e qualidade de código

### 12. `dangerouslySetInnerHTML` no sistema de tutorial
Conteúdo é estático no código (não vem de input do usuário), risco real ≈ 0, mas é uma má prática que pode virar XSS quando alguém adicionar tour vindo do banco no futuro.

**Fix:** trocar `step.body`/`step.details` para `ReactNode` (JSX) nas definições de tour, remover `dangerouslySetInnerHTML` em `TourPopover.tsx` e `HelpButton.tsx`.

### 13. `console.log/error` sobrando em produção
Achei usos em `LeadsTableDnd.tsx` e `dashboard/ActivityFeed.tsx`. Substituir por `telemetry.error()` (já existe em `src/lib/telemetry`) ou remover.

### 14. Index HTML com TODOs e `meta author=Lovable`
- Remover comentários `<!-- TODO: ... -->` deixados no `index.html`.
- Atualizar `<meta name="author">` para "Cantinho da Roça".

### 15. Migration única e auditável
Tudo de schema vai numa migration enxuta com comentários por seção, nessa ordem: revoke executes → policy realtime → policy storage → policy lead_notes → reescrita do INSERT público + trigger reforçado → mover instance_id.

---

## Como vou executar

1. **Migration de segurança** (P0 + P1.4/5/6) — uma única migration aprovada pelo usuário.
2. **Edge function `wa-send` / `wa-cadence-tick`** — atualizar para ler `instance_id` do secret em vez da tabela.
3. **Refactor `LeadsPage`** — extrair 3 componentes, memoizar linhas.
4. **`App.tsx`** — `lazy` + `Suspense` nas rotas pesadas e configurar `QueryClient`.
5. **Limpeza de deps + tutorial XSS-safe + logs + index.html.**
6. **Re-rodar `security_scan` + `linter`** ao final e marcar findings como `mark_as_fixed` com explicação.

**Nada deste plano quebra UI existente** — é cirúrgico.

### Pontos para sua decisão
- **Storage**: posso restringir `video` e `skill` a **só admin** (mais seguro) ou manter `vendedor` lendo? Vou assumir **só admin** se você não disser nada.
- **Realtime**: assumir que **só admin + vendedor** podem subscrever (mesma regra dos SELECTs já existentes).
- **Deps a remover**: vou confirmar uso real antes de remover qualquer uma; se estiver em uso, mantenho.

Aprovando, eu já começo pela migration P0.
