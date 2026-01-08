# Implementação: Contexto Cognitivo do Produto

## Data: 2024

## Visão Geral

Implementação completa do sistema de Contexto Cognitivo do Produto, um artefato central, vivo e compartilhado que elimina a necessidade de recontextualização manual a cada nova conversa.

## Decisões de Produto Implementadas

- ✅ Conversas são sempre privadas e nunca compartilhadas
- ✅ Vereditos são decisões deliberadas e compartilhadas
- ✅ Contexto Cognitivo não é conversa, não é anexo, não é histórico
- ✅ Nada é atualizado automaticamente por inferência
- ✅ Toda criação ou atualização exige confirmação explícita
- ✅ Governança baseada em papéis (owner, editor, viewer)

## Componentes Implementados

### 1. Banco de Dados

#### Migração 009: `product_contexts`
- Tabela para armazenar contexto cognitivo do produto
- Campos: id, product_id, content_text, embedding, change_reason, updated_at, updated_by
- Políticas RLS baseadas em papéis
- Índices para performance

#### Migração 010: `product_members`
- Tabela para gerenciar papéis de usuários em produtos
- Campos: id, product_id, user_id, role, created_at, created_by
- Trigger automático para criar owner ao criar produto
- Migração de dados para produtos existentes

### 2. Tipos TypeScript

- Interfaces atualizadas em `app/lib/types/database.ts`
- Tipos para `product_contexts` e `product_members`
- Suporte para embedding como string (compatibilidade)

### 3. Funções de Acesso

#### `app/lib/pachai/roles.ts`
- `getUserProductRole()`: Obtém papel do usuário
- `canEditContext()`: Verifica permissão de edição
- `canViewContext()`: Verifica permissão de visualização
- `canCreateVeredict()`: Verifica permissão para criar vereditos

#### `app/lib/pachai/product-context.ts`
- `getProductContext()`: Busca contexto do produto
- `hasProductContext()`: Verifica existência de contexto
- `createProductContext()`: Cria contexto inicial
- `updateProductContext()`: Atualiza contexto existente
- Todas com validação de papéis

### 4. Runtime

#### `app/lib/pachai/runtime.ts`
- Modificado `buildContextString()` para incluir contexto no topo
- Ordem de contexto: Contexto Cognitivo → Vereditos Globais → Vereditos do Produto → Anexos → Mensagens
- Função `getVeredictsSeparated()` para separar vereditos
- Integração com detecção de consolidação

#### `app/lib/pachai/context-detection.ts`
- `shouldSuggestContextConsolidation()`: Detecta quando sugerir consolidação
- Critérios: primeira conversa + conteúdo suficiente + sem contexto existente

### 5. Prompts

#### `app/lib/pachai/prompts.ts`
- Instrução adicionada ao prompt de exploration
- Pergunta explícita sobre consolidação quando apropriado
- Nunca assume ou cria automaticamente

### 6. API Endpoints

#### `app/api/product-contexts/route.ts`
- GET: Busca contexto do produto
- POST: Cria contexto inicial (apenas owner/editor)
- PUT: Atualiza contexto existente (apenas owner/editor)
- Validação de `change_reason` obrigatório

#### `app/api/product-contexts/consolidate/route.ts`
- POST: Consolida contexto usando LLM
- Nunca salva automaticamente
- Retorna preview editável
- Suporta consolidação inicial e atualização com veredito

### 7. Componentes de UI

#### `app/components/chat/ContextConsolidationForm.tsx`
- Formulário para consolidação inicial
- Preview editável antes de salvar
- Campo `change_reason` obrigatório

#### `app/components/chat/ContextUpdateAfterVeredictForm.tsx`
- Formulário para atualização após veredito
- Incorpora novo veredito ao contexto
- Preview editável

#### `app/components/product/ProductContextEditor.tsx`
- Exibição do contexto na página do produto
- Edição manual (apenas owner/editor)
- Modal com validações

### 8. Integração no Chat

#### `app/components/chat/ChatInterface.tsx`
- Detecção de sugestão de consolidação
- Exibição de formulários quando apropriado
- Fluxo após criação de veredito

#### `app/api/pachai/route.ts`
- Detecção de padrões de sugestão de consolidação
- Retorno de flag `suggestContextConsolidation`

### 9. Governança

#### `app/lib/pachai/governance.ts`
- `validateContextUpdate()`: Valida atualizações
- `validateChangeReason()`: Valida motivo obrigatório
- `logContextAudit()`: Logs de auditoria
- `validateGovernanceRules()`: Validação de segurança

## Fluxos Implementados

### 1. Criação Inicial do Contexto
1. Usuário cria produto → Owner é criado automaticamente
2. Primeira conversa → Usuário despeja entendimento
3. Agente pergunta sobre consolidação
4. Se confirmado → Preview editável → Salva com `change_reason`

### 2. Atualização Após Veredito
1. Usuário cria veredito
2. Sistema verifica se existe contexto
3. Se existe → Pergunta sobre atualização
4. Se confirmado → Consolida com novo veredito → Preview → Salva

### 3. Edição Manual
1. Usuário acessa página do produto
2. Vê contexto atual (se existir)
3. Clica em "Editar" (apenas owner/editor)
4. Edita texto e motivo → Salva

## Regras de Governança Implementadas

- ✅ NUNCA atualizar contexto automaticamente
- ✅ SEMPRE exigir confirmação explícita
- ✅ SEMPRE mostrar preview antes de salvar (quando aplicável)
- ✅ SEMPRE registrar `updated_by` e `updated_at`
- ✅ SEMPRE exigir `change_reason`
- ✅ BLOQUEAR qualquer tentativa de bypass

## Validações Implementadas

- Validação de papéis em todas as operações
- Validação de campos obrigatórios
- Validação de tamanho máximo (10.000 caracteres para contexto)
- Validação de `change_reason` não vazio
- Validação de permissões via RLS + código

## Compatibilidade

- Produtos existentes começam sem contexto
- Owner original é migrado automaticamente para `product_members`
- Fallback para ownership técnico quando necessário
- Embedding como TEXT para compatibilidade (vector opcional)

## Próximos Passos (Futuro)

- UI de compartilhamento de produtos
- Versionamento do contexto
- Busca semântica usando embeddings
- Histórico de alterações do contexto
- Propostas de mudança para viewers

## Arquivos Criados/Modificados

### Criados
- `supabase/migrations/009_add_product_contexts.sql`
- `supabase/migrations/010_add_product_members.sql`
- `app/lib/pachai/roles.ts`
- `app/lib/pachai/product-context.ts`
- `app/lib/pachai/context-detection.ts`
- `app/lib/pachai/governance.ts`
- `app/api/product-contexts/route.ts`
- `app/api/product-contexts/consolidate/route.ts`
- `app/components/chat/ContextConsolidationForm.tsx`
- `app/components/chat/ContextUpdateAfterVeredictForm.tsx`
- `app/components/product/ProductContextEditor.tsx`

### Modificados
- `app/lib/types/database.ts`
- `app/lib/pachai/runtime.ts`
- `app/lib/pachai/prompts.ts`
- `app/api/pachai/route.ts`
- `app/components/chat/ChatInterface.tsx`
- `app/(dashboard)/products/[productId]/page.tsx`

## Testes Recomendados

1. Criar produto e verificar owner em `product_members`
2. Primeira conversa e sugestão de consolidação
3. Consolidação e salvamento com `change_reason`
4. Criação de veredito e atualização de contexto
5. Edição manual do contexto
6. Validação de permissões (owner, editor, viewer)
7. Validação de `change_reason` obrigatório
8. Verificação de RLS policies

## Notas Técnicas

- Extensão `vector` é opcional (fallback para TEXT)
- Trigger automático cria owner ao criar produto
- Migração de dados para produtos existentes
- Compatibilidade com estrutura atual mantida
- Logs de auditoria implementados
