

# Auditoria de Segurança — Cantinho da Roça

Revisão completa do projeto (landing pública + CRM privado + módulo IA + edge functions). Objetivo: elevar a postura de segurança ao nível profissional, eliminando dependência exclusiva do frontend e endurecendo o backend (RLS, validações, autorização real).

## 🔴 Achados críticos (precisam ser corrigidos)

### 1. RLS de `profiles` vaza e-mails de todos os usuários
- **Problema**: política `SELECT` usa `USING (true)`. Qualquer usuário autenticado lê e-mail e nome de **todos** os outros usuários. (PUBLIC_USER_DATA — error)
- **Correção**: trocar por `auth.uid() = user_id` ou exigir `has_role('admin')` para listagem global. Manter visualização própria + acesso admin.

### 2. Realtime sem autorização de canal — vaza eventos
- **Problema 1**: `realtime.messages` sem RLS. Qualquer autenticado pode ouvir qualquer canal.
- **Problema 2**: `ia_import_logs` está publicado em realtime; eventos de **todos** os usuários são transmitidos para todo subscriber, ignorando o RLS de SELECT.
- **Correção**:
  - Adicionar política em `realtime.messages` que exija o usuário ser dono do tópico/registro.
  - Remover `ia_import_logs` da publicação realtime (o `useImportHistory` pode fazer polling/refetch sob demanda — alternativa mais segura).

### 3. RLS permissivo em massa nas tabelas de negócio
Todas estas têm `USING (true)` para autenticados:
- `leads` (SELECT, UPDATE, DELETE)
- `customers` (SELECT, INSERT, UPDATE, DELETE)
- `interactions` (SELECT)
- `lead_notes` (SELECT)
- `profiles` (SELECT)

**Risco real**: qualquer conta criada (mesmo `usuario` comum) lê/edita/apaga todos os dados comerciais. Hoje o sistema só funciona porque a criação de conta está desabilitada na prática — mas **isso é segurança por obscuridade**.

**Correção (princípio do menor privilégio)**:
- Restringir todas as operações em `leads`, `customers`, `interactions`, `lead_notes`, `profiles` (SELECT/INSERT/UPDATE/DELETE) a usuários com role `admin` OU `vendedor` (via `has_role`).
- `lead_notes`: SELECT volta a `auth.uid() = user_id` para notas privadas, e `admin` enxerga tudo.
- Manter a política pública `Anyone can submit a lead` (necessária para o formulário do site), mas adicionar uma trigger BEFORE INSERT que **força** `status='new'` e zera campos sensíveis (`ai_*`, `next_contact_at`, `last_contact_at`) — impede que um atacante poste leads pré-classificados ou polua o pipeline via API direta.
- `user_roles`: já está bem (admin gerencia, user vê próprio) — **manter**.

### 4. Credenciais administrativas hardcoded em código-fonte
- **Problema**: `src/config/app.ts` expõe `adminEmail` e `adminDefaultPassword` em texto puro. Esse arquivo vai pro bundle do cliente — **qualquer visitante do site público pode ler a senha** abrindo DevTools.
- **Correção**: remover ambos os campos do código. A senha inicial deve existir só no momento do primeiro deploy e ser trocada pelo dono. Substituir por uma orientação no README.

## 🟠 Achados altos (frontend / autorização)

### 5. Sem reset real de senha
- **Problema**: o "esqueci minha senha" só abre um modal mandando e-mail manual ao suporte. Sem fluxo de `resetPasswordForEmail` + página `/reset-password`, o admin fica dependente de intervenção manual e o sistema fica vulnerável a engenharia social.
- **Correção**: implementar fluxo padrão Supabase:
  - Modal envia `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`.
  - Nova página pública `/reset-password` que detecta `type=recovery` e chama `auth.updateUser({ password })`.

### 6. Sessão expirada não limpa estado/cache
- **Problema**: ao expirar sessão, o `QueryClient` mantém dados em cache. Em teoria nada vaza (o RLS bloqueia novas reads), mas **dados antigos continuam visíveis** na UI até refresh.
- **Correção**: no `AuthProvider`, ao receber evento `SIGNED_OUT` ou `TOKEN_REFRESHED` falhando, invalidar `queryClient.clear()` e forçar `Navigate` para login. Adicionar listener global.

### 7. ProtectedRoute mostra UI brevemente durante carregamento de role
- **Problema**: o componente já cobre o caso, mas o flash de loading expõe a estrutura. Aceitável, mas posso melhorar:
- **Correção**: garantir que enquanto `roleLoading` for true, **nenhum** filho renderiza (já está assim — manter). Adicionar verificação de role também na entrada do `CrmLayout` como defesa em profundidade.

### 8. Sem validação Zod nos serviços
- **Problema**: `leadService.create/update`, `clientService`, `interactionService`, formulário público — todos aceitam qualquer string sem limites consistentes. Permite injeção de payloads grandes/HTML.
- **Correção**: criar `src/lib/validation/schemas.ts` com schemas Zod para `lead`, `customer`, `interaction`, `note`. Aplicar `.parse()` antes de cada mutação. Sanitizar HTML em campos textuais (notes/description) com strip de tags via regex simples (`<[^>]*>` → '').

### 9. Busca SQL via `.or()` permite injeção de operadores PostgREST
- **Problema** em `leadService.list`: `query.or(\`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%\`)` — se `search` contém `,` ou `.` o usuário pode estender o filtro com operadores arbitrários do PostgREST (não SQL injection clássico, mas **PostgREST injection**).
- **Correção**: escapar vírgulas, parênteses e aspas no `search`; ou usar `.ilike()` separado e união no client.

## 🟡 Achados médios (hardening)

### 10. Logs em produção
- 12 ocorrências de `console.warn/error` em código de produção (importLogService, useExcelImport, useAIChat, columnMapper). Vazam estrutura interna em DevTools.
- **Correção**: criar `src/lib/logger.ts` que só loga em `import.meta.env.DEV`. Substituir todos os `console.*` por `logger.*`.

### 11. Validação de upload Excel
- O parser aceita qualquer arquivo. Sem verificação de MIME real, sem limite de tamanho explícito (só MAX_ROWS=5000 internamente).
- **Correção**: no `ExcelDropzone`, validar:
  - tamanho ≤ 10 MB
  - extensão `.xlsx`, `.xls`, `.xlsm`
  - rejeitar nomes com path traversal (`../`, `\\`)
  - sanitizar todos os valores de string ao normalizar (já feito em `cleanText` — bom)

### 12. Edge functions de IA sem rate limit por usuário
- `ia-assistant-chat`, `ia-parse-text`, `ia-suggest-mapping` autenticam mas não limitam frequência. Um usuário malicioso (ou bug) pode estourar `LOVABLE_API_KEY`.
- **Correção mínima**: tracking simples em memória por `userId` (debounce de 1s entre chamadas). Para algo robusto seria preciso uma tabela de rate limit, mas isso fica como recomendação futura.

### 13. CORS aberto (`*`)
- Edge functions usam `Access-Control-Allow-Origin: *`. Aceitável durante desenvolvimento, mas em produção idealmente seria restrito ao domínio do CRM.
- **Correção**: trocar `*` por checagem do header `Origin` contra allowlist (`cantinho-da-roca.lovable.app`, `cantimdarocaa.com.br`, preview lovable.app, localhost dev).

### 14. Faltam HIBP + signup desabilitado
- **Correção**: ativar `password_hibp_enabled: true` e `disable_signup: true` via `configure_auth`. Hoje qualquer um pode criar conta no `/admin/login`? **Verificar** — se signup estiver aberto, é uma porta de entrada. Como o login não tem botão de signup, na UI está oculto, mas a API ainda aceita. Fechar.

### 15. Form público sem honeypot/throttle server-side
- O `LeadFormSection` tem rate limit client-side de 30s (facilmente burlado). Para volume baixo é aceitável, mas adicionar:
- **Correção**: campo honeypot oculto (`name="website"`) — se preenchido, descarta. E trigger BEFORE INSERT em `leads` que rejeita inserts com nome ou telefone vazios/curtos demais.

## 🟢 Coisas que já estão certas

- `user_roles` em tabela separada com `has_role()` SECURITY DEFINER ✅
- `set search_path = public` em todas as funções ✅
- `BrowserRouter` com `ProtectedRoute` envolvendo `/admin/*` ✅
- `onAuthStateChange` configurado antes de `getSession` ✅
- Senhas via Supabase Auth (não custom) ✅
- Edge functions validam JWT ✅
- `LOVABLE_API_KEY` em secret server-side ✅

---

## Plano de execução (em ordem, com gates de aprovação)

### Fase 1 — Banco (migration única)
1. RLS de `profiles`: SELECT só dono ou admin.
2. RLS de `leads`: todos (exceto INSERT público) só admin/vendedor.
3. RLS de `customers`, `interactions`, `lead_notes`: só admin/vendedor; lead_notes SELECT volta a dono+admin.
4. Trigger BEFORE INSERT em `leads` para inserts anônimos: força `status='new'`, zera `ai_*`, `next_contact_at`, `last_contact_at`, valida nome ≥ 2 chars.
5. Remover `ia_import_logs` da publicação realtime.
6. Adicionar policy mínima em `realtime.messages` (deny-by-default + allow se topic combinar com user_id do JWT).
7. `configure_auth`: `disable_signup: true`, `password_hibp_enabled: true`.

### Fase 2 — Frontend / código
8. Remover credenciais hardcoded de `src/config/app.ts`.
9. Implementar reset de senha real (modal + página `/reset-password`).
10. Criar `src/lib/logger.ts` e substituir todos os `console.*`.
11. Criar `src/lib/validation/schemas.ts` (Zod) e aplicar nos services.
12. Sanitizar `search` em `leadService.list`.
13. Honeypot no formulário público.
14. Validação de upload (MIME/tamanho) no `ExcelDropzone`.
15. `queryClient.clear()` no logout.
16. Sanitizar HTML em notes/descriptions.

### Fase 3 — Edge functions
17. CORS allowlist ao invés de `*`.
18. Rate limit em memória por usuário nas funções de IA.

### Fase 4 — Verificação
19. Re-rodar `security--run_security_scan` e `supabase--linter` para confirmar que críticos foram fechados.
20. Testar manualmente: rota `/admin/dashboard` sem login → redireciona; logout → cache limpo; signup via API → bloqueado; busca `'a,b'` no leadService → não quebra.

### Arquivos modificados (estimativa)
- 1 migration grande (RLS + triggers + realtime + signup off)
- `src/config/app.ts` (remove creds)
- `src/contexts/AuthContext.tsx` (limpa cache no signout)
- `src/components/ProtectedRoute.tsx` (defesa em profundidade)
- `src/pages/AdminLogin.tsx` (reset real)
- `src/pages/ResetPassword.tsx` (novo)
- `src/App.tsx` (rota /reset-password)
- `src/lib/logger.ts` (novo)
- `src/lib/validation/schemas.ts` (novo)
- `src/services/leadService.ts` + `clientService.ts` + `interactionService.ts` (Zod + sanitize)
- `src/components/landing/LeadFormSection.tsx` (honeypot)
- `src/components/ia/excel/ExcelDropzone.tsx` (validação upload)
- `src/hooks/useImportHistory.ts` (substituir realtime por polling — já que vamos remover da publicação)
- `supabase/functions/_shared/aiGateway.ts` (CORS allowlist + rate limit)
- 12 arquivos com `console.*` → trocar por `logger.*`

### Sem mudanças
- Schema das tabelas (só políticas).
- Estrutura visual do CRM, landing, módulos IA.
- Lógica de negócio (pipeline, score, follow-up, reengajamento).

### Resultado esperado
- Scan limpo: 0 erros, 0 warnings críticos.
- CRM realmente protegido: sem signup aberto, sem RLS permissivo, sem credenciais expostas.
- Realtime escopado por usuário.
- Validação consistente em todas as mutações.
- Reset de senha funcional.
- Frontend sem vazamentos em console.

Este plano segue o princípio de **defesa em profundidade**: backend (RLS + triggers + auth config) é a fonte da verdade; frontend é apenas conveniência de UX. Mesmo que alguém burle o frontend, o backend não permite acesso indevido.

