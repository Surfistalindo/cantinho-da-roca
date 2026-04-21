

## Plano: Revisão final do CRM — ajustes pontuais para gestão comercial

Após revisar toda a área administrativa, **a maior parte da operação já funciona como sistema integrado** (formulário público → leads → pipeline → clientes, com timeline, recência automática, dashboard em tempo real). A revisão identificou **6 pontos de polimento** focados em consistência, robustez e usabilidade real — sem refazer o que já funciona.

### Diagnóstico — o que já está OK

| Área | Status |
|---|---|
| Formulário público → tabela `leads` | OK (com rate-limit, validação, deduplicação por telefone) |
| Cadastro manual (`NewLeadDialog`) | OK (validação Zod, mesma tabela) |
| Listagem com filtros (status, origem, recência, busca) | OK |
| Pipeline drag-and-drop sincronizado com banco | OK |
| Status padronizados (`APP_CONFIG.leadStatuses`) | OK (5 status, fonte única) |
| Timeline de interações + autor via `profiles` | OK |
| `last_contact_at` automático via trigger | OK |
| Dashboard com dados reais + realtime | OK |
| Conversão lead → cliente | OK (mas perde histórico — ver #4) |

### O que ajustar

#### 1. Origens normalizadas (formulário público vs CRM)

**Inconsistência:** o formulário público grava origem em **lowercase** (`whatsapp`, `instagram`, `indicacao`, `outro`, `direto`), mas `APP_CONFIG.leadOrigins` usa **TitleCase** (`WhatsApp`, `Instagram`, `Indicação`, `Outro`). Resultado: o filtro de origem na listagem **não casa** com leads vindos do site.

**Fix:** padronizar `LeadFormSection.tsx` para gravar exatamente os mesmos valores de `APP_CONFIG.leadOrigins`. Adicionar `'Site'` à lista de origens (substitui `'direto'`). Backfill via insert tool dos leads existentes para uniformizar.

#### 2. Página de Clientes — dois pontos faltantes

- **Sem busca por produto.** Adicionar filtro/busca pelo campo `product_bought` junto com nome/telefone (mesmo input expandido).
- **`CustomerDetailSheet` está visualmente defasado** vs `LeadDetailSheet` (que foi refeito em blocos). Aplicar a **mesma estrutura de blocos** no detalhe do cliente: header com WhatsApp + recência, ações rápidas, blocos "Compra", "Observações", "Histórico". Reutiliza o `ContactRecencyBadge` (já funciona para customers — trigger sincroniza `last_contact_at`).

#### 3. Lead → Cliente: levar a timeline junto

Hoje `clientService.createFromLead` cria um `customers` novo, mas as **interações da timeline ficam órfãs no lead** (que continua existindo em `won`). O usuário não vê o histórico no cliente.

**Fix:** após criar o customer, fazer `UPDATE interactions SET customer_id = <novo_id> WHERE lead_id = <lead_id>` (mantém `lead_id` para rastreabilidade). Trigger `trg_sync_last_contact` re-popula `last_contact_at` do customer automaticamente. Sem perda de dados.

#### 4. Sidebar — adicionar atalho "Ver site" e indicador visual

A sidebar tem só 4 itens, sem destaque para áreas com pendências. Pequenos polimentos:
- Mostrar **badge numérico** ao lado de "Leads" quando houver leads atrasados (ex.: `Leads · 3`).
- Adicionar o item **"Site público"** com ícone (link externo) — hoje só está no navbar (escondido em mobile).

#### 5. Limpeza: remover tabela legada `clients`

A tabela `clients` (singular, com `lead_id`) existe no schema mas está **vazia e não é usada em nenhum lugar do código** (todos usam `customers`). Migration para `DROP TABLE public.clients` — reduz confusão e ruído no schema.

#### 6. Dashboard — pequena melhoria de navegação

No bloco "Leads recentes" e "Precisam de atenção", o link leva para `/admin/leads` mas **não abre o sheet do lead clicado**. Ajuste mínimo: passar `?focus=<id>` na URL e fazer `LeadsPage` ler esse param para abrir o `LeadDetailSheet` automaticamente. Mesmo padrão já usado para `?recency=`.

### Garantias de não-regressão

- **Landing page intacta:** o único ajuste em `LeadFormSection` é normalizar valores de origem (não muda visual nem fluxo).
- **Sem mudança nos componentes UI compartilhados** (`Button`, `Sheet`, `Dialog`, etc.).
- **Sem mudança nos design tokens** (`tailwind.config`, `index.css`).
- **Schema:** apenas `DROP TABLE clients` (vazia, sem foreign keys, sem código). Zero impacto.
- **RLS:** sem alterações — todas as operações continuam protegidas.
- **Realtime:** já cobre `leads`, `customers`, `interactions` — nada a adicionar.

### Arquivos tocados

- **Editar:** `src/components/landing/LeadFormSection.tsx` — normalizar `<SelectItem value>` e o fallback `'direto'` → `'Site'`.
- **Editar:** `src/config/app.ts` — adicionar `'Site'` em `leadOrigins`.
- **Insert tool:** backfill `UPDATE leads SET origin = ...` para uniformizar dados existentes (caso haja).
- **Editar:** `src/pages/admin/ClientsPage.tsx` — busca por produto.
- **Reescrever:** `src/components/admin/CustomerDetailSheet.tsx` — adotar layout de blocos do `LeadDetailSheet`, com header + ações rápidas + recência + timeline.
- **Editar:** `src/services/clientService.ts` — em `createFromLead`, transferir interações para o novo `customer_id`.
- **Editar:** `src/components/crm/AdminSidebar.tsx` — badge de leads atrasados + item "Site público".
- **Editar:** `src/pages/admin/DashboardPage.tsx` — links das listas com `?focus=<id>`.
- **Editar:** `src/pages/admin/LeadsPage.tsx` — ler `?focus=<id>` e abrir o sheet correspondente.
- **Migration SQL:** `DROP TABLE IF EXISTS public.clients;`

### Resultado esperado

Sistema 100% coerente: o que entra pelo site aparece corretamente filtrado no CRM; cliente convertido mantém histórico; navegação do dashboard leva direto ao contexto certo; visualização de cliente fica no mesmo nível visual do lead; sidebar comunica pendências em tempo real; schema limpo sem tabelas órfãs.

