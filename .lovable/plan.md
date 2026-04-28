## Objetivo

Modernizar o Dashboard com (1) Activity Feed **utilizável** (cada item leva ao lead/cliente correspondente, mostra nome do contato, evita preview de templates gigantes) e (2) novos dashboards **interativos, responsivos e atuais** organizados em abas — sem sobrecarregar a tela inicial.

---

## 1. Activity Feed — torná-lo utilizável

Problemas atuais (visíveis no print):
- Mostra só a descrição crua (template gigante "[Template: Primeiro contato] Olá Chef!...") sem identificar o lead.
- Não é clicável.
- Repete o mesmo template várias vezes sem diferenciação visual.

Correções:
- Resolver `lead_id`/`customer_id` → exibir **nome do contato** em destaque + ação ("Mensagem para **Chef**").
- Resumir templates: detectar prefixo `[Template: X]` e mostrar como chip "Template · Primeiro contato" + 1 linha do corpo.
- Cada item vira `<Link>` para `/admin/leads?focus={id}` ou `/admin/clients?focus={id}`.
- Hover state, ícone tonal por tipo (whatsapp=verde, ligação=azul, etc).
- Filtro rápido no topo: Todos · WhatsApp · Ligações · Notas.
- "Ver tudo" → leva à página de telemetria/interações.

---

## 2. Reorganizar em abas (não empilhar tudo)

Substituir a longa rolagem por `Tabs` no topo do dashboard:

```text
[ Visão geral ] [ Funil & Velocidade ] [ Canais & Origem ] [ Atividade & Retenção ]
```

- **Visão geral** (atual, enxuta): KPIs + Tendência + Priority Leads + Próximos contatos.
- **Funil & Velocidade** (novo): donut do funil + novo gráfico de velocidade.
- **Canais & Origem** (novo): OriginBars + novo gráfico de performance por canal.
- **Atividade & Retenção** (novo): Activity Feed melhorado + heatmap + cohort.

Filtros e período permanecem sticky no topo, válidos para todas as abas.

---

## 3. Novos dashboards (4)

### A. Heatmap de Atividade (Activity Heatmap)
- Grid 7 dias × 24 horas mostrando volume de interações.
- Cores em escala HSL com `--primary`.
- Hover: tooltip com "Quarta 14h · 8 interações".
- Útil para descobrir melhor horário de contato.
- Fonte: `interactions.interaction_date`.

### B. Velocidade do Funil (Funnel Velocity)
- Barras horizontais com **tempo médio** que um lead passa em cada estágio (novo → em contato → negociação → ganho).
- Comparação com período anterior (delta em verde/vermelho).
- Identifica gargalos.
- Fonte: histórico de `leads.status` + `created_at` + `last_contact_at` (aproximação a partir de interações).

### C. Performance por Canal de WhatsApp
- Cards interativos por origem com 4 mini-métricas: enviados / respondidos / convertidos / taxa.
- Mini-sparkline em cada card.
- Click → filtra o resto do dashboard por essa origem.
- Fonte: `whatsapp_messages` cruzado com `leads.origin` e `leads.status`.

### D. Cohort de Retenção / Conversão
- Tabela cohort: linhas = semana de entrada do lead, colunas = semanas até conversão (W0, W1, W2, W3+).
- Células coloridas por taxa de conversão acumulada.
- Mostra quanto tempo leva para fechar e onde leads "morrem".
- Fonte: `leads.created_at` + `customers.purchase_date`.

Todos com:
- SVG nativo (sem libs novas) seguindo o padrão de `TrendArea`/`FunnelDonut`.
- Tooltip on hover, animação `fade-in-up` ao montar.
- Skeleton enquanto carrega.
- Responsivo: scroll horizontal em telas estreitas para tabela cohort/heatmap.

---

## 4. Responsividade

- Tabs viram `Select` em `< sm`.
- Heatmap: scroll horizontal em mobile, célula mínima 18px.
- Cards de canal: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- Cohort: scroll horizontal com cabeçalho sticky.
- Tooltips usam `Popover` em touch (long-press).

---

## Detalhes técnicos

**Arquivos novos:**
- `src/components/admin/dashboard/ActivityHeatmap.tsx`
- `src/components/admin/dashboard/FunnelVelocity.tsx`
- `src/components/admin/dashboard/ChannelPerformance.tsx`
- `src/components/admin/dashboard/RetentionCohort.tsx`
- `src/components/admin/dashboard/ActivityFeed.tsx` (extraído + melhorado, com resolução de leads/customers)
- `src/lib/dashboardAnalytics.ts` (helpers puros: buildHeatmap, buildVelocity, buildChannels, buildCohort)

**Arquivos editados:**
- `src/pages/admin/DashboardPage.tsx`: introduzir `<Tabs>` (`@/components/ui/tabs` já existe), distribuir blocos atuais e novos pelas 4 abas, ampliar fetch para `whatsapp_messages` (limit ~500) e mais `interactions` (~500) usados pelos analytics.
- Persistir aba ativa em `?tab=` na URL (mesmo padrão dos filtros).

**Performance:**
- Computações em `useMemo` por aba.
- Paginar Activity Feed (20 + "carregar mais").

**Sem libs novas** — tudo com SVG + Tailwind, mantendo a direção visual Monday-clean já estabelecida (sem gradientes purple, sem glassmorphism).

---

## Fora do escopo
- Exportar PDF dos dashboards.
- Criação de dashboards customizáveis pelo usuário.
- Real-time push de novas interações no heatmap (já cobre via `useRealtimeTable`).
