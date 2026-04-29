## Bug: coluna "Lead" pinada à esquerda cria overlay azul ao arrastar horizontalmente

### Diagnóstico
A página `src/pages/admin/LeadsPage.tsx` está aplicando, no modo `comfortable`, a classe `crm-pin-left` na coluna "Lead" (cabeçalho + célula) e `crm-pin-right` na coluna "Ações". Isso fixa essas duas colunas lateralmente — exatamente o que você não quer e causa aquele bloco azul escuro sobreposto na imagem ao arrastar pra esquerda.

O cabeçalho horizontal da tabela (linha de "Origem · Interesse · Status · Prioridade · Recência · Prioridade · Ações") já tem `sticky top-0 z-20 bg-card` no `<TableHeader>` (linha 694) — ou seja, ele já fica fixo no topo durante o scroll vertical, que é o comportamento correto que você pediu. Não precisa mexer nessa parte.

### Correção
Remover as 4 referências de `crm-pin-left` / `crm-pin-right` em `src/pages/admin/LeadsPage.tsx`:

1. **Linha 709** — `<TableHead>` "Lead" no cabeçalho: tirar `density === 'comfortable' && 'crm-pin-left'`.
2. **Linha 744** — `<TableHead>` "Ações" no cabeçalho: tirar `density === 'comfortable' && 'crm-pin-right'`.
3. **Linha 791** — `<TableCell>` da célula "Lead": passar de `cn('font-medium', density === 'comfortable' && 'crm-pin-left')` para apenas `'font-medium'`.
4. **Linha 834** — `<TableCell>` da célula "Ações": tirar `className={cn(density === 'comfortable' && 'crm-pin-right')}`.

Mantém intacto:
- O `sticky top-0 z-20 bg-card` no `<TableHeader>` — cabeçalho continua fixo no scroll vertical.
- O scroll horizontal interno da tabela.
- Os utilitários `.crm-pin-left/right` no CSS (podem seguir disponíveis pra outras telas).

### Resultado
- Sem mais overlay azul escuro sobreposto ao arrastar pra esquerda.
- Cabeçalho continua fixo no topo durante scroll vertical (era o que você queria preservar).
- Colunas rolam normalmente em ambas direções.
