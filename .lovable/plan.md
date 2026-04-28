
# Padronização tipográfica do CRM — uma única família, estilo Monday

Hoje o CRM mistura **Fraunces (serif display)** + **Geist (sans body)** + JetBrains Mono. O resultado é inconsistente com a estética Monday/Linear/ClickUp, que usam **uma única família sans** para tudo, variando apenas o peso para criar hierarquia.

A landing page `Cantinho da Roça` (Satisfy + DM Sans + Caveat — direção warm farmstand) **fica intocada**. A mudança é exclusiva do escopo `.font-crm`.

## Decisão de tipografia

| Papel | Fonte | Pesos |
|---|---|---|
| Toda a UI do CRM (display, body, labels, botões, inputs, tabelas) | **Inter** | 400, 500, 600, 700, 800 |
| Números, telefones, IDs, percentuais, datas curtas | **JetBrains Mono** | 400, 500, 600 |
| Manuscrito (uso restrito a microelementos opcionais) | **Caveat** | mantida disponível |

Por que Inter:
- É **a fonte do Linear, Vercel, Notion, GitHub e a referência industrial de produtos B2B densos**.
- Hinting impecável em telas pequenas, ótima legibilidade em 11–14px (a faixa real de uso do CRM).
- Variable font: 1 arquivo cobre todos os pesos → carrega rápido.
- 100% gratuita, hospedada no Google Fonts, sem licenciamento.

Não usar uma 2ª família para títulos: o padrão Monday é **mesma família, peso 600/700 + tracking apertado**. Isso é o que faz o app parecer profissional e coeso.

## Mudanças concretas

### 1. `src/index.css` — imports e tokens
- Remover import de `Fraunces` e `Geist`.
- Adicionar import único: `Inter` (400–800) + `JetBrains Mono` (400–600) + `Caveat` (mantida).
- Atualizar tokens dentro do `:root`:
  ```css
  --font-crm-display: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-crm-body:    'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-crm-label:   'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-crm-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  ```
- Hierarquia continua nas regras já existentes (`.font-crm h1/h2/h3 …`), apenas a família muda. Pesos e tamanhos atuais ficam (600 display / 500 label / 400 body).
- Adicionar `font-feature-settings: "cv11", "ss01", "ss03"` no `.font-crm` para ativar o set estilístico do Inter (números tabulares, “a” simplificado, “l” com cauda) — é o detalhe que diferencia visualmente Linear/Vercel.
- Adicionar `font-variant-numeric: tabular-nums` em tabelas e badges numéricos.

### 2. `tailwind.config.ts` — alinhar `fontFamily`
```ts
crm:           ['"Inter"', 'system-ui', 'sans-serif'],
'crm-display': ['"Inter"', 'system-ui', 'sans-serif'],
'crm-body':    ['"Inter"', 'system-ui', 'sans-serif'],
'crm-label':   ['"Inter"', 'system-ui', 'sans-serif'],
'crm-mono':    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
```
As classes `font-heading`/`font-body`/`font-sans`/`font-serif` (usadas pela landing) **não são alteradas**.

### 3. Componentes — sem trabalho manual
Os componentes já consomem os tokens via `.font-crm` herdado de `CrmLayout`. Trocando o token, **toda a UI do CRM atualiza automaticamente**. Os usos pontuais de `font-mono` em telefones/IDs continuam corretos (apontam para JetBrains Mono).

### 4. Atualização do memory
Atualizar `mem://design/warm-farmstand` (se mencionar Recoleta/General Sans no escopo CRM) e o índice Core para refletir: **CRM = Inter unificada; Landing = Recoleta+General Sans+Caveat (warm farmstand intocada)**.

## O que NÃO muda

- Landing page (`/`, hero, footer, formulário) — continua warm farmstand.
- Tamanhos, line-heights, espaçamentos e cores do CRM.
- Componentes Monday existentes (board-panel, group-section, sidebar).
- Identidade da marca / wordmark.

## Resultado esperado

CRM com tipografia única, profissional, calma e densa — exatamente o efeito Monday/Linear: hierarquia por **peso e tamanho**, não por troca de família. Carrega menos peso (uma família a menos) e fica visualmente mais consistente em todas as telas (Leads, Clientes, Pipeline, IA, WhatsApp, Tasks, Configurações).

## Arquivos editados

- `src/index.css` — imports + tokens `--font-crm-*` + feature settings
- `tailwind.config.ts` — `fontFamily.crm*`
- `mem://index.md` e `mem://design/warm-farmstand` — registrar a decisão
