
# Padrão de layout estável — “TableShell”

Objetivo: nenhuma tabela, grid ou painel lateral pode empurrar/quebrar a largura da página. Cada bloco de conteúdo grande rola dentro do próprio container — como Monday/Linear/ClickUp. Identidade visual e funcionalidade ficam intactas; muda apenas a estrutura.

## Estratégia em 2 camadas

### Camada 1 — utilitários CSS reutilizáveis (em `src/index.css`)

Quatro classes que resolvem 95% dos casos sem reescrever componentes:

```text
.surface-shell      → flex flex-col min-w-0 max-w-full overflow-hidden rounded
.surface-scroll-x   → overflow-x-auto overflow-y-hidden
.surface-scroll-y   → overflow-y-auto
.surface-table-wrap → min-w-0 overflow-x-auto overflow-y-auto, max-h responsivo,
                       header sticky (top: 0), e estiliza col 1 sticky opcional
                       via .has-sticky-first
.surface-side-panel → shrink-0, w fixa por breakpoint (lg:w-[360px] xl:w-[400px]),
                       sticky top com altura própria
.surface-split      → flex gap-4, com .surface-main { flex:1; min-width:0 }
                       garantindo que o lado direito não comprime o conteúdo
```

Ponto-chave: **`min-width: 0`** em todos os filhos flex/grid (a causa raiz de tabelas que “empurram” a página em containers flex).

### Camada 2 — componente `TableShell` (novo)

`src/components/crm/ui/TableShell.tsx` — wrapper padrão para qualquer tabela larga.

```tsx
<TableShell
  toolbar={<Filters />}
  side={<TemplatesPanel />}    // opcional, vira drawer no mobile
  maxHeight="calc(100vh - 280px)"
  stickyFirstColumn
>
  <Table>...</Table>
</TableShell>
```

Responsabilidades internas:
- `flex min-w-0` no main, `shrink-0` no side
- Wrapper de tabela com `overflow-x-auto overflow-y-auto`, header sticky
- No mobile (`<lg`), o `side` vira `Sheet` com botão flutuante “Painel”
- Aceita altura via prop ou usa `max-h-[calc(100vh-Npx)]` padrão

## Telas atingidas (apenas ajustes estruturais, sem mexer em UI/cor/texto)

| Tela | Mudança estrutural |
|---|---|
| `LeadsPage` (table view) | Substituir `<div className="overflow-x-auto crm-dense-table">` em `renderGroup` por `TableShell` com `stickyFirstColumn`. Garante header sticky e coluna “Lead” fixa no scroll horizontal. |
| `LeadsPage` (kanban/cards) | Wrapper `surface-scroll-x` no kanban para scroll lateral próprio sem empurrar layout. Cards já estão ok. |
| `ClientsPage` | Mesmo refactor de `renderGroup` para `TableShell` + sticky “Cliente”. |
| `IAExcelImportPage` — **etapa Mapeamento** | Atualmente `grid lg:grid-cols-[1fr_400px]`. Trocar por `surface-split`: preview à esquerda com `min-w-0` real + `ColumnMapper` lateral `surface-side-panel sticky top-4`. No mobile, `ColumnMapper` vira **drawer** (botão “Mapear colunas”). |
| `IAExcelImportPage` — **Revisão** | `RowReviewTable` ganha `TableShell` interno. Header sticky já existe; falta sticky col “Linha” + “Nome”, e impedir overflow vertical empurrar página. |
| `ExcelPreviewTable` | Já usa `overflow-x-auto max-h-[420px]`. Adicionar `min-w-0` no pai e `position: sticky; left: 0` na 1ª col (header da planilha). |
| `IAClassifyPage` | Envolver `<Card><Table>` com `TableShell`; toolbar de filtros vira `toolbar`, não acima da Card. |
| `IADuplicatesPage` | Cada grupo: encapsular tabela do grupo em wrapper `surface-table-wrap` com `max-h-[60vh]`. |
| `WhatsAppPage` | Já segue 3 colunas com `min-w-0` e `shrink-0` corretos — apenas auditar e adicionar `min-w-0` onde faltar. |
| `TaskBoardPage` | Adicionar `min-w-0` nas colunas + `surface-scroll-y` na lista de tarefas (já tem `overflow-auto`, formalizar). |
| `PipelineBoard` (kanban embarcado em Leads) | Wrapper `surface-scroll-x` + `min-w-0` nas colunas para scroll lateral próprio. |
| `MyWorkPage`, `TelemetryPage`, `AuditUiPage` | Auditoria leve: trocar containers fixos por `surface-shell` quando houver tabela. |
| `CrmLayout` | Adicionar `min-w-0` no `<main>` (o `flex-1` já existe; falta o `min-w-0` para impedir que children largos cresçam o flex). |
| `IAPageShell` | Wrapper externo ganha `min-w-0`. |

## Detalhes técnicos

### Por que `min-width: 0`
Em `flex` (e `grid` com auto), o min-content default é o conteúdo intrínseco. Tabelas largas viram min-content do flex item, esticando o pai. Adicionar `min-width: 0` ao filho permite que o pai limite a largura e o overflow do filho funcione.

### Header sticky em `<table>`
Precisa do scroll vertical no wrapper (não no `<tbody>`). Padrão:
```css
.surface-table-wrap { overflow: auto; max-height: var(--max-h, 70vh); }
.surface-table-wrap thead th { position: sticky; top: 0; z-index: 2; background: hsl(var(--surface-3)); }
.surface-table-wrap.has-sticky-first th:first-child,
.surface-table-wrap.has-sticky-first td:first-child {
  position: sticky; left: 0; z-index: 1;
  background: hsl(var(--card));
}
.surface-table-wrap.has-sticky-first thead th:first-child { z-index: 3; }
```

### Painel lateral → drawer no mobile
`TableShell` recebe `side`. Em `lg+` renderiza inline como `surface-side-panel`; em `<lg` esconde inline e mostra um botão flutuante `Sheet` (mesmo padrão usado em `WhatsAppPage` para context).

### Sem mudança de identidade
- Não alterar tokens de cor, fontes, espaçamento de linhas, badges, ícones.
- Não alterar textos, labels, traduções.
- Não alterar comportamentos (filtros, sort, seleção, atalhos).
- Apenas: containers, overflow, sticky, larguras fixas/flexíveis, drawer no mobile.

### Sem novas deps
Tudo com Tailwind + classes em `index.css`. `Sheet` já existe.

## Não faço nesta entrega

- Reescrever a UI das telas (cores, tipografia, badges).
- Migrar todas as tabelas para um único `<DataTable>` componente — só padronizo o wrapper.
- Mudar a paleta `cream/clay/moss/honey` ou aplicar o `design_token_generator.py` do skill enviado (não combina com o sistema de tokens já estabelecido). O skill UI fica como referência apenas para boas práticas, não como gerador.

## Arquivos editados

- `src/index.css` — adiciona utilitários `.surface-*` e regras de sticky
- `src/components/crm/ui/TableShell.tsx` — **novo**
- `src/components/crm/ui/index.ts` — exporta `TableShell`
- `src/components/crm/CrmLayout.tsx` — `min-w-0` no main
- `src/components/ia/IAPageShell.tsx` — `min-w-0` no wrapper
- `src/pages/admin/LeadsPage.tsx` — `renderGroup` usa `TableShell`
- `src/pages/admin/ClientsPage.tsx` — `renderGroup` usa `TableShell`
- `src/pages/admin/ia/IAExcelImportPage.tsx` — etapa Mapeamento usa `surface-split` + drawer mobile
- `src/components/ia/excel/RowReviewTable.tsx` — `TableShell` + sticky col Linha/Nome
- `src/components/ia/excel/ExcelPreviewTable.tsx` — `min-w-0` + sticky 1ª col
- `src/pages/admin/ia/IAClassifyPage.tsx` — envolve `Card+Table` em `TableShell`
- `src/pages/admin/ia/IADuplicatesPage.tsx` — `surface-table-wrap` por grupo
- `src/components/admin/leads/LeadsKanban.tsx` — wrapper `surface-scroll-x`
- `src/components/pipeline/PipelineBoard.tsx` — wrapper `surface-scroll-x`
- `src/pages/admin/TaskBoardPage.tsx` — `min-w-0` nas colunas
- `src/pages/admin/WhatsAppPage.tsx` — auditoria de `min-w-0`

## Resultado

- Tabelas largas rolam dentro do próprio bloco; o resto da página fica imóvel
- Headers e primeira coluna ficam visíveis durante o scroll
- Painéis laterais (mapeamento, templates, contexto) não somem com tabelas largas
- Mobile/tablet: painéis viram drawer com 1 toque
- Comportamento, identidade visual e textos preservados
