## Tela de Leads — versão sênior

Hoje a tela de Leads é só uma tabela agrupada por status, e o Kanban com arrastar vive isolado em outra rota (Pipeline). A proposta é unir tudo em **um único workspace de Leads** com troca de visão, drag-and-drop nativo, ações rápidas reais e responsividade pensada do mobile pra cima — usando o design system warm farmstand já existente (sem inventar paleta nova).

### O que muda visualmente

```text
┌─ Leads ─────────────────────────────────────────────────────────┐
│  KPI strip:  Total · Novos hoje · Aguardando · Quentes · SLA    │
├─────────────────────────────────────────────────────────────────┤
│  [Busca]  [Status] [Origem] [Recência] [Prioridade] [⭐ Salvar] │
│  Visão: ( Tabela | Kanban | Cards )    Densidade · Exportar     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ── conteúdo da visão escolhida ──                             │
│                                                                 │
└─ barra de seleção em massa (aparece quando há selecionados) ────┘
```

- **KPI strip** com 5 cards enxutos (Total, Novos hoje, Aguardando contato, Quentes 🔥, SLA estourado) — cada card é clicável e aplica o filtro correspondente.
- **View switcher** Tabela / Kanban / Cards, com a escolha persistida em `localStorage`.
- **Filtros salvos** ("Quentes da semana", "Sem contato 7+ dias", etc.) salvos por usuário em `localStorage` — shortcut de 1 clique.
- Tudo dentro do mesmo header, mesma paleta cream/clay/moss/honey, sem gradients novos.

### Funcionalidades novas

1. **Drag-and-drop nativo na tela de Leads** (não só no Pipeline)
   - Na visão Kanban: arrastar card entre colunas atualiza `status` no Supabase com optimistic update + toast de undo.
   - Na visão Tabela: arrastar uma linha pra outro grupo de status também muda o status (handle ⠿ na esquerda da linha).
   - Reuso do `@dnd-kit/core` já instalado.

2. **Ações rápidas inline** em cada lead
   - Botão "Marcar contato feito" → grava `last_contact_at = now()` e cria uma `interactions` do tipo "observação".
   - "Agendar follow-up" → popover com datepicker, grava `next_contact_at`.
   - "Copiar telefone" e WhatsApp já existem, ficam mais visíveis.

3. **Seleção em massa expandida**
   - Além de mudar status / excluir (já existe), adicionar: agendar follow-up em massa, exportar selecionados para CSV, copiar telefones.

4. **Exportar CSV** dos leads filtrados (botão no header).

5. **Atalhos de teclado**
   - `N` novo lead (já existe), `/` foca na busca, `1/2/3` troca visão, `J/K` navega lead a lead, `Enter` abre, `Esc` fecha.
   - Tela de ajuda (`?`) já existe — só registramos os novos.

6. **KPI strip clicável**: cada KPI vira um filtro. Ex.: clicar em "Quentes" aplica `priority=hot`.

7. **Filtros salvos** (locais, por usuário). Estrela ao lado dos filtros aplicados → salva combinação atual com nome.

8. **Pipeline page → vira atalho** que abre a tela de Leads já na visão Kanban (ou continua existindo apontando pra mesma tela com `?view=kanban`).

### Responsividade real

- **< 640px (mobile)**: visão Cards por padrão; KPIs viram chips horizontais com scroll; filtros viram drawer; ações de seleção em massa viram bottom sheet; arrastar funciona via long-press.
- **640–1024px (tablet)**: Kanban com 2 colunas + scroll horizontal; tabela em modo compacto.
- **≥ 1024px**: layout completo, Kanban 5 colunas, tabela com todas as colunas.
- Card mobile ganha swipe gestures: arrastar pra direita = WhatsApp, pra esquerda = ações.

### Bug encontrado de quebra

`LeadsPage` agrupa por `contacted`/`converted` mas o `APP_CONFIG` usa `contacting`/`won` — isso faz os grupos "Em contato" e "Convertido" aparecerem sempre vazios e os leads caírem em "Outros". Vamos alinhar os dois nesse mesmo passo.

### Detalhes técnicos

- **Arquivos novos**:
  - `src/components/admin/leads/LeadsKpiStrip.tsx` — 5 KPIs clicáveis.
  - `src/components/admin/leads/LeadsViewSwitcher.tsx` — toggle Tabela/Kanban/Cards.
  - `src/components/admin/leads/LeadsKanban.tsx` — Kanban embutido (reaproveita `PipelineColumn` + `LeadCard`).
  - `src/components/admin/leads/LeadsCards.tsx` — grid de cards (mobile-first, mas disponível no desktop).
  - `src/components/admin/leads/SavedFiltersMenu.tsx` — salvar/aplicar/remover filtros (localStorage).
  - `src/components/admin/leads/QuickActionsPopover.tsx` — popover unificado com follow-up, contato feito, WhatsApp, copiar.
  - `src/components/admin/leads/exportLeadsCsv.ts` — utilitário de export.
  - `src/hooks/useLeadDragRow.ts` — wrapper do `useDraggable` para linhas da tabela.
- **Arquivos editados**:
  - `src/pages/admin/LeadsPage.tsx` — vira shell que orquestra KPIs + filtros + view switcher + visões.
  - `src/pages/admin/PipelinePage.tsx` — passa a redirecionar pra `/admin/leads?view=kanban` (mantém o link existente funcionando).
  - `src/components/pipeline/PipelineColumn.tsx` e `LeadCard.tsx` — pequenos ajustes para receber a callback de "marcar contato".
  - `src/components/admin/BulkActionsBar.tsx` — novas ações (follow-up em massa, exportar, copiar telefones).
  - `src/components/crm/CommandPalette.tsx` e `ShortcutsHelp.tsx` — registrar atalhos novos.
- **Banco**: nenhuma migration necessária. Usamos colunas já existentes (`last_contact_at`, `next_contact_at`, `status`) e a tabela `interactions` já está pronta.
- **Realtime**: continua via `useRealtimeTable('leads')` já em uso.
- **Sem libs novas**: `@dnd-kit/core`, `date-fns`, `sonner`, FontAwesome — tudo já no projeto.

### Não está no escopo

- Mexer no Dashboard, no WhatsApp Studio, no IA ou na Landing.
- Mudar o esquema do banco.
- Trocar o design system (continua warm farmstand, fontes Recoleta/General Sans, paleta atual).

Posso seguir?