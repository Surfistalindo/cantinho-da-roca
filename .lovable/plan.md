

## Plano: Aprimorar dashboard com leads recentes e leads que precisam atenção

O dashboard atual já cobre quase tudo do pedido (total, novos, em contato, negociação, clientes, perdidos, atenção, atrasados, conversão, distribuição por status, atalhos rápidos, dados em tempo real). **A única lacuna real é "destacar leads mais recentes"** — hoje só há contagem, sem lista. Vou adicionar isso e fazer dois pequenos ajustes para tornar o painel mais acionável, mantendo o mesmo estilo visual orgânico.

### 1. Nova seção: "Leads recentes" (lista clicável)

Adicionar bloco entre "Distribuição por status" e "Atalhos rápidos":

```text
┌─ LEADS RECENTES ────────────────── Ver todos →┐
│ ● Maria Silva    WhatsApp · Café   há 2h  [▸] │
│ ● João Santos    Instagram · Mel   há 5h  [▸] │
│ ● Ana Costa      Site · Geleia     ontem  [▸] │
│ ● Pedro Lima     WhatsApp · Café   2 dias [▸] │
│ ● Lucia Rocha    Indicação · Mel   3 dias [▸] │
└───────────────────────────────────────────────┘
```

- Mostra os **5 leads mais recentes** (ordenados por `created_at` desc).
- Cada linha exibe: nome, origem · interesse, tempo relativo (`há 2h` via `formatDistanceToNow`), badge de status (`LeadStatusBadge`).
- Clicar na linha leva para `/admin/leads?focus=<id>` (ou simplesmente `/admin/leads` se preferirmos abrir o sheet exigir mais infra). **Decisão: linkar para `/admin/leads`** por simplicidade — usuário vê a listagem completa onde pode abrir o sheet.
- Empty state discreto: "Nenhum lead ainda. Compartilhe sua landing page!" quando não houver leads.
- Estilo coerente: `bg-card rounded-xl border border-border p-5 shadow-sm`, linhas com `hover:bg-muted/30 rounded-lg`.

Para isso, expandir o `select` do `fetchData` para incluir `name, origin, product_interest` nos leads (já busca `id, status, created_at, last_contact_at`).

### 2. Nova mini-seção: "Precisam de atenção agora" (top 3-5)

Junto com a contagem "Atenção" e "Atrasados" que já existem como KPI, adicionar uma **lista compacta dos leads mais críticos** (até 5 leads) ordenados por dias sem contato (descendente), apenas se houver algum.

Exibido em duas colunas no desktop com "Leads recentes":

```text
┌─ LEADS RECENTES ──────┐ ┌─ PRECISAM DE ATENÇÃO ─┐
│ ● Maria · há 2h       │ │ ⚠ João · 12 dias      │
│ ● João · há 5h        │ │ ⚠ Ana · 9 dias        │
│ ● Ana · ontem         │ │ ⏰ Pedro · 5 dias      │
│ ● Pedro · 2 dias      │ │ ⏰ Lucia · 4 dias      │
│ ● Lucia · 3 dias      │ │                       │
└────────────────────── ┘ └────────────────────── ┘
```

- Mostra `ContactRecencyBadge size="sm"` ao lado de cada nome.
- Apenas leads abertos (não fechados) com nível `attention` ou `overdue`.
- Clicar leva para `/admin/leads?recency=overdue` (ou attention).
- Se não houver nenhum: bloco discreto com "Tudo em dia ✓".

### 3. Card "Clientes" no KPI principal usar `customers` real

Hoje o card "Conversão" mostra `${stats.sold} clientes de ${stats.total}` mas usa `won` da tabela `leads`, ignorando `customerCount` (que já é buscado mas não usado). Manter `won` para a taxa de conversão (faz sentido: % do funil), e deixar essa informação clara no description: `${stats.sold} fechados · ${customerCount} no cadastro` — assim o usuário vê os dois números reais.

### 4. Mudanças mínimas no resto

- **Sem mudanças** nos 4 KPIs principais — já cobrem tudo do pedido.
- **Sem mudanças** na "Distribuição por status" — já tem todos os 5 status pedidos.
- **Sem mudanças** nos atalhos rápidos — já bem dimensionados.
- Manter `useRealtimeTable('leads')` — as duas novas listas atualizam sozinhas.

### Arquivo tocado

- **Editar:** `src/pages/admin/DashboardPage.tsx` — expandir `LeadLite` com `name/origin/product_interest`, adicionar grid de 2 colunas `Recentes + Atenção` antes dos atalhos, ajustar description do card "Conversão".

### Garantias

- Zero mudança de schema, zero novo componente, zero nova dependência.
- Mesmos dados reais do CRM via `supabase.from('leads')` em uma única query.
- Realtime já configurado propaga novos leads para a lista de "recentes" automaticamente.
- Estilo mantido: `rounded-xl border border-border bg-card`, tokens semânticos, sem sombras pesadas, tipografia consistente. Continua não parecendo dashboard genérico.

