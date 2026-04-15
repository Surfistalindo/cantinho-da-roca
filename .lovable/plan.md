

## Plano: Navbar com animação de scroll + Logo morphing + Animações 3D por toda a landing

### Conceito UX
A navbar começa **invisível**. Conforme o usuário rola, ela desliza de cima com `translateY` e aparece gradualmente. A logo do hero **"sobe" e encolhe** para se posicionar na navbar, criando uma transição fluida e cinematográfica. Todas as seções ganham animações de entrada ao entrar no viewport.

### O que será feito

**1. Navbar com reveal on scroll + logo morphing**
- Navbar começa com `opacity: 0` e `translateY(-100%)`, totalmente escondida
- Ao rolar ~150px, a navbar anima para dentro com transição suave
- A logo do hero usa `position: fixed` com interpolação de `top`, `left`, `scale` baseada no `scrollY` — começa grande no centro do hero e migra para o canto da navbar enquanto encolhe
- Implementado com `useEffect` + `requestAnimationFrame` para performance

**2. Hook `useScrollAnimation` reutilizável**
- Criar `src/hooks/useScrollAnimation.ts` com Intersection Observer
- Detecta quando elementos entram no viewport e aplica classes CSS de animação
- Suporta threshold, delay e direção configuráveis

**3. Animações 3D nas seções (CSS puro, sem lib extra)**
- **BenefitsSection**: Cards entram com `rotateY` + `translateZ`, virando de lado para frente como cartas 3D. Hover com `perspective` e `rotateX/Y` sutil seguindo o mouse
- **ProductsSection**: Cards entram escalonados com `translateZ` + `scale`, efeito de profundidade. Hover com elevação 3D (`translateZ` + sombra dinâmica)
- **TestimonialsSection**: Cards deslizam de baixo com `rotateX` (inclinação para trás) e corrigem para flat. Parallax leve no scroll
- **LeadFormSection**: Formulário entra com `scale3d` de pequeno para grande, como emergindo da tela
- **Footer**: Fade-in simples ao entrar no viewport

**4. Keyframes e animações no Tailwind**
- Adicionar novos keyframes em `tailwind.config.ts`: `slide-down`, `card-flip`, `emerge-3d`, `float`
- Manter as animações existentes intactas

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useScrollAnimation.ts` | Criar — hook com IntersectionObserver |
| `src/components/landing/Navbar.tsx` | Reescrever — reveal on scroll, logo placeholder slot |
| `src/components/landing/HeroSection.tsx` | Editar — logo com position fixed + scroll interpolation |
| `src/pages/Index.tsx` | Editar — gerenciar estado de scroll compartilhado entre Navbar e Hero |
| `src/components/landing/BenefitsSection.tsx` | Editar — animações 3D de entrada nos cards |
| `src/components/landing/ProductsSection.tsx` | Editar — animações 3D escalonadas |
| `src/components/landing/TestimonialsSection.tsx` | Editar — animação de entrada com rotateX |
| `src/components/landing/LeadFormSection.tsx` | Editar — animação emerge-3d |
| `src/components/landing/Footer.tsx` | Editar — fade-in on scroll |
| `tailwind.config.ts` | Editar — novos keyframes 3D |

### O que NÃO muda
- Lógica do formulário e integração com banco
- Estrutura de rotas e CRM admin
- WhatsAppFloat
- Nenhuma lib nova necessária (tudo CSS transforms + JS vanilla)

