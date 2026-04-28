## Problema

Na tela de Leads, a roda do mouse só rola a página quando o cursor está sobre a barra de scroll lateral. Quando o mouse está sobre a tabela, "nada acontece".

## Causa

A tabela de Leads tem **dois containers de scroll vertical aninhados**:

```text
<main overflow-y-auto>            ← scroll principal do CRM (CrmLayout.tsx)
  <LeadsPage>
    <div overflow-y-auto          ← wrapper da tabela (LeadsPage.tsx, linha 723)
         style="maxHeight: calc(100vh - 280px)">
      <Table ... />
    </div>
  </main>
```

Quando a roda do mouse está sobre a tabela, o navegador entrega o evento ao container **mais interno** com `overflow-y-auto`. Como a tabela é paginada (não há overflow vertical real lá dentro), a roda "morre" no wrapper e o `<main>` externo nunca recebe — por isso o scroll só funciona ao mirar o trackbar lateral.

Mesmo padrão pode estar acontecendo em outras telas que usam o `crm-paper-bg`/`<main>`; mas a queixa concreta foi Leads, então corrijo lá.

## Correção

Em `src/pages/admin/LeadsPage.tsx` (linhas 723-726), remover o `overflow-y-auto` e o `maxHeight` do wrapper da tabela, deixando apenas o `overflow-x-auto` (necessário para colunas largas no mobile/notebook). O scroll vertical passa a ser exclusivamente o do `<main>`, como já é em todas as outras telas (Dashboard, Clientes, Pipeline).

Adicional: `overscroll-behavior-x: contain` no wrapper para evitar que arrastar lateral acione "voltar página" no Chrome/Safari.

```tsx
<div
  className="overflow-x-auto crm-smooth-scroll crm-dense-table min-w-0 max-w-full"
  style={{ overscrollBehaviorX: 'contain' }}
>
  <Table>...</Table>
</div>
```

## Verificação após o fix

1. Em /admin/leads, posicionar o mouse sobre o meio da tabela e usar a roda → a página deve rolar normalmente.
2. Em telas estreitas, a tabela ainda rola horizontalmente (scroll-x preservado).
3. Header sticky e filtros sticky continuam funcionando — eles dependem do scroll do `<main>`, que agora é o único container vertical.

## Arquivos alterados

- `src/pages/admin/LeadsPage.tsx` (1 ajuste, linhas 723-726).
