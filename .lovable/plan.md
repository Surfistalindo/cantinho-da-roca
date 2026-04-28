## Objetivo

Tornar `/admin/leads` mais diagnosticável e acessível, sem mexer no scroll interno restaurado (cabeçalho + filtros fixos, tabela com `overflow-y-auto` e `maxHeight: calc(100vh - 280px)`).

## Escopo (4 entregas)

### 1. Logs simples de filtros e erro de carregamento

Usar o `logger` existente em `src/lib/logger.ts` (silencia em produção), sem nenhuma lib nova.

Em `src/pages/admin/LeadsPage.tsx`:

- Em `fetchLeads` (linha ~175):
  - Antes do fetch: `logger.debug('[leads] fetch start')`.
  - Em sucesso: `logger.debug('[leads] fetch ok', { count: data?.length ?? 0 })`.
  - Em erro: `logger.error('[leads] fetch error', { code: error.code, message: error.message })` + manter `setFetchError`.
- Novo `useEffect` que observa filtros (`statusFilter`, `originFilter`, `recencyFilter`, `priorityFilter`, `activeKpi`, `dateFrom`, `dateTo`, `search`, `sortBy`, `sortDir`) e emite `logger.debug('[leads] filters', { ... })` com debounce simples (250ms via `setTimeout`/cleanup) para não poluir no digitar.
- Em `clearFilters`: `logger.debug('[leads] filters cleared')`.

### 2. Skeleton/loader ao reaplicar filtros e ordenação (sem quebrar scroll)

Hoje `LoadingState` só aparece no carregamento inicial (`if (loading) return <LoadingState />`). Trocaremos por um indicador "in-place" que NÃO desmonta o container scrollável.

- Adicionar estado `isRefreshing` (ligado por 250–400ms quando filtros/ordenação mudam, via `useEffect` debounced sobre as mesmas deps de `useResetPagesOn`). Ignorar a primeira execução para não disparar no mount.
- Renderizar uma faixa fina sticky no topo do `board-panel` (acima dos filtros, dentro do mesmo wrapper) com `<div className="h-0.5 bg-primary/60 animate-pulse" />` enquanto `isRefreshing`.
- Adicionar `aria-busy={isRefreshing}` no wrapper do `board-panel` e `data-refreshing` no container scrollável (sem alterar classes de overflow/maxHeight).
- Opcional: quando `isRefreshing && filtered.length === 0`, sobrepor placeholder skeleton dentro do `<TableBody>` (linhas com `bg-muted/40 animate-pulse`) — sem trocar o container, mantendo `scrollTop` preservado.

Resultado: o scroll interno e a posição do scroll permanecem intactos durante refresh.

### 3. Navegação por teclado

Confirmar/ajustar acessibilidade sem alterar layout:

- Garantir `tabIndex={0}` e `role="region"` + `aria-label="Tabela de leads"` no container scrollável (linhas ~763–767), para que setas funcionem após focar com Tab.
- Adicionar `aria-label`s nos botões de densidade (já existem) e revisar `LeadsViewSwitcher` e `LeadsKpiStrip` para que cada ação exposta seja focável (verificar se KPIs são `<button>` com `aria-pressed`).
- Adicionar handler `onKeyDown` no container da tabela: PageUp/PageDown rola ±80% da altura visível; Home/End vai para topo/fim. Não interceptar se o foco estiver em `input`/`select`.
- Garantir que o atalho global "N" (já existente) não dispare quando o foco está em campos de texto (checar `event.target` em `useEffect` de `crm:new-lead` se aplicável — se já estiver tratado em outro lugar, deixar nota e não duplicar).

### 4. Checklist de testes manuais (executados na entrega)

Após implementar, abrir o preview em `/admin/leads` via browser tools e validar:

1. **Scroll interno**: roda do mouse sobre cabeçalho/filtros faz a tabela rolar (forwarding wheel já existe); scroll direto sobre a tabela também funciona; `body` não rola.
2. **Ordenação**: clicar no toggle de sort alterna `score → created desc → created asc → score`; lista reordena sem reset visual indesejado e com o skeleton-strip aparecendo brevemente.
3. **Paginação**: navegar entre páginas em um grupo NÃO altera a página dos outros grupos (já é por grupo via `useLeadsPaged`); trocar `pageSize` reseta páginas.
4. **Filtros**: aplicar status, origem, recency, priority, KPI, intervalo de datas e busca textual; cada um produz `logger.debug('[leads] filters', ...)` no console e reseta páginas.
5. **Erro de carregamento**: simular falha desligando rede no DevTools e recarregar; verificar que `logger.error` aparece e o `ListState` mostra o erro sem travar a UI.
6. **Teclado**: Tab atravessa filtros → switcher → tabela; com tabela focada, setas/PageDown/Home/End rolam o container; nenhum atalho global dispara digitando em inputs.

Os resultados de cada item ficam reportados na resposta final.

## Arquivos afetados

- `src/pages/admin/LeadsPage.tsx` — logs, estado `isRefreshing`, faixa de loading, atributos de acessibilidade e handlers de teclado.
- (Sem novos arquivos, sem novas libs, sem mudanças em CSS de scroll.)

## Não-objetivos

- Não alterar `overflow`, `maxHeight` ou `forwardWheelToLeadTable`.
- Não tocar em `useLeadsPaged`, `useLeadsUrlState`, RLS ou queries.
- Não adicionar telemetria remota (apenas `logger` local em DEV).
