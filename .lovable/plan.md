

## Análise: O formulário já está funcional

Após revisar o código, o fluxo de captação de leads **já está implementado e funcional**:

1. **Formulário → Banco**: `LeadFormSection.tsx` já insere diretamente na tabela `leads` via Supabase SDK (linha 53-58)
2. **Validação client-side**: Nome obrigatório, telefone com máscara e validação de formato (10-11 dígitos)
3. **Sanitização**: Telefone é limpo (`replace(/\D/g, '')`), nome é trimado
4. **Feedback visual**: Toast de sucesso/erro já implementado (linhas 61, 67)
5. **RLS**: Tabela `leads` permite INSERT para `anon` e `authenticated` — funciona sem login
6. **SQL Injection**: Impossível — Supabase SDK usa queries parametrizadas internamente
7. **Dados chegam no CRM**: `leadService.ts` lista os leads para o painel admin

### O que pode ser melhorado

| Melhoria | Descrição |
|----------|-----------|
| **Validação de nome** | Adicionar tamanho mínimo (2 caracteres) |
| **Proteção contra duplicidade** | Verificar se telefone já existe antes de inserir |
| **Redirecionamento WhatsApp** | Após envio com sucesso, oferecer abrir WhatsApp |
| **Rate limiting** | Prevenir spam de submissões repetidas |
| **Campo de mensagem** | Adicionar campo opcional de mensagem/observação (mapear para `notes`) |

### Arquivos editados
- `src/components/landing/LeadFormSection.tsx` — Validação aprimorada, check de duplicidade, redirect WhatsApp pós-envio, campo de mensagem, rate limiting básico

### O que NÃO muda
- Tabela `leads` no banco (já tem a estrutura correta)
- RLS policies (já configuradas)
- `leadService.ts` (já funcional para o CRM)
- Nenhum endpoint separado necessário — Supabase SDK conecta direto ao banco com segurança

