

## Plano: Inteligência Comercial — Lead Score com priorização automática

Adicionar uma camada de **scoring** que classifica leads em **🔥 Quente · 🌤 Morno · ❄ Frio**, exibida em todo o CRM e usável para ordenação. **100% client-side e calculado em tempo real** — zero migração de banco, zero quebra de contratos.

---

### 1. Núcleo: `src/lib/leadScore.ts` (novo)

Função pura que recebe um lead + contagem de interações e devolve:

```ts
interface LeadScoreInfo {
  score: number;           // 0–100
  level: 'hot' | 'warm' | 'cold' | 'closed';
  label: string;           // "Quente" | "Morno" | "Frio" | "Encerrado"
  reasons: string[];       // ["Em negociação", "5 dias sem contato", ...]
  toneClass: string;       // tokens semânticos (success/warning/destructive)
  dotClass: string;        // bg-success / bg-warning / bg-destructive
}

getLeadScore(lead, opts?: { interactionCount?: number }): LeadScoreInfo
```

**Fórmula (soma ponderada, 0–100):**

| Fator | Peso | Lógica |
|---|---|---|
| **Status** | até 35 | `negotiating`=35 · `contacting`=22 · `new`=15 · `won`/`lost`=neutro (level=`closed`) |
| **Recência (sem contato)** | até 25 | 0d=0 · 3–6d=15 · 7–13d=22 · ≥14d=25 (urgência crescente) |
| **Interações** | até 20 | clamp(count×5, 0, 20) — engajamento histórico |
| **Origem** | até 10 | Indicação=10 · WhatsApp=8 · Site=6 · Instagram=5 · Outro=3 |
| **Próximo contato agendado** | até 10 | atrasado=10 · hoje=8 · ≤3d=5 · futuro=2 · sem agenda=0 |

Classificação:
- **score ≥ 65** → `hot` (verde→urgente: vermelho se overdue ≥7d)
- **35–64** → `warm` (amarelo)
- **< 35** → `cold` (cinza/azul claro)
- status fechado → `closed` (neutro, fora da priorização)

**Override de cor semântica conforme regra do usuário:**
- `verde` → ativo recente (hot + recência boa)
- `amarelo` → atenção (warm OU hot com 3–6d sem contato)
- `vermelho` → urgente (hot com ≥7d sem contato OU next_contact_at atrasado)

Função auxiliar `compareByScore(a, b)` para ordenação desc.

### 2. Componente visual: `src/components/admin/LeadScoreBadge.tsx` (novo)

Badge compacto com 3 tamanhos (`sm` / `md` / `lg`):

```
[🔥 Quente · 87]   ← level=hot, urgente=vermelho
[● Morno · 52]
[● Frio · 18]
```

- Ícone: `faFire` (hot urgente), `faBolt` (hot ativo), `faCircleHalfStroke` (warm), `faSnowflake` (cold).
- Tooltip on-hover lista os `reasons` ("Em negociação · 8 dias sem contato · 4 interações").
- Variante `dot` (somente bolinha colorida) para uso em cards densos.

### 3. Hook de contagem: `src/hooks/useInteractionCounts.ts` (novo)

Como `interactions` não tem contagem agregada, fazemos **uma única query** por página:

```ts
useInteractionCounts(leadIds: string[]) → Record<string, number>
```

Internamente: `supabase.from('interactions').select('lead_id').in('lead_id', leadIds)` e agrupa client-side. Refetch via `useRealtimeTable('interactions', ...)`. Cache local por sessão.

### 4. Integração nas páginas

**`LeadCard.tsx` (Pipeline)**
- Adicionar `LeadScoreBadge size="sm"` no topo do card (acima do nome).
- Cards `hot+overdue` ganham anel sutil `ring-1 ring-destructive/40` + leve glow.
- Lateral colorida (`before:`) passa a refletir o **level do score** (não mais só recência) — mantém a hierarquia visual já existente.

**`PipelineColumn.tsx`**
- Ordenar leads da coluna por score desc (mais quentes no topo).
- Header da coluna mostra contador de hot leads: `Em contato · 12 · 🔥 3`.

**`LeadsPage.tsx` (Tabela)**
- Nova coluna **Prioridade** (entre Status e Recência) com `LeadScoreBadge size="sm"`.
- Header da coluna é clicável: alterna ordenação entre **Score desc** (padrão novo) e **Entrada**.
- Linha de lead `hot urgente` ganha barra lateral vermelha (`border-l-2 border-destructive`).
- Card mobile mostra o badge acima do nome.

**`LeadDetailSheet.tsx`**
- No header, ao lado do `LeadStatusBadge`, exibir `LeadScoreBadge size="lg"`.
- Bloco novo "Por que essa prioridade" listando os `reasons` em bullets.

**`DashboardPage.tsx`**
- Novo card **"Top 5 leads quentes"** (substitui ou complementa "Leads recentes"): lista ordenada por score desc, filtrando `level === 'hot'`, com avatar + nome + badge + botão WhatsApp inline.
- KPI extra: contagem de leads quentes.

**`LeadFilters.tsx`**
- Novo select **Prioridade**: Todos · 🔥 Quentes · 🌤 Mornos · ❄ Frios. Aplica filtro por `level`.

### 5. Ordenação automática

- **Pipeline:** ordem padrão = score desc dentro de cada coluna.
- **LeadsPage:** ordem padrão muda para score desc; toggle no header restaura "Entrada".
- Estado `sortBy: 'score' | 'created'` persistido em `?sort=` na URL.

### 6. UX e cores semânticas

| Level | Tokens | Uso |
|---|---|---|
| hot (ativo) | `success` / `bg-success-soft` | verde — engajamento bom |
| warm | `warning` / `bg-warning-soft` | amarelo — atenção |
| hot (overdue) ou next_contact atrasado | `destructive` / `bg-destructive/10` | vermelho — urgente |
| cold | `muted-foreground` | cinza — baixa prioridade |
| closed | `muted` neutro | fora do funil |

Microinterações: badge `hot urgente` com pulso suave (`animate-pulse` no dot, 2s). Transições já globais (`duration-150`).

---

### Arquivos tocados

**Novos**
- `src/lib/leadScore.ts`
- `src/components/admin/LeadScoreBadge.tsx`
- `src/hooks/useInteractionCounts.ts`

**Modificados (apenas markup/lógica de ordenação)**
- `src/components/pipeline/LeadCard.tsx`
- `src/components/pipeline/PipelineColumn.tsx`
- `src/components/pipeline/PipelineBoard.tsx` (passar interactionCounts via prop)
- `src/components/admin/LeadDetailSheet.tsx`
- `src/components/admin/LeadFilters.tsx`
- `src/pages/admin/LeadsPage.tsx`
- `src/pages/admin/PipelinePage.tsx`
- `src/pages/admin/DashboardPage.tsx`

**Não tocados:** rotas, AuthContext, ProtectedRoute, services, schema do banco, RLS, migrations, types Supabase, landing page, login.

### Garantias

- **Sem migração de banco** — score é derivado em runtime a partir dos campos já existentes (`status`, `last_contact_at`, `created_at`, `next_contact_at`, `origin`) + count agregado de `interactions`.
- Mesmas props públicas em todos os componentes existentes (apenas adições opcionais).
- Realtime continua funcionando — score recalcula automaticamente a cada refetch.
- Função `getLeadScore` é pura e testável.
- Respeita o design system (Josefin Sans + tokens HSL + sombras já criadas).

