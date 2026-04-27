
## Dashboard Premium: visual 3D, gráficos ricos e filtros avançados

Hoje o `DashboardPage` é funcional mas plano: KPIs com sparklines minúsculas, listas chapadas e zero filtragem. Vou elevar para um visual premium ao estilo Linear/Attio/Vercel — com **profundidade tonal real**, **gráficos modernos** (donut, barras empilhadas, área com gradiente), **microinterações 3D** (tilt sutil, glow, glassmorphism) e uma **barra de filtros** robusta no topo da página.

### 1. Barra de filtros global (novo componente)

Topo do dashboard, sticky abaixo do header, com os seguintes controles:

- **Período** (segmented control): `Hoje · 7d · 30d · 90d · Tudo` + opção "Personalizado" abrindo `react-day-picker` em popover.
- **Status** (multi-select com chips): Novo, Em contato, Negociação, Cliente, Perdido. Aplica a todos KPIs/gráficos.
- **Origem** (select dinâmico): valores únicos derivados de `leads.origin` + opção "Todas".
- **Vendedor/Responsável** (se houver, baseado em `notes`/futuro campo) — por ora ocultar se não houver dado.
- **Score**: chips `Quente · Morno · Frio · Urgente`.
- **Busca rápida**: input com ícone search filtra leads por nome/telefone.
- **Botão "Limpar filtros"** + indicador de quantos filtros ativos.
- **Botão "Exportar"** (CSV do snapshot atual via `reportExporter.ts`).

Estado dos filtros vive no `DashboardPage` via `useState`, persistido em `searchParams` para deep-link/refresh.

Componente novo: `src/components/admin/dashboard/DashboardFilters.tsx`.

### 2. KPIs com profundidade 3D

Substituir os cards atuais por cards "elevated" com:

- **Gradient mesh sutil** no fundo (radial-gradient com cor do tone do KPI a 6% opacidade) usando pseudoelemento `::before`.
- **Borda dupla**: borda externa fina + borda interna `inset` brilhante (1px `bg-white/[0.04]` no topo) — efeito de bisel sutil.
- **Sombra ambiente** com 2 camadas: `shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]`.
- **Hover tilt 3D**: usar o `useMouseTilt` hook que já existe (`src/hooks/useMouseTilt.ts`) para inclinação leve (max 4°) seguindo o cursor.
- **Sparkline maior** (h-12) com **gradiente preenchido** abaixo da linha (área), não só linha.
- **Badge de variação** com ícone trending + porcentagem grande, tom semântico.

KPIs (todos respeitam filtros):
1. **Total de Leads** (info) — total no período + delta vs período anterior + sparkline diária.
2. **Em andamento** (warning) — leads em contacting/negotiating + sub: "X em negociação".
3. **Conversão** (success/destructive) — taxa win/total + meta visível com mini progress radial.
4. **Sem resposta** (destructive) — leads em overdue + atalho "Reengajar".

Componente novo: `src/components/admin/dashboard/KpiCard.tsx`.

### 3. Gráficos modernos (3 novos)

**a) Funil de conversão (donut + legenda)** — `FunnelDonut.tsx`
- SVG donut com 5 segmentos (status), espaçamento entre segmentos (`stroke-dasharray` com gap), gradient stops por segmento, glow no hover.
- Centro mostra total + label "leads no período".
- Legenda lateral com porcentagem e contagem.

**b) Tendência (area chart com gradient)** — `TrendArea.tsx`
- SVG path `<path>` com `fill="url(#grad)"` (linearGradient vertical: cor → transparente).
- Linha principal 2px + pontos nos picos.
- Eixo X com labels de dias/semanas conforme período do filtro.
- Tooltip flutuante ao passar o mouse mostrando dia + valor.
- 2 séries: leads criados vs ganhos (linhas de cores diferentes).

**c) Origem dos leads (barras horizontais empilhadas)** — `OriginBars.tsx`
- Para cada origem: barra horizontal segmentada por status (novo/contato/negoc./cliente/perdido).
- Largura proporcional ao volume; segmentos com gradient sutil.
- Hover destaca o segmento e mostra valor absoluto.

Todos usam **SVG puro** (sem libs novas), respeitam tokens de cor `hsl(var(--primary))` etc., e têm estado vazio amigável.

### 4. Layout do dashboard reorganizado

```
[ Header: título + ações ]
[ DashboardFilters (sticky) ]
[ Row 1: 4 KPI cards (3D)                              ]
[ Row 2: TrendArea (col-span-2) | FunnelDonut          ]
[ Row 3: OriginBars (col-span-2) | AI Suggestion+Distrib ]
[ Row 4: Priority Leads (col-span-2) | Próximos contatos ]
[ Row 5: Activity Feed (col-span-2) | Reengagement      ]
```

Container até `1480px`, `gap-5`, animação `animate-fade-in-up` em cascata leve nos cards (delay incremental de 40ms).

### 5. Microinterações e profundidade

- **Glassmorphism opcional** no card de AI Suggestion: `backdrop-blur` + borda gradiente animada (`@keyframes` shimmer já no projeto ou novo).
- **Ring de progresso** circular para a meta de conversão (SVG `circle` com `stroke-dasharray` animado).
- **Hover lift** padrão em todos os cards: `transition-transform`, `hover:-translate-y-0.5`, sombra mais profunda.
- **Skeleton shimmer** já existente no `LoadingState` — manter, mas com cards de mesma altura para evitar layout shift.

### 6. Aplicação de filtros

Helper puro `applyDashboardFilters(leads, customers, interactions, filters)` em `src/lib/dashboardFilters.ts` que devolve as listas filtradas. Todos os `useMemo` do dashboard passam a usar essas listas filtradas. Período afeta sparklines/trend (granularidade ajustada: hoje=hora, 7d=dia, 30d=dia, 90d=semana).

### Arquivos criados

- `src/components/admin/dashboard/DashboardFilters.tsx` — barra de filtros sticky
- `src/components/admin/dashboard/KpiCard.tsx` — card 3D com tilt + área sparkline
- `src/components/admin/dashboard/FunnelDonut.tsx` — donut SVG do funil
- `src/components/admin/dashboard/TrendArea.tsx` — area chart com gradient e tooltip
- `src/components/admin/dashboard/OriginBars.tsx` — barras horizontais empilhadas
- `src/components/admin/dashboard/MetaRing.tsx` — ring radial de progresso
- `src/lib/dashboardFilters.ts` — helpers puros de filtragem

### Arquivos modificados

- `src/pages/admin/DashboardPage.tsx` — orquestração com filtros + nova grid + uso dos componentes novos
- `src/index.css` — adicionar utilitários `.card-3d`, `.bevel-top`, gradient mesh helpers (poucas linhas) e keyframes de shimmer/glow se faltarem

### Sem mudanças

- Schema, RLS, hooks de dados, módulos IA, landing page, pipeline, leads, customers (nenhuma quebra fora do dashboard).

### Validação

1. Filtros: alterar período/status/origem reflete imediatamente em **todos** os blocos (KPIs, donut, área, barras, listas).
2. Tilt 3D funciona em desktop, desativa em touch (`prefers-reduced-motion` respeitado).
3. Donut/área renderizam corretamente com 0 dados (estado vazio claro).
4. Conversão mostra ring de progresso até a meta (18%).
5. Deep-link `?period=30d&status=new,contacting` restaura estado.
6. Layout em 982px (viewport atual): cards reagrupam para 2 colunas; filtros viram drawer/scroll horizontal sem quebrar.
7. Performance: nenhum re-render desnecessário; SVG puro, sem libs novas instaladas.

### Resultado esperado

Dashboard com presença visual de produto sério (Linear/Attio level): cards com profundidade real, gráficos ricos contando a história do funil, e uma barra de filtros que torna tudo navegável por período, status, origem e busca — tudo respeitando o design system "Premium CRM" já configurado e os dados reais do Supabase em tempo real.
