# Cabeçalho da tabela de Leads sticky

## Problema
Ao rolar listas longas, os títulos das colunas (Lead, Origem, Interesse, Status, Prioridade, Recência, Entrada, Ações) saem da tela.

## Solução (1 arquivo)

`src/pages/admin/LeadsPage.tsx` (linhas 553-554)

Tornar `<TableHeader>` sticky dentro do container scrollável (`overflow-y-auto` já existe na div pai, linha 691):

```tsx
<TableHeader className="sticky top-0 z-20 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
  <TableRow className="hover:bg-transparent border-border [&>th]:bg-card">
```

- `sticky top-0` fixa o header no topo do container scrollável
- `z-20` garante que fique acima das células
- `bg-card` no `<th>` (via `[&>th]:bg-card`) evita que o conteúdo apareça atrás (células de tabela são transparentes por padrão)
- `shadow` cria a hairline inferior preservada durante o scroll

## Resultado
Títulos das colunas permanecem visíveis durante toda a rolagem da tabela, em cada grupo de status. Sem mudança de layout.
