

## Plan: Redesign da Landing Page — "Cantim da Roça"

Atualização completa da identidade visual da landing page para refletir o posicionamento natural, acessível e focado em saúde/bem-estar, com nova paleta verde, tipografia moderna e foco em conversão via WhatsApp.

---

### O que muda

**1. Paleta de cores e tipografia** (`src/index.css`, `tailwind.config.ts`)
- Substituir paleta marrom/terrosa por verde natural: primário `#2E7D32`, secundário `#66BB6A`, fundo `#E8F5E9`, destaque/botões `#F9A825`, texto `#333333`
- Trocar fontes: Playfair Display → **Poppins** (títulos), Source Sans 3 → **Inter** (corpo)
- Atualizar variante `hero` do botão para usar amarelo destaque `#F9A825`

**2. Hero Section** (`src/components/landing/HeroSection.tsx`)
- Gradiente verde em vez de marrom
- Headline focada em benefício: "Saúde e bem-estar com produtos 100% naturais"
- Subtítulo sobre atendimento próximo e personalizado
- Botão principal: "Falar no WhatsApp" (amarelo, alta visibilidade) linkando direto ao WhatsApp
- Botão secundário: "Conhecer produtos"

**3. Benefícios** (`src/components/landing/BenefitsSection.tsx`)
- Reescrever para focar em saúde, emagrecimento, bem-estar
- Ícones e textos mais simples e diretos
- Fundo `#E8F5E9` com cards brancos

**4. Nova seção educativa** — Criar `src/components/landing/ProductsSection.tsx`
- Seção "Conheça nossos produtos" com cards curtos explicando categorias (chás, temperos, produtos naturais)
- Linguagem simples, estilo Instagram
- CTA "Falar no WhatsApp" ao final

**5. Depoimentos** (`src/components/landing/TestimonialsSection.tsx`)
- Atualizar textos para mencionar resultados reais (saúde, emagrecimento, disposição)
- Visual com fundo verde claro, cards brancos
- Adicionar mais prova social (quantidade de clientes atendidos)

**6. Formulário / CTA** (`src/components/landing/LeadFormSection.tsx`)
- Manter formulário de cadastro mas adicionar botão WhatsApp proeminente acima
- Headline: "Fale com a gente agora"
- Botão WhatsApp amarelo grande + formulário como alternativa

**7. Footer** (`src/components/landing/Footer.tsx`)
- Atualizar cores para verde escuro
- Manter link administrativo discreto

**8. WhatsApp Float** (`src/components/landing/WhatsAppFloat.tsx`)
- Cor verde WhatsApp `#25D366` em vez de secondary

**9. Index.tsx** — Incluir nova seção `ProductsSection` entre Benefits e Testimonials

---

### Arquivos editados
- `src/index.css` — Nova paleta e fontes
- `tailwind.config.ts` — Novas font families
- `src/components/ui/button.tsx` — Variante hero amarela
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/BenefitsSection.tsx`
- `src/components/landing/TestimonialsSection.tsx`
- `src/components/landing/LeadFormSection.tsx`
- `src/components/landing/Footer.tsx`
- `src/components/landing/WhatsAppFloat.tsx`
- `src/pages/Index.tsx`
- **Novo:** `src/components/landing/ProductsSection.tsx`

### O que NÃO muda
- Rotas, autenticação, CRM, banco de dados, pipeline
- Estrutura de componentes do admin
- Funcionalidade do formulário de leads

