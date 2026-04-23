

## Corrigir importação Excel: datas e múltiplas abas

### Problema 1 — Datas não são lidas corretamente

O parser de datas em `src/services/ia/leadNormalizer.ts` não cobre formatos comuns que o Excel devolve quando a célula é texto (ex.: `"6/28/25"`, `"28/6/25"`, `"2025-06-28"`). Resultado: badge "Data inválida: 6/28/25" mesmo com data legítima.

**Causa raiz adicional**: o parser do Excel chama `sheet_to_json(..., { raw: false })`, que **força conversão de datas para string formatada local do SheetJS**, perdendo o objeto `Date` nativo. Isso transforma uma célula data em string ambígua.

**Correção (`excelParser.ts`)**:
- Trocar `raw: false` por `raw: true` na leitura, mantendo `cellDates: true` no `XLSX.read`. Assim células de data chegam como `Date` nativo no JS e são tratadas pelo branch `raw instanceof Date` do normalizer (já funciona).

**Correção (`leadNormalizer.ts → parseDate`)**:
- Adicionar suporte a número serial do Excel (caso ainda venha numérico): converter via `XLSX.SSF.parse_date_code` ou cálculo direto (dias desde 1899-12-30).
- Ampliar lista de formatos: `M/d/yy`, `MM/dd/yy`, `M/d/yyyy`, `MM/dd/yyyy`, `d-M-yyyy`, `d.M.yyyy`, `yyyy/MM/dd`.
- Heurística BR: quando o formato é ambíguo (`6/28/25` vs `28/6/25`), priorizar `dd/MM` se o primeiro token > 12; caso contrário tentar ambos e escolher o que produz data válida e plausível (entre 2000 e hoje+5 anos).
- Para anos de 2 dígitos, normalizar (`yy < 50 → 20yy`, senão `19yy`).

### Problema 2 — Só importa a primeira aba

`parseExcelFile` lê apenas `wb.SheetNames[0]`. Planilhas com múltiplas abas (ex.: clientes por mês/categoria) têm o resto descartado silenciosamente — exatamente o sintoma "só vieram 40 clientes".

**Correção (`excelParser.ts`)**:
- Iterar **todas** as abas do workbook.
- Para cada aba: detectar header próprio, extrair linhas. Se a aba estiver vazia ou sem header reconhecível, ignorar com aviso.
- **Unificar headers**: usar o conjunto-união de todos os cabeçalhos das abas. Linhas de abas que não têm uma coluna recebem `''` para essa coluna.
- Adicionar coluna virtual `__sheet` em cada linha (origem da aba) — usada como fallback de origem se o usuário quiser, mas não obrigatória no mapping.
- Retornar `totalRows` agregado e nova propriedade `sheets: Array<{ name; rows; skipped? }>` para feedback.
- Manter `MAX_ROWS = 5000` como teto **global** (somando todas as abas).

**Feedback ao usuário**:
- `ExcelPreviewTable` (e/ou um banner novo) mostra: "X abas detectadas: Aba1 (120), Aba2 (87), Aba3 (15) — total 222 linhas". Permite ver de onde veio cada bloco.
- Se uma aba foi ignorada (sem cabeçalho), exibir aviso amarelo listando o nome.

### Problema 3 — IA do mapeamento e parsing de texto

Como pedido ("peça pra fazer todas as correções necessárias com a IA"), revisar também:
- **`ia-suggest-mapping`**: confirmar que recebe os headers unificados de todas as abas (já vai automaticamente após correção do parser).
- **Prompt de `ia-parse-text`** (módulo Colar): adicionar exemplos de datas BR no system prompt para reduzir falsos negativos.
- Sem alterações de schema/edge function novas — só ajustar prompt se necessário.

### Validação

Após implementar:
1. `npx tsc --noEmit` para garantir tipos.
2. Testar via preview com a planilha real do usuário:
   - Confirmar contagem total de linhas no banner.
   - Confirmar que datas tipo `28/06/2025`, `6/28/25`, `2025-06-28` aparecem **sem** badge "Data inválida".
   - Confirmar que leads de **todas** as abas chegam à etapa de revisão.
3. Validar que CSV (`useExcelImport` com parser próprio) e WhatsApp (parser próprio) **não são afetados** — só o parser Excel muda.

### Arquivos

**Modificados**:
- `src/services/ia/excelParser.ts` — multi-aba + raw values.
- `src/services/ia/leadNormalizer.ts` — parser de data robusto + serial Excel.
- `src/components/ia/excel/ExcelPreviewTable.tsx` — banner com lista de abas detectadas.
- `supabase/functions/ia-parse-text/index.ts` — refinar exemplos de data no prompt (se necessário).

**Sem mudanças**: schema, RLS, hooks, fluxo de mapping/strategy/review/dedup, módulos CSV/WhatsApp/Paste/Assistente.

### Resultado

Importação do Excel passa a:
- Ler **todas as abas** do arquivo, agregando linhas (até 5000 no total).
- Reconhecer datas em formato BR, US e ISO, incluindo serial do Excel.
- Mostrar feedback claro de quantas linhas vieram de cada aba.

