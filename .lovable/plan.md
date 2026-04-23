

## Auditoria dos objetivos de Inteligência Comercial + plano de fechamento

### O que JÁ existe hoje (✅ ok)

| Objetivo | Estado | Onde |
|---|---|---|
| Filtros por status | ✅ | `LeadFilters.tsx` (Select status) |
| Filtros por origem | ✅ | `LeadFilters.tsx` (Select origem) |
| Filtros por tempo sem contato | ✅ | `LeadFilters.tsx` (recência: recente / atenção / atrasado) |
| Lógica de recência centralizada | ✅ | `src/lib/contactRecency.ts` (≤2d, 3–6d, ≥7d) |
| "Precisam de atenção" no Painel | ✅ parcial | `DashboardPage.tsx` mostra 5 leads atrasados |
| Templates de reengajamento | ✅ | `whatsappTemplates.ts` (`reengagement` auto-selecionado p/ overdue) |
| Base de clientes convertidos | ✅ parcial | `/admin/clients` lista clientes, mas sem segmentação |
| Score / IA / Assistente | ✅ | módulo IA já implementado |

### O que FALTA para fechar os 5 objetivos

| Falta | Por que importa |
|---|---|
| **Visão dedicada "Leads sem resposta"** | Hoje o usuário precisa filtrar manualmente. Não há atalho nem KPI separado de "sem resposta" vs "atrasado genérico". |
| **Filtro de tempo sem contato em Clientes** | `/admin/clients` não tem nenhum filtro de recência — impossível ver clientes "frios" para reativar. |
| **Visão de clientes para reativação** | Sem coluna/badge de "última compra há X meses" nem filtro "comprou há 90+ dias". |
| **Lógica formal de reengajamento** | Templates existem, mas não há **fila de ação** ("hoje preciso reengajar X leads + Y clientes") nem registro de tentativa de reengajamento. |
| **Preparação da base para reativação de clientes** | Faltam: (a) campo/derivação `days_since_purchase`, (b) template WhatsApp específico de reativação de cliente, (c) marcação de "cliente inativo". |

---

### Plano de implementação (4 entregas pequenas)

#### 1. Visão "Leads sem resposta" (atalho + KPI)
- Novo card no `DashboardPage`: **"Sem resposta"** (status `contacting`/`negotiating` + sem contato há ≥7d) → linka para `/admin/leads?recency=overdue&status=contacting`.
- Adicionar preset rápido em `LeadFilters` (chip "Sem resposta") que aplica recência=overdue + status≠new/won/lost.
- Sem schema novo: usa colunas e helpers existentes.

#### 2. Página `/admin/clients` com filtros e segmentação
- Estender `ClientsPage` com:
  - Filtro **Recência de contato** (recente / atenção / inativo ≥30d / inativo ≥90d).
  - Filtro **Tempo desde compra** (≤30d / 31–90d / 91–180d / 180+d).
  - Coluna nova: badge "Última compra há X" + badge de recência (reusa `ContactRecencyBadge`).
  - Coluna **Status do cliente**: ativo / em atenção / inativo (derivado de `last_contact_at` + `purchase_date`).
- Helper novo `src/lib/customerLifecycle.ts` espelhando `contactRecency` mas focado em ciclo pós-venda.

#### 3. Lógica de reengajamento estruturada
- Novo helper `src/lib/reengagement.ts`:
  - `getReengagementCandidates(leads, customers)` → retorna lista priorizada (leads atrasados ≥7d + clientes inativos ≥60d).
  - Tier de urgência: crítico (≥30d lead / ≥120d cliente), alto, médio.
- Novo bloco no Painel: **"Fila de reengajamento de hoje"** — top 8 entradas (mistas: leads + clientes), com botão WhatsApp inline usando template apropriado.
- Adicionar template novo em `whatsappTemplates.ts`: `customer_reactivation` (para clientes inativos, mensagem distinta de `reengagement` que é para lead frio).

#### 4. Painel de reativação de clientes (`/admin/clients?view=reactivation`)
- Aba/preset que aplica filtro **inativos 90+d com telefone**, ordenado por dias desde compra (decrescente).
- KPI no topo da página de clientes: **% ativos / em atenção / inativos**.
- Botão "Reativar" inline → abre WhatsApp com template `customer_reactivation` e registra interaction tipo "reativação".

---

### Detalhes técnicos

- **Sem migrations** — toda derivação é client-side a partir de `last_contact_at`, `purchase_date`, `status`.
- **Sem mexer** em `leadService`, `clientService`, schema, RLS, auth, landing, módulo IA.
- Reuso máximo: `ContactRecencyBadge`, `WhatsAppQuickAction`, `useInteractionCounts`, `useRealtimeTable`.
- Novos arquivos: `src/lib/customerLifecycle.ts`, `src/lib/reengagement.ts`, `src/components/admin/CustomerLifecycleBadge.tsx`, `src/components/admin/ReengagementQueue.tsx`, `src/components/admin/ClientFilters.tsx`.
- Modificados: `ClientsPage.tsx`, `DashboardPage.tsx`, `whatsappTemplates.ts`, `LeadFilters.tsx` (chip preset).

### Resultado esperado

Sistema deixa de ser passivo (lista filtrada) e vira **ativo** (fila diária priorizada de quem precisa de mensagem hoje), cobrindo simétricamente leads sem resposta E clientes para reativar — fechando os 5 objetivos.

