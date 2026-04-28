## Scroll híbrido em todas as telas do CRM

Hoje o `<main>` do `CrmLayout` é o único elemento com scroll (`overflow-y-auto`), e o shell é `min-h-screen` com `overflow-x-hidden`. Isso faz a roda do mouse só rolar quando o cursor está sobre o `<main>` ou seus filhos sem `overflow` próprio. Quando você passa o mouse sobre uma `div` com scroll interno (tabela densa, painel lateral), os eventos de wheel são consumidos por aquela div em vez de propagar para o documento — e quando o mouse está em áreas "vazias" como navbar ou margens, nada rola.

A solução padrão é fazer o **documento inteiro ser o scroller** e fixar a sidebar/navbar via `sticky`. Assim a roda funciona em qualquer lugar da página, e divs internas com scroll próprio só "comem" o evento até o fim do conteúdo delas — quando esgotam, o scroll passa pro documento naturalmente (overscroll chaining nativo do navegador).

### Mudanças

**`src/components/crm/CrmLayout.tsx`**
- Remover `overflow-y-auto crm-smooth-scroll crm-scrollbar-thin` do `<main>`. Ele vira só `flex-1 min-w-0`.
- Envolver `<MondaySidebar />` num wrapper `sticky top-0 h-screen shrink-0 z-20` para que ela fique fixa enquanto a página rola.
- Manter o shell com `min-h-screen` + `overflow-x-hidden` (impede scroll horizontal acidental).
- Navbar já é `sticky top-0 z-30` no `AdminNavbar.tsx` — continua funcionando, agora fixa em relação ao documento.

**`src/index.css`** (ajuste pequeno)
- Garantir que `html, body` herdem `overflow-x: hidden` e que o scrollbar fino (`.crm-scrollbar-thin`) seja aplicado também ao `html` quando dentro de `.font-crm`. Isso preserva a estética do scrollbar Linear/Vercel já estabelecida na Fase 1, mas agora no documento inteiro.

### O que NÃO muda

- Tabelas e painéis com `overflow` próprio (ex.: scroller horizontal do Leads em modo "comfortable", LeadDetailSheet, listas internas) seguem rolando dentro de si — só o eixo Y "vaza" pro documento quando esgotado.
- Sidebar continua colapsável, com mesmo visual.
- Navbar sticky não muda visualmente.
- Tutorial overlay, command palette, dialogs — sem impacto.

### Por que assim

Fixar a sidebar via `sticky top-0 h-screen` em vez de `position: fixed` mantém o comportamento de flexbox (largura calculada pelo `<Sidebar>` colapsável do shadcn continua intacto) e evita "buracos" de layout. Já o documento como scroller dá o comportamento que o usuário espera de qualquer SaaS moderno (Linear, Notion, Monday): roda do mouse funciona em qualquer pixel da janela.

### Arquivos da mudança

- `src/components/crm/CrmLayout.tsx` — wrapper sticky na sidebar, remover overflow do main
- `src/index.css` — scrollbar fino aplicado ao documento dentro de rotas CRM
