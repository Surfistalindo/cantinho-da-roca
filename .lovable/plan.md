

## Plano: Padronização total de ícones com Font Awesome

Auditoria do CRM: o app **já usa Font Awesome** em 100% do código de produto (Sidebar, Navbar, Dashboard, Leads, Pipeline, Sheets, Timeline, WhatsApp, Score). Sobraram apenas **3 pontos residuais** com emoji ou lucide. Esta tarefa fecha o gap e formaliza o padrão.

---

### 1. Remover emojis do `LeadFilters.tsx`

Substituir os emojis 🔥 🌤 ❄ do select de prioridade por ícones FA inline coerentes com o `LeadScoreBadge`:

- `🔥 Quentes` → `faFire` (text-destructive)
- `🌤 Mornos` → `faCircleHalfStroke` (text-warning)
- `❄ Frios` → `faSnowflake` (text-muted-foreground)

Cada `SelectItem` ganha um `<FontAwesomeIcon className="h-3 w-3 mr-2" />` mantendo o mesmo label.

### 2. Migrar `src/pages/AdminLogin.tsx` para Font Awesome

Trocar todos os imports `lucide-react` por equivalentes FA:

| Lucide atual | Font Awesome |
|---|---|
| `ArrowLeft` | `faArrowLeft` |
| `ArrowRight` | `faArrowRight` |
| `Eye` / `EyeOff` | `faEye` / `faEyeSlash` |
| `Loader2` (spin) | `faSpinner` com `spin` prop |
| `Mail` | `faEnvelope` |
| `Lock` | `faLock` |
| `Copy` | `faCopy` |
| `Check` | `faCheck` |

Mantém tamanhos atuais (`h-4 w-4`, `h-5 w-5`) via `className`. Animação do loader: `<FontAwesomeIcon icon={faSpinner} spin />`.

### 3. Migrar `src/pages/AdminDashboard.tsx` (legacy) para Font Awesome

Mesma estratégia:

| Lucide | Font Awesome |
|---|---|
| `LogOut` | `faArrowRightFromBracket` |
| `Users` | `faUserGroup` |
| `BarChart3` | `faChartColumn` |
| `MessageSquare` | `faCommentDots` |

Como os ícones são passados por referência no array `cards`, trocamos para `IconDefinition` + render via `<FontAwesomeIcon icon={c.icon} />`.

### 4. Convenção e tamanhos padronizados (sem refatorar tudo)

Documentar e aplicar a convenção já vigente em todos os lugares novos/tocados:

- **Ações em botão (sm)**: `h-3.5 w-3.5`
- **Ações em botão (md)**: `h-4 w-4`
- **Ícones em headers/labels**: `h-3 w-3` ou `h-3.5 w-3.5`
- **Avatares de KPI**: `h-5 w-5` dentro de quadrado `h-11 w-11`
- **Timeline dots**: `h-3 w-3` no marcador `h-7 w-7`
- **Fonte única de tipos de interação**: `src/lib/interactionTypes.ts` (já existe — nenhuma mudança)

### 5. `src/components/ui/*` (shadcn primitives) — mantidos

Os ícones `lucide-react` em `accordion`, `dialog`, `select`, `dropdown-menu`, `checkbox`, `command`, `pagination`, `breadcrumb`, `sheet`, `toast`, `carousel`, `sidebar`, `radio-group`, `context-menu`, `menubar`, `navigation-menu`, `input-otp`, `resizable` são **partes internas dos primitivos** (chevrons de select, X de dialog, check de checkbox, etc.). São ícones decorativos invisíveis ao usuário em termos de "identidade" e trocar quebra contratos do shadcn sem ganho visual. **Mantemos como estão** — o usuário só vê ícones FA na superfície da aplicação.

### 6. Landing page — fora de escopo

A landing já usa Font Awesome (Footer, Navbar, Benefits, Testimonials). Os emojis 🌿/😊 em `Footer.tsx`, `WhatsAppFloat.tsx` e `LeadFormSection.tsx` são **copy de marca** (texto promocional, não ícones de UI) — não são alterados. A pergunta foca no CRM.

---

### Arquivos tocados

- `src/components/admin/LeadFilters.tsx` — remove emojis, adiciona FA
- `src/pages/AdminLogin.tsx` — lucide → FA (8 ícones)
- `src/pages/AdminDashboard.tsx` — lucide → FA (4 ícones)

**Não tocados:** componentes shadcn em `src/components/ui/*`, landing page, services, hooks, schema, AuthContext, rotas.

### Garantias

- Zero mudança funcional — apenas substituição de ícones.
- Zero nova dependência (FA já instalado).
- Mesma identidade visual e tamanhos consistentes com o resto do CRM.
- Após a aplicação, **100% dos ícones visíveis ao usuário no CRM são Font Awesome**.

