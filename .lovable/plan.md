## Problema

No modo **compact** da tabela de Leads, várias colunas continuam visíveis (Lead 160px + Status 120px + Prioridade 120px + Ações ~120px = ~520px só de obrigatórias, sem contar Origem/Interesse/Recência em telas maiores) mas o container está com `overflow-x: hidden !important` (regra `.crm-compact-table` em `src/index.css:648`). Resultado: em larguras menores os cabeçalhos/células ficam **cortados lateralmente sem possibilidade de scroll**.

A correção anterior (remover `maxHeight` e usar `overflow-y-visible`) tirou também o scroll vertical interno por engano. O usuário quer reverter isso: **scroll vertical interno volta**, e o **scroll horizontal passa a existir também no modo compact** quando a tabela não couber.

## Solução

### 1. Restaurar scroll interno vertical (`src/pages/admin/LeadsPage.tsx`)
No container do grupo (linhas ~881-888):
- Voltar a usar `overflow-y-auto` + `maxHeight` baseado em viewport (algo como `calc(100vh - 320px)` com `min-height` para grupos pequenos não ficarem espremidos), igual ao comportamento original antes da última edição.
- Manter o `crm-smooth-scroll` que já existe.

### 2. Permitir scroll horizontal no modo compact
Trocar `overflow-x-hidden` por `overflow-x-auto` na variante compact e ajustar o CSS de `.crm-compact-table` em `src/index.css` (linha 648) para **remover** o `overflow-x: hidden !important` — deixar o overflow ser controlado pelo Tailwind no JSX.

Reaproveitar a estética do scrollbar persistente do `crm-x-scroll-always` também no compact (aplicar a classe nas duas densidades), para que a barrinha lateral apareça discreta sempre que houver overflow.

### 3. Garantir que a tabela não force largura mínima desnecessária no compact
A `<table>` compact já tem `table-layout: auto` + `width: 100%`. Vai expandir naturalmente conforme o conteúdo das colunas obrigatórias e gerar scroll horizontal quando não couber, em vez de cortar.

## Resultado esperado

- Modo **comfortable**: igual ao atual (scroll vertical interno + scroll horizontal sempre visível, pinned cols Lead/Ações).
- Modo **compact**: scroll vertical interno **de volta**, e scroll horizontal aparece **se** a viewport não comportar todas as colunas obrigatórias — sem mais corte lateral nos cabeçalhos. O aviso "Shift + rolar" continua oculto no compact (como já está).

## Arquivos afetados

- `src/pages/admin/LeadsPage.tsx` — container do grupo (~linhas 881-888)
- `src/index.css` — regra `.crm-compact-table` (~linha 647-649)
