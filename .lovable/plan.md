# Rolagem suave + correção do painel de detalhe do Lead

## Problemas identificados

1. **Painel do Lead "transparente demais"** (segunda imagem)
   `LeadDetailSheet` usa `bg-muted/30` (apenas 30% opaco) no `SheetContent`. Isso deixa o conteúdo abaixo aparecer através do drawer, prejudicando leitura — especialmente sobre a tabela escura.
   O header tem `bg-card` mas sem sombra/separação clara, e o padding interno está apertado em telas menores.

2. **Rolagem de listas longas travada/dura**
   - `<main>` em `CrmLayout` e a tabela de leads (`overflow-x-auto overflow-y-auto`) usam scroll nativo sem `scroll-behavior`, sem `overscroll-behavior` e sem inertia em iOS.
   - Em listas grandes (centenas de linhas) o scroll horizontal+vertical fica "duro" e propaga para o body.

3. **Espaçamentos**
   - Cabeçalho do drawer com `pt-7 pb-6` cria altura excessiva que come espaço na sticky.
   - Seções internas com `space-y-5` + `p-5` em cada card geram densidade inconsistente.

## Mudanças

### 1. `src/components/admin/LeadDetailSheet.tsx`
- `SheetContent`: trocar `bg-muted/30` → `bg-background` (sólido). Adicionar classe `crm-smooth-scroll`.
- `SheetHeader`: reduzir para `pt-6 pb-5`, adicionar `shadow-sm` para destacar do conteúdo ao rolar.
- Ajustar bloco "Ações rápidas": `mt-5` → `mt-4` e `gap-2` mantido.
- Container de conteúdo: `px-6 py-6 space-y-5` → `px-6 py-5 space-y-4` para densidade mais coerente com o resto do CRM.
- Cards internos `p-5` → `p-4` para harmonizar com o restante do sistema.

### 2. `src/index.css` — utilitário de rolagem suave (com fallback)
Adicionar:
```css
.crm-smooth-scroll {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;       /* inertia iOS */
  overscroll-behavior: contain;            /* não propaga p/ body */
  scroll-padding-top: 8px;
}
@media (prefers-reduced-motion: reduce) {
  .crm-smooth-scroll { scroll-behavior: auto; }
}
/* opcional: scroll-snap leve por linha em tabelas longas */
.crm-smooth-rows > * { scroll-margin-top: 56px; }
```

### 3. `src/components/crm/CrmLayout.tsx`
- `<main className="flex-1 overflow-y-auto min-w-0">` → adicionar `crm-smooth-scroll`.

### 4. `src/pages/admin/LeadsPage.tsx`
- Container de tabela paginada (linha 691): adicionar `crm-smooth-scroll` à classe.
- Adicionar `scroll-margin-top` nas linhas (via classe `crm-smooth-rows` no `TableBody`) para que `scrollIntoView` ao abrir o drawer não esconda a linha sob o header sticky.

## Por que não usar libs (Lenis/Locomotive)
- Adicionariam ~10-20kb e conflitariam com `position: sticky` do header e dos grupos de status.
- O combo `scroll-behavior: smooth` + `-webkit-overflow-scrolling` + `overscroll-behavior` cobre 99% dos casos com fallback automático em browsers antigos.

## Resultado esperado
- Drawer do lead sólido, legível, sem "vazamento" da tabela ao fundo.
- Espaçamentos mais consistentes com o restante do CRM Monday-style.
- Rolagem com inertia em mobile/trackpad e sem propagação ao body.
- Sem regressão visual no resto do app (mudanças escopadas a `.crm-smooth-scroll` e ao `LeadDetailSheet`).
