

## Plano: Login premium fiel à marca Cantinho da Roça

Refazer o `AdminLogin` com profundidade, glassmorphism suave e microinterações — usando a paleta verde/creme/dourado já existente. Sem dark mode, sem neon, sem social login. Foco em hierarquia, feedback claro e sensação artesanal.

### 1. Layout (split screen no desktop, empilhado no mobile)

```text
┌─────────────────────────┬──────────────────────────────┐
│ ARTE / BACKGROUND       │  CARD DE LOGIN (glass)       │
│                         │                              │
│  blobs verdes/âmbar     │   🌿 Cantinho da Roça        │
│  animados (float lento) │   Área administrativa        │
│  folhas SVG flutuantes  │                              │
│  textura grão sutil     │   ┌────────────────────────┐ │
│  gradiente creme→verde  │   │ E-mail                 │ │
│                         │   │ [             ✉ ]      │ │
│  "Do campo para         │   ├────────────────────────┤ │
│   sua mesa."            │   │ Senha    Esqueci?      │ │
│  — citação da marca     │   │ [             👁 ]     │ │
│                         │   └────────────────────────┘ │
│                         │                              │
│                         │   [   Entrar  →   ]          │
│                         │                              │
│                         │   ← Voltar para o site       │
└─────────────────────────┴──────────────────────────────┘
```

- **Desktop (≥md):** grid 2 colunas, arte à esquerda, card à direita centralizado.
- **Mobile (<md):** uma coluna, arte vira fundo do card (blobs reduzidos), card ocupa tela com padding.
- Min-height `100dvh` (não `100vh`) para não cortar em mobile.

### 2. Background animado (CSS puro, sem dependências)

- Gradiente base radial: creme (`--background`) → verde claro (`--accent`) → leve âmbar (`--highlight`) nos cantos.
- 3 **blobs** SVG/divs com `blur-3xl` em verde primário, verde secundário e dourado, animados com `@keyframes float` (já existe) em durações dessincronizadas (12s/16s/20s).
- 2-3 **folhas** SVG (reaproveitar `LeafSVG.tsx`) flutuando devagar com `opacity-20` e rotação suave.
- Textura de grão sutil via `bg-[url('data:image/svg+xml...')]` ou pseudo-elemento com noise (mantém a sensação rural/orgânica em vez de neon).
- Tudo `pointer-events-none` e `aria-hidden`.

### 3. Card de login (glassmorphism orgânico)

- `bg-card/70 backdrop-blur-xl border border-white/40` — vidro suave sobre o fundo claro (não dark).
- `shadow-[0_20px_60px_-15px_hsl(125_47%_33%/0.25)]` — sombra verde difusa, não preta.
- `rounded-2xl p-8 md:p-10`.
- Animação de entrada: `animate-fade-in` (já existe no tailwind config) + slight scale.

### 4. Campos com label flutuante e foco elevado

Substituir `Input` placeholder-only por inputs com label visível acima:
- Label `text-xs font-semibold uppercase tracking-wide text-muted-foreground`.
- Wrapper com `relative`: input + ícone à direita (`Mail`, `Lock`/`Eye` toggle).
- **Foco**: `focus-within:ring-2 focus-within:ring-primary/40 focus-within:shadow-[0_0_0_4px_hsl(125_47%_33%/0.08)]` + leve `-translate-y-px` no wrapper.
- Toggle de visibilidade da senha (botão `Eye`/`EyeOff` à direita).
- Validação inline: borda âmbar (`--warning`) + mensagem pequena abaixo se email malformado (HTML5 + check em `onBlur`).
- `autoComplete="email"` / `autoComplete="current-password"` para acessibilidade.

### 5. Botão "Entrar" com profundidade

- Variante existente `default` (verde primário) + classes extras: gradiente sutil (`bg-gradient-to-b from-primary to-primary/90`), `shadow-lg shadow-primary/30`, `hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40`, `active:translate-y-0` — efeito de profundidade sem trocar tokens.
- Loading: spinner inline (`Loader2 animate-spin`) + texto "Entrando…", botão `disabled` com `opacity-70`.
- Sucesso: pequeno toast verde + redirect imediato (já feito).
- Erro: toast destrutivo (já feito) + shake sutil no card via classe one-shot (`animate-[wiggle_0.4s]` adicionada localmente).

### 6. "Esqueci minha senha" → modal de contato

- Link discreto à direita do label "Senha" (`text-xs text-primary hover:underline`).
- Abre `Dialog` (shadcn) com:
  - Título: "Recuperação de senha"
  - Texto: "Para redefinir sua senha, entre em contato com nosso suporte."
  - Email destacado em card: **contato@voltzagency.com.br** com botão "Copiar" (feedback "Copiado ✓") e botão "Abrir email" (`mailto:`).
  - Botão "Fechar".
- Sem fluxo de reset real, sem rota `/reset-password`.

### 7. Header do card (logo + título)

- Ícone de folha (reaproveitar `LeafSVG`) acima do título, com `animate-[float_4s_ease-in-out_infinite]`.
- Título "Cantinho da Roça" em `font-heading` (Satisfy) com `hero-title-shimmer` (já existe) — assinatura visual da marca.
- Subtítulo "Área administrativa" em DM Sans, `text-muted-foreground`.

### 8. Painel lateral (apenas desktop)

- Citação grande em Satisfy: *"Do campo para sua mesa."*
- Pequeno texto: "Sistema de gestão da família Cantinho da Roça."
- Marca discreta no rodapé do painel.
- Fica oculto em `<md` para priorizar o card.

### 9. Acessibilidade & responsividade

- Contraste AA garantido (texto sobre vidro continua legível porque o fundo é claro).
- Foco visível em todos os interativos (`focus-visible:ring`).
- `aria-label` nos botões de ícone (toggle senha, copiar email).
- Form com `aria-invalid` quando há erro.
- `prefers-reduced-motion`: blobs e float pausam via media query.
- Mobile-first: testado em 360px, breakpoints `sm/md/lg`.
- Viewport atual do usuário (860px) cai em `md` — split layout aparece bem.

### Arquivos tocados

- **Reescrever:** `src/pages/AdminLogin.tsx` — todo o novo layout, modal de recuperação, animações inline.
- **Editar:** `src/index.css` — adicionar `@keyframes wiggle` e classe utilitária para o shake (uma adição pequena, sem mudar tokens).
- Reutilizar: `LeafSVG`, `Dialog`, `Button`, `Input`, `useToast`, `hero-title-shimmer`, `animate-fade-in`, `@keyframes float`.

### Garantias

- Zero mudança de tokens, zero dependência nova, zero impacto em outras páginas.
- Marca preservada: Satisfy, verde primário, dourado de destaque, folha como ícone.
- AuthContext intacto: mesmo `signIn(email, password)` → `/admin/dashboard`.
- Landing page e CRM não tocados.

