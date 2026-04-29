## O que está acontecendo hoje

Na página **Leads**, a lupa só procura em **nome** e **telefone** — por isso, quando você digitou um interesse (ex.: "SECA BARRIGA" ou "Banana coberta"), nada apareceu. O mesmo acontece em **Clientes**: a lupa lá busca em nome/telefone/produto, mas nada de origem, status ou observações.

Na **paleta global** do topo (Ctrl+K, "Buscar leads, clientes, comandos…"), só aparecem 8 leads recentes fixos — a busca digitada não consulta a base.

Vou transformar a lupa em **busca universal em tempo real** em todas as listas, e a paleta do topo em uma **busca global** que cruza leads, clientes, páginas e boards.

---

## O que vai mudar

### 1) Página de Leads — lupa pesquisa TUDO

A caixa "Buscar por nome ou telefone…" passa a ser **"Buscar em tudo (nome, telefone, interesse, origem, status, observações, responsável)…"** e filtra em tempo real (debounce 200ms já existente) por:

- Nome do lead
- Telefone (com ou sem máscara — já normaliza dígitos)
- **Interesse / produto** (`product_interest`)
- **Origem** (`origin`)
- **Status** (compara contra o rótulo amigável: "Novo", "Em contato", etc.)
- **Observações** (`notes`)
- **Resumo de IA** e **motivo de score** (`ai_summary`, `ai_score_reason`)
- **Nome do responsável** (resolve `assigned_to` → `profiles.name`)

Tudo **client-side** sobre os leads já carregados (a página já carrega tudo em memória), então o resultado aparece enquanto você digita, sem ida ao servidor.

Quando você digitar, por exemplo, `banana coberta`, vão aparecer **todos** os leads cujo interesse contém isso, agrupados pelos status atuais.

**Indicador de "onde casou"**: ao lado de cada resultado vou destacar em qual campo deu match (badge pequeno: `interesse`, `origem`, `obs`, `responsável`), pra ficar claro por que aquele lead apareceu.

### 2) Filtros da página de Leads — revisão e novos

Mantidos: Status, Origem, Prioridade, Recência, Período, "Sem resposta".

**Novos:**
- **Filtro "Interesse"**: dropdown com todos os interesses únicos extraídos dos leads carregados (ordem alfabética, com contagem). Selecionar um filtra exatamente por esse interesse — útil quando você quer "ver todas as pessoas interessadas em Banana coberta".
- **Filtro "Responsável"**: dropdown com os vendedores (puxa de `profiles`), inclui opção "Sem responsável".
- **Filtro "Com WhatsApp" / "Sem WhatsApp"**: toggle baseado em `phone IS NOT NULL` e `whatsapp_opt_out`.

**Correções de filtros existentes:**
- Selecionar uma **origem** com diferença de capitalização agora compara case-insensitive de forma consistente (já é, mas vou garantir trim em ambos os lados).
- Botão **Limpar** passa também a resetar Interesse e Responsável.
- Sincronização com URL (`?q`, `?status`, `?origin`, `?interest`, `?assignee`, `?priority`, `?recency`, `?from`, `?to`) — adiciono `interest` e `assignee` ao `useLeadsUrlState`.

### 3) Página de Clientes — mesma busca universal

A lupa em Clientes passa a buscar também em: **observações**, **produto comprado**, **estágio do ciclo de vida**, com placeholder atualizado ("Buscar em tudo…").

### 4) Paleta global (Ctrl+K, no topo) — busca real

Hoje só lista 8 leads recentes fixos. Vou transformar em **busca dinâmica**:

- Ao digitar, dispara uma query Supabase debounced (250ms) com `or(name.ilike.%q%, phone.ilike.%q%, product_interest.ilike.%q%, origin.ilike.%q%, notes.ilike.%q%)` em **leads** e em **clientes** (limit 8 cada).
- Mostra resultados em duas seções: "Leads" e "Clientes", clique navega direto para `/admin/leads?focus=ID` ou abre o sheet do cliente.
- Se a query bater com nome de página/board, mostra também (já funciona).
- Se a query for um interesse comum, mostra um item especial **"Ver todos os leads com interesse: 'banana'"** que leva pra `/admin/leads?q=banana`.

### 5) Toolbar visual

- Reordeno os filtros para: **Status · Origem · Interesse · Responsável · Prioridade · Recência · Período · Limpar** (mais usados primeiro).
- Em telas estreitas, agrupo Prioridade/Recência/Período num botão "Mais filtros" (popover) pra não quebrar a linha.

---

## Arquivos afetados

- `src/components/admin/LeadFilters.tsx` — placeholder, filtros novos (Interesse, Responsável), reordenação, agrupamento responsivo.
- `src/pages/admin/LeadsPage.tsx` — predicado de busca expandido + filtros novos aplicados; resolve `assigned_to → profile.name` num map.
- `src/hooks/useLeadsUrlState.ts` — adiciona `interest` e `assignee` na URL.
- `src/components/admin/ClientFilters.tsx` + `src/pages/admin/ClientsPage.tsx` — placeholder e predicado.
- `src/components/crm/CommandPalette.tsx` — busca dinâmica em leads/clientes/atalho "ver todos com interesse X".
- (Opcional) `src/components/admin/leads/LeadsTableDnd.tsx` — pequeno badge "match em: interesse" na linha quando `q` casa fora de nome/telefone.

Sem mudanças de banco. Tudo é leitura/filtragem.

---

## Como você vai sentir a diferença

1. Abre **Leads**, digita `banana` na lupa → aparecem na hora todas as leads com esse interesse, agrupadas por status, com um chip "interesse" do lado mostrando por que casaram.
2. Abre o filtro **Interesse**, clica em "Banana coberta c/ chocolate" → mesma lista, sem precisar digitar.
3. Aperta **Ctrl+K** em qualquer tela, digita `seca barriga` → vê leads e clientes que mencionam isso em qualquer campo, e um atalho "Ver todos os leads com interesse: seca barriga".
4. Em **Clientes**, digita o nome de um produto/observação → filtra na hora.
