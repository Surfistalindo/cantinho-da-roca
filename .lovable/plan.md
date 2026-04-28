# Corrigir filtros de Origem (e bugs relacionados) na página de Leads

## Problemas confirmados

1. **Filtro de Origem mostra opções inexistentes nos dados**
   `LeadFilters.tsx` lista valores fixos de `APP_CONFIG.leadOrigins` (`Site`, `WhatsApp`, `Instagram`, `Indicação`, `Outro`), mas os 19 valores reais no banco são meses (`AGOSTO 2025`, `JUNHO 2025`...), categorias (`VIVAZ`, `CENTRO`, `RESERVA DE PRODUTOS`) e duplicatas com case (`Vivaz`/`vivaz`/`VIVAZ`). Filtrar por "Site" retorna 0 leads.

2. **Coluna "Origem" mostra meses ("AGOSTO 2025")**
   Em `src/services/ia/leadNormalizer.ts` (linha 184-189), quando o Excel não mapeia coluna de origem, o sistema usa o **nome da aba** como origem. Em planilhas onde abas são meses de captação, isso polui o campo `origin` com datas.

3. **Origens duplicadas por case**
   `Vivaz`, `vivaz`, `VIVAZ` viram 3 origens distintas → 3 entradas no dropdown e contagens fragmentadas.

## Mudanças

### 1. `src/components/admin/LeadFilters.tsx`
Tornar o filtro de Origem **dinâmico**, populado a partir das origens realmente presentes nos leads carregados. Adicionar prop `availableOrigins?: string[]` (opcional). Quando fornecida, usar essa lista; fallback para `APP_CONFIG.leadOrigins`.

```tsx
interface Props {
  // ... existentes
  availableOrigins?: string[];
}

// no SelectContent:
{(availableOrigins ?? APP_CONFIG.leadOrigins).map((o) => (
  <SelectItem key={o} value={o}>{o}</SelectItem>
))}
```

### 2. `src/pages/admin/LeadsPage.tsx`
Computar `availableOrigins` via `useMemo` a partir de `leads` (deduplicado case-insensitive, ordenado), e passar ao `<LeadFilters>`:

```tsx
const availableOrigins = useMemo(() => {
  const set = new Map<string, string>(); // key=lower, val=display
  for (const l of leads) {
    if (!l.origin) continue;
    const k = l.origin.trim().toLowerCase();
    if (!set.has(k)) set.set(k, l.origin.trim());
  }
  return Array.from(set.values()).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}, [leads]);
```

Também tornar a comparação do filtro **case-insensitive** (linha 217):
```tsx
if (originFilter !== 'all' &&
    (l.origin ?? '').trim().toLowerCase() !== originFilter.trim().toLowerCase())
  return false;
```

### 3. `src/services/ia/leadNormalizer.ts` — bloquear meses como origem
No fallback "origem = nome da aba" (linhas 184-189), **rejeitar valores que parecem datas/meses** para não poluir o campo origin:

```ts
const MONTH_NAMES_RE = /^(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*\/?\s*\d{2,4}/i;

if (!data.origin) {
  const sheetMeta = row['__sheet'];
  if (typeof sheetMeta === 'string' && sheetMeta.trim()) {
    const candidate = sheetMeta.trim();
    // Não usar se for nome de mês ou começar com data
    if (!MONTH_NAMES_RE.test(candidate) && !/^\d{1,2}[\/\-]\d{1,2}/.test(candidate)) {
      data.origin = candidate;
    }
  }
}
```

Isso impede futuras importações de gerarem origens como "AGOSTO 2025".

### 4. (Opcional, sem migração destrutiva) Botão para limpar origens-data
Não vou rodar UPDATE em massa nos leads existentes sem confirmação do usuário. Posso oferecer isso depois — por enquanto o filtro dinâmico já resolve a leitura, e os meses ficarão visíveis até o usuário decidir corrigi-los.

## Resultado

- Dropdown de **Origem** lista apenas valores que **existem** nos leads atuais, sem duplicatas por case
- Filtro funciona (selecionar "VIVAZ" retorna os 184 leads — VIVAZ + Vivaz + vivaz somados)
- Importações futuras de Excel não vão mais gravar "AGOSTO 2025" como origem quando a aba tiver nome de mês
- Sem necessidade de migração de banco; correção retroativa pode vir depois
