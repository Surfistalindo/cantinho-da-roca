

## Plan: Efeitos 3D, Parallax e Fluidos Estratégicos

### Resumo
Adicionar efeitos visuais premium em locais estratégicos do site sem poluir a experiência. Foco em: parallax por scroll, tilt 3D interativo, e transições fluidas.

### Mudanças por seção

**1. Hero — Parallax em camadas (já parcial, melhorar)**
- Adicionar parallax diferencial na imagem do hero (velocidade diferente do texto)
- Efeito de escala sutil na imagem conforme scroll (`scale: 1 + scrollY * 0.0003`)

**2. Benefits Section — Tilt 3D nos cards ao hover**
- Implementar mouse-tracking tilt 3D nos cards de benefícios usando `onMouseMove` para calcular `rotateX/rotateY` baseado na posição do cursor
- Adicionar reflexo de luz (gradient overlay) que segue o mouse
- Efeito de "lift" mais pronunciado com `translateZ` e sombra dinâmica

**3. Products Section — Parallax no título + floating elements**
- Receber `scrollY` como prop e aplicar parallax sutil no heading da seção
- Adicionar um elemento decorativo (logo ou folha) com parallax invertido no fundo

**4. Testimonials Section — Stagger 3D flip-in + hover tilt**
- Manter o flip-in 3D existente no scroll, adicionar tilt 3D leve no hover dos cards (menos intenso que benefits)
- Adicionar brilho sutil que segue o mouse nos cards

**5. Lead Form Section — Glass morphism + float**
- Adicionar animação de "floating" sutil no card do formulário (micro-movimento vertical contínuo)
- Efeito de borda brilhante sutil (glow pulsante) no card do formulário para chamar atenção

**6. Novo hook: `useMouseTilt`**
- Hook reutilizável que retorna `rotateX`, `rotateY` e `lightPosition` baseado na posição do mouse dentro de um elemento
- Usado nos cards de benefícios e depoimentos

### Arquivos modificados
- `src/hooks/useMouseTilt.ts` — novo hook
- `src/components/landing/HeroSection.tsx` — parallax na imagem
- `src/components/landing/BenefitsSection.tsx` — tilt 3D + light follow
- `src/components/landing/ProductsSection.tsx` — parallax no título
- `src/components/landing/TestimonialsSection.tsx` — hover tilt leve
- `src/components/landing/LeadFormSection.tsx` — floating + glow
- `src/pages/Index.tsx` — passar scrollY para ProductsSection

### Princípios
- Todos os efeitos usam `will-change: transform` e são GPU-composited
- `prefers-reduced-motion` respeita acessibilidade (sem animação quando ativado)
- Efeitos são sutis e elegantes, não exagerados

