## Visão (direção criativa sênior)

**Aesthetic**: "Atelier OS" — um CRM **editorial-tech** que lembra Linear + Vercel + Notion, mas com personalidade própria do Cantim. Refinado, sério, denso e silencioso. Light mode dominante com modo "Focus Dark" opcional. Tipografia distintiva (não-Inter), microcomposições caprichadas, profundidade real (não glassmorphism), e um único momento "uau" por tela — page load orquestrado com stagger.

**Princípios**:
- **Densidade respeitosa**: muita informação por pixel, sem ruído (Linear-style).
- **Hierarquia tipográfica forte**: display serif sutil para títulos, sans neutro de personalidade para UI, mono para números.
- **Cor como linguagem**: status pintando células inteiras (Monday), accent único de marca + pílulas tonais saturadas.
- **Movimento intencional**: stagger no load, micro-tilts em KPIs, hover states surpresa em rows. Nada pisca à toa.
- **Sem clichês de IA**: zero gradiente roxo-em-branco, zero glass, zero `Inter`, zero ícones genéricos sem propósito.

> A landing **não muda**. Toda essa direção fica escopada em `.font-crm` (já é o padrão do projeto).

---

## Sistema de design (tokens + tipografia)

### Tipografia — trocar para uma combinação distintiva

| Função | Família | Por quê |
|---|---|---|
| **Display** (h1, headings, números KPI) | `Fraunces` (variable serif moderno) | Personalidade editorial, números bonitos, opcional `opsz` |
| **UI/Body** | `Geist` (Vercel) | Sans neutra, muito legível, NUNCA é Inter/Roboto |
| **Label/Caption** | `Geist` (uppercase tracking-wide) | Coerência |
| **Mono** (IDs, números tabulares, KPIs grandes) | `JetBrains Mono` | Linear-feel para números/timestamps |
| **Touch acolhedor** (1 momento por tela, ex: empty state) | `Caveat` (já usado na landing) | Liga sutil com a marca |

`@import` do Google Fonts no `index.css`. Atualizar `--font-crm-display`, `--font-crm-body`, `--font-crm-label` + adicionar `--font-crm-mono`.

### Tokens novos (escopados em `.font-crm`)

```css
/* Atelier surface ladder — neutros frios mais finos */
--surface-0: 220 30% 99%;       /* page bg "paper" */
--surface-1: 0 0% 100%;
--surface-2: 220 22% 98%;
--surface-3: 220 18% 96%;
--surface-4: 220 16% 93%;
--surface-sunken: 220 24% 95%;  /* containers cinzentos */

/* Linhas de divisão extra-finas */
--hairline: 220 16% 90%;
--hairline-strong: 220 14% 82%;

/* Sombras "paper" (sem blur exagerado) */
--shadow-xs: 0 1px 0 0 hsl(220 25% 14% / 0.04);
--shadow-sm: 0 1px 2px 0 hsl(220 25% 14% / 0.05), 0 1px 1px 0 hsl(220 25% 14% / 0.04);
--shadow-md: 0 4px 12px -4px hsl(220 25% 14% / 0.08), 0 1px 2px hsl(220 25% 14% / 0.04);
--shadow-pop: 0 16px 32px -16px hsl(220 25% 14% / 0.18), 0 4px 12px -4px hsl(220 25% 14% / 0.08);

/* Brand accent (mantém o azul Monday como ação, mas adiciona o moss/honey da marca como "voice") */
--accent-brand: 152 35% 38%;    /* moss profundo — marca Cantim */
--accent-warm: 38 85% 58%;      /* honey — destaques editoriais */

/* Dark mode focus (CRM dark) */
[data-crm-theme="dark"] .font-crm { ... } /* paleta dark editorial */
```

### Modo Focus (Dark) — toggle opcional

Botão na navbar (☀/🌙). Tema escuro **editorial** (não preto puro, e sim azul-petróleo profundo `220 24% 9%` com text `220 14% 88%`). Persiste em `localStorage`. Apenas dentro do `.font-crm`, não afeta landing.

---

## Layout shell — refinamento do CRM

### `CrmLayout.tsx`
- Página inteira fica num **canvas com micro-textura** (`bg-surface-0` + grain SVG sutil) ao invés de `bg-background` chapado.
- `main` ganha `padding-inline` responsivo: `px-3 md:px-6 lg:px-8`.
- Loading inicial: orquestrar **stagger reveal** (`warm-stagger` já existe — generalizar para `crm-stagger`).

### `MondaySidebar` (sidebar principal)
- Mantém estrutura, mas:
  - Logo + workspace title em **Fraunces** (serif), com microespaço e tracking apertado.
  - Items com **rail ativo** azul à esquerda (já tem) + **micro animação** de slide do indicador (200ms ease).
  - Avatar + presença (dot verde "online") no footer.
  - Search inline no topo da sidebar com `⌘K` chip — mas estilizado tipo Linear (chip pill com tecla).
  - Em **mobile**: vira sheet/drawer (já é offcanvas via shadcn) com gesto swipe.

### `AdminNavbar`
- Altura `h-14` (mais respirável).
- Breadcrumb dinâmico real (segmentos do path com links), não label hardcoded.
- Substituir o status pill "On track" por um **command bar** mais útil: chips contextuais ("hoje · 12 leads novos · 3 atrasados") clicáveis que filtram a página.
- Ações à direita: Theme toggle, Notifications (com badge real), Ask AI, Avatar.

---

## Componentes que ganham redesign

### 1. `KpiCard` — refinar a versão "3D"
- **Reduzir** o tilt (de 4° → 2°) e o glow para parecer menos gamer.
- Número grande em **Fraunces** (serif) tabular-nums, dando peso editorial.
- Sparkline mais fina (1.2px), grid baseline sutil atrás.
- Delta badge: estilo Linear (sem borda forte, só fundo tonal + ícone arrow).
- Hover: leve `translateY(-2px)` + sombra cresce — parar com o tilt agressivo em mobile.
- Suporte a `loading` skeleton próprio (shimmer caprichado).

### 2. `PageHeader`
- Título em Fraunces 24/28px, descrição em Geist `text-muted-foreground`.
- **Stripe de meta horizontal** abaixo: chips com `count · label` que viram filtros (afford­ance Linear/Notion).
- Right side: ações com hierarquia clara (primary + secondary outline + icon ghost).

### 3. **`board-table`** (todas as tabelas densas)
- Manter densidade Monday, mas:
  - **Zebra opcional** ultra-sutil (`hsl(var(--surface-2)) / 0.4`) — toggle por usuário.
  - Header sticky com **gradient fade** sutil quando há scroll.
  - Row hover: linha lateral azul de 2px à esquerda (Linear).
  - Row selecionada: bg `primary/6` + rail azul à esquerda.
  - Empty state inline ilustrado (Caveat + ícone outline grande).

### 4. `LeadDetailSheet` (e `CustomerDetailSheet`)
- Reformatar como **two-column sheet** quando viewport ≥ `lg`: esquerda dados estruturados, direita timeline cronológica.
- Header com avatar + nome em Fraunces, status select inline.
- Quick actions topo: WhatsApp, ligar, agendar próximo contato, marcar como ganho/perdido.
- Timeline com âncora vertical fina (1px), dots tonais por tipo de interação.

### 5. `EmptyState` — ilustrado de verdade
- Ilustração SVG inline (folhinha + caderno em outline, no tom moss), Caveat para o headline ("Tudo limpo por aqui ✿"), botão de ação proeminente.

### 6. `CommandPalette`
- Já existe. Refinar visual: chip de seção, kbd estilo Linear, ícones tonais por categoria, animação de entrada com stagger nos itens.

### 7. **Mobile-first** — auditoria responsiva
- Tabelas: em `< md` viram **lista de cards** ricos (avatar + nome + status pill + meta + actions overflow).
- KPI grid: em `< md` colapsa para **carousel horizontal scroll-snap** (Linear/Notion mobile pattern).
- Sidebar: já é offcanvas, ajustar trigger e overlay para feel premium.
- DetailSheet vira `Drawer` bottom em mobile.

### 8. Pipeline (Kanban) — colunas com personalidade
- Coluna header com cor de status como underline grosso (não fundo chapado).
- Cards com micro-elevation no hover, drag handle só no hover, count chip animado.

---

## Microinterações & motion

- **Page load orquestrado** (`crm-stagger`): KPIs entram em cascata 60ms, depois o painel principal, depois listas. Já existe `ia-stagger` — generalizar.
- **Hover de row**: rail lateral azul 2px aparece com `transform: scaleY(0→1)` 180ms.
- **Status pill change**: morfismo de cor com `transition: background-color 240ms`.
- **Toast Sonner**: customizar para usar Fraunces no título + Geist no corpo, sombra `shadow-pop`.
- **Keyboard shortcuts**: já tem `useGlobalShortcuts` — adicionar `g d` (go dashboard), `g l` (go leads), `g p` (pipeline), `?` (help) — visual highlight no chip ativo.
- **`prefers-reduced-motion`**: respeitado em todos os keyframes.

---

## Acessibilidade (WCAG AA+)

- Contraste mínimo 4.5:1 em todo texto sob fundos claros (validar honey e moss, ajustar tons soft).
- Focus ring **visível e bonito**: `outline: 2px solid hsl(var(--primary) / 0.6); outline-offset: 2px; border-radius: inherit`.
- `aria-label` em todos os icon-buttons (auditar).
- Tab order coerente em sheets e palette.
- Tabelas com `<caption>` sr-only quando agrupadas.

---

## Arquivos a editar

### Núcleo do design system
- `src/index.css` — tokens novos, fontes novas, classes utilitárias (`crm-stagger`, `crm-row-rail`, `crm-paper-bg`, `kbd-chip`, etc.), modo dark `[data-crm-theme="dark"]`.
- `tailwind.config.ts` — adicionar `surface-0/1/2/3/4`, `hairline`, `accent-brand`, `accent-warm`, `font-display`, `font-mono-crm`, sombras `shadow-xs/sm/md/pop`.

### Shell
- `src/components/crm/CrmLayout.tsx` — wrapper paper-bg, stagger root, theme attribute.
- `src/components/crm/AdminNavbar.tsx` — breadcrumb dinâmico, command bar contextual, theme toggle, notifications real.
- `src/components/crm/MondaySidebar.tsx` — refino tipográfico, rail animado, presença footer.
- `src/components/crm/CommandPalette.tsx` — visual Linear-style.
- **Novo**: `src/components/crm/ThemeToggle.tsx` — toggle ☀/🌙 com persist.
- **Novo**: `src/hooks/useCrmTheme.ts` — gerencia `data-crm-theme` no `<html>`.

### Componentes admin
- `src/components/admin/PageHeader.tsx` — meta-stripe, tipografia editorial.
- `src/components/admin/dashboard/KpiCard.tsx` — refino do tilt/sparkline/typography.
- `src/components/admin/dashboard/FunnelDonut.tsx` — refinar paleta + tooltips.
- `src/components/admin/dashboard/TrendArea.tsx` — grid baseline sutil.
- `src/components/admin/EmptyState.tsx` — ilustração SVG + Caveat.
- `src/components/admin/LeadDetailSheet.tsx` — layout two-column ≥ lg.
- `src/components/admin/CustomerDetailSheet.tsx` — idem.
- `src/components/admin/InitialsAvatar.tsx` — gradiente determinístico por nome (HSL hash).
- **Novo**: `src/components/admin/MobileLeadCard.tsx` — versão card para mobile substituindo a tabela.
- **Novo**: `src/components/admin/StatChip.tsx` — chip clicável usado no PageHeader meta-stripe.

### Páginas (apenas integrar componentes refinados — não reescrever lógica)
- `src/pages/admin/DashboardPage.tsx` — usar mobile carousel para KPIs, novos chips no header.
- `src/pages/admin/LeadsPage.tsx` — render mobile via `MobileLeadCard`.
- `src/pages/admin/PipelinePage.tsx` — refinar header de coluna + card.
- `src/pages/admin/ClientsPage.tsx`, `MyWorkPage.tsx`, `WhatsAppPage.tsx` — aplicar PageHeader novo + paper-bg.

### Memória
- Atualizar `mem://design/crm-atelier-os.md` com a direção e atualizar `mem://index.md`.

---

## O que **NÃO** vou mexer

- Landing (`/`), `StaticImageHero`, `ProductsSection`, etc. — intocadas.
- Lógica de negócio (Supabase, hooks de dados, edge functions, Z-API/WhatsApp, IA).
- Estrutura de rotas e auth.
- Schemas e RLS.

---

## Fases de execução (uma única passada de implementação)

1. **Tokens + fontes** (`index.css` + `tailwind.config.ts`).
2. **Theme toggle** (hook + componente + integração na navbar).
3. **Shell** (CrmLayout, AdminNavbar, MondaySidebar, CommandPalette).
4. **Núcleo de componentes** (PageHeader, KpiCard, EmptyState, InitialsAvatar, novos: StatChip, MobileLeadCard).
5. **Sheets** (LeadDetailSheet, CustomerDetailSheet two-column).
6. **Páginas** (Dashboard mobile-carousel, Leads mobile-cards, Pipeline column polish, Clients/MyWork/WhatsApp aplicar PageHeader novo).
7. **Memória + QA visual** (snapshot de cada rota em desktop e mobile via browser tools).

Resultado: um CRM com identidade própria, denso e refinado, totalmente responsivo, com tema claro/escuro, sem nenhum traço de "AI slop".
