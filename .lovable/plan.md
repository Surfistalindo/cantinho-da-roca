

## Plano: Refinar UI do CRM para nível SaaS premium

Reformulação **puramente visual** das rotas `/admin/*`. Zero mudança em rotas, lógica, serviços, queries, dnd-kit, AuthContext ou backend. Mantém Josefin Sans no CRM e a identidade de marca (verde primário + creme).

---

### 1. Tokens & superfícies (`src/index.css`)

Introduzir uma paleta de superfícies em camadas (estilo Linear/Stripe) **sem trocar a marca**:

- `--background` → cinza-creme mais neutro (`220 20% 97%`) para dar contraste com cards brancos.
- Novos tokens: `--surface-1` (card), `--surface-2` (subtle/zebra), `--elevated` (popovers/sheets).
- `--border` mais suave (`220 15% 92%`) + `--border-strong` para divisores explícitos.
- `--ring` mantém verde primário (foco visível e on-brand).
- `--radius` para `0.875rem` (xl) como base do sistema.
- Sombras utilitárias customizadas: `shadow-soft` (1px 2px), `shadow-card` (4px 12px com 4% alpha), `shadow-pop` para sheets/dialogs.
- Sidebar: tom **mais escuro e neutro** (`220 25% 10%`) com acento verde — visual mais "produto" e menos "rústico".

Adicionar utilitários:
```css
.surface-card  /* bg + border + shadow-soft + rounded-2xl */
.surface-muted /* zebra para linhas alternadas */
.kbd, .chip    /* badges discretos */
```

### 2. Sistema de cards e seções

Padrão único reaplicado em todas as páginas:

- `rounded-2xl` (cards) / `rounded-xl` (inputs, botões pequenos).
- Padding interno `p-6` em cards principais, `p-5` em sub-cards.
- Espaçamento vertical entre blocos: `space-y-8` nas páginas (hoje `space-y-5`).
- Header de card padronizado: título `text-sm font-semibold` + descrição `text-xs text-muted-foreground` + ação à direita.

### 3. Sidebar (`AdminSidebar.tsx`)

- Largura ligeiramente maior (`w-60`) com padding mais generoso.
- Logo + wordmark "Cantinho da Roça / CRM" no topo da própria sidebar (mover do navbar).
- Item ativo: pill verde sutil (`bg-sidebar-accent` + barra lateral de 2px verde claro), em vez do destaque atual mais pesado.
- Hover: transição `bg-white/5` em 150ms.
- Badge de "Atrasados" alinhado à direita, redondo, contagem em monospace.
- Seção "Outros" vira footer fixo no rodapé da sidebar (com avatar/email do usuário + sair).

### 4. Navbar (`AdminNavbar.tsx`)

- Mais leve: remove logo (agora vive na sidebar) e fica com **breadcrumb dinâmico** (Painel · Leads · etc) à esquerda, derivado da rota.
- À direita: botão "Ver site" como ícone + tooltip, avatar do usuário com dropdown (email · sair).
- Altura reduzida para `h-14`, fundo `bg-card/80 backdrop-blur` + borda inferior fina.

### 5. Dashboard (`DashboardPage.tsx`)

- Grid 12-col responsivo. KPIs em 4 cards `rounded-2xl` com:
  - Ícone em quadrado `rounded-xl` 11×11 com fundo soft.
  - Label `text-[11px] uppercase tracking-wider`.
  - Número `text-3xl font-semibold tabular-nums`.
  - Delta/descrição com seta sutil.
- "Distribuição por status" vira **barra horizontal segmentada** (proporcional) + legenda abaixo, em vez de 5 pílulas.
- "Leads recentes" e "Precisam de atenção" em cards lado a lado com avatar circular gerado pelas iniciais.
- "Atalhos rápidos" reduzido a um rodapé de chips discretos.

### 6. Leads (`LeadsPage.tsx` + `LeadFilters.tsx`)

- Filtros agrupados em uma **toolbar única** dentro do card: busca cresce, selects compactos com ícones, botão "Limpar filtros" aparece quando há algo aplicado.
- Tabela:
  - Linhas mais altas (`h-14`), zebra suave em `surface-muted`.
  - Coluna "Nome" com avatar circular de iniciais + sub-linha do telefone (remove coluna duplicada).
  - Status como badge clicável que abre o select (sem trigger separado).
  - Ações sempre visíveis em desktop (sem `opacity-0`), com tooltips.
- Cards mobile com mesmo padrão visual da tabela (avatar + título + meta + ação).

### 7. Pipeline (`PipelineColumn.tsx` + `LeadCard.tsx`)

- Colunas com header sticky, contador em pill, fundo `bg-muted/60` + borda discreta.
- Cards: `rounded-xl`, sombra suave, indicador de recência como **dot colorido** + barra lateral de 3px (em vez de 4px); status passa a ser tag pequena no topo.
- Hover do card: leve `translate-y-[-1px]` + sombra `shadow-card`.
- Drop zone destaca com ring `ring-2 ring-primary/20` + fundo `bg-primary/5`.

### 8. Sheets e Dialogs (`LeadDetailSheet.tsx`, `CustomerDetailSheet.tsx`, `NewLeadDialog.tsx`)

- Sheet: largura `sm:max-w-xl`, header com avatar grande de iniciais + nome + status. Subheader com chips de telefone, recência e "Lead há X dias".
- Ações rápidas viram **toolbar segmentada** (WhatsApp em destaque verde, demais em ghost).
- Blocos internos: cards com fundo `bg-surface-2`, sem borda dupla, separados por `space-y-4`.
- Modo edição: footer sticky com gradient suave de fundo, botões alinhados à direita.
- Dialogs com `rounded-2xl`, sombra `shadow-pop`, padding `p-6`.

### 9. Inputs, botões e badges

- Inputs: `h-10 rounded-xl`, foco com ring verde + shadow sutil, ícone interno alinhado.
- Selects (shadcn): mesma altura/raio dos inputs.
- Botão `default` ganha leve `shadow-sm` + transição `bg` 150ms; `outline` com border 1.5px.
- Badges: padding `px-2.5 py-0.5`, weight 500, variantes soft já existentes (success-soft, warning-soft etc) padronizadas em todos os usos.

### 10. Microinterações e feedback

- Transições globais `transition-colors duration-150` em hovers.
- `LoadingState`: skeleton shimmer (em vez do spinner atual) com layout do conteúdo.
- `EmptyState`: ilustração-ícone maior em círculo soft + CTA mais proeminente.
- Toasts (sonner): tema customizado para combinar com cards (rounded-xl, sombra-pop).
- `animate-fade-in-up` aplicado a páginas (ao montar) com stagger leve em cards de KPI.

---

### Arquivos tocados

**Tokens e base**
- `src/index.css` — paleta de superfícies, sombras, utilitários.
- `tailwind.config.ts` — `boxShadow.soft/card/pop`, `borderRadius.2xl`.

**Layout do CRM**
- `src/components/crm/CrmLayout.tsx`
- `src/components/crm/AdminSidebar.tsx`
- `src/components/crm/AdminNavbar.tsx`

**Componentes compartilhados**
- `src/components/admin/PageHeader.tsx`
- `src/components/admin/EmptyState.tsx`
- `src/components/admin/LoadingState.tsx`
- `src/components/admin/LeadStatusBadge.tsx`
- `src/components/admin/ContactRecencyBadge.tsx`
- `src/components/admin/LeadFilters.tsx`
- `src/components/admin/LeadDetailSheet.tsx`
- `src/components/admin/CustomerDetailSheet.tsx`
- `src/components/admin/NewLeadDialog.tsx`
- `src/components/admin/InteractionTimeline.tsx`

**Pipeline**
- `src/components/pipeline/PipelineBoard.tsx`
- `src/components/pipeline/PipelineColumn.tsx`
- `src/components/pipeline/LeadCard.tsx`

**Páginas**
- `src/pages/admin/DashboardPage.tsx`
- `src/pages/admin/LeadsPage.tsx`
- `src/pages/admin/ClientsPage.tsx`
- `src/pages/admin/PipelinePage.tsx`

**Não tocados:** `AdminLogin`, landing, serviços, hooks, AuthContext, ProtectedRoute, integrações Supabase, migrations, types.

### Garantias

- 100% das funcionalidades preservadas (drag-and-drop, realtime, filtros por URL `?recency`/`?focus`, conversão lead→cliente, edição inline, WhatsApp deep link).
- Mesmas props/contratos em todos os componentes — apenas markup e classes mudam.
- Sem novas dependências.
- Respeita `font-crm` (Josefin Sans) e o design system existente em HSL.

