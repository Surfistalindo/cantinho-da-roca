

## Plano: 5 melhorias avançadas no fluxo de importação Excel

Adições focadas no `/admin/ia/excel`, mantendo arquitetura modular existente. Zero impacto em leads, pipeline, dashboard ou clientes.

---

### 1. Estratégia padrão de deduplicação (pré-revisão)

**Nova etapa** entre `mapping` e `reviewing`: **`strategy`**.

- Tela compacta com 4 cards selecionáveis (radio): **Criar novo / Atualizar / Mesclar / Ignorar**.
- Cada card mostra ícone FA + descrição curta + cenário típico.
- Estratégia escolhida vira **default aplicado a todos os duplicados detectados** — usuário ainda pode trocar individualmente na etapa de duplicados.
- Preferência salva em `localStorage` (`ia.excel.defaultDupStrategy`) para reuso automático.
- Stepper passa a ter 5 passos: Upload → Mapeamento → Estratégia → Revisão → Confirmação.

**Arquivos:**
- Novo `src/components/ia/excel/DefaultStrategyPicker.tsx`
- `useExcelImport.ts`: adiciona estado `defaultStrategy` + step `strategy` + ação `setDefaultStrategy`
- `IAExcelImportPage.tsx`: renderiza nova etapa entre mapping e review
- `duplicateDetector.ts`: aplica `defaultStrategy` em vez de hardcoded `'skip'`

---

### 2. Revisão com validação por linha + correção inline

Substituir a tela atual de `reviewing` (resumo agregado) por uma **tabela de revisão linha-a-linha** com:

- Coluna por campo CRM mapeado (name, phone, status, next_contact_at, origin, product_interest, notes).
- **Células com erro** ficam destacadas (borda vermelha + ícone `faTriangleExclamation` + tooltip com motivo).
- **Células com warning** (telefone normalizado, status inferido, data ajustada) ficam em amarelo com ícone `faWandMagicSparkles`.
- **Edição inline**: clicar na célula abre input/select para corrigir o valor diretamente — revalida ao sair (blur).
- Filtros no topo: "Todas / Com erro / Com warning / Válidas".
- Painel lateral colapsável **"Ajustar mapeamento"** — permite trocar o mapeamento sem voltar à etapa anterior; ao salvar, re-normaliza todas as linhas.
- Resumo agregado vira um header compacto (X válidas · Y warnings · Z erros).

**Arquivos:**
- Novo `src/components/ia/excel/RowReviewTable.tsx` (tabela editável)
- Novo `src/components/ia/excel/RowEditCell.tsx` (célula com input/select + validação)
- Novo `src/components/ia/excel/InlineMappingPanel.tsx` (painel lateral)
- `leadNormalizer.ts`: expor `normalizeRow(rawRow, mappings)` para re-normalizar uma linha individual após edição
- `useExcelImport.ts`: ações `updateRowField(rowIndex, field, value)` e `remapAndRevalidate(mappings)`
- `ImportSummary.tsx` vira `ReviewHeader.tsx` (apenas badges de contagem)

---

### 3. Templates de mapeamento salvos

Permitir salvar o conjunto `{ source → target }` por nome amigável e reaproveitar.

**Persistência:** `localStorage` chave `ia.excel.mappingTemplates` (array de `{ id, name, createdAt, mappings: Array<{source, target}> }`). Não requer migração — totalmente client-side, simples e suficiente para 1 usuário operacional.

**UI na etapa `mapping`:**
- Header da etapa ganha 3 botões: **"Salvar template"**, **"Carregar template"**, **"Aplicar automaticamente"**.
- Ao carregar arquivo: se houver template cujo conjunto de `source` casa ≥80% com headers atuais, oferece banner sutil "Template detectado: 'Planilha de Vendas' — aplicar?".
- Dialog de salvar: nome + preview dos mapeamentos.
- Dialog de carregar: lista de templates com data + qtd de campos + ações (aplicar/excluir).

**Arquivos:**
- Novo `src/services/ia/mappingTemplates.ts` (CRUD em localStorage)
- Novo `src/components/ia/excel/MappingTemplateManager.tsx` (dialogs)
- `ColumnMapper.tsx`: integra os 3 botões no header
- `useExcelImport.ts`: ações `saveMappingTemplate(name)`, `applyMappingTemplate(id)`, detecção automática em `handleFile`

---

### 4. Relatório final com download PDF/CSV

Tela `done` (`ImportResult.tsx`) ganha:

- Cabeçalho expandido com **4 KPIs**: Criados / Atualizados / Ignorados / Erros (cards com ícones).
- Seção **"Detalhamento por linha"** colapsável: tabela com `linha · nome · telefone · resultado · mensagem`.
- 2 botões de download:
  - **"Baixar relatório (CSV)"** — gerado client-side com `xlsx` (já instalado, faz CSV nativo) ou string manual. Inclui todas as linhas processadas + resultado.
  - **"Baixar relatório (PDF)"** — usa `jsPDF` + `jspdf-autotable` (deps novas, ~150KB total). PDF com header (logo textual + nome arquivo + data + usuário), tabela de KPIs e tabela de linhas.
- CTAs existentes mantidos ("Ver leads", "Importar outra").

**Arquivos:**
- Novo `src/services/ia/reportExporter.ts` (`exportToCsv(result)`, `exportToPdf(result, meta)`)
- `importExecutor.ts`: já retorna `errorDetails` — estender `ImportResult` para incluir `details: Array<{rowIndex, name, phone, outcome: 'created'|'updated'|'skipped'|'error', message?}>`
- `ImportResult.tsx`: refator visual + botões de export
- Adiciona deps: `jspdf` e `jspdf-autotable`

---

### 5. Histórico no topo da tela do Excel + realtime

Hoje há `ImportHistoryCard` mas isolado. Movê-lo para **banner persistente no topo de `IAExcelImportPage`**:

- Visível em **todos os steps** (não apenas `idle`), de forma compacta.
- Mostra **última importação em andamento** (se houver) com barra de progresso animada + contador "X de Y".
- Mostra **3 últimas concluídas** em chips horizontais clicáveis (data · arquivo · resultado).
- **Realtime via Supabase channel** em `ia_import_logs` — atualiza ao vivo conforme `importExecutor` grava progresso.
- Para suportar progresso ao vivo, `importExecutor` passa a fazer `update` periódico (a cada lote de 50) no log com contadores parciais — não só no início/fim.
- Hook `useImportHistory` já existe; estender para subscribe via `supabase.channel('ia_import_logs')`.

**Arquivos:**
- Novo `src/components/ia/excel/ImportHistoryBanner.tsx` (versão compacta, sticky)
- `useImportHistory.ts`: adicionar realtime subscription + retornar `inProgress` separado de `recent`
- `importExecutor.ts`: novo helper `updateImportLogProgress(logId, partial)` chamado a cada batch
- `importLogService.ts`: adicionar `updateImportLog(id, patch)`
- `IAExcelImportPage.tsx`: renderiza banner sempre no topo
- Migração: habilitar realtime em `ia_import_logs` (`ALTER PUBLICATION supabase_realtime ADD TABLE public.ia_import_logs`)

---

### Resumo técnico

**Migração SQL (1 linha):**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.ia_import_logs;
```

**Novas dependências:** `jspdf`, `jspdf-autotable` (para o item 4).

**Novo step na máquina de estados:**
```
idle → parsing → mapping → strategy → reviewing → resolving_duplicates → importing → done
```

**Persistência client-side (localStorage):**
- `ia.excel.defaultDupStrategy` — preferência de estratégia padrão
- `ia.excel.mappingTemplates` — lista de templates salvos

**Garantias:**
- Zero alteração em leads, pipeline, dashboard, clientes, auth, landing.
- Zero alteração nos services `leadService`, `interactionService`, `clientService`.
- Schema do banco intocado (apenas habilita realtime numa tabela já existente).
- Todos os ícones permanecem 100% Font Awesome.
- Mobile: tabela de revisão vira accordion por linha; banner de histórico colapsa.

### Ordem de implementação

1. Migração realtime + estender `importLogService` e `useImportHistory` com subscribe.
2. `ImportHistoryBanner` no topo + progresso parcial em `importExecutor`.
3. Step `strategy` + `DefaultStrategyPicker` + persistência.
4. `mappingTemplates` service + `MappingTemplateManager` + integração no `ColumnMapper`.
5. `RowReviewTable` editável + `InlineMappingPanel` + `normalizeRow` exposto.
6. `reportExporter` (CSV + PDF) + refator de `ImportResult` com KPIs e detalhamento.

