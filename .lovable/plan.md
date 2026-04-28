
## Contexto

Já existem hoje na LeadsPage:
- Multi-seleção com checkboxes + `BulkActionsBar` (status, follow-up, copiar fones, exportar, excluir).
- Filtros (busca, status, origem, prioridade, recência) com persistência parcial na URL (`recency`, `priority`, `sort`, `view`, `focus`).
- Paginação por grupo de status (`useLeadsPaged`).
- Sheet de detalhes (`LeadDetailSheet`) com header sticky e `InteractionTimeline` rolável.

A proposta abaixo cobre os 4 pedidos sem reescrever o que já funciona.

---

## 1. Acessibilidade (drawer + tabela)

**LeadDetailSheet**
- Adicionar `SheetDescription` (visualmente oculto via `sr-only`) referenciado pelo `aria-describedby` para narrar o lead aberto (nome, status, telefone). Hoje só temos `SheetTitle` — leitores de tela perdem o contexto.
- Garantir foco inicial no botão "Fechar" do `SheetContent` (já vem do Radix), e adicionar `aria-label="Fechar painel do lead"` explícito.
- Ordem de tabulação: marcar a área de scroll (`<div className="px-6 py-5 …">`) com `tabIndex={0}` + `role="region"` + `aria-label="Detalhes do lead"` para permitir navegação por teclado dentro do conteúdo rolável.
- Diálogos `Excluir` e `Converter` recebem `aria-describedby` apontando para a `DialogDescription` correspondente (já existe no Excluir; falta no Converter).
- Esc: já fechado pelo Radix; verificar que botões internos (`DropdownMenu`, `Popover`) não capturam Esc indevidamente — adicionar `onEscapeKeyDown` no `SheetContent` apenas se `editing` estiver ativo, perguntando se quer descartar.

**Tabela de Leads**
- Trocar `<button>` do toggle de ordenação por elemento com `aria-pressed`/`aria-sort` correto (`ascending`/`descending`).
- `TableRow` com `role="button"` + `aria-label={`Abrir lead ${lead.name}`}` (hoje tem `tabIndex={0}` e Enter, mas falta papel semântico e label).
- Checkbox de header: `aria-label` dinâmico ("Selecionar todos do grupo Em contato").
- `LeadFilters` inputs com `<label className="sr-only">` correspondente para cada Select/Input (hoje só placeholder).
- Sticky header já tem contraste suficiente, mas adicionar `scope="col"` em todos os `TableHead`.

---

## 2. Ações em lote ampliadas

Hoje a `BulkActionsBar` já cobre status, follow-up, copiar telefones, exportar e excluir.

**Adicionar:**
- **Atribuir responsável** — depende de coluna `assigned_to` em `leads` (não existe hoje; só `task_board_items` tem `assignee_id`). Será necessária migração:
  - `ALTER TABLE public.leads ADD COLUMN assigned_to uuid;` (sem FK para auth.users, conforme guideline).
  - Seleciona um usuário a partir de `profiles` (admin + vendedor). Adicionar policy de leitura ampliada em `profiles` para membros autenticados verem nome/email apenas (ou usar a policy admin existente combinada com vendedor).
  - Novo botão "Responsável" no `BulkActionsBar` abrindo um `Popover` com lista (`<Command>` searchable) dos perfis com role `admin` ou `vendedor`.
  - `bulkAssign(userId)` em `LeadsPage` faz `update({ assigned_to }).in('id', ids)`.
  - Mostrar avatar do responsável na coluna "Lead" (badge pequeno) e no `LeadDetailSheet`.
- **Exportar selecionados** — já existe (`bulkExport`); apenas confirmar rótulo e atalho de teclado (`E`).
- **Mudar status** — já existe; manter.

**Atalhos novos:** `A` para abrir popover de atribuir, `E` para exportar selecionados (quando há seleção).

---

## 3. Filtros avançados com persistência na URL

Reorganizar `LeadFilters` e o estado da `LeadsPage` para refletir tudo na querystring (compartilhável e back-button friendly).

**Persistir na URL** (substituindo o estado local quando presente):
- `q` — busca por nome/telefone (hoje só local).
- `status` — já filtra, mas nunca foi à URL.
- `origin` — idem.
- `priority` — já está.
- `recency` — já está.
- `from` / `to` — novo intervalo de datas em `created_at` (DateRangePicker shadcn).
- `kpi` — KPI ativo.

Implementação:
- Criar hook `useLeadsUrlState()` que:
  - Lê params na montagem e devolve `{search, status, origin, priority, recency, from, to, kpi, set(partial)}`.
  - Faz debounce de 250 ms na escrita de `q` para não floodar history.
- Em `LeadsPage`, substituir os `useState` locais pelo hook (mantendo a mesma API consumida por `LeadFilters` e `applySaved`).
- `LeadFilters` recebe novo bloco `DateRangeFilter` (popover com `Calendar mode="range"`) com badge "Últimos 7d / 30d / Personalizado".
- `filtered` em `LeadsPage` ganha:
  ```ts
  if (from && new Date(l.created_at) < from) return false;
  if (to   && new Date(l.created_at) > to)   return false;
  ```
- Botão "Limpar" continua funcionando (limpa todos os params relevantes).

A busca por telefone já funciona (`l.phone.includes(q)`); apenas garantir normalização (remover não-dígitos do termo se for numérico).

---

## 4. Paginação no LeadDetailSheet

O scroll do sheet já é suave; o gargalo real é o `InteractionTimeline` quando há muitas interações + notas + mensagens whatsapp.

**Abordagem (paginação progressiva, sem virtualização — mais simples e suficiente):**
- Em `InteractionTimeline`, manter o fetch atual mas exibir só os primeiros 20 itens.
- Botão "Ver mais 20" no fim que incrementa `visibleCount`.
- Se `items.length > 100`, trocar para virtualização real com `@tanstack/react-virtual` (já comum em projetos shadcn; adicionar dependência se necessário).
- O conteúdo do sheet (`<div className="px-6 py-5 …">`) permanece rolável — não muda layout.

Não tocar em outros campos do sheet: eles são poucos e fixos.

---

## Mudanças técnicas (resumo de arquivos)

```text
supabase/migrations/<ts>_leads_assigned_to.sql   NEW   add column + index
src/hooks/useLeadsUrlState.ts                    NEW   estado <-> querystring
src/components/admin/LeadFilters.tsx             EDIT  date range, sr-only labels, props from/to
src/components/admin/BulkActionsBar.tsx          EDIT  novo botão "Responsável" (AssigneePicker)
src/components/admin/AssigneePicker.tsx          NEW   Command + lista de profiles
src/components/admin/LeadDetailSheet.tsx         EDIT  a11y (Description, role, aria), exibe responsável
src/components/admin/InteractionTimeline.tsx     EDIT  paginação progressiva (+ virtual se >100)
src/pages/admin/LeadsPage.tsx                    EDIT  usa useLeadsUrlState, bulkAssign, filtro de datas
```

## Migração de banco

```sql
alter table public.leads add column if not exists assigned_to uuid;
create index if not exists leads_assigned_to_idx on public.leads(assigned_to);
-- profiles: permitir que vendedores vejam nome/email dos colegas
create policy "Vendedores e admins veem perfis"
on public.profiles for select to authenticated
using (has_role(auth.uid(), 'admin') or has_role(auth.uid(), 'vendedor'));
```

(A policy atual de profiles só deixa o próprio user ou admin ver — precisamos dos vendedores para popular o picker.)

## Fora do escopo

- Não vou tocar em estilos do CRM (já está Monday-clean).
- Não vou recodificar o Kanban/Cards — as ações em lote continuam apenas na visão Tabela (já era assim).
- Não vou virtualizar a tabela principal — a paginação por grupo já resolve.
