# Vereditos Fundadores do Pachai

## O que são Vereditos Fundadores?

Vereditos fundadores são regras não negociáveis que definem o comportamento do Pachai. Eles:

- **NÃO são prompts** - não são instruções para o LLM
- **NÃO são estados** - não definem estados da conversa
- **NÃO são heurísticas** - não dependem de inferências fracas
- **NÃO são configuração leve** - não podem ser ignorados ou sobrescritos

São **regras duras de governança comportamental** que têm precedência absoluta sobre prompts e estados.

## Princípio Meta

**Vereditos fundadores existem para impedir comportamentos errados, não para ditar comportamentos corretos.**

O sistema bloqueia caminhos errados através de guards determinísticos, mas nunca força caminhos específicos através de overrides agressivos.

## Camadas de Precedência

A ordem obrigatória de aplicação é:

```
1. Vereditos Fundadores (governança)
   ↓
2. Guards Cognitivos (bloqueios)
   ↓
3. Inferência de Estado
   ↓
4. Prompts por Estado
   ↓
5. Construção de Contexto
   ↓
6. Resposta do LLM
```

## Lista de Vereditos Fundadores

### 1. MEMORY_SHARING - Isolamento de Memória entre Conversas

**Regra**: "Apenas vereditos e contexto cognitivo são compartilhados entre conversas."

**Fase**: `pre_context`

**Ação**: Bloquear qualquer tentativa de injetar mensagens históricas de outras conversas no contexto atual.

**Exemplo de violação**: Tentar incluir mensagens de uma conversa anterior na construção de contexto de uma nova conversa.

**Como é tratada**: O sistema garante que apenas mensagens da conversa atual são incluídas no contexto enviado ao LLM.

---

### 2. EXTERNAL_SEARCH_CONSCIOUS - Busca Externa Consciente

**Regra**: "Informações externas só entram por decisão explícita e nunca se tornam verdade automaticamente."

**Fases**: `pre_context`, `pre_prompt`

**Ação**: 
- Bloquear SearchContext sem confirmação explícita do usuário
- Bloquear elevação automática de resultados de busca para contexto ou veredito

**Exemplo de violação**: 
- Usar resultados de busca sem confirmação explícita do usuário
- Tratar resultados de busca como verdade absoluta

**Como é tratada**: 
- SearchContext só existe quando confirmado explicitamente pelo usuário
- Resultados de busca são marcados como referências temporárias, nunca como verdade

---

### 3. REACTIVE_BEHAVIOR - Comportamento Reativo

**Regra**: "O Pachai reage a atos de fala e não faz perguntas por reflexo."

**Fase**: `pre_prompt`

**Ação**: Bloquear prompts que forcem reformulação ou gerem perguntas automáticas.

**Exemplo de violação**: 
- Prompt que força o Pachai a perguntar "você pode reformular isso?"
- Prompt que gera perguntas automáticas sem ganho cognitivo claro

**Como é tratada**: O sistema detecta padrões reflexivos no prompt e os remove antes de enviar ao LLM.

---

### 4. CLOSURE_RECOGNITION - Reconhecimento de Fechamento

**Regra**: "Declarações de fechamento devem ser reconhecidas e não exploradas."

**Fases**: `pre_prompt`, `post_response`

**Ação**: 
- Bloquear prompts que reabram discussão após sinal de fechamento
- Validar resposta final para garantir reconhecimento explícito

**Exemplo de violação**: 
- Após usuário dizer "esse é o conceito", prompt que sugere "mas e se considerarmos também..."
- Resposta que não reconhece explicitamente o fechamento

**Como é tratada**: 
- Prompts que tentam reabrir discussão são bloqueados
- Respostas são validadas para garantir reconhecimento explícito de fechamento

---

### 5. EXPLICIT_CONTEXT_EVOLUTION - Evolução Explícita de Contexto

**Regra**: "O entendimento do produto só evolui por decisão explícita, nunca por inferência automática."

**Fase**: `pre_context`

**Ação**: Bloquear qualquer atualização de contexto sem confirmação explícita do usuário.

**Exemplo de violação**: Tentar atualizar o contexto cognitivo do produto automaticamente sem confirmação do usuário.

**Como é tratada**: Todas as atualizações de contexto requerem confirmação explícita através do fluxo de UI.

---

### 6. VEREDICT_META - Princípio Meta dos Vereditos

**Regra**: "Vereditos fundadores existem para impedir comportamentos errados, não para ditar comportamentos corretos."

**Fase**: `pre_prompt` (aplicado como princípio orientador)

**Ação**: Garantir que enforcement sempre bloqueia, nunca força.

**Exemplo de violação**: Tentar usar vereditos para forçar um comportamento específico em vez de bloquear comportamentos ruins.

**Como é tratada**: O sistema sempre bloqueia violações, mas nunca força estados ou comportamentos específicos.

## Como Propor Novos Vereditos

Novos vereditos fundadores devem:

1. **Ser não negociáveis** - regras fundamentais que não podem ser violadas
2. **Ter enforcement determinístico** - não depender de LLM ou heurísticas fracas
3. **Bloquear erros, não forçar acertos** - seguir o princípio meta
4. **Ter precedência sobre prompts e estados** - sempre vencer conflitos

Processo de adição:

1. Documentar o veredito proposto neste arquivo
2. Criar migração SQL para inserir no banco
3. Implementar enforcement no módulo `foundational-governance.ts`
4. Adicionar testes de conformidade
5. Atualizar esta documentação

## Processo de Versionamento

- Cada veredito tem campo `version` no banco de dados
- Mudanças em vereditos existentes criam nova versão
- Versões antigas são mantidas para auditoria
- Campo `is_active` controla qual versão está ativa
- Vereditos não podem ser deletados, apenas desativados

## Exemplos de Violações e Tratamento

### Violação 1: Pergunta Reflexiva

**Cenário**: Prompt contém "você pode reformular o que acabou de dizer?"

**Detecção**: `REACTIVE_BEHAVIOR` detecta padrão reflexivo

**Tratamento**: Padrão removido do prompt antes de enviar ao LLM

**Resultado**: Prompt limpo é enviado, sem pergunta reflexiva

---

### Violação 2: Reabertura após Fechamento

**Cenário**: Usuário diz "esse é o conceito", mas prompt sugere "mas e se considerarmos também..."

**Detecção**: `CLOSURE_RECOGNITION` detecta sinal de fechamento + padrão de reabertura

**Tratamento**: Prompt bloqueado, não enviado ao LLM

**Resultado**: Sistema retorna erro de violação

---

### Violação 3: Busca sem Confirmação

**Cenário**: Tentativa de usar SearchContext sem confirmação explícita

**Detecção**: `EXTERNAL_SEARCH_CONSCIOUS` valida que SearchContext só existe se confirmado

**Tratamento**: SearchContext removido do contexto

**Resultado**: Contexto enviado sem resultados de busca

## Auditoria

Todas as violações são registradas na tabela `veredict_audit` com:

- Código do veredito violado
- Fase em que foi detectada
- Se foi bloqueada ou apenas detectada
- Detalhes do contexto da violação

Na Fase 1, a auditoria é apenas para logging. Auditoria avançada (relatórios, CI bloqueante) fica para Fase 2.

## Sincronização com Banco de Dados

Este documento deve estar sincronizado com a tabela `global_veredicts` no banco de dados.

Script opcional `scripts/validate-veredicts-sync.js` pode ser usado para validar sincronização (não bloqueante).
