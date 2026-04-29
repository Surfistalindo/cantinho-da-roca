## Problema

Na tabela de Leads (/admin/leads), arrastar um lead de **Negociação** para **Em contato** (ou entre quaisquer grupos) não funciona consistentemente. Além disso, o site apresenta lags ao arrastar e em interações gerais.

### Causas identificadas

**1. Drop zone incorreta no DnD da tabela** — `LeadsTableDnd.tsx`
   - O `DroppableGroupHeader` envolve o `<GroupSection>` inteiro (cabeçalho + lista paginada). Quando o grupo "Negociação" está aberto e grande, o "header drop zone" cobre uma área enorme — mas como cada grupo tem sua própria área scrollable interna com `<Table>`, e estamos usando `pointerWithin` como collision detection, o ponteiro fica "dentro" da árvore do próprio grupo de origem (Negociação) na maior parte do tempo, nunca chegando ao header de outro grupo (Em contato), que está em outra `DroppableGroupHeader` acima/abaixo.
   - Resultado: o usuário precisa soltar exatamente em cima do título "Em contato", o que é frágil. Com grupos grandes/scrollados, fica praticamente impossível.

**2. Lags durante o drag**
   - `onPointerMove` no scroller da tabela (linhas 920-932 de `LeadsPage.tsx`) executa `getBoundingClientRect()` + `closest('tr')` em **cada movimento do mouse**, mesmo durante o drag — extremamente caro com 100+ linhas.
   - `forwardWheelToLeadTable` faz `getBoundingClientRect` em todos os scrollers a cada wheel event.
   - `LeadCard` no Pipeline aplica `before:absolute`, `ring`, `rotate-[0.5deg]` no estado isDragging — `transform: rotate` força repaint contínuo.

**3. Lags gerais**
   - `useInteractionCounts` puxa **todas as interações** dos 2000 leads carregados de uma vez (sem paginação) e re-fetcha em qualquer change da tabela `interactions` via realtime — re-render em cascata.
   - `fetchLeads` busca `.limit(2000)` toda vez que qualquer lead muda (realtime), sem debounce.
   - `LeadsKpiStrip` e `filtered`/`grouped`/`enriched` recalculam `getLeadScore` para 2000 leads várias vezes por render.

---

## Plano de correção

### A. Corrigir DnD entre grupos na tabela

Em **`src/components/admin/leads/LeadsTableDnd.tsx`**:

1. Trocar `collisionDetection` de `pointerWithin` → `closestCenter` (do `@dnd-kit/core`). Isso encontra o droppable mais próximo do centro do item arrastado, mesmo que o ponteiro esteja sobre outro elemento.
2. Mudar a estrutura de drop:
   - Em vez de usar **um único droppable por grupo** (que cobre a seção inteira), criar um **droppable só no cabeçalho colorido** do `GroupSection` (faixa de ~40px no topo).
   - Implementação: renderizar `<DroppableGroupHeader>` apenas em volta da barra de título, não do conteúdo.
3. Adicionar visual claro durante o drag: quando `activeId !== null`, **todos** os cabeçalhos de grupo (exceto o de origem) ganham um banner sutil "Soltar aqui para mover para X" e ficam "magneticamente" ativos.
4. Ajustar `pointerWithin` para `rectIntersection` como fallback se necessário.

### B. Remover lags do drag

Em **`src/pages/admin/LeadsPage.tsx`**:

1. Remover o handler `onPointerMove` do scroller (linhas 920-932). Substituir por **CSS-only**: pseudo-elemento `::after` na borda inferior da `<tr>` com `cursor: ns-resize` via classe utilitária (sem JS por evento de mouse).
2. Adicionar guard no `onPointerDown` de resize: se um drag-and-drop já estiver ativo (verificar via classe no body ou pelo target ser o grip), não interceptar.
3. Throttle do `forwardWheelToLeadTable`: cachear o scroller resolvido por uns 200ms (limpando no resize/scroll do window).

Em **`src/components/pipeline/LeadCard.tsx`** e **`src/components/admin/leads/LeadsTableDnd.tsx`**:

4. Remover `rotate-[0.5deg]` no estado isDragging (causa repaint contínuo).
5. Adicionar `will-change: transform` no overlay (`DragOverlay`).

### C. Reduzir lags gerais do site

Em **`src/hooks/useInteractionCounts.ts`**:

1. Debounce do refetch via realtime: 400ms. Eventos de interactions chegando em rajada não devem refetch a cada um.
2. Em vez de `select('lead_id')` retornando todas as linhas (potencialmente milhares), usar uma RPC ou — solução simples sem migration — limitar e contar via SQL: como não temos RPC pronta, manter a query mas adicionar `.limit(5000)` defensivo.

Em **`src/pages/admin/LeadsPage.tsx`**:

3. Debounce do `fetchLeads` via realtime: 500ms. Atualmente cada update remoto refetcha 2000 leads.
4. Memoizar `interactionCounts[l.id]` lookups: pre-calcular `scoreByLead = useMemo(...)` uma vez por leads/interactionCounts e reusar em `filtered`, `grouped`, `LeadsKpiStrip` em vez de chamar `getLeadScore` 3x por lead por render.

Em **`src/hooks/useRealtimeTable.ts`**:

5. Adicionar suporte opcional a debounce: `useRealtimeTable(table, onChange, { debounceMs: 400 })`. Default = 0 (mantém compatibilidade). Aplicar nos hooks acima.

---

## Sumário das mudanças

| Arquivo | Mudança |
|---|---|
| `src/components/admin/leads/LeadsTableDnd.tsx` | `closestCenter`, droppable só no header, hint visual em todos os headers ao arrastar, sem rotate |
| `src/pages/admin/LeadsPage.tsx` | Remover onPointerMove de resize (CSS-only cursor), debounce no refetch realtime, memo `scoreByLead`, mover `<DroppableGroupHeader>` para envolver só o título |
| `src/components/admin/leads/GroupSection` (uso) | Receber slot do header como prop, ou expor um wrapper `headerSlot` para o droppable |
| `src/components/pipeline/LeadCard.tsx` | Sem `rotate-[0.5deg]` no isDragging |
| `src/hooks/useRealtimeTable.ts` | Suporte a debounce opcional |
| `src/hooks/useInteractionCounts.ts` | Debounce 400ms via realtime, `.limit(5000)` defensivo |
| `src/index.css` | Classe `crm-row-resize-handle` com cursor via `:hover` na borda inferior do `<tr>`, sem JS |

## Resultado esperado

- Arrastar lead de qualquer grupo para qualquer outro grupo funciona soltando em cima do **cabeçalho colorido** do grupo destino (visual fica destacado).
- Drag fluido sem stutters mesmo com 500+ leads.
- Filtros, scroll e clique no Leads ficam mais responsivos.
- Sem mudanças de schema do banco.
