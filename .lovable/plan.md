## O que vamos construir

Página **/admin/settings/users** (e seção "Configurações" no menu) onde admins podem:

- Listar todos os usuários do sistema com nome, email, papel (admin/vendedor), foto e data de criação.
- **Criar novo login** direto pelo painel (email + senha + nome + papel) — sem precisar do fluxo público de signup.
- **Editar perfil** de qualquer usuário: nome, foto (avatar), telefone, cargo/bio.
- **Trocar a senha** de um usuário (forçar nova senha) ou enviar link de reset por email.
- **Mudar o papel** (promover/rebaixar admin ↔ vendedor).
- **Desativar/excluir** usuários.
- Cada usuário também tem uma página **/admin/settings/profile** pra editar seus próprios dados (nome, foto, senha).

---

## Mudanças no banco (migration)

**1. Estender `profiles`** com:
- `avatar_url` (text)
- `phone` (text)
- `bio` (text)
- `job_title` (text)
- `is_active` (boolean, default true)
- `updated_at` (timestamp, com trigger)

**2. Criar bucket de storage `avatars`** (público, leitura aberta) com policies:
- Qualquer um pode ver avatares (SELECT público)
- Usuário autenticado pode upload do próprio avatar (`{userId}/...`)
- Admin pode upload de qualquer avatar
- Owner ou admin pode update/delete

**3. RLS adicionais em `profiles`**:
- Já existe SELECT pra admin/vendedor — manter.
- Adicionar UPDATE pra admin (poder editar perfil de qualquer um). Update do próprio já existe.

**4. RLS em `user_roles`**: já tem "Only admins can grant/update/revoke" — ok.

**5. Trigger `handle_new_user`**: já cria profile automaticamente — ok.

---

## Edge functions (admin operations exigem service role)

Criar **`supabase/functions/admin-users/index.ts`** com endpoints (action via body):

- `create-user`: cria usuário em `auth.users` + define papel + cria profile com nome.
- `update-password`: força nova senha pra um user_id.
- `send-password-reset`: dispara email de reset (usa `resetPasswordForEmail`).
- `delete-user`: remove de `auth.users` (cascade limpa profiles/roles).
- `list-users`: lista usuários combinados (auth.users + profiles + roles) — necessário pq admin precisa ver `last_sign_in_at` etc., que não tá em profiles.

Toda action valida via JWT do chamador que ele tem role `admin` (chamando `has_role` no DB) antes de executar com service role. Sem isso qualquer vendedor poderia escalar.

CORS habilitado, validação Zod nos inputs.

---

## Frontend

**Novas páginas:**

- `src/pages/admin/settings/UsersPage.tsx` — lista + ações (criar, editar, reset senha, mudar papel, excluir).
- `src/pages/admin/settings/ProfilePage.tsx` — perfil do próprio usuário (nome, foto, telefone, mudar senha).
- `src/pages/admin/settings/SettingsLayout.tsx` — layout com sub-nav (Perfil / Usuários / [futuro]).

**Novos componentes:**

- `UserFormDialog.tsx` — dialog reutilizável pra criar/editar usuário (form + role selector + avatar upload).
- `AvatarUploader.tsx` — drag&drop de imagem, preview, upload no bucket `avatars` (path `{userId}/avatar-{timestamp}.{ext}`), atualiza `profiles.avatar_url`.
- `PasswordResetDialog.tsx` — escolher entre "definir nova senha agora" ou "enviar email de reset".
- `RoleBadge.tsx` — badge visual para admin/vendedor.
- `UserAvatar.tsx` (atualizar o existente em `crm/ui/`) — usar `avatar_url` quando disponível, fallback nas iniciais.

**Atualizar:**

- `AdminSidebar.tsx` — adicionar item "Configurações" (icon `settings`) com sub-itens "Perfil" e "Usuários" (este último só visível pra admin via `useUserRole().isAdmin`).
- `App.tsx` — adicionar rotas `/admin/settings/profile`, `/admin/settings/users` (lazy).
- Avatar no header da sidebar usar `avatar_url` real do profile.
- `ProtectedRoute.tsx` — adicionar variante `requireAdmin` (ou um `AdminRoute` wrapper) usando `useUserRole`. Aplicar em `/admin/settings/users`.

**Hook novo:** `useProfile()` — busca o profile completo do usuário logado (cacheado, com realtime na tabela profiles do próprio user_id).

---

## Fluxos chave

**Criar novo login (admin):**
1. Admin abre dialog "Novo usuário", preenche email/senha/nome/papel.
2. Front chama edge function `admin-users` action `create-user`.
3. Edge function valida que chamador é admin → cria user com `auth.admin.createUser({ email, password, email_confirm: true })` → trigger cria profile → insere role.
4. Lista é atualizada.

**Trocar senha de outro usuário:**
1. Admin escolhe "Definir nova senha" ou "Enviar email de reset".
2. Edge function executa `auth.admin.updateUserById(id, { password })` ou `auth.resetPasswordForEmail(email, { redirectTo: <origin>/reset-password })`.
3. A página `/reset-password` já existe.

**Trocar a própria senha:**
- Front chama `supabase.auth.updateUser({ password })` direto (não precisa edge function — usuário pode mudar a própria senha).

**Upload de foto:**
- Cliente faz upload direto pra bucket `avatars` via `supabase.storage` (RLS controla quem pode escrever onde).
- Após upload, atualiza `profiles.avatar_url` com a public URL.

---

## Resumo de arquivos

| Tipo | Caminho | Mudança |
|---|---|---|
| Migration | (nova) | profiles + cols, bucket avatars, policies, RLS update |
| Edge fn | `supabase/functions/admin-users/index.ts` | CRUD admin de users |
| Página | `src/pages/admin/settings/SettingsLayout.tsx` | Layout sub-nav |
| Página | `src/pages/admin/settings/UsersPage.tsx` | Lista + ações admin |
| Página | `src/pages/admin/settings/ProfilePage.tsx` | Perfil próprio |
| Componente | `src/components/admin/users/UserFormDialog.tsx` | Form criar/editar |
| Componente | `src/components/admin/users/AvatarUploader.tsx` | Upload de foto |
| Componente | `src/components/admin/users/PasswordResetDialog.tsx` | Reset/troca de senha |
| Componente | `src/components/admin/users/RoleBadge.tsx` | Badge papel |
| Hook | `src/hooks/useProfile.ts` | Profile do logado |
| Update | `src/components/ProtectedRoute.tsx` | Variante `requireAdmin` |
| Update | `src/components/crm/AdminSidebar.tsx` | Item "Configurações" |
| Update | `src/App.tsx` | Rotas novas |
| Update | `src/components/crm/ui/UserAvatar.tsx` | Suportar avatar_url |

Não há mudanças de schema fora de `profiles` + storage. RLS continua segura: apenas admin executa ações de gestão; vendedor só edita o próprio perfil.
