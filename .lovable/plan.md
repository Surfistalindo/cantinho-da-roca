# Plano: Reskin visual do CRM no estilo Monday.com (sem mudar funcionalidade)

## Princípios obrigatórios
- **Nenhuma** alteração em handlers, hooks, chamadas Supabase, rotas, autenticação, schemas, services, queries ou regras de negócio.
- **Nenhuma** mudança nos arquivos de service (`src/services/**`), `AuthContext`, `ProtectedRoute`, hooks, `App.tsx` (rotas), tipos do Supabase ou edge functions.
- Trabalho concentrado em: tokens de tema (`src/index.css`), shell do admin (`CrmLayout`, `AdminSidebar`, `AdminNavbar`) e camada visual das páginas/listas (classes Tailwind, wrappers, badges).
- Colunas, campos, dados reais, filtros, modais e fluxos permanecem **idênticos em comportamento**.

## Etapas

### 1. Paleta dark "board corporativo" (apenas escopo `.font-crm`)
Ajustar tokens em `src/index.css` dentro de `.font-crm` para o visual tipo Monday/Linear:
- `--background`: cinza muito escuro quase preto (ex.: `222 18% 7%`).
- `--card` / `--surface-1..4`: tons de cinza-azulado escuros (`222 14% 10%`, `222 13% 13%`, `222 12% 16%`).
- `--border`: cinza discreto (`222 10% 20%`), `--border-strong` (`222 10% 28%`).
- `--sidebar-background`: levemente diferente do main (`222 20% 6%`), com `--sidebar-accent` para item ativo em azul escuro translúcido.
- `--primary`: azul Monday-like (`212 100% 56%`) com hover/contraste; manter `--success`, `--warning`, `--info`, `--destructive` em paletas vivas para badges.
- Adicionar tokens auxiliares: `--tag-purple`, `--tag-pink`, `--tag-orange`, `--tag-cyan`, `--tag-yellow`, `--tag-green` (em HSL) para tags de setor/frente.
- Tipografia: padronizar `--font-crm-body` para uma fonte sans neutra (manter Public Sans/DM Sans existente; sem novos imports pesados).

### 2. Shell visual

**`CrmLayout.tsx`** (apenas classes):
- Reduzir padding do conteúdo (`px-4 sm:px-6 py-4`), fundo `bg-background`, conteúdo em painéis `bg-card border border-border rounded-lg`.

**`AdminSidebar.tsx`**:
- Largura ~240px, fundo `--sidebar-background`, item ativo com fundo `bg-primary/15` + barra lateral azul à esquerda (`border-l-2 border-primary`).
- Subitens IA com tipografia menor, indentados, divisor sutil.
- Manter 100% dos itens, badges e lógica de `overdueCount`, expand/collapse, logout, realtime — apenas reestilizar.
- Mobile: já usa `SidebarProvider` (drawer offcanvas) — sem mudança lógica.

**`AdminNavbar.tsx`**:
- Topbar slim (`h-14`), fundo `bg-card/80 backdrop-blur`, borda inferior fina.
- Esquerda: trigger + breadcrumb compacto + título da rota.
- Centro: busca compacta (já existe — preservar input).
- Direita: Ask AI, notificações, abrir site, avatar/menu (preservar dropdown e signOut).

### 3. Componentes visuais novos (puramente apresentacionais)

Criar em `src/components/crm/ui/`:
- **`PageTabs.tsx`** — abas horizontais reutilizáveis (controlled value + onChange), estilo pill underline azul. Usado opcionalmente em páginas com sub-visões; não substitui rotas.
- **`ActionToolbar.tsx`** — barra com slot esquerdo (botão primário "Criar"), busca, filtros, ordenar, agrupar. Apenas layout — recebe children/handlers.
- **`StatusBadge.tsx`** — badge colorido por variante (`success`, `warning`, `danger`, `info`, `neutral`, `purple`, `pink`, `orange`). Usar para status de leads/clientes; substituir uso interno do `LeadStatusBadge` mantendo a mesma API exportada.
- **`UserAvatar.tsx`** — wrapper sobre `InitialsAvatar` existente, tamanho `xs/sm/md`, círculo com gradient.
- **`DataBoard.tsx`** — wrapper de painel: header (título + ações) + corpo com scroll horizontal e bordas finas.
- **`DataTable.tsx`** (opcional, leve) — `<table>` com classes Monday-like (`text-[12.5px]`, linhas `h-10`, hover `bg-muted/40`, borda `border-border/60`, sticky header). Não obrigatório se a página já usa `<Table>` shadcn — nesse caso só ajustar classes.

### 4. Aplicação por página (apenas wrappers/classes — comportamento intocado)

- **DashboardPage**: cards de KPI ganham `bg-card border-border rounded-lg`, fundo escuro, sem alterar lógica de filtros/queries.
- **LeadsPage**: envolver tabela em `DataBoard`, header com `ActionToolbar` (mesmos botões/handlers já existentes — Novo Lead, filtros). Linhas mais densas, badges via `StatusBadge`. Manter colunas, ordenação, paginação, sheets e modais.
- **ClientsPage**: idem LeadsPage (DataBoard + toolbar + badges densos).
- **PipelinePage / PipelineBoard**: manter Kanban funcional (DnD intacto), apenas reestilizar colunas (`bg-surface-2 border-border`), cards (`bg-card hover:border-primary/40`), badges de status com novas cores.
- **IA Pages**: aplicar `DataBoard` como container; cards de feature continuam com mesma estrutura, só novo skin.

### 5. Densidade e responsividade
- Tabelas: `text-[12.5px]`, `h-9` por linha, padding lateral `px-3`, bordas `border-border/50`, hover `bg-muted/40`.
- Botões compactos: `h-8 text-[12px]` para toolbars; primários azuis.
- Mobile: sidebar continua via `SidebarProvider` (drawer); tabelas em `overflow-x-auto`; modais inalterados.

## O que NÃO será alterado
- `src/App.tsx` (rotas)
- `src/integrations/supabase/**`
- `src/services/**`, `src/hooks/**`, `src/contexts/**`
- Schemas Zod, validações, formulários (apenas classes podem ser ajustadas)
- Estrutura de dados retornados, nomes de colunas exibidas, filtros de domínio
- Funcionalidades do landing page (`/`)

## Resultado esperado
CRM com aparência dark estilo Monday.com — sidebar slim com item ativo azul, topbar fina, painéis em cinza escuro com bordas sutis, tabelas densas, badges coloridos para status/setor/frente, avatares circulares, hover nas linhas, scroll horizontal — com **todas** as funcionalidades, dados reais, integrações e rotas funcionando exatamente como hoje.
