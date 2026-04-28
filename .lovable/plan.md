## Problema

Em telas largas (1920×1080), a hero `StaticImageHero` apresenta dois problemas visíveis no print do usuário:

1. **Conteúdo sobrepõe os produtos da imagem**: o texto + CTAs ficam centralizados (`max-w-3xl` + `justify-center`) bem em cima do bule, do pote de mel e da sacola "Cantim da Roça" — protagonistas visuais do hero.
2. **Quebra de linha forçada esquisita**: `<br className="hidden sm:block">` força "Sabores e cuidados" / "direto da roça para você" em duas linhas, o que em desktop deixa a linha 2 muito longa e desalinhada.
3. **`bg-center` em ultrawide** mantém os produtos à direita parcialmente cortados, e a parte esquerda (janela com luz) some sob o overlay escuro.
4. **`sm:justify-end`** ancora tudo no rodapé deixando metade da tela vazia em monitores 1080p.

## Correções

Editar **`src/components/landing/StaticImageHero.tsx`**:

### A. Layout split em desktop (`lg:` ≥ 1024px)
- Texto, CTAs e hint passam a alinhar à **esquerda** em `lg+`, deixando o lado direito livre para os produtos da foto respirarem.
- `items-center justify-center sm:justify-end` em mobile/tablet vira `lg:items-start lg:justify-center` em desktop.
- `max-w-3xl text-center` em mobile vira `lg:max-w-2xl lg:text-left`.
- Padding lateral aumenta no desktop: `lg:px-16 xl:px-24`.

### B. Background reposicionado em wide
- Mantém `bg-center` em ≤ md.
- Em `lg+` muda para `bg-[position:75%_center]` (xl: `80%_center`) — empurra a câmera para a direita, deixando a janela e o produto da direita melhor enquadrados, e abre a região esquerda como "área para o texto".

### C. Overlay direcional
- Em mobile permanece o gradiente vertical atual (`from-black/15 via-black/25 to-black/75`).
- Em `lg+` adiciona um gradiente **horizontal** (`lg:bg-gradient-to-r lg:from-black/70 lg:via-black/45 lg:to-transparent`) que escurece só o lado esquerdo onde o texto vive, mantendo os produtos à direita totalmente visíveis sem véu.

### D. Tipografia
- Remover o `<br className="hidden sm:block">` forçado — deixar o título quebrar naturalmente respeitando `max-w-2xl`.
- Reduzir um passo no desktop: `lg:text-6xl xl:text-7xl` (estava `lg:text-7xl`) para caber bem em duas linhas alinhadas à esquerda.

### E. Pequenos ajustes de espaçamento
- `pb-12 sm:pb-24 lg:pb-0` (sem ancorar no rodapé em desktop, o `justify-center` cuida).
- `mt-12 sm:mt-16 lg:mt-20` no hint "Role para descobrir", justificado à esquerda em desktop.

## Resultado esperado

| Breakpoint | Resultado |
|---|---|
| Mobile / tablet | Sem mudança visual — mesmo layout centralizado atual. |
| Desktop ≥1024 | Texto à esquerda com gradiente escurecendo só esse lado; produtos da direita 100% visíveis e protagonizando. |
| Ultrawide 1920+ | Foto reenquadrada (75–80%), produtos respirando, conteúdo numa coluna confortável à esquerda. |

## Fora do escopo
- Trocar a imagem do hero.
- Refatorar outras seções (BenefitsSection, ProductsSection etc).
- Adicionar variação de hero por dispositivo.
