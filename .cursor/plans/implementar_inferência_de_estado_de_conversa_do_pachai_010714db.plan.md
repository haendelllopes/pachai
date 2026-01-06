---
name: Implementar inferência de estado de conversa do Pachai
overview: Implementar sistema robusto de inferência de estado que analisa todo o histórico da conversa, dando peso às últimas 3 mensagens do usuário, seguindo critérios específicos para cada estado e garantindo comportamento conservador.
todos:
  - id: "1"
    content: Unificar sistema de estados em states.ts criando enum ConversationState único
    status: pending
  - id: "2"
    content: Implementar função analyzeMessages() para analisar padrões em mensagens com peso
    status: pending
    dependencies:
      - "1"
  - id: "3"
    content: Refatorar inferConversationStateFromMessages() com algoritmo de inferência robusto
    status: pending
    dependencies:
      - "2"
  - id: "4"
    content: Implementar regras de transição (nunca EXPLORATION -> VEREDICT_CHECK direto)
    status: pending
    dependencies:
      - "3"
  - id: "5"
    content: Atualizar wrapper inferConversationState() para compatibilidade com prompts.ts
    status: pending
    dependencies:
      - "3"
  - id: "6"
    content: Adicionar estado 'veredict_check' em prompts.ts
    status: pending
    dependencies:
      - "1"
  - id: "7"
    content: Atualizar runtime.ts para usar inferência melhorada diretamente
    status: pending
    dependencies:
      - "3"
      - "6"
  - id: "8"
    content: Integrar detectVeredictSignal na inferência de VEREDICT_CHECK
    status: pending
    dependencies:
      - "3"
---

# Implementação de

Inferência de Estado de Conversa

## Objetivo

Criar sistema de inferência de estado que orienta o comportamento do agente sem assumir intenções ou tomar decisões pelo usuário.

## Análise do Estado Atual

### Problemas Identificados:

1. **Duplicação de tipos de estado**: 

- `ConversationState` enum em `states.ts` (português: EXPLORACAO, CLAREAMENTO)
- `ConversationState` type em `prompts.ts` (inglês: 'exploration', 'clarification')

2. **Duas funções de inferência diferentes**:

- `inferConversationStateFromMessages()` retorna `StateTendency` (primary/secondary)
- `inferConversationState()` retorna estado simples (string)

3. **Lógica atual é simplista**:

- Baseada apenas em keywords
- Não considera peso das últimas mensagens
- Não segue critérios específicos por estado

## Mudanças Necessárias

### 1. Unificar Sistema de Estados

**Arquivo**: `app/lib/pachai/states.ts`

- Criar enum único `ConversationState` com valores em inglês:
- `EXPLORATION`
- `CLARIFICATION`
- `CONVERGENCE`
- `VEREDICT_CHECK` (renomear de 'veredict')
- `PAUSED`
- Remover estados duplicados
- Manter compatibilidade com `prompts.ts`

### 2. Refatorar Função de Inferência Principal

**Arquivo**: `app/lib/pachai/states.ts`

- Refatorar `inferConversationStateFromMessages()` para:
- Considerar TODO o histórico da conversa
- Dar peso 3x maior às últimas 3 mensagens do usuário
- Nunca inferir baseado em uma única frase isolada
- Retornar apenas um estado (não StateTendency)
- Implementar critérios específicos por estado

### 3. Implementar Critérios por Estado

**EXPLORATION:**

- Linguagem vaga ou inicial
- Descreve situação sem impacto claro
- Nenhuma tentativa de decisão ou solução
- Default quando não há certeza

**CLARIFICATION:**

- Menciona dor, impacto ou consequência
- Explica por que algo importa
- Ainda sem testar soluções
- Palavras-chave: "dor", "impacto", "afeta", "problema", "dificuldade"

**CONVERGENCE:**

- Testa ideias ou caminhos
- Compara opções
- Linguagem de hipótese ("talvez", "estou pensando em", "seria")
- Palavras-chave: "talvez", "pensando", "seria", "comparar", "testar"

**VEREDICT_CHECK:**

- Demonstra fechamento implícito
- Frases de síntese ("então o ponto é...", "resumindo")
- Ou `detectVeredictSignal` retorna `suspected: true`
- IMPORTANTE: só pode ser inferido se já passou por CLARIFICATION ou CONVERGENCE
- Nunca pode vir diretamente de EXPLORATION

**PAUSED:**

- Usuário explicitamente pede pausa (via `shouldPauseConversation`)
- Não inferido automaticamente

### 4. Algoritmo de Inferência

```typescript
function inferConversationStateFromMessages(messages: Message[]): ConversationState {
  const userMessages = messages.filter(m => m.role === 'user')
  
  // Se menos de 2 mensagens do usuário, sempre EXPLORATION
  if (userMessages.length < 2) {
    return ConversationState.EXPLORATION
  }
  
  // Últimas 3 mensagens do usuário (peso maior)
  const recentUserMessages = userMessages.slice(-3)
  const olderMessages = userMessages.slice(0, -3)
  
  // Analisar padrões nas últimas 3 mensagens (peso 3x)
  const recentScore = analyzeMessages(recentUserMessages, 3.0)
  
  // Analisar padrões no histórico anterior (peso 1x)
  const olderScore = analyzeMessages(olderMessages, 1.0)
  
  // Combinar scores
  const finalScore = combineScores(recentScore, olderScore)
  
  // Aplicar regras de transição
  return applyTransitionRules(finalScore, previousState)
}
```



### 5. Regras de Transição Obrigatórias

- Nunca pular de EXPLORATION direto para VEREDICT_CHECK
- Em caso de dúvida, preferir EXPLORATION
- VEREDICT_CHECK só pode ser inferido se:
- Já passou por CLARIFICATION ou CONVERGENCE anteriormente
- OU `detectVeredictSignal` retorna `suspected: true`

### 6. Atualizar Wrapper para Compatibilidade

**Arquivo**: `app/lib/pachai/states.ts`

- Manter `inferConversationState(conversationHistory: string)` como wrapper
- Converter string history para Message[] e chamar função principal
- Retornar estado compatível com `prompts.ts`

### 7. Integrar com Runtime

**Arquivo**: `app/lib/pachai/runtime.ts`

- Usar `inferConversationStateFromMessages()` diretamente com histórico completo
- Remover conversão desnecessária para string

### 8. Atualizar Prompts

**Arquivo**: `app/lib/pachai/prompts.ts`

- Adicionar estado `veredict_check` (além de `veredict` existente)
- Garantir que prompts estejam alinhados com novos critérios

## Estrutura de Arquivos

```javascript
app/lib/pachai/
├── states.ts (refatorado)
│   ├── ConversationState enum
│   ├── inferConversationStateFromMessages() (principal)
│   ├── inferConversationState() (wrapper)
│   └── Funções auxiliares de análise
├── prompts.ts (atualizado)
│   └── Adicionar 'veredict_check' ao tipo
└── runtime.ts (atualizado)
    └── Usar inferência melhorada
```



## Critérios de Sucesso

- Inferência considera todo histórico mas dá peso às últimas 3 mensagens
- Nunca infere baseado em uma única frase
- Estados seguem critérios específicos definidos
- Comportamento conservador (preferir EXPLORATION em dúvida)
- Nunca pula de EXPLORATION direto para VEREDICT_CHECK