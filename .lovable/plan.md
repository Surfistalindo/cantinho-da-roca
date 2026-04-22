

## Plano: Integração WhatsApp ativa com templates + auto-registro

Transformar os botões de WhatsApp existentes em uma ação 1-clique que abre o WhatsApp com mensagem pré-preenchida **e** registra automaticamente uma interação do tipo `mensagem`. O trigger do banco (`sync_last_contact_from_interaction`) já atualiza `last_contact_at` automaticamente — zero migração.

---

### 1. Núcleo: `src/lib/whatsappTemplates.ts` (novo)

Biblioteca pura com templates e utilitários:

```ts
type TemplateKey = 'first_contact' | 'follow_up' | 'reengagement';

interface Template {
  key: TemplateKey;
  label: string;            // "Primeiro contato"
  icon: IconDefinition;     // faHandshake / faClockRotateLeft / faRotateRight
  description: string;      // tooltip curto
  build: (lead) => string;  // gera a mensagem com nome + interesse
}

export const WHATSAPP_TEMPLATES: Template[]
export function buildWhatsAppUrl(phone: string, message: string): string | null
export function pickSuggestedTemplate(lead, score): TemplateKey  // baseado em status/recência
```

**Templates (pt-BR, com primeiro nome do lead):**

- **Primeiro contato** (lead `new` ou sem interações)
  > "Olá {firstName}! Aqui é do Cantinho da Roça 🌿 Vi seu interesse{interest} e queria entender melhor como podemos te ajudar. Posso te passar mais detalhes por aqui?"

- **Follow-up** (lead em `contacting`/`negotiating`, recência atenção)
  > "Oi {firstName}! Tudo certo? Passando para retomar nossa conversa{interest}. Ainda tem interesse? Fico no aguardo 😊"

- **Reengajamento** (recência overdue ou ≥14d)
  > "Olá {firstName}! Faz um tempinho que não conversamos. Estamos com novidades por aqui e lembrei de você — ainda posso te ajudar com{interest}? 🌱"

`{interest}` é substituído por `" no(a) {product_interest}"` quando existir, ou string vazia.

### 2. Componente: `src/components/admin/WhatsAppQuickAction.tsx` (novo)

Botão dropdown reutilizável — uma única fonte de verdade para a ação.

```tsx
<WhatsAppQuickAction
  lead={lead}
  variant="primary" | "icon" | "ghost"
  size="sm" | "md"
  onSent?: () => void
/>
```

Comportamento:
- **Click principal**: abre WhatsApp com o template **sugerido** (1 clique real).
- **Caret/seta lateral** (ou long-press no mobile): abre `DropdownMenu` listando os 3 templates + opção "Ver/editar antes de enviar".
- "Editar antes" abre um `Dialog` compacto com `Textarea` pré-preenchido + botão "Abrir WhatsApp".
- Ao confirmar envio (em qualquer fluxo):
  1. `window.open(buildWhatsAppUrl(...), '_blank')`
  2. `interactionService.create({ lead_id, contact_type: 'mensagem', description: '[Template: {label}] {primeiras 80 chars}…', created_by: user.id })`
  3. Trigger do banco atualiza `last_contact_at` automaticamente.
  4. `toast.success('Mensagem registrada')` + ícone verde animado.
  5. `onSent?.()` para o pai dar refetch.
- Sem telefone → botão fica desabilitado com tooltip "Sem telefone cadastrado".
- Falha no registro de interação **não** bloqueia o WhatsApp (best-effort) — toast de aviso discreto.

Usa `useAuth()` para pegar `user.id`. Se não autenticado, só abre o WhatsApp sem registrar.

### 3. Integração no `LeadCard.tsx` (Pipeline)

Substituir os dois `<Button>` atuais (`openWhatsApp` e `sendFollowUp`) por **um único** `<WhatsAppQuickAction lead={lead} variant="icon" size="sm" onSent={refetch}>`. O componente decide internamente o template sugerido (follow-up se atenção/overdue, primeiro contato caso contrário). Remove as funções inline duplicadas.

### 4. Integração no `LeadDetailSheet.tsx`

- Trocar o botão "WhatsApp" verde da toolbar por `<WhatsAppQuickAction lead={lead} variant="primary" size="md" onSent={onUpdated} />` — vira um split-button (ação principal + caret).
- Trocar também o atalho `openWhatsApp` no telefone do header pela mesma ação (1 clique → template sugerido).
- O painel "Histórico de Interações" abaixo já reflete o novo registro automaticamente via `useRealtimeTable('interactions', ...)`.

### 5. Integração no `DashboardPage.tsx`

O card "Top Leads Quentes" já tem botão WhatsApp inline — substituir pelo `<WhatsAppQuickAction variant="icon" size="sm" onSent={refetch} />` para também registrar a interação.

### 6. UX e feedback

- Botão usa cor `#25D366` no variant `primary`, ghost verde no `icon`.
- Após disparo: ícone troca momentaneamente para `faCheck` por 1.2s + toast `"Mensagem enviada e registrada"`.
- Dropdown usa `rounded-xl` + `shadow-pop` (consistente com o design system).
- Tooltip em cada template no dropdown explica quando usar.
- Acessível: `aria-label`, foco visível, navegação por teclado no dropdown.

### 7. Configuração

- Templates ficam centralizados em `whatsappTemplates.ts` — fácil editar/adicionar.
- Sem novas chaves no `APP_CONFIG`. Se quiser personalizar saudação no futuro, adiciona-se `APP_CONFIG.brandName` (já implícito como "Cantinho da Roça" nos templates).

---

### Arquivos tocados

**Novos**
- `src/lib/whatsappTemplates.ts` — templates + builder de URL + sugestão automática
- `src/components/admin/WhatsAppQuickAction.tsx` — split-button reutilizável

**Modificados (só substituem o handler antigo)**
- `src/components/pipeline/LeadCard.tsx` — usa `WhatsAppQuickAction`
- `src/components/admin/LeadDetailSheet.tsx` — usa `WhatsAppQuickAction` (toolbar + telefone do header)
- `src/pages/admin/DashboardPage.tsx` — usa `WhatsAppQuickAction` no Top Leads Quentes

**Não tocados:** `interactionService` (já tem `create`), `leadService`, schema do banco, RLS, triggers, AuthContext, rotas, landing, `WhatsAppFloat` (botão público da landing — escopo diferente), login.

### Garantias

- **Sem migração** — usa `interactions` + trigger `sync_last_contact_from_interaction` já existente.
- **1 clique real** para o caso comum (template sugerido); 2 cliques para escolher template; 3 cliques para editar antes.
- Best-effort: falha ao registrar não impede o WhatsApp abrir.
- Realtime do histórico já existente reflete a nova interação na hora.
- Score de prioridade recalcula automaticamente (interação +5 pts, recência reseta).
- Respeita design system (Josefin Sans, tokens HSL, shadows, rounded-xl/2xl).

