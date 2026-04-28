## Objetivo

Tornar o botão de **densidade compacta** (ícone de lista, ao lado do confortável) realmente útil em `/admin/leads`: quando ativado, **toda a tabela encolhe para caber na tela sem scroll horizontal**, mesmo em telas menores onde hoje aparece a barra horizontal.

## Estado atual

- Toggle existe (`density: 'comfortable' | 'compact'`) e persiste em `localStorage`, mas hoje só altera:
  - altura da linha (`h-9` vs `h-12`)
  - tamanho do avatar (`sm` vs `md`)
  - exibição do telefone abaixo do nome
- O scroller usa `overflow-x-auto` sempre, então o usuário compacta a linha mas ainda precisa rolar lateralmente.
- Colunas `Origem` (`hidden lg:table-cell`) e `Interesse` (`hidden xl:table-cell`) e `Recência` (`hidden lg:table-cell`) aparecem por viewport, não por densidade.

## Mudanças

### 1. `src/index.css` — nova classe `.crm-compact-table`

Adicionar logo após `.crm-dense-table` (após linha 587), reaproveitando o sistema atual:

- `overflow-x: hidden` no scroller (some a barra horizontal).
- `table-layout: auto; width: 100%` para Postgres-like fit ao container.
- `thead th`: `height: 28px`, `padding: 0 .375rem`, `font-size: 10px`.
- `tbody tr`: `height: 30px`.
- `tbody td`: `padding: 2px 6px`, `font-size: 12px`, `.text-sm` cai para 12px.
- Botões de ação na última coluna encolhem: `h-6 w-6`, ícones `h-3 w-3`.

Mantém o `overflow-y-auto` e `maxHeight: calc(100vh - 280px)` intactos (scroll vertical preservado, plano anterior intocado).

### 2. `src/pages/admin/LeadsPage.tsx`

**a) Scroller** (linhas ~795–815): alternar classes conforme densidade

```tsx
className={cn(
  'overflow-y-auto crm-smooth-scroll crm-dense-table min-w-0 max-w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset rounded-sm',
  density === 'compact' ? 'crm-compact-table overflow-x-hidden' : 'overflow-x-auto',
)}
```

**b) Esconder colunas auxiliares no compact** — header (linhas ~657, 661) e cells (linhas ~734, 748):

- Coluna **Origem** e **Recência**: trocar `hidden lg:table-cell` por `cn('hidden lg:table-cell', density === 'compact' && 'lg:hidden')`.
- Coluna **Interesse** (`xl:table-cell`): em compact, também ocultar com `density === 'compact' && 'xl:hidden'`.

**c) Coluna "Lead"** (linha ~656): `min-w-[240px]` → em compact usar `min-w-[160px]` (cabe melhor). Aplicar via `cn`.

**d) Coluna "Ações"** (linha ~682): `w-[140px]` → em compact `w-[80px]` para acomodar 2 ícones menores. Truncar para mostrar só WhatsApp + Excluir (esconder `QuickActionsPopover` em compact, que tem ações secundárias).

**e) Score badge / Status select** ficam, mas Score já é `size="sm"` e Status select usa largura fluida do `w-[160px]` da coluna — em compact reduzir para `w-[120px]`.

**f) Tooltip no botão** atualizar de `Densidade compacta` para `Compactar tabela (cabe sem rolar lateral)`.

### 3. Verificação

Após aplicar, abrir `/admin/leads` no preview com viewport 1280×720:

1. Em **confortável** confirmar que o layout atual permanece idêntico.
2. Clicar no ícone de **compacto**: barra de scroll horizontal desaparece; todas as linhas encolhem; colunas Origem/Recência/Interesse somem; Lead, Status, Prioridade, Entrada e Ações continuam visíveis e usáveis.
3. Testar também em 1024×768 (apenas Lead/Status/Prioridade/Entrada/Ações em compact, sem scroll lateral).
4. Voltar para confortável: layout volta ao normal.

## Não-objetivos

- Não mudar Kanban nem Cards (densidade só afeta a visão de tabela, como hoje).
- Não alterar paginação por grupo, filtros URL, refresh strip ou navegação por teclado adicionados antes.
- Sem novas libs, sem mudanças no schema.

## Arquivos afetados

- `src/index.css` — adicionar bloco `.crm-compact-table` (~30 linhas).
- `src/pages/admin/LeadsPage.tsx` — classes condicionais nas colunas, scroller e ajustes no tooltip/QuickActions.
