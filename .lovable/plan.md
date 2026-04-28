## Redesign do CRM — abordagem em 4 fases

O documento que você anexou é grande (tokens, layout, navbar, sidebar, leads, kanban, dashboard) e algumas partes conflitam com regras antigas da memória. Você optou por **redesign completo + atualizar memória + adicionar pinned columns no comfortable**.

Em vez de despejar tudo num único patch (alto risco de regressão visual e funcional), vou executar **uma fase por vez**, com aprovação no fim de cada uma. Este plano cobre **Fase 1** em detalhe + esboço das fases seguintes.

---

### Princípios que guiam todas as fases

- Escopo do redesign = `.font-crm` (todo `/admin/*`). **Landing fica intocada.**
- Mantém Lovable Cloud + RLS + paginação por grupo + filtros URL + bulk + tutorial FAB já existentes.
- Sem novas libs. Sem `cursor` custom. Sem gradientes roxos. Sem mudar schema.
- Performance: nenhuma fonte nova além das já carregadas (Inter / JetBrains Mono / Caveat / Material Symbols). Glassmorphism só onde pré-aprovado (navbar e popovers — leve, não decorativo).
- Toda animação 150–220ms, ease-out. Respeita `prefers-reduced-motion`.

---

### Fase 1 — Memória + Design System global (esta fase)

**1.1 Atualizar memórias** (a regra antiga proibia glassmorphism e troca de fonte; agora você liberou):

- `mem://index.md` Core: trocar a linha "Sem purple gradients, glassmorphism, cursor custom..." por uma versão refinada: glass leve permitido só em navbar/popover, sem gradientes roxos, sem cursor custom.
- `mem://design/crm-typography`: manter Inter como base, **adicionar permissão** para usar Geist (opcional) só em `text-display-*`. Mono = JetBrains Mono.
- Novo `mem://design/crm-redesign-2026`: documenta tokens (paleta refinada, sombras `soft/pop/ringed`, raios, durações, scrollbar) para servir de fonte da verdade.

**1.2 `tailwind.config.ts`**

- Refinar `boxShadow`: já tem `soft/card/pop/ringed` — adicionar `shadow-floating` (popovers) e `shadow-inset-hairline` (boards).
- `transitionDuration` e `transitionTimingFunction`: presets `crm-fast` (120ms), `crm` (180ms), `crm-slow` (240ms) com `cubic-bezier(.2,.8,.2,1)`.
- Não mudar paleta semântica (HSL já existe via vars). Apenas garantir que `--ring` no light tem alpha pronto pra focus-ring premium.

**1.3 `src/index.css` — bloco global do CRM**

Sem renomear vars existentes (evita regressão). Adicionar:

- **Scrollbar utility refinada** (`.crm-smooth-scroll` já existe; criar `.crm-scrollbar-thin` complementar com 8px, hover 10px, cor `hsl(var(--hairline-strong))`).
- **Focus-visible global** dentro de `.font-crm`: anel `0 0 0 3px hsl(var(--ring) / 0.35)` em botões, links, inputs, células, switches; remove halos default duplos.
- **Skeleton premium** `.crm-skeleton`: shimmer 1.4s baseado em `surface-2 → surface-3 → surface-2`.
- **Sticky/pinned helpers** (preparação p/ Fase 3):
  - `.crm-pin-left { position: sticky; left: 0; background: hsl(var(--card)); z-index: 4; box-shadow: 1px 0 0 0 hsl(var(--hairline)); }`
  - `.crm-pin-right { ...right: 0; box-shadow: -1px 0 0 0 hsl(var(--hairline)); }`
  - Variante `.crm-pin-left-shadowed` com `clip-path` que evita sombra cortada na borda do scroller.
- **Hover affordance em linhas de tabela**: `.font-crm .board-table tbody tr` ganha `--row-actions-opacity: 0` por padrão, `:hover { --row-actions-opacity: 1 }`. Ações de linha usam essa variável (preparação p/ Fase 3).
- **Linear/Vercel hairlines**: `.font-crm .surface-card` ganha alternativa `.surface-card--hair` com `box-shadow: 0 0 0 1px hsl(var(--hairline)), 0 1px 2px hsl(220 25% 14% / .04)` (sem border, alinhamento perfeito a 1px).

**1.4 Verificação Fase 1**

- Abrir `/admin/dashboard`, `/admin/leads`, `/admin/pipeline` no preview e confirmar: nada quebrou visualmente, focus-ring novo aparece com Tab, scroll fica mais fino. Skeleton ainda não foi adotado em telas — só está disponível.

> Aprovado isto, parto para Fase 2.

---

### Fase 2 — Layout + Navbar + Sidebar (próxima)

Resumo (vai virar plan próprio):

- `CrmLayout`: surface ladder explícita (`surface-sunken` no shell, `surface-1` no main), padding e max-width revisados, garantir `overflow-x-hidden` no shell.
- `AdminNavbar`: glass leve (`bg-card/80 backdrop-blur-md` + `border-b hairline`), realinhar grid (logo/breadcrumb | search | actions), avatar com ring `ringed`, search com `kbd-chip` refinado.
- `MondaySidebar`: estados ativos com barra de acento à esquerda + bg `sidebar-accent/60`; ícones crisp 16px; transições 180ms; feedback DnD com `outline + ring + scale .98`.

### Fase 3 — Leads (tabela + pinned columns + comfortable)

- Mantém modo **compact** atual (sem scroll).
- Em **comfortable**: scroller volta a `overflow-x-auto`, mas coluna "Lead" fica `crm-pin-left` e "Ações" fica `crm-pin-right`. Header também sticky vertical (já é) e horizontal nas pinned.
- Quick actions de linha: ícones aparecem só no hover via `--row-actions-opacity`.
- Empty state ilustrado (já temos `EmptyState` warm) reutilizado quando filtros sem resultado.
- Filtros e view switcher repintados com componentes do design system novo (segmented control mais Linear-like).

### Fase 4 — Dashboard + Kanban + polish final

- KPIs: card `surface-card--hair` + `hover: shadow-pop translate-y-[-1px]` 180ms; tipografia tabular-nums grande.
- Charts: tooltip refinado (popover novo + sombra floating).
- LeadsKanban + LeadCard: sombras suaves, estado dragging com `rotate-1 + shadow-pop`, badges status do design system, espaçamento 8px.
- Auditoria visual final em mobile (375 e 768) e desktop (1280 e 1536).

---

### Arquivos da Fase 1

- `mem://index.md` — atualizar Core
- `mem://design/crm-typography` — atualizar
- `mem://design/crm-redesign-2026` — novo
- `tailwind.config.ts` — sombras + transições
- `src/index.css` — utilitários (focus, skeleton, pinned helpers, hover affordance, hairlines)

Nenhum componente/página é tocado nesta fase — risco mínimo, apenas tokens e utilitários novos prontos pra Fase 2/3.

---

### Não-objetivos (para todas as fases)

- Não mexer em landing, schema, edge functions, hooks de dados, paginação, filtros URL, tutorial, IA.
- Não trocar `Inter` como fonte base. Geist só fica como opção opcional em headings, sem ser default.
- Não adicionar libs novas (sem framer-motion novo, sem nova icon lib).
