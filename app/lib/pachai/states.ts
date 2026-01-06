/**
 * 🔴 REGRAS INVOLÁVEIS DE INFERÊNCIA
 * 
 * Regra 1: Inferência Só Sobre Mesma Conversa Ativa
 * - Inferência só acontece sobre mensagens da MESMA conversa ativa
 * - NUNCA inferir reabertura se conversation.status !== 'PAUSED'
 * - Se conversation.status === 'PAUSED', usar modo REOPENING (já implementado)
 * - Se conversation.status === 'ACTIVE', inferir estados normais
 * 
 * Regra 2: PAUSED Só Com Sinal Explícito
 * - PAUSED não é inferido pela função de inferência de estado
 * - PAUSED é gerenciado separadamente via shouldPauseConversation() na API route
 * 
 * Regra 3: Veredito Nunca é Assumido
 * - detectVeredictSignal() NUNCA muda estado sozinho
 * - Ele apenas sugere VEREDICT_CHECK
 * - A palavra final é sempre do usuário
 * 
 * Regra 4: Fallback de Segurança
 * - Em caso de ambiguidade, retornar EXPLORATION
 * - Em caso de dúvida, preferir EXPLORATION
 * - Nunca inferir estado com base em uma única frase isolada
 * 
 * Regra 5: Transições Válidas
 * - Nunca pular de EXPLORATION direto para VEREDICT_CHECK
 * - VEREDICT_CHECK só pode ser inferido se já passou por CLARIFICATION ou CONVERGENCE
 */

export enum ConversationState {
  EXPLORATION = 'EXPLORATION',
  CLARIFICATION = 'CLARIFICATION',
  CONVERGENCE = 'CONVERGENCE',
  VEREDICT_CHECK = 'VEREDICT_CHECK',
  PAUSED = 'PAUSED', // Não inferido, gerenciado separadamente
}

export interface Message {
  role: 'user' | 'pachai'
  content: string
  created_at?: string
}

export type ConversationStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED'

export interface VeredictSignal {
  suspected: boolean
  reason?: string
}

interface StateScore {
  exploration: number
  clarification: number
  convergence: number
  veredictCheck: number
  maxState: ConversationState
  maxConfidence: number
}

/**
 * Palavras-chave para cada estado
 */
const STATE_KEYWORDS = {
  CLARIFICATION: [
    'dor', 'impacto', 'afeta', 'problema', 'dificuldade', 'incomoda', 'pesa',
    'necessidade', 'desafio', 'consequência', 'importa', 'precisa'
  ],
  CONVERGENCE: [
    'talvez', 'pensando', 'seria', 'comparar', 'testar', 'opção', 'hipótese',
    'poderia', 'considerando', 'avaliando', 'testando', 'comparando'
  ],
  VEREDICT_CHECK: [
    'então', 'resumindo', 'ponto é', 'conclusão', 'fechar', 'síntese',
    'em resumo', 'chegamos', 'ficou claro', 'decisão'
  ]
}

/**
 * Analisa mensagens e retorna scores para cada estado
 */
function analyzeMessages(messages: Message[], weight: number): StateScore {
  const scores: StateScore = {
    exploration: 0,
    clarification: 0,
    convergence: 0,
    veredictCheck: 0,
    maxState: ConversationState.EXPLORATION,
    maxConfidence: 0
  }

  if (messages.length === 0) {
    scores.exploration = 1.0 * weight
    scores.maxState = ConversationState.EXPLORATION
    scores.maxConfidence = 1.0
    return scores
  }

  const allText = messages.map(m => m.content.toLowerCase()).join(' ')

  // Contar ocorrências de palavras-chave (múltiplas ocorrências aumentam score)
  let clarificationCount = 0
  let convergenceCount = 0
  let veredictCheckCount = 0

  STATE_KEYWORDS.CLARIFICATION.forEach(keyword => {
    const matches = (allText.match(new RegExp(keyword, 'gi')) || []).length
    clarificationCount += matches
  })

  STATE_KEYWORDS.CONVERGENCE.forEach(keyword => {
    const matches = (allText.match(new RegExp(keyword, 'gi')) || []).length
    convergenceCount += matches
  })

  STATE_KEYWORDS.VEREDICT_CHECK.forEach(keyword => {
    const matches = (allText.match(new RegExp(keyword, 'gi')) || []).length
    veredictCheckCount += matches
  })

  // Calcular scores (normalizar por número de mensagens)
  const messageCount = messages.length
  scores.clarification = (clarificationCount / Math.max(messageCount, 1)) * weight
  scores.convergence = (convergenceCount / Math.max(messageCount, 1)) * weight
  scores.veredictCheck = (veredictCheckCount / Math.max(messageCount, 1)) * weight

  // EXPLORATION é o padrão (score base)
  scores.exploration = 0.5 * weight

  // Encontrar estado com maior score
  const stateScores = [
    { state: ConversationState.EXPLORATION, score: scores.exploration },
    { state: ConversationState.CLARIFICATION, score: scores.clarification },
    { state: ConversationState.CONVERGENCE, score: scores.convergence },
    { state: ConversationState.VEREDICT_CHECK, score: scores.veredictCheck }
  ]

  const max = stateScores.reduce((prev, curr) => 
    curr.score > prev.score ? curr : prev
  )

  scores.maxState = max.state
  scores.maxConfidence = max.score / weight // Normalizar confiança

  return scores
}

/**
 * Combina scores de mensagens recentes e antigas
 */
function combineScores(recentScore: StateScore, olderScore: StateScore): StateScore {
  const totalWeight = recentScore.maxConfidence * 3 + olderScore.maxConfidence * 1
  const weight = totalWeight > 0 ? totalWeight : 1

  return {
    exploration: (recentScore.exploration + olderScore.exploration) / weight,
    clarification: (recentScore.clarification + olderScore.clarification) / weight,
    convergence: (recentScore.convergence + olderScore.convergence) / weight,
    veredictCheck: (recentScore.veredictCheck + olderScore.veredictCheck) / weight,
    maxState: ConversationState.EXPLORATION,
    maxConfidence: 0
  }
}

/**
 * Aplica regras de transição invioláveis
 */
function applyTransitionRules(
  score: StateScore,
  previousState: ConversationState | null,
  veredictSignal?: VeredictSignal
): ConversationState {
  // Recalcular maxState e maxConfidence após combinação
  const stateScores = [
    { state: ConversationState.EXPLORATION, score: score.exploration },
    { state: ConversationState.CLARIFICATION, score: score.clarification },
    { state: ConversationState.CONVERGENCE, score: score.convergence },
    { state: ConversationState.VEREDICT_CHECK, score: score.veredictCheck }
  ]

  const max = stateScores.reduce((prev, curr) => 
    curr.score > prev.score ? curr : prev
  )

  score.maxState = max.state
  score.maxConfidence = max.score

  const threshold = 0.3 // Threshold mínimo para considerar um estado

  // REGRA INVOLÁVEL 4: Em caso de ambiguidade, EXPLORATION
  if (score.maxConfidence < 0.6) {
    return ConversationState.EXPLORATION
  }

  // REGRA INVOLÁVEL 5: Nunca pular de EXPLORATION direto para VEREDICT_CHECK
  if (previousState === ConversationState.EXPLORATION && 
      score.veredictCheck > threshold) {
    // Se há sinal de veredito mas veio de EXPLORATION, ir para CLARIFICATION primeiro
    if (score.clarification > score.convergence) {
      return ConversationState.CLARIFICATION
    }
    return ConversationState.CONVERGENCE
  }

  // VEREDICT_CHECK só se já passou por CLARIFICATION ou CONVERGENCE
  if (score.veredictCheck > threshold) {
    const canReachVeredict = previousState === ConversationState.CLARIFICATION ||
                             previousState === ConversationState.CONVERGENCE ||
                             veredictSignal?.suspected === true

    if (canReachVeredict) {
      return ConversationState.VEREDICT_CHECK
    }
    // Se não pode, continuar no estado atual ou ir para CONVERGENCE
    return previousState || ConversationState.CONVERGENCE
  }

  // Retornar estado com maior score
  return score.maxState
}

/**
 * Infere o estado atual da conversa baseado no histórico de mensagens
 * 
 * REGRAS INVOLÁVEIS:
 * - Recebe conversationStatus obrigatório para garantir que não infere reabertura incorretamente
 * - Se conversationStatus === 'PAUSED', lança erro (reabertura é gerenciada separadamente)
 * - Nunca infere baseado em uma única frase isolada
 * - Em caso de ambiguidade, retorna EXPLORATION
 */
export function inferConversationStateFromMessages(
  messages: Message[],
  conversationStatus: ConversationStatus,
  veredictSignal?: VeredictSignal,
  previousState?: ConversationState | null
): ConversationState {
  // REGRA INVOLÁVEL 1: Se conversa está pausada, não inferir estados normais
  if (conversationStatus === 'PAUSED') {
    throw new Error('Cannot infer state for paused conversation. Use REOPENING mode.')
  }

  const userMessages = messages.filter(m => m.role === 'user')

  // REGRA INVOLÁVEL 4: Fallback EXPLORATION se menos de 2 mensagens
  if (userMessages.length < 2) {
    return ConversationState.EXPLORATION
  }

  // REGRA INVOLÁVEL 4: Nunca inferir baseado em uma única frase
  // Requer pelo menos 2 mensagens para qualquer estado além de EXPLORATION

  // Últimas 3 mensagens do usuário (peso maior)
  const recentUserMessages = userMessages.slice(-3)
  const olderMessages = userMessages.slice(0, -3)

  // Analisar padrões nas últimas 3 mensagens (peso 3x)
  const recentScore = analyzeMessages(recentUserMessages, 3.0)

  // Analisar padrões no histórico anterior (peso 1x)
  const olderScore = analyzeMessages(olderMessages, 1.0)

  // Combinar scores
  const finalScore = combineScores(recentScore, olderScore)

  // REGRA INVOLÁVEL 3: detectVeredictSignal apenas sugere, não força
  // REGRA INVOLÁVEL 5: Aplicar regras de transição
  return applyTransitionRules(finalScore, previousState || null, veredictSignal)
}

/**
 * Infere o estado da conversa a partir do histórico (string)
 * Wrapper para compatibilidade com prompts.ts
 * 
 * @param conversationHistory Histórico da conversa como string
 * @param conversationStatus Status da conversa (obrigatório)
 * @param veredictSignal Sinal de veredito opcional
 */
export function inferConversationState(
  conversationHistory: string,
  conversationStatus: ConversationStatus,
  veredictSignal?: VeredictSignal
): 'exploration' | 'clarification' | 'convergence' | 'veredict_check' | 'pause' {
  // REGRA INVOLÁVEL 1: Se conversa está pausada, não inferir estados normais
  if (conversationStatus === 'PAUSED') {
    // Retornar 'pause' para compatibilidade, mas isso não deve ser usado
    // REOPENING mode deve ser usado quando status === 'PAUSED'
    return 'pause'
  }

  // Converter string history para Message[]
  const lines = conversationHistory.split('\n').filter(line => line.trim())
  const messages: Message[] = lines.map(line => {
    if (line.toLowerCase().startsWith('usuário:') || line.toLowerCase().startsWith('user:')) {
      return {
        role: 'user' as const,
        content: line.replace(/^(usuário|user):\s*/i, '').trim()
      }
    } else if (line.toLowerCase().startsWith('pachai:') || line.toLowerCase().startsWith('assistant:')) {
      return {
        role: 'pachai' as const,
        content: line.replace(/^(pachai|assistant):\s*/i, '').trim()
      }
    }
    // Se não tem prefixo, assumir que é mensagem do usuário (fallback)
    return {
      role: 'user' as const,
      content: line.trim()
    }
  }).filter(m => m.content.length > 0)

  // Chamar função principal
  const state = inferConversationStateFromMessages(messages, conversationStatus, veredictSignal)

  // Converter enum para string compatível com prompts.ts
  const stateMap: Record<ConversationState, 'exploration' | 'clarification' | 'convergence' | 'veredict_check' | 'pause'> = {
    [ConversationState.EXPLORATION]: 'exploration',
    [ConversationState.CLARIFICATION]: 'clarification',
    [ConversationState.CONVERGENCE]: 'convergence',
    [ConversationState.VEREDICT_CHECK]: 'veredict_check',
    [ConversationState.PAUSED]: 'pause'
  }

  return stateMap[state]
}
