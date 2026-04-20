

## Plano: Pipeline Kanban Comercial

Vou trabalhar **em cima do kanban existente** (`PipelineBoard`, `PipelineColumn`, `LeadCard`) adicionando 1 coluna nova, enriquecendo os cards e melhorando integração — sem refazer.

### 1. Nova estrutura de colunas (5 status)

Atualizar `src/config/app.ts` para refletir o funil pedido. Mapeamento dos status atuais para os novos:

| Atual | Novo | Label |
|---|---|---|
| `new` | `new` | Novo lead |
| — (criar) | `contacting` | Em contato |
| `negotiating` | `negotiating` | Negociação |
| `sold` | `won` | Cliente |
| `no_response` | `lost` | Perdido |

**Migração de dados** (via insert tool, não schema): `UPDATE leads SET status='won' WHERE status='sold'` e `UPDATE leads SET status='lost' WHERE status='no_response'`. Default da coluna `status` continua `'new'` (já correto). Atualizar também:
- `LeadFilters.tsx`, `LeadStatusBadge`, `LeadStatusSelect` — automático, leem de `APP_CONFIG`.
- `DashboardPage.tsx` — trocar `'sold'`/`'no_response'` por `'won'`/`'lost'` nos `filter`.
- `LeadDetailSheet.convertToCustomer` — atualizar para `status: 'won'`.
- `isLeadStale` em `followUpService.ts` — excluir `'won'` e `'lost'` (em vez de `sold`/`no_response`).

Cores semânticas (já existem no design system): `new`→info, `contacting`→primary suave, `negotiating`→warning, `won`→success, `lost`→muted.

### 2. Cards mais informativos (`LeadCard.tsx`)

Os cards já mostram nome, telefone e origem. Adicionar de forma compacta e elegante (sem virar "sistema corporativo"):

- **Interesse** (`product_interest`) — linha discreta com ícone de tag, só se preenchido.
- **Último contato** — "há 2 dias" (relativo via `date-fns/formatDistanceToNow` pt-BR), com ícone de relógio. Usa `last_contact_at` ou cai para `created_at`.
- Manter a borda colorida lateral por status, o pulso/destaque de stale, e os botões WhatsApp/follow-up já existentes.

### 3. Botão "+ Novo lead" por coluna

No header de cada `PipelineColumn`, adicionar um botão ícone `+` discreto que abre o `NewLeadDialog` já existente, **pré-selecionando o status daquela coluna**. Requer:
- Adicionar prop `defaultStatus?: string` ao `NewLeadDialog` (override do estado inicial do select).
- `PipelineBoard` controla um único `NewLeadDialog` (estado `newLeadStatus`) para evitar 5 instâncias.

### 4. Confiabilidade do drag & drop (revisar, não refazer)

O fluxo atual já: aplica update otimista no `onDragOver`, persiste no `onDragEnd`, faz rollback via `fetchLeads` em erro, e usa realtime para sincronizar com a listagem de Leads. Ajustes pequenos:
- **Bug atual no rollback**: o realtime do próprio update pode "piscar". Manter como está — aceitável.
- Garantir que ao soltar em coluna vazia funciona (já funciona via `useDroppable` na coluna).
- Adicionar `aria-label` na coluna pra acessibilidade.

### 5. Integração CRM

Já está integrado via realtime (`useRealtimeTable('leads')` em Pipeline, Leads e Dashboard). Confirmar que mover card no pipeline atualiza listagem de Leads em tempo real (sim — mesma tabela, mesmo canal).

### Arquivos tocados

- `src/config/app.ts` — novos 5 status + cores
- `src/components/pipeline/LeadCard.tsx` — interesse + último contato relativo
- `src/components/pipeline/PipelineColumn.tsx` — botão "+ Novo lead"
- `src/components/pipeline/PipelineBoard.tsx` — controlar NewLeadDialog com status default
- `src/components/admin/NewLeadDialog.tsx` — aceitar `defaultStatus`
- `src/services/followUpService.ts` — atualizar filtros de status
- `src/pages/admin/DashboardPage.tsx` — trocar nomes de status nos `.filter`
- `src/components/admin/LeadDetailSheet.tsx` — `convertToCustomer` usa `won`
- **Migração de dados** (insert tool, não schema): renomear `sold`→`won`, `no_response`→`lost` nos registros existentes

### Visual

Estilo orgânico preservado: bordas suaves (`rounded-xl`), tokens semânticos da paleta, hover discreto, sem sombras pesadas. Nenhuma alteração no `tailwind.config` ou `index.css`.

