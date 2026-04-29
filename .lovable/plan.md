## Objetivo
Transformar `/admin/pipeline` (hoje só um redirect pra `/admin/leads?view=kanban`) numa **tela própria de Pipeline Kanban** completamente funcional, com KPIs, filtros, drag & drop entre colunas e criação rápida de lead já em uma etapa.

A view Kanban dentro de Leads continua existindo (não removo). A diferença é que `/admin/pipeline` deixa de redirecionar e passa a ter sua própria experiência mais focada em "funil de vendas".

## Arquivos afetados

- **`src/pages/admin/PipelinePage.tsx`** — substitui o `<Navigate>` por uma página real com header + KPIs + toolbar de filtros + `<PipelineBoard />`.
- **`src/components/pipeline/PipelineBoard.tsx`** — passa a aceitar `filters` (busca, responsável, origem, prioridade) via props e a expor as estatísticas calculadas (via callback `onStats`) para os KPIs do header.
- **`src/components/pipeline/PipelineKpis.tsx`** *(novo)* — quatro cards no topo: Total no funil, Hot/Urgentes, Taxa de conversão (won / total considerados), Tempo médio em cada etapa.
- **`src/components/pipeline/PipelineToolbar.tsx`** *(novo)* — busca por nome/telefone, filtros de responsável, origem, prioridade (`hot/warm/cold`) e botão "Limpar filtros".
- **`src/components/tutorial/tours/pipeline.ts`** — atualiza spotlights para os novos elementos com `data-tour="pipeline-kpis|pipeline-filters|pipeline-board"`.
- (memória) anotar a feature em `mem://features/pipeline-page`.

## Comportamento detalhado

### KPIs no topo (`PipelineKpis`)
Calculados client-side com base nos leads carregados (mesma fonte do board):
- **Total no funil** — leads em `new + contacting + negotiating` (exclui `won/lost`).
- **Hot/Urgentes** — count de leads com `score.level === 'hot'` ou `score.urgent` (usa `getLeadScore`).
- **Conversão** — `won / (won + lost)` em %, com fallback "—" se 0.
- **Tempo médio até venda** — média de dias entre `created_at` e `last_contact_at` (ou now) para leads `won`.

### Toolbar (`PipelineToolbar`)
- Busca (`q`) — filtra `name`/`phone` (case-insensitive).
- Responsável — popover com lista de profiles (reusa `AssigneePicker` existente em modo single).
- Origem — `<Select>` com opções únicas extraídas dos leads carregados + "Todas".
- Prioridade — chips `Hot/Warm/Cold/Urgent`.
- Atalho `/` foca a busca; `Esc` limpa.

### Board (já existe, só refino)
- Mantém DnD entre as 5 colunas (`new → contacting → negotiating → won/lost`).
- Aplica os filtros antes de distribuir nos `PipelineColumn`.
- Botão "+" no cabeçalho de cada coluna abre `NewLeadDialog` com `defaultStatus` daquela etapa (já implementado).
- `onStats(stats)` callback novo, sobe os totais por coluna e contagens hot/urgent pro KPIs.
- Realtime continua ligado (`useRealtimeTable('leads', refetch)`).

### Página (`PipelinePage`)
```
PageHeader "Pipeline" + descrição
PipelineKpis (4 cards)
PipelineToolbar (sticky abaixo do header)
PipelineBoard com filters + onStats
```
Layout: `space-y-4`, container `font-crm`. Sem glass agressivo (Monday-clean, conforme regra do projeto).

## Pontos técnicos importantes
- Não criar nova tabela nem migration — todos os campos já existem em `leads` (`assigned_to`, `status`, `origin`).
- Reaproveitar `getLeadScore` / `compareByScore` que já alimentam o `PipelineColumn`.
- `useInteractionCounts` continua sendo a fonte do "score com interactions".
- Manter shortcut `2` (Leads → Kanban) intacto. Em `/admin/pipeline` adicionar shortcut `/` (focar busca).
- Acessibilidade: cada KPI com `aria-label`, board com `role="region"` por coluna (já existe).

## O que NÃO muda
- Aba Kanban dentro de `/admin/leads` continua funcionando normalmente.
- Nenhuma policy de RLS precisa de ajuste (todos os campos usados já são acessíveis para `admin/vendedor`).
- Não removo o link da sidebar — agora ele leva pra uma tela real em vez de redirect.
