## Fase 4 — Dashboard + Kanban + polish final

Última fase do redesign. Aplica os tokens da Fase 1 (sombras `floating`, transições `crm`, hairlines, focus-ring, scrollbar) nos pontos visuais ainda no estilo "antigo" (KpiCard com tilt 3D + glow forte, LeadCard kanban genérico) e faz auditoria visual nas três telas principais.

### 4.1 KPI Cards — `src/components/admin/dashboard/KpiCard.tsx`

Calmar a estética. Hoje tem perspective tilt + radial gradient grande + sombra escura — destoa da nova direção Linear/Vercel.

- Trocar `border border-border` + sombras manuais por `surface-card--hair` + `shadow-soft`.
- Remover `useMouseTilt` e o radial gradient grande. Manter apenas:
  - `hover: shadow-pop -translate-y-px` em `duration-crm ease-crm`.
  - Spotlight muito sutil (radial 240px, opacity 0.5) no hover, sem seguir o mouse.
- Tipografia: valor com `text-[34px] font-bold tabular-nums tracking-tight` (já existe) e `font-display` opcional via classe pra ganhar Geist quando disponível (cai pra Inter no resto).
- Badges de delta: usar paleta semântica atual mas com `rounded-full` e `px-2 py-0.5` para look mais Monday/Linear.
- Sparkline mantém. Apenas reduzir stroke pra 1.4 e gradient stop final pra opacity 0.05 (mais discreto no light).
- Manter `MetaRing` no canto quando passado.
- Respeita `prefers-reduced-motion` (já implícito ao remover tilt).

### 4.2 LeadCard Kanban — `src/components/pipeline/LeadCard.tsx`

Alinhar à mesma linguagem das tabelas de Leads.

- `rounded-md` → `rounded-lg`. Trocar `shadow-soft` base por `surface-card--hair` (sem border explícita) + `shadow-soft`.
- `hover`: `shadow-card -translate-y-px` em `duration-crm`.
- Estado dragging: além do `opacity-50 ring-2 ring-primary/40 shadow-pop`, adicionar `rotate-[0.5deg]` (sutil, nada de cartoon).
- Lateral colorida `before:` mantida (priority hint).
- Fontes: `font-mono` no telefone fica melhor com `tabular-nums` (vai pegar JetBrains Mono via `.font-crm`).
- Espaçamentos: `p-2.5 pl-3` → `p-3 pl-3.5`. Gap interno 8px em vez de 10/12 misturados.

### 4.3 LeadsKanban DragOverlay — `src/components/admin/leads/LeadsKanban.tsx`

- Card flutuante do overlay: `border-primary` + `shadow-pop` → `surface-card--hair` + `shadow-floating` + `ring-2 ring-primary/40 ring-offset-1 ring-offset-background`. Mais limpo, segue a linguagem dos popovers.
- Width fixo 224px (`w-56`) mantido.

### 4.4 Polish global — `src/index.css`

Pequenos retoques, todos dentro de `.font-crm`:

- Garantir que `*[data-state="open"]` em popovers/dropdowns use `shadow-floating` (já ajustamos em alguns; aplicar via seletor genérico nos primitivos do Radix usados no CRM, sem afetar landing).
- `.crm-card-hover`: utilitário curto reutilizável → `transition: var(--crm) ease-crm; &:hover { transform: translateY(-1px); box-shadow: var(--shadow-card); }`. Usado por KpiCard, LeadCard e cards de dashboard secundários.
- Tooltip Radix dentro de `.font-crm`: `bg-popover/95 backdrop-blur-sm shadow-floating border-hairline text-[12px]`.

### 4.5 Auditoria visual final

Sem mudanças de código. Apenas verificar nos viewports:

- 375px (mobile): `/admin/leads` (cards mode), `/admin/dashboard`, `/admin/pipeline`.
- 768px (tablet): mesmos + `/admin/clients`.
- 1280px e 1536px (desktop): mesmos + `/admin/whatsapp`, `/admin/ia/classify`.

Critérios: nenhum scroll horizontal indesejado, focus-ring novo aparece em Tab, KPIs respiram sem o glow agressivo, kanban cards consistentes com tabela, popovers/dropdowns com `shadow-floating`.

### Arquivos da Fase 4

- `src/components/admin/dashboard/KpiCard.tsx` — refactor calmo
- `src/components/pipeline/LeadCard.tsx` — alinhar linguagem
- `src/components/admin/leads/LeadsKanban.tsx` — DragOverlay
- `src/index.css` — `.crm-card-hover`, tooltip primitivo, popover floating padrão

### Não-objetivos

- Não mexer em hooks de dados, charts, lógica de DnD, cálculos de score, paginação, filtros.
- Não adicionar libs (sem framer, sem nova icon lib).
- Não trocar paleta nem tipografia base. Geist permanece opcional.
- Landing intocada.
