
# Reskin Monday.com — alinhamento visual fiel (sem mudar funcionalidades)

## Diagnóstico

Comparando o estado atual (`/admin/pipeline` no print) com as referências do Monday Work Management:

| Aspecto | Hoje no app | Monday das referências |
|---|---|---|
| Tema | **Dark** (cinza quase preto) | **Light** (fundo cinza muito claro `#f6f7fb`, painéis brancos) |
| Sidebar | Dark com texto claro | Branca, ícones cinza, item ativo com fundo `#e6e9ef` + texto preto |
| Topbar | Dark com badge "On track" verde | Branca slim, ícones outline cinza, avatar à direita |
| Tabela | Dark, badges arredondados pequenos | **Branca**, células de status são **blocos coloridos sólidos ocupando a célula inteira** (verde "concluído", azul "em andamento", vermelho "não iniciado", cinza "pausado") |
| Agrupamento | Inexistente | **Grupos colapsáveis** com barra colorida lateral (laranja/amarelo/verde/vermelho) e título "Sprint X – data" |
| Linhas | Hover sutil | Linhas brancas, `h-9`, divisor `#e0e3eb`, primeira coluna com checkbox + texto da tarefa |
| Tags (Setor/Frente) | Pequenos badges | **Pílulas coloridas sólidas** (`fullstack`=cinza-azulado, `frontend`=rosa, `qualidade`=azul-claro, etc.) |
| Botão primário | Azul Monday | Azul Monday `#0073ea` (manter) |

O usuário quer que **pareça idêntico** ao Monday das fotos, mantendo 100% das funcionalidades, dados e fluxos atuais.

## Princípios obrigatórios

- **Zero** mudança em handlers, services, queries Supabase, hooks, rotas, autenticação, schemas Zod, edge functions, formulários (apenas classes podem mudar).
- **Zero** mudança em `App.tsx`, `src/services/**`, `src/hooks/**` (exceto criar novos hooks puramente visuais), `AuthContext`, `ProtectedRoute`, tipos do Supabase.
- Trabalho concentrado em: `src/index.css` (tokens), shell (`CrmLayout`, `AdminSidebar`, `AdminNavbar`), camada visual das páginas e novos primitivos de UI.
- Mesmas colunas, mesmos campos, mesmas ordenações, mesmos modais/sheets, mesmas permissões.

## Etapas

### 1. Trocar a paleta `.font-crm` para Light Monday

Em `src/index.css`, dentro do escopo `.font-crm`:

- `--background`: `220 20% 97%` (fundo cinza levíssimo da área de conteúdo, ~`#f6f7fb`)
- `--card`: `0 0% 100%` (painéis brancos puros)
- `--foreground`: `222 25% 16%` (texto quase preto)
- `--muted`: `220 15% 95%`, `--muted-foreground`: `220 10% 45%`
- `--border`: `220 15% 90%`, `--border-strong`: `220 12% 80%`
- `--primary`: `212 100% 46%` (azul Monday `#0073ea`)
- `--surface-1..4`: tons claros progressivos (`100% → 96%`)
- `--sidebar-background`: `0 0% 100%` (sidebar branca)
- `--sidebar-foreground`: `222 15% 35%`
- `--sidebar-accent`: `220 18% 93%` (fundo do item ativo, cinza claro)
- `--sidebar-accent-foreground`: `222 30% 12%`
- `--sidebar-primary`: `212 100% 46%` (barra azul à esquerda do item ativo)
- Manter tokens `--tag-*` (já existem) — eles serão usados como cores das células inteiras de status/setor/frente.

Adicionar tokens novos para os **status sólidos** estilo Monday:
- `--status-done`: `142 70% 45%` (verde "concluído")
- `--status-progress`: `212 95% 55%` (azul "em andamento")
- `--status-blocked`: `0 80% 60%` (vermelho "não iniciado / cancelado")
- `--status-paused`: `38 95% 56%` (laranja "pausado")
- `--status-neutral`: `220 10% 70%` (cinza)

Manter o tema do landing page (`/`) intocado — escopo `.font-crm` continua isolado.

### 2. Sidebar branca estilo Monday

`src/components/crm/AdminSidebar.tsx` — apenas classes:
- Fundo branco, borda direita `border-r border-border`.
- Header com logo + "Cantim da Roça / WORKSPACE" em texto cinza-escuro.
- Itens: `h-9`, padding lateral, ícone outline `text-[#676879]`, hover `bg-[hsl(220_18%_95%)]`.
- Item ativo: fundo `bg-sidebar-accent` (cinza claro), texto preto bold, **barra azul à esquerda 3px** (já existe via `.sidebar-item-active::before`, ajustar cor para `--sidebar-primary` light).
- Subitens IA: indentação, divisor cinza claro vertical.
- Footer com avatar circular azul + nome + ícone logout.
- **Sem mudar lógica** de `overdueCount`, expand/collapse, realtime, signOut.

### 3. Topbar slim estilo Monday Work Management

`src/components/crm/AdminNavbar.tsx`:
- Fundo branco, `h-12`, borda inferior fina.
- Esquerda: trigger sidebar + breadcrumb "Workspace › Pipeline" em cinza, badge "On track" verde pílula.
- Centro: input de busca arredondado cinza-claro com lupa à esquerda.
- Direita: "Ask AI" pílula azul translúcida, sino notificações outline, abrir site outline, avatar circular gradient azul + nome.
- Manter dropdown e signOut intactos.

### 4. Novo primitivo: `BoardTable` com células coloridas sólidas

Criar `src/components/crm/ui/BoardTable.tsx` — componente de tabela puramente visual:
- `<table class="board-table">` branca, header cinza-claro `bg-[hsl(220_18%_96%)]`, sticky.
- Linhas `h-9`, divisor `border-b border-[hsl(220_15%_92%)]`, **bordas verticais finas entre células** `border-r border-[hsl(220_15%_94%)]` (visual Monday).
- Primeira coluna com checkbox + texto.
- Suporta "células de status" via prop `<StatusCell variant="done|progress|blocked|paused|neutral">concluído</StatusCell>` — renderiza `<td>` inteiro pintado da cor + texto branco centralizado bold.
- Suporta "células de tag" via `<TagCell color="pink|cyan|purple|blue|orange">qualidade</TagCell>` — pílula sólida colorida dentro da célula.
- Suporta "célula de avatar" `<AvatarCell name="..." />` — círculo gradient com iniciais.
- Suporta "célula de progresso" `<ProgressCell value={80} />` — barra colorida + `80%`.
- Suporta "célula de prioridade" — bloco colorido (Alto/Médio/Baixo) que ocupa célula inteira.

Criar também `src/components/crm/ui/GroupSection.tsx`:
- Cabeçalho colapsável `▼ Sprint 18 – 22/04 a 11/05` com **barra lateral colorida 4px** (verde/laranja/vermelho/azul conforme prop).
- Estado open/close local; opcional contagem.

Esses primitivos são **puramente apresentacionais**. As páginas decidem se os usam.

### 5. Atualizar `LeadStatusBadge` e `StatusBadge` para o visual sólido

- `src/components/admin/LeadStatusBadge.tsx`: adicionar variante `solid` (default) que renderiza pílula colorida sólida (fundo cheio + texto branco) usando os tokens `--status-*`. Manter API atual (`status`, `className`) — sem quebrar usos existentes.
- `src/components/crm/ui/StatusBadge.tsx`: idem.
- Mapear status do `leadStatus.ts` para as cores Monday:
  - `novo_lead` → azul (`progress`)
  - `em_contato` → roxo/cyan
  - `negociacao` → laranja (`paused`)
  - `cliente` → verde (`done`)
  - `perdido` → vermelho (`blocked`)

### 6. Aplicar nas páginas (apenas wrappers/classes)

**`PipelinePage` / `PipelineBoard` / `PipelineColumn` / `LeadCard`:**
- Painel de fundo branco com bordas finas.
- Colunas: cabeçalho colorido com **fundo da cor do status** (não só texto), título em branco bold, contador pílula branca.
- Cards: brancos com `border` cinza claro, hover `border-primary/40 shadow-sm`, badges sólidos.
- DnD intacto (zero mudança em handlers).

**`LeadsPage`:**
- Trocar `Table` shadcn por `BoardTable` novo (mesmas colunas, mesmos handlers — só wrapper visual).
- Coluna "Status" usa `StatusCell` (célula inteira colorida).
- Coluna "Prioridade" usa `StatusCell` colorido.
- Coluna "Origem" usa `TagCell` colorido (mapear origens fixas para cores).
- Filtros mantidos (`LeadFilters` recebe ajuste de classes para visual claro).
- Modais (`LeadDetailSheet`, `NewLeadDialog`) reestilizados visualmente — fundo branco, inputs com borda cinza, botões azuis Monday — **sem mudar nenhum handler/schema**.

**`ClientsPage`:** idem LeadsPage.

**`DashboardPage`:** KPI cards brancos com bordas finas, ícone colorido à esquerda em fundo translúcido, número grande preto, label cinza, mini-trend abaixo. Charts (`FunnelDonut`, `OriginBars`, `MetaRing`, `TrendArea`) ganham paleta light + acentos azul/verde/laranja Monday.

**Páginas IA (`IAHomePage`, `IAExcelImportPage`, etc.):** containers brancos com `board-panel`, cards de feature com mesma estrutura, só skin claro.

### 7. Densidade e responsividade

- Tabelas `text-[12.5px]`, linhas `h-9`, padding lateral `px-3`, divisores `border-[hsl(220_15%_92%)]`.
- Botões compactos `h-8 text-[12px]`, primários azul Monday.
- Mobile: sidebar continua via `SidebarProvider` (drawer), tabelas em `overflow-x-auto`, células de status mantêm cor sólida.

## O que NÃO será alterado

- `src/App.tsx` (rotas)
- `src/integrations/supabase/**`
- `src/services/**`, `src/hooks/**` existentes (apenas hooks novos puramente visuais), `src/contexts/**`
- Schemas Zod, validações, lógica de formulários
- Estrutura de dados, nomes de colunas exibidas, filtros de domínio
- Comportamento dos modais, sheets, dropdowns, DnD do pipeline
- Funcionalidades do landing page (`/`) e tema light atual da home
- `ProtectedRoute`, `useUserRole`, telemetria, rotas privadas

## Detalhes técnicos

**Arquivos a editar (apenas classes/skin):**
- `src/index.css` — paleta light Monday + novos tokens `--status-*`
- `src/components/crm/CrmLayout.tsx` — fundo light
- `src/components/crm/AdminSidebar.tsx` — sidebar branca
- `src/components/crm/AdminNavbar.tsx` — topbar branca slim
- `src/components/admin/LeadStatusBadge.tsx` — variante sólida
- `src/components/crm/ui/StatusBadge.tsx` — variante sólida
- `src/components/admin/PageHeader.tsx` — espaçamento Monday
- `src/components/admin/LeadFilters.tsx`, `ClientFilters.tsx` — inputs claros
- `src/pages/admin/LeadsPage.tsx`, `ClientsPage.tsx`, `DashboardPage.tsx`, `PipelinePage.tsx`
- `src/components/pipeline/PipelineBoard.tsx`, `PipelineColumn.tsx`, `LeadCard.tsx`
- `src/components/admin/dashboard/KpiCard.tsx`, `FunnelDonut.tsx`, `OriginBars.tsx`, `MetaRing.tsx`, `TrendArea.tsx`
- `src/components/ia/IAPageShell.tsx`, `IAFeatureCard.tsx`

**Arquivos novos (primitivos visuais):**
- `src/components/crm/ui/BoardTable.tsx`
- `src/components/crm/ui/StatusCell.tsx`
- `src/components/crm/ui/TagCell.tsx`
- `src/components/crm/ui/AvatarCell.tsx`
- `src/components/crm/ui/ProgressCell.tsx`
- `src/components/crm/ui/GroupSection.tsx`

**Mapeamento de cores (Monday-style):**

```text
Status cell (célula inteira):
  done       → verde   #00c875
  progress   → azul    #0086c0
  blocked    → vermelho #e2445c
  paused     → laranja #fdab3d
  neutral    → cinza   #c4c4c4

Tag cell (pílula):
  fullstack  → cinza-azulado
  frontend   → rosa #ff158a
  dados      → roxo #a25ddc
  qualidade  → azul-claro #579bfc
  geral      → cinza
  inovação   → amarelo
  preventiva → verde-claro
  corretiva  → vermelho-claro
```

## Resultado esperado

CRM com aparência **idêntica ao Monday Work Management** das referências:
- Light theme com fundo cinza muito claro e painéis brancos
- Sidebar branca com item ativo cinza-claro + barra azul à esquerda
- Topbar slim branca com breadcrumb, busca, Ask AI e avatar
- Tabelas brancas com **células de status pintadas sólido** ocupando a célula inteira
- Pipeline com colunas coloridas no topo, cards brancos, DnD funcionando
- Tags coloridas sólidas para origem/setor/frente
- Agrupamentos colapsáveis disponíveis como primitivo (uso opcional onde fizer sentido)

E **todas** as funcionalidades, dados reais, integrações Supabase, RLS, autenticação, telemetria, rotas, modais, filtros, ordenações, DnD do pipeline, IA, importação Excel/CSV/WhatsApp continuam funcionando exatamente como hoje.
