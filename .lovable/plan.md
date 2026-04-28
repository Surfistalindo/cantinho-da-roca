## Refinamentos finais de scroll do CRM

Cinco ajustes complementares ao scroll híbrido implementado anteriormente. Tudo escopado a `.font-crm` — landing intocada.

### 1. Anti-salto no overscroll chaining

Quando uma `div` interna esgota seu scroll, o browser propaga o evento pro documento — mas como o documento também tem `overscroll-behavior: auto` por padrão, o trackpad/touch dispara um pequeno "salto"/bounce. A correção é dupla:

- No `<html>` do CRM: `overscroll-behavior-y: none` — corta bounce do documento root, sem perder o chaining (que vem de cada container interno).
- Em containers internos: `overscroll-behavior: contain` quando devem confinar (sheets/dialogs) e `overscroll-behavior-y: auto` quando devem entregar o resto pro documento.

Também adiciono `scrollbar-gutter: stable` ao `<html>` pra evitar o "pulo" horizontal de 8-10px quando um dialog abre (scrollbar some, conteúdo desloca).

### 2. Utilitários padronizados de scroll

Hoje cada componente escolhe `overflow-y-auto + overscroll? + crm-smooth-scroll?` solto. Crio duas classes que codificam a regra:

- **`.crm-scroll-area`** — confina o scroll dentro do elemento (não vaza pro documento). Para sheets, dialogs, painéis em split, listas que devem ter rolagem independente.
- **`.crm-scroll-passthrough`** — rola por dentro mas, ao esgotar, deixa o documento continuar (chaining suave). Para listas longas dentro de telas que rolam pelo documento.

Ambas trazem o scrollbar fino premium e `contain: paint` (próximo ponto).

Substituo os usos atuais nos componentes-chave:
- `LeadDetailSheet`, `CustomerDetailSheet`, `NewLeadDialog` → `crm-scroll-area` (precisam confinar)
- `IAAssistantPage` chat scroller → `crm-scroll-area`
- Tabela densa do `LeadsPage` (modo comfortable com scroll horizontal) e `ClientsPage` → mantém `overflow-*-auto` mas ganha `crm-scroll-passthrough` no eixo Y quando aplicável

### 3. Performance da rolagem (will-change + reduzir reflows)

- Nova classe `.crm-sticky-layer` (aplicada no wrapper sticky da sidebar e no `<header>` do `AdminNavbar`): `will-change: transform; transform: translateZ(0); backface-visibility: hidden;` — promove o elemento a uma camada de compositing própria, então a roda do mouse não dispara repaint do conteúdo atrás. Anulada em `prefers-reduced-motion: reduce` (sem ganho real e custa memória).
- `contain: paint` nos containers `.crm-scroll-area` e `.crm-scroll-passthrough`: o browser sabe que mudanças dentro do elemento não afetam o resto da página, então não recalcula layout dos irmãos durante o scroll.
- Não toco em transforms ou animações já existentes (nada de microanimações novas, conforme regra Core).

### 4. Fallback para navegadores sem `:has()`

Hoje o scrollbar fino premium do documento só aparece se o navegador suportar `html:has(.font-crm)`. Suporte é amplo (Chrome 105+, Safari 15.4+, Firefox 121+), mas usuários em browsers antigos veem o scrollbar default do SO no `<html>`.

Solução: o CSS aceita as duas formas — `html:has(.font-crm)` **e** `html.crm-active`. O `CrmLayout` adiciona/remove a classe `crm-active` no `<html>` via `useEffect` (no mount) e cleanup (no unmount). Cobertura: 100%, com zero degradação visual nos navegadores modernos (a regra `:has` continua valendo e a classe é só backup).

### 5. Mobile: sidebar sticky não pode interferir

No mobile (`< 768px`), o `Sidebar` do shadcn vira automaticamente um `Sheet` (offcanvas). Mas o nosso wrapper `<div className="sticky top-0 h-screen shrink-0 z-20">` no `CrmLayout` continua ocupando espaço e fixando 100vh — isso quebra o scroll fino do documento e cria layout-thrash em mobile.

Correção:
- Adiciono classe `crm-sidebar-shell` ao wrapper.
- No CSS, `@media (max-width: 767px)` zera o sticky/h-screen/z-index dessa classe (`position: static; height: auto; z-index: auto`). O Sheet do shadcn passa a ser a única referência da sidebar mobile, como deveria.
- Restauro `-webkit-overflow-scrolling: touch` no `<html>` mobile (momentum scroll nativo do iOS, perdido quando definimos `overscroll-behavior-y: none`).

### Arquivos editados

- `src/index.css` — utilitários (`.crm-scroll-area`, `.crm-scroll-passthrough`, `.crm-sticky-layer`, `.crm-sidebar-shell`), fallback `:has()`, regras mobile, anti-salto.
- `src/components/crm/CrmLayout.tsx` — `useEffect` que liga/desliga `html.crm-active`, classe `crm-sidebar-shell + crm-sticky-layer` no wrapper da sidebar.
- `src/components/crm/AdminNavbar.tsx` — adiciona `crm-sticky-layer` ao `<header>`.
- `src/components/admin/LeadDetailSheet.tsx`, `src/components/admin/CustomerDetailSheet.tsx`, `src/components/admin/NewLeadDialog.tsx`, `src/pages/admin/ia/IAAssistantPage.tsx` — trocar `overflow-y-auto` solto por `crm-scroll-area`.

### Não-objetivos

- Não trocar a estratégia de scroll do documento (foi aprovada na rodada anterior).
- Não mexer em hooks de dados, paginação, filtros, tutoriais ou pipeline.
- Não adicionar libs (sem virtualização, sem lib de scroll).
