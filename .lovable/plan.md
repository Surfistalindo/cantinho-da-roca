
# Tutoriais guiados com botão "?" em todo o sistema

Adicionar um sistema próprio de **tutoriais contextuais por tela**: um botão flutuante "?" sempre visível dentro do CRM que, ao clicar, abre um menu com (1) Tour guiado da tela atual, (2) Dicas rápidas, (3) Atalhos de teclado, (4) Glossário. O Tour destaca elementos reais da página com spotlight, mostra um popover com explicação passo a passo, e pode disparar ações (abrir guia, abrir modal, focar input).

Solução **própria, sem dependências externas** (não usar react-joyride/shepherd/driver.js — eles colidem com nosso design system Inter/Monday e adicionam ~30kb). Usaremos Radix Popover (já no projeto) + um overlay SVG com `clip-path` para o spotlight. Leve, acessível, themed pelos nossos tokens.

## Arquitetura

```
src/components/tutorial/
├── TutorialProvider.tsx     # Context: tour atual, índice, abrir/fechar/next/prev/skip
├── HelpButton.tsx           # FAB "?" fixo (bottom-right) + menu (Radix Popover)
├── TourOverlay.tsx          # SVG fullscreen com clip-path spotlight + popover ancorado
├── TourPopover.tsx          # Card do passo: título, corpo, "Passo X de Y", Anterior/Próximo/Pular
└── tours/
    ├── index.ts             # Registry rota → tour (e fallback "explorar")
    ├── dashboard.ts
    ├── leads.ts
    ├── pipeline.ts
    ├── clients.ts
    ├── ia-home.ts
    ├── ia-excel.ts          # Tour multi-etapa (idle → mapping → review)
    ├── whatsapp.ts
    ├── boards.ts
    └── shared.ts            # Atalhos, navegação, sidebar
```

## Como o Tour funciona

1. Cada tour é um array de **steps**:
   ```ts
   type TourStep = {
     id: string;
     target: string;          // CSS selector OU [data-tour="leads-search"]
     title: string;
     body: string;            // pode conter <strong>, listas curtas
     placement?: 'top'|'bottom'|'left'|'right'|'auto';
     waitFor?: () => boolean; // ex.: aguardar tabela renderizar
     action?: () => void;     // ex.: abrir um drawer antes do passo
     allowSkip?: boolean;
   };
   ```
2. `TourOverlay` calcula o `getBoundingClientRect()` do target, desenha um retângulo "buraco" (spotlight) sobre overlay escuro `bg-foreground/40`, e ancora o `TourPopover` ao lado.
3. ResizeObserver + scroll listener mantêm o spotlight sincronizado se a página rolar/redimensionar.
4. Foco vai para o popover, navegação por teclado (← → ESC).
5. Progresso salvo em `localStorage` (`tutorial:completed:<route>`), oferecendo "marcar como concluído" e "rever tour".

## Marcação dos elementos

Em vez de selectors frágeis, marcar pontos-chave nas páginas com `data-tour="..."`:
- `data-tour="sidebar-leads"`, `data-tour="sidebar-pipeline"`, etc. no `MondaySidebar`.
- `data-tour="leads-search"`, `data-tour="leads-new"`, `data-tour="leads-table"`, `data-tour="leads-kanban-toggle"` em `LeadsPage`.
- `data-tour="pipeline-board"`, `data-tour="pipeline-stage"` no Pipeline.
- `data-tour="excel-dropzone"`, `data-tour="excel-mapper"`, `data-tour="excel-review"` no fluxo IA Excel.
- `data-tour="whatsapp-paste"`, `data-tour="ia-card-*"`, `data-tour="dashboard-funnel"`, etc.

## Conteúdo dos tours (resumo)

| Rota | Passos | Foco didático |
|---|---|---|
| `/admin/dashboard` | 5 | Métricas chave, abas (funil, score, origem), ações rápidas |
| `/admin/leads` | 7 | Busca, filtros, novo lead, tabela vs kanban, status inline, ações em massa |
| `/admin/pipeline` | 5 | Estágios, drag-and-drop, criar negócio, conversão |
| `/admin/clients` | 4 | Diferença Lead × Cliente, conversão, histórico |
| `/admin/ia` | 4 | Visão geral, importação, classificação, assistente |
| `/admin/ia/excel` | 8 (em 3 etapas) | Upload → preview → mapeamento IA → revisão → import |
| `/admin/whatsapp` | 4 | Quick actions, templates, log |
| `/admin/boards/:id` | 5 | Grupos, colunas tipadas, status pills, favoritar |
| `*` (fallback) | 3 | Sidebar, command palette (Cmd+K), botão "?" |

## Botão "?" + menu

- `HelpButton` fixo `bottom-4 right-4`, `z-40`, círculo 44×44, ícone `HelpCircle` da lucide, sombra suave, ring no hover.
- Click abre Radix Popover com 4 itens:
  - **Iniciar tour desta tela** (com badge "Novo" se nunca visto)
  - **Dicas rápidas** (3-5 bullets do tour da rota atual, formato leitura)
  - **Atalhos de teclado** (reusa o `ShortcutsHelp` já existente)
  - **Glossário** (Lead, Cliente, Estágio, Score, Pipeline) — sheet lateral

## Ações que o tour pode disparar

Para tours que cruzam estados (ex.: Excel import), `step.action` pode:
- Mudar de aba via `searchParams` (`?tab=funnel`).
- Disparar evento global (já temos `window.dispatchEvent(new CustomEvent(...))`).
- Abrir o command palette (`Cmd+K`) para demonstrá-lo.
- Para o tour do Excel, mockamos uma planilha de exemplo opcional (botão "ver com dados de exemplo") — fora do MVP, sinalizado como passo "estático".

## Acessibilidade & detalhes finos

- `role="dialog" aria-modal="true"` no popover do tour.
- Foco preso (focus trap leve) só no popover; ESC sai do tour confirmando "Pular tour?".
- `prefers-reduced-motion` desliga transições do spotlight.
- Z-index isolado (`--z-tour: 80`) acima de drawers (50), abaixo de toasts (100).
- Tokens semânticos: `bg-card`, `text-foreground`, `border-border`, `text-primary`. Sem cores hardcoded.

## Telemetria leve

`localStorage` apenas (`tutorial:state` JSON: `{ completed: string[], lastSeenVersion: number }`). Bumpar `version` quando reescrevermos um tour reabre o "Novo".

## Integração no layout

- Inserir `<TutorialProvider>` envolvendo `<Outlet/>` em `CrmLayout`.
- Inserir `<HelpButton/>` e `<TourOverlay/>` dentro do provider.
- Hook `useRouteTour()` resolve o tour da rota atual via `useLocation`.

## Arquivos a criar

- `src/components/tutorial/TutorialProvider.tsx`
- `src/components/tutorial/HelpButton.tsx`
- `src/components/tutorial/TourOverlay.tsx`
- `src/components/tutorial/TourPopover.tsx`
- `src/components/tutorial/Glossary.tsx`
- `src/components/tutorial/types.ts`
- `src/components/tutorial/tours/index.ts`
- `src/components/tutorial/tours/{dashboard,leads,pipeline,clients,ia-home,ia-excel,whatsapp,boards,shared}.ts`

## Arquivos a editar

- `src/components/crm/CrmLayout.tsx` — montar provider + botão.
- `src/components/crm/MondaySidebar.tsx` — adicionar `data-tour` em itens.
- `src/components/admin/AdminNavbar.tsx` — `data-tour` em busca/atalhos.
- `src/pages/admin/DashboardPage.tsx` — `data-tour` em cards/tabs.
- `src/pages/admin/LeadsPage.tsx` — `data-tour` em search/new/table/kanban.
- `src/pages/admin/PipelinePage.tsx` — `data-tour` no board.
- `src/pages/admin/ClientsPage.tsx` — `data-tour` na tabela.
- `src/pages/admin/WhatsAppPage.tsx` — `data-tour` nos blocos.
- `src/pages/admin/ia/IAHomePage.tsx` — `data-tour` nos cards.
- `src/pages/admin/ia/IAExcelImportPage.tsx` — `data-tour` no dropzone, mapper, review (tour multi-etapa).
- `src/pages/admin/TaskBoardPage.tsx` — `data-tour` nos grupos.
- `src/index.css` — utilitário `.tour-spotlight` com transição suave do `clip-path`.

## Fora de escopo (próxima iteração)

- Onboarding sequencial cross-page (o tour atual é por tela).
- Vídeos embutidos.
- Tradução i18n (nascemos em pt-BR).
