## Sidebar estilo Monday — workspaces dinâmicos + boards genéricos

Substitui visualmente a `AdminSidebar` atual pela estrutura da Monday (header de produto, bloco IA fixo, busca, Favoritos, Áreas de trabalho com seletor, workspaces expansíveis com boards aninhados, +, ⋯ e drag-and-drop). Tudo persistido por usuário no Supabase. **Nenhuma rota ou página atual é removida.**

### Anatomia da nova sidebar (de cima pra baixo)

```text
┌──────────────────────────────────────┐
│ 🌿 cantim work management        ▾   │ ← header de produto (substitui logo atual)
├──────────────────────────────────────┤
│ 🏠  Página inicial                   │ → /admin/dashboard
│ 📥  Meu trabalho                     │ → /admin/my-work (novo)
│ 🔔  Mais                             │ → menu (Telemetria, Auditoria…)
├──────────────────────────────────────┤
│ cantim IA                            │ ← bloco fixo (não editável)
│ 🤖  Assistente de IA                 │ → /admin/ia/assistant
│ ✨  Vibe (Insights)                  │ → /admin/ia/insights
│ 🧠  Agentes de IA                    │ → /admin/ia (visão geral)
│ 📝  Anotador de IA (Score)           │ → /admin/ia/score
├──────────────────────────────────────┤
│ Favoritos                       …    │
│ ⭐ Pipeline de vendas                │ ← qualquer board favoritado
├──────────────────────────────────────┤
│ Áreas de trabalho             🔍 +   │
│ ▾ [Vendas Cantim ▾]                  │ ← dropdown de workspace ativo
│   ▾ 🟧 CRM Operacional      ⭐ ⋯ +   │ ← workspace expansível
│       👥  Leads                       │
│       📊  Pipeline                    │
│       👤  Clientes                    │
│       ⚡  Automação WhatsApp          │
│   ▸ 🟦 Importação IA        ⭐ ⋯ +   │
│   ▸ 🟪 Tarefas internas     ⭐ ⋯ +   │ ← workspace que usa o board genérico
└──────────────────────────────────────┘
```

### 1. Banco — 4 tabelas novas (sem tocar nas existentes)

```text
workspaces
  - id, owner_id, name, icon (string), color (hex), position int
  - active boolean (workspace selecionado por último)

boards
  - id, workspace_id, name, icon, color, position int
  - kind: 'route' | 'task_board'
  - route_path text (quando kind=route, ex.: '/admin/leads')
  - created_by

board_favorites
  - user_id, board_id, position int
  - PK (user_id, board_id)

-- Para o "1 board genérico de tarefas"
task_board_items
  - id, board_id, title, description
  - status: 'todo' | 'doing' | 'done' | 'blocked'
  - assignee_id, due_date, position int
  - created_by, created_at, updated_at
```

RLS: workspaces/boards/items por `owner_id = auth.uid()` ou admin via `has_role`. Favoritos só do próprio user.

### 2. Seed inicial (insert tool, 1x por usuário no primeiro login)

Workspace **"CRM Operacional"** com 4 boards `kind=route` apontando para Leads, Pipeline, Clientes, Automação. Workspace **"Importação IA"** com 8 boards route (cobre todos os `/admin/ia/*` atuais). Workspace **"Tarefas internas"** vazio com 1 board `kind=task_board` chamado "Minhas tarefas".

Hook `useEnsureDefaultWorkspaces` roda no login: se `workspaces` do user = 0, faz seed.

### 3. Componentes novos

```text
src/components/crm/sidebar/
  MondaySidebar.tsx               → substitui AdminSidebar
  SidebarProductHeader.tsx        → "cantim work management ▾"
  SidebarStaticSection.tsx        → Página inicial / Meu trabalho / Mais
  SidebarAISection.tsx            → bloco IA fixo
  SidebarFavorites.tsx            → lista board_favorites
  SidebarWorkspaceSelector.tsx    → dropdown de workspace ativo
  SidebarWorkspaceList.tsx        → lista expansível de workspaces
  SidebarWorkspaceItem.tsx        → linha workspace (▸/▾, ⭐, ⋯, +)
  SidebarBoardItem.tsx            → linha board (NavLink, ⭐, ⋯)
  SidebarSearch.tsx               → input filtra workspaces+boards
  WorkspaceContextMenu.tsx        → renomear / mudar cor / duplicar / excluir
  BoardContextMenu.tsx            → idem para board
  CreateWorkspaceDialog.tsx       → modal + nome/ícone/cor
  CreateBoardDialog.tsx           → modal + nome/ícone/cor + tipo (rota|tarefa)
```

DnD com `@dnd-kit/sortable` (já presente no projeto pelo Pipeline). Reordenar atualiza `position` em batch.

### 4. Página nova `/admin/boards/:boardId` (board genérico de tarefas)

Tela única que renderiza qualquer board `kind=task_board`. Layout Monday:
- Header: nome do board, ícone, "Novo item" (+)
- Tabela densa (`crm-dense-table` já existente) com colunas: Item · Status (status-cell colorida) · Responsável · Prazo · Tags
- Agrupamento por status (`GroupSection` já existente — mesma do CRM)
- DnD para reordenar e mover entre status
- Edição inline de célula

Página nova `/admin/my-work` agrega todos os `task_board_items` onde `assignee_id = me`.

### 5. Serviços

```text
src/services/workspaceService.ts    → CRUD workspaces + reorder
src/services/boardService.ts        → CRUD boards + reorder + favorite
src/services/taskBoardService.ts    → CRUD task_board_items
src/hooks/useWorkspaces.ts          → carrega + realtime
src/hooks/useFavoriteBoards.ts
src/hooks/useEnsureDefaultWorkspaces.ts
```

Realtime nas 4 tabelas para a sidebar atualizar entre abas.

### 6. Visual / tokens

A paleta Monday já está aplicada no projeto (sidebar branca, primária `#0073ea`, hover `#f5f6f8`). Vou ajustar só:
- Header de produto com fundo levemente off-white e divisor
- Linha ativa: trilho azul à esquerda + bg `#e6f1fd`
- Cor do workspace = bolinha 8px à esquerda do nome
- ⭐ aparece em hover (filled quando favoritado)
- Badge `…` aparece em hover
- Tooltip Monday-style nos itens quando colapsada

### 7. O que NÃO muda
- Rotas atuais: todas continuam funcionando exatamente iguais
- `AdminNavbar`, todas as páginas (`LeadsPage`, `PipelinePage`, etc.)
- `ReengagementQueue`, `WhatsAppQuickAction`, plano do Modo 2 anterior (régua WhatsApp) segue intacto
- `useUserRole` / `ProtectedRoute` continuam protegendo tudo
- A `AdminSidebar.tsx` antiga é removida do `CrmLayout.tsx`, mas o arquivo pode ficar como backup (`.bak`) por segurança

### 8. Ordem de execução
1. **Migração**: 4 tabelas + RLS + triggers `updated_at`
2. Serviços + hooks + `useEnsureDefaultWorkspaces`
3. `MondaySidebar` + subcomponentes (estática primeiro, depois conectada)
4. Modais Criar / Renomear / Excluir + menus de contexto
5. Drag-and-drop com dnd-kit
6. Busca + favoritos + seletor de workspace
7. Página `/admin/boards/:id` (board genérico) e `/admin/my-work`
8. Trocar `AdminSidebar` por `MondaySidebar` no `CrmLayout`
9. QA: navegação, persistência, RLS, colapsada/expandida, mobile

Total estimado: ~16 arquivos novos, 2 editados (`App.tsx` p/ rotas, `CrmLayout.tsx` p/ trocar sidebar).
