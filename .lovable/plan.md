# Corrigir scroll do diálogo "Automações da Régua" + auditar CRM

## 1. Bug confirmado — scroll quebrado no AutomationsDialog

**Causa**: `DialogContent` do shadcn usa `display: grid` por padrão. O override `flex flex-col` é sobrescrito pelo `grid`, então o `flex-1` no `ScrollArea` interno não recebe altura limitada, e o conteúdo escapa de `max-h-[85vh]` sem rolar.

**Correção**:
- `src/components/whatsapp/AutomationsDialog.tsx` linha 53:
  - Trocar `className="max-w-2xl max-h-[85vh] flex flex-col"` por `className="max-w-2xl max-h-[85vh] !grid-rows-[auto_minmax(0,1fr)] grid-cols-1"`
  - Garantir `min-h-0` no `ScrollArea` (linha 65) para que o filho do grid possa encolher e rolar.

Resultado: o card de cada etapa rola dentro do diálogo; header e footer ficam fixos.

## 2. Auditoria leve dos demais bugs do CRM

Para não fazer mudanças invisíveis em massa, vou rodar uma varredura focada nestes pontos comuns e listar findings (não corrigir tudo às cegas):

- **Diálogos / Sheets**: outros casos do mesmo padrão `flex flex-col` dentro de `DialogContent`/`SheetContent` que não rolam.
- **Listas longas sem virtualização ou scroll container**: páginas onde a lista cresce além do viewport.
- **Realtime duplicado**: hooks que se inscrevem em `postgres_changes` sem cleanup correto, causando re-fetch em loop.
- **Z-index de popovers/tooltips dentro de dialogs**: itens escondidos atrás do overlay.
- **`onClick` em linhas de tabela** que disparam quando o usuário clica em botões internos sem `stopPropagation`.

Findings serão entregues no chat com:
- arquivo e linha
- descrição curta do bug
- severidade (alta / média / baixa)

Você prioriza quais corrigir num próximo loop.

## Por que não corrigir tudo agora?

“Todos os bugs existentes” é escopo aberto. Sem listar findings primeiro, eu corro o risco de mexer em código que está intencionalmente daquele jeito (ex.: tooltips dentro de drawers, listas que devem rolar a página inteira). A auditoria é rápida e te devolve controle sobre o que muda.

## Entregável deste loop

1. Diálogo de Automações com scroll funcional.
2. Lista de bugs encontrados na auditoria, com severidade, para você aprovar a próxima rodada de correções.
