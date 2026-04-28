## Objetivo

No hero da landing (`StaticImageHero.tsx`), a imagem de fundo atual já tem a marca "Cantim da Roça" embutida na própria foto, e ela aparece **cortada** no topo da viewport. Vou:

1. Trocar o background pela foto **limpa** (sem a logo embutida).
2. Sobrepor a **logo oficial** como um elemento HTML, posicionada **mais para baixo** dentro do hero (acima do badge "colhido na semana"), com margem grande do topo para nunca ser cortada — independente do tamanho de tela.

## Arquivos

**Já copiados para `src/assets/`:**
- `hero-cantim-clean.png` — foto sem logo no fundo
- `logo-cantim-oficial.png` — logo oficial PNG transparente

**Editar:**
- `src/components/landing/StaticImageHero.tsx`

## Mudanças no `StaticImageHero.tsx`

1. Trocar o import do background:
   - De `hero-cantim-bg.webp` → para `hero-cantim-clean.png`.
   - Manter o LQIP atual como blur de fallback.

2. Adicionar um novo `useReveal` para animar a entrada da logo.

3. No bloco de conteúdo (já posicionado com `justify-end pb-16 sm:pb-24 pt-28 sm:pt-32`), inserir a logo **antes** do badge:
   - `<img>` centralizada, largura `w-[260px] sm:w-[320px] md:w-[380px]`.
   - `mb-6 sm:mb-8` separando do badge.
   - `drop-shadow` suave para destacar contra o fundo escuro.
   - Como o conteúdo do hero usa `justify-end` + `pt-28 sm:pt-32`, a logo nasce na metade inferior da viewport — bem longe da navbar — e nunca é cortada.

4. Pequeno delay no badge (`transitionDelay: 60ms`) para a logo aparecer primeiro na sequência de reveal.

## Resultado esperado

```text
┌─ Navbar fixa ───────────────────────┐
│                                     │
│         (foto natural, limpa,        │
│          sem logo embutida)          │
│                                     │
│         ┌──────────────────┐        │
│         │  [LOGO OFICIAL]  │ ← nova │
│         └──────────────────┘        │
│         🌿 colhido na semana        │
│                                     │
│   Sabores e cuidados                │
│   direto da roça🌿 para você        │
│                                     │
│   [Conhecer produtos] [Falar...]    │
│                                     │
│         Role para descobrir         │
└─────────────────────────────────────┘
```

A logo fica visível inteira em mobile (260px), tablet (320px) e desktop (380px), nunca cortada pela navbar.
