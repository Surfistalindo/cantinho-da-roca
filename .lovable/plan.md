

## Plano: Aplicar Josefin Sans em todo o CRM

Trocar a fonte do CRM (rotas `/admin/*`) para **Josefin Sans**, mantendo a landing page com as fontes atuais (Satisfy + DM Sans + Oswald) intactas.

### 1. Importar a fonte

Em `src/index.css`, adicionar `Josefin Sans` (pesos 300/400/500/600/700) ao `@import` do Google Fonts já existente.

### 2. Registrar token Tailwind

Em `tailwind.config.ts`, adicionar à `fontFamily`:
```ts
'crm': ['"Josefin Sans"', 'sans-serif']
```

### 3. Aplicar no layout do CRM

Em `src/components/crm/CrmLayout.tsx`, aplicar a classe `font-crm` no wrapper raiz para que toda a árvore (sidebar, navbar, páginas, sheets, dialogs renderizados dentro) herde Josefin Sans:

```tsx
<div className="min-h-screen flex w-full bg-muted font-crm">
```

Como headings (`h2`–`h6`) hoje recebem `Oswald` via regra global em `src/index.css`, adicionar override no mesmo layer para que dentro do CRM os headings também usem Josefin Sans:

```css
.font-crm h1,
.font-crm h2,
.font-crm h3,
.font-crm h4,
.font-crm h5,
.font-crm h6 {
  font-family: 'Josefin Sans', sans-serif;
}
```

### Escopo

- **Afetado:** tudo sob `/admin/*` (Dashboard, Leads, Pipeline, Clients, sheets, dialogs, sidebar, navbar).
- **Não afetado:** landing page (`/`), tela de login `/admin/login` (continua com a identidade Satisfy/Cantinho), toasts globais e componentes fora do `CrmLayout`.

### Arquivos tocados

- `src/index.css` — import da fonte + override de headings dentro de `.font-crm`.
- `tailwind.config.ts` — token `font-crm`.
- `src/components/crm/CrmLayout.tsx` — classe `font-crm` no wrapper.

