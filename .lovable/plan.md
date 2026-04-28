
# Ajustes finos do logo + melhorias na landing

Foco em duas frentes complementares, mantendo 100% a direção **Warm Farmstand** já aprovada (cream/clay/moss/honey, Recoleta + General Sans + Caveat). Sem reescrever seções, sem mudar paleta, sem novas dependências.

---

## 1. Logo oficial no hero — responsividade cirúrgica

Hoje o logo em `StaticImageHero.tsx` usa larguras fixas (`w-[260px] → w-[380px]`) e fica acima do badge. Em telas curtas (≤ 700px de altura) e em mobile landscape ele empurra o conteúdo para fora ou encosta na navbar quando ela aparece.

### Ajustes
- **Escala fluida com `clamp`**: substituir `w-[260px] sm:w-[320px] md:w-[380px]` por `width: clamp(180px, 38vw, 360px)` — escala suave em qualquer breakpoint, nunca maior que o container nem menor que legível.
- **Altura máxima por viewport**: `max-h-[18vh]` (mobile) e `sm:max-h-[22vh]` para garantir que **nunca** ocupe mais que ~1/5 da tela em landscape ou aparelhos baixos.
- **Safe-area do topo**: aumentar `pt` do container para `pt-24 sm:pt-28 md:pt-32` e adicionar `mt-[max(0px,env(safe-area-inset-top))]` no logo para iPhones com notch.
- **Espaçamento adaptativo**: `mb-4 sm:mb-6 md:mb-8` (era fixo `mb-6 sm:mb-8`) — reduz folga em telas curtas.
- **Aspect-ratio reservada** (`aspect-[5/2]` aproximado da logo) para evitar layout shift enquanto carrega.
- **Drop-shadow mais suave em mobile** (`drop-shadow-[0_4px_14px_rgba(0,0,0,0.4)]` em mobile, `sm:drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]`) — sombra grande em telas pequenas vira "halo".
- **Conteúdo do hero alinhado ao centro vertical em telas baixas**: trocar `justify-end` por `justify-center sm:justify-end` quando `min-h-screen` é mais alta que o conteúdo cabe — assim, em mobile landscape o bloco fica centralizado em vez de espremido embaixo.

### Resultado por breakpoint

```text
Mobile portrait (375×812)   → logo ~165px,  navbar limpa, badge+H1 visíveis sem scroll
Mobile landscape (812×375)  → logo ~140px (max-h limita), conteúdo centralizado
Tablet (768×1024)           → logo ~290px
Desktop (1440×900)          → logo ~360px (cap do clamp)
```

---

## 2. Polimento da landing (alto impacto, baixo risco)

### 2.1 Navbar (`Navbar.tsx`)
- Logo da navbar hoje é `h-20 sm:h-24` (80–96px) numa barra de `h-16 sm:h-[72px]` → **transborda 8–24px** e sangra no conteúdo. Reduzir para `h-12 sm:h-14` (48–56px), proporcional à barra.
- Adicionar `safe-area-inset-top` via `pt-[env(safe-area-inset-top)]` no wrapper fixed — corrige notch.
- Item "Cadastre-se" com `bg-clay text-white` (em vez de `bg-primary`) para coerência com a paleta warm.

### 2.2 Hero — micro melhorias
- Trocar `bg-fixed` em mobile por `bg-scroll` (já está, mas confirmar `sm:bg-fixed`) — `bg-fixed` em iOS causa rerender pesado e jitter. ✓ já correto.
- Overlay um pouco mais forte na base (`from-black/15 via-black/25 to-black/75`) para melhorar contraste do texto sem escurecer demais a foto.
- Hint "Role para descobrir" ganha um chevron animado sutil (CSS `animate-bounce` discreto) — convida ao scroll.
- CTA primário usa `bg-clay` ✓ (manter), mas com `hover:shadow-[0_12px_32px_-8px_hsl(var(--clay)/0.55)]` para dar peso quente no hover.

### 2.3 BenefitsSection
- Hoje `py-16 ... sm:py-0` zera padding vertical no desktop — visualmente cola na próxima seção. Trocar para `py-16 sm:py-24`.
- Cards em mobile recebem `min-h-[200px]` (era 220) e título `text-lg sm:text-2xl` — densidade melhor em telas pequenas.
- Adicionar grid `lg:grid-cols-4` para que os 4 benefícios apareçam em uma única linha em telas largas (hoje fica 2×2 sempre).

### 2.4 ProductsSection
- O logo decorativo `-right-20` em mobile cria scroll horizontal sutil. Adicionar `overflow-hidden` é redundante (já tem na section), mas trocar `-right-20` por `-right-10 sm:-right-20` reduz o vazamento visual em mobile.
- Header do bloco com `px-6 sm:px-4` para melhor respiro lateral em mobile.

### 2.5 Footer
- Garantir link admin discreto continua existindo (já é regra do projeto) — sem alterações se já está correto.

### 2.6 Detalhes globais (`index.css`)
- Adicionar `scroll-padding-top: 80px` em `html` para que âncoras (#produtos, #beneficios) não fiquem cobertas pela navbar fixa ao usar os links.
- `body { -webkit-tap-highlight-color: transparent; }` — remove flash azul no toque mobile, comum em iOS.

---

## Arquivos a editar

- `src/components/landing/StaticImageHero.tsx` — logo responsivo + safe-area + alinhamento adaptativo
- `src/components/landing/Navbar.tsx` — altura do logo, safe-area, cor do CTA
- `src/components/landing/BenefitsSection.tsx` — padding, grid lg:4, densidade mobile
- `src/components/landing/ProductsSection.tsx` — vazamento decorativo + padding mobile
- `src/index.css` — `scroll-padding-top` + tap-highlight

## QA visual

Após implementar, vou conferir o preview em **375×812 (iPhone)**, **812×375 (mobile landscape)**, **768×1024 (tablet)** e **1440×900 (desktop)** via browser tools, validando:
1. Logo do hero **nunca** corta nem encosta na navbar
2. Conteúdo do hero cabe sem scroll em mobile portrait padrão
3. Navbar sticky não invade conteúdo ao usar âncora
4. Sem scroll horizontal em nenhum breakpoint

Se algum breakpoint apresentar regressão, ajusto os valores de `clamp`/`max-h` antes de finalizar.
