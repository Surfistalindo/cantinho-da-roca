

## Plano: Linha do tempo de interações por lead

A infraestrutura já existe (`interactions` table, `interactionService`, formulário básico no `LeadDetailSheet`). Vou **refinar** para entregar uma timeline comercial real, sem refazer.

### 1. Expandir tipos de interação

Atualmente: `mensagem`, `ligação`, `observação`. Adicionar: **WhatsApp**, **reunião**, **outro** — totalizando os 6 tipos pedidos. Cada tipo terá ícone e cor própria:

| Tipo | Ícone | Cor |
|---|---|---|
| WhatsApp | `faWhatsapp` (brands) | verde |
| Ligação | `faPhone` | primary |
| Mensagem | `faCommentDots` | info |
| Reunião | `faUsers` | warning |
| Observação | `faFileLines` | muted |
| Outro | `faCircleInfo` | muted |

Centralizar em `src/lib/interactionTypes.ts` para que `LeadDetailSheet`, `CustomerDetailSheet` e futuras telas leiam da mesma fonte.

### 2. Timeline visual (não lista)

Substituir a lista de cards atual por uma **timeline vertical** dentro do mesmo `LeadDetailSheet`:

```text
┌─ Histórico de Interações ────────────────┐
│                                          │
│  ●─── WhatsApp · há 2 horas              │
│  │    "Cliente confirmou interesse..."   │
│  │    por Maria Silva                    │
│  │                                       │
│  ●─── Ligação · ontem 14:32              │
│  │    "Não atendeu, tentar amanhã"       │
│  │    por João Santos                    │
│  │                                       │
│  ●─── Observação · 12/04 09:15           │
│       "Lead veio do Instagram"           │
└──────────────────────────────────────────┘
```

- Linha vertical contínua (`border-l` no container, marcadores `●` coloridos por tipo).
- Data **relativa** ("há 2 horas") + tooltip com data absoluta.
- Ordem cronológica decrescente (mais recente no topo) — já implementado.
- Empty state elegante quando não há interações.

### 3. Usuário responsável visível

Hoje `created_by` é salvo mas nunca exibido. Buscar nome do usuário via JOIN com `profiles`:

```ts
// interactionService.listByLead — refatorar:
.select('id, contact_type, description, interaction_date, created_by, profiles:created_by(name)')
```

Como não há FK formal, usar uma busca em duas etapas (ids únicos → `profiles`) e mapear no client. Exibir nome (ou "Sistema" se ausente) abaixo da descrição, em texto pequeno e discreto.

### 4. Formulário de nova interação (mais completo)

No bloco de adicionar interação:
- Select de tipo expandido (6 opções) com ícone ao lado de cada label.
- Textarea de descrição (já existe).
- Botão único "Registrar interação" (largura total) em vez de ícone enviar — mais claro.
- Ao salvar: atualiza `last_contact_at` no lead (já existe), realtime propaga.

### 5. Realtime nas interações

Adicionar `useRealtimeTable('interactions', leadId)` no `LeadDetailSheet` para que, se outro usuário registrar interação, o sheet atual atualize sem refresh manual.

### 6. Aplicar mesma timeline em `CustomerDetailSheet`

A tabela `interactions` já tem `customer_id`. Reaproveitar o componente extraído.

### Refator: extrair `<InteractionTimeline />`

Para evitar duplicação entre `LeadDetailSheet` e `CustomerDetailSheet`:

- **Criar `src/components/admin/InteractionTimeline.tsx`** — componente self-contained que recebe `leadId` ou `customerId`, faz fetch + realtime + render da timeline + form de adição. Aceita prop `entityType: 'lead' | 'customer'`.

### Arquivos tocados

- **Criar:** `src/lib/interactionTypes.ts` — fonte única dos 6 tipos com ícones/cores
- **Criar:** `src/components/admin/InteractionTimeline.tsx` — componente reutilizável (timeline + form)
- **Editar:** `src/components/admin/LeadDetailSheet.tsx` — substituir bloco atual de interações por `<InteractionTimeline entityId={lead.id} entityType="lead" />`
- **Editar:** `src/components/admin/CustomerDetailSheet.tsx` — adicionar `<InteractionTimeline entityId={customer.id} entityType="customer" />`
- **Editar:** `src/services/interactionService.ts` — incluir `created_by` no select e helper para resolver nomes via `profiles`

### Visual

- Tokens semânticos do design system (sem cores hardcoded fora do token verde do WhatsApp já estabelecido).
- Bordas suaves `rounded-lg`, fundo `bg-muted/30` em cada item, marcador circular com a cor do tipo.
- Tipografia coerente: descrição em `text-sm`, meta em `text-xs text-muted-foreground`.
- Sem mudanças em `tailwind.config` ou `index.css`.

### Garantias

- Timeline vive **dentro** do sheet do lead — não é tela solta.
- Mesma tabela `interactions`, mesmo serviço, zero fluxo paralelo.
- RLS já cobre INSERT/UPDATE/DELETE (`auth.uid() = created_by`) — sem mudanças de schema.

