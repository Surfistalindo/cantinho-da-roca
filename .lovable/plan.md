

## Plano: Navbar fixa + harmonização visual + redesign das seções

### O que será feito

**1. Navbar fixa no topo**
- Criar `src/components/landing/Navbar.tsx` com posição `fixed` e fundo translúcido (`backdrop-blur`)
- Links: Início, Benefícios, Produtos, Depoimentos, Contato — smooth scroll para âncoras
- Logo à esquerda, menu hamburger no mobile com overlay
- Adicionar `id` em cada seção: `beneficios`, `produtos`, `depoimentos`, `contato`
- Integrar no `Index.tsx` acima do `HeroSection`

**2. Trocar fontes**
- Substituir Poppins/Inter por fontes mais premium e menos genéricas
- Usar **DM Serif Display** para headings (elegante, natural) e **DM Sans** para body (moderno, limpo)
- Atualizar `index.css` (import Google Fonts) e `tailwind.config.ts`

**3. Harmonizar cores com o hero**
- O hero usa `#f7f5f0` → `#f0f7f0`. As seções intermediárias devem seguir essa paleta
- BenefitsSection: fundo warm `#f7f5f0` em vez de `bg-accent` genérico
- ProductsSection: fundo branco suave com borda sutil verde
- TestimonialsSection: fundo `#eef5ee`
- LeadFormSection: fundo `#f7f5f0` com destaque verde
- Footer: verde escuro profundo (já está `bg-primary`)

**4. Redesign das seções (estilo premium, não genérico)**

- **BenefitsSection**: Layout em bento grid assimétrico. Cards com ícones grandes, fundo com gradiente sutil, bordas arredondadas com hover elevado. Estilo inspirado em feature sections do 21st.dev (cards com glassmorphism leve)
- **ProductsSection**: Cards com hover animado (scale + shadow), badge "100% Natural" no canto, layout com destaque no card central. Botão WhatsApp com animação de pulse
- **TestimonialsSection**: Layout com aspas grandes decorativas, avatar com iniciais coloridas, cards com borda esquerda verde accent. Mais espaçamento e tipografia refinada
- **LeadFormSection**: Fundo com padrão sutil (dots como no hero), card centralizado com sombra elevada, inputs com estilo mais refinado
- **Footer**: Manter estrutura, refinar tipografia

### Arquivos editados
| Arquivo | Ação |
|---------|------|
| `src/components/landing/Navbar.tsx` | Criar — navbar fixa com links âncora |
| `src/pages/Index.tsx` | Adicionar Navbar, padding-top para compensar fixed |
| `src/index.css` | Trocar fontes para DM Serif Display + DM Sans |
| `tailwind.config.ts` | Atualizar fontFamily |
| `src/components/landing/BenefitsSection.tsx` | Redesign visual — bento grid premium |
| `src/components/landing/ProductsSection.tsx` | Redesign visual — cards animados |
| `src/components/landing/TestimonialsSection.tsx` | Redesign visual — aspas decorativas |
| `src/components/landing/LeadFormSection.tsx` | Harmonizar fundo e estilo |
| `src/components/landing/HeroSection.tsx` | Adicionar padding-top para navbar |

### O que NÃO muda
- Lógica de formulário e integração com banco
- Estrutura de rotas e CRM admin
- WhatsAppFloat
- Footer (apenas ajustes de fonte)

