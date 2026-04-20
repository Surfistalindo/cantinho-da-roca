

## Plano: Controle confiável de "último contato"

A base já existe (`last_contact_at` na tabela `leads`, atualização client-side ao registrar interação, exibição em listagem/cards/detalhe, filtro `Follow-up` binário, helper `isLeadStale`). Vou **reforçar** para ficar automático no banco, com indicador de 3 níveis e filtro mais granular — sem refazer o que já funciona.

### 1. Automação no banco (fonte da verdade)

Hoje o `last_contact_at` depende do client chamar `update` após inserir interação — se falhar, fica desincronizado. Migração SQL com **trigger automático**:

```sql
CREATE OR REPLACE FUNCTION public.sync_last_contact_from_interaction()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.lead_id IS NOT NULL THEN
    UPDATE public.leads
       SET last_contact_at = GREATEST(COALESCE(last_contact_at, NEW.interaction_date), NEW.interaction_date)
     WHERE id = NEW.lead_id;
  END IF;
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
       SET last_contact_at = GREATEST(COALESCE(last_contact_at, NEW.interaction_date), NEW.interaction_date)
     WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sync_last_contact
AFTER INSERT ON public.interactions
FOR EACH ROW EXECUTE FUNCTION public.sync_last_contact_from_interaction();
```

Resultado: qualquer interação registrada (agora ou no futuro, por qualquer caminho) atualiza `last_contact_at` automaticamente. Usa `GREATEST` para suportar interações retroativas sem regredir.

**Backfill** (insert tool): popular `last_contact_at` para leads/customers existentes a partir da última interação registrada — garante consistência histórica imediata.

Como bônus, **remover o update manual** em `InteractionTimeline.addInteraction` (linhas 84-86) — a trigger faz isso melhor.

### 2. Helper de recência com 3 níveis

Estender `src/lib/leadStatus.ts` (ou criar `src/lib/contactRecency.ts`) com:

```ts
export type ContactRecency = 'recent' | 'attention' | 'overdue' | 'never';

export function getContactRecency(lastContactAt: string | null, status: string):
  { level: ContactRecency; days: number | null; label: string; toneClass: string }
```

Regras (leads abertos apenas — fechados `won`/`lost` retornam `recent` neutro):
- **Recente** (verde): ≤ 2 dias desde último contato
- **Atenção** (amarelo): 3–6 dias
- **Atrasado** (vermelho): ≥ 7 dias *ou* nunca contatado e criado há ≥ 7 dias
- **Nunca**: `last_contact_at` nulo (exibe "ainda não contatado")

Mantém `isLeadStale` como compatibilidade (= `attention | overdue`), redirecionando para o novo helper.

### 3. Indicador visual (badge/pill) reutilizável

Criar `src/components/admin/ContactRecencyBadge.tsx` — pequeno pill com ponto colorido + label relativa ("há 3 dias") + tooltip data absoluta. 4 variantes:

| Nível | Cor token | Ícone |
|---|---|---|
| Recente | `success` | `faCircleCheck` |
| Atenção | `warning` | `faClock` |
| Atrasado | `destructive` | `faTriangleExclamation` |
| Nunca | `muted` | `faCircleQuestion` |

### 4. Aplicar nas 4 telas

- **Listagem (`LeadsPage`)** — coluna "Último contato" passa a usar `<ContactRecencyBadge />`. Mobile card idem.
- **Pipeline (`LeadCard`)** — substituir o texto atual de "última hora" por `<ContactRecencyBadge size="sm" />` discreto. A borda lateral colorida atual passa a refletir **recência** quando o lead estiver `attention`/`overdue` (override sobre a cor de status, igual ao comportamento atual com `stale`, mas com o vermelho novo para `overdue`).
- **Detalhe (`LeadDetailSheet`)** — adicionar bloco compacto logo abaixo do "Status atual": "Último contato: [badge] · [data absoluta]". Manter linha "Último contato" existente na grade.
- **Dashboard** — o card "Follow-ups" hoje conta `stale` (atenção+atrasado). Dividir visualmente em **dois indicadores**:
  - "Atenção" (3–6 dias sem contato)
  - "Atrasados" (7+ dias ou nunca contatado)
  
  Cada um vira atalho que abre `/admin/leads?recency=attention` ou `?recency=overdue`.

### 5. Filtro de recência na listagem

Trocar o botão binário "Follow-up" por um **select com 4 opções**:

- Todos
- Recentes (≤ 2 dias)
- Atenção (3–6 dias)
- Atrasados (7+ dias ou nunca)

Em `LeadsPage`, ler `?recency=` da URL para deep-link do dashboard. Manter `?followup=1` como alias retrocompatível mapeando para "atenção+atrasados".

### Arquivos tocados

- **Migration SQL** — função + trigger `trg_sync_last_contact` em `interactions`
- **Insert tool (backfill)** — popular `last_contact_at` em leads/customers a partir do MAX(`interaction_date`) por entidade
- **Criar:** `src/lib/contactRecency.ts` — helper `getContactRecency` + tipos
- **Criar:** `src/components/admin/ContactRecencyBadge.tsx` — pill visual reutilizável
- **Editar:** `src/services/followUpService.ts` — `isLeadStale` delega ao novo helper (compat)
- **Editar:** `src/components/admin/InteractionTimeline.tsx` — remover update manual de `last_contact_at` (trigger cuida)
- **Editar:** `src/components/admin/LeadFilters.tsx` — substituir botão Follow-up por select de recência
- **Editar:** `src/pages/admin/LeadsPage.tsx` — ler `?recency=`, aplicar filtro novo, usar `<ContactRecencyBadge />` na coluna e mobile card
- **Editar:** `src/components/pipeline/LeadCard.tsx` — usar badge + estilo de borda para `overdue`
- **Editar:** `src/components/admin/LeadDetailSheet.tsx` — bloco compacto de recência
- **Editar:** `src/pages/admin/DashboardPage.tsx` — split "Follow-ups" em "Atenção" + "Atrasados", links com `?recency=`

### Garantias

- **Automático no banco**: trigger garante sincronização independente do client.
- **Integrado com timeline**: cada interação alimenta o campo automaticamente.
- **Visível em todas as 4 superfícies**: listagem, pipeline, detalhe, dashboard, com mesma lógica e cores.
- **Acionável**: filtro granular + atalhos do dashboard direcionam direto para os leads que precisam de atenção.
- Zero breaking change nas tabelas (só adiciona trigger), zero fluxo paralelo (mesmo `last_contact_at`, mesmo helper).

