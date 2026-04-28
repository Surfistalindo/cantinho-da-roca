## Reverter o scroll da tabela de Leads + testar

A última mudança no scroll deixou a experiência ruim. Reverto a tabela ao estado original (com o próprio scroll vertical interno e altura máxima) e testo no preview para confirmar que voltou ao normal.

## Mudança

Em `src/pages/admin/LeadsPage.tsx`, linhas 723-726, restaurar:

```tsx
<div
  className="overflow-x-auto overflow-y-auto crm-smooth-scroll crm-dense-table min-w-0 max-w-full"
  style={{ maxHeight: 'calc(100vh - 280px)' }}
>
```

Isso devolve à tabela:
- O scroll vertical próprio dentro do container.
- O limite de altura (`100vh - 280px`) que mantém os filtros e o cabeçalho fixos no topo.
- O scroll horizontal preservado para colunas largas.

## Verificação no preview

Após a mudança, abrir o preview em `/admin/leads` e:

1. Confirmar visualmente que a tabela voltou ao layout antigo (com sua própria barra de scroll vertical, sem "esticar" a página inteira).
2. Rolar a tabela com a roda do mouse sobre ela.
3. Tirar screenshot para validar.

## Arquivos alterados

- `src/pages/admin/LeadsPage.tsx` (1 ajuste, linhas 723-726).
