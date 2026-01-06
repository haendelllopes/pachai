export enum ConversationState {
  EXPLORACAO = 'EXPLORACAO',
  CLAREAMENTO = 'CLAREAMENTO',
  CONVERGENCIA = 'CONVERGENCIA',
  PAUSA = 'PAUSA',
  REABERTURA = 'REABERTURA',
}

export interface StateTendency {
  primary: ConversationState
  confidence: number
  secondary?: ConversationState
}

export interface Message {
  role: 'user' | 'pachai'
  content: string
  created_at?: string
}

/**
 * Infere o estado atual da conversa como tendência, não como rótulo fixo.
 * Retorna objeto com primary e confidence para lidar com ambiguidade natural.
 */
export function inferConversationStateFromMessages(
  messages: Message[],
  previousVeredicts: Array<{ created_at: string; pain: string; value: string }> = []
): StateTendency {
  const userMessages = messages.filter(m => m.role === 'user')
  const pachaiMessages = messages.filter(m => m.role === 'pachai')
  
  // Se não há mensagens, começa em Exploração
  if (userMessages.length === 0) {
    return {
      primary: ConversationState.EXPLORACAO,
      confidence: 1.0,
    }
  }

  // NOTA: Reabertura não é mais inferida aqui
  // Reabertura só acontece quando conversation.status === 'PAUSED'
  // Esta função infere apenas estados de pensamento (exploration, clarification, convergence, etc.)

  // Se há poucas mensagens (1-3), provavelmente está em Exploração
  if (userMessages.length <= 3) {
    return {
      primary: ConversationState.EXPLORACAO,
      confidence: 0.8,
      secondary: ConversationState.CLAREAMENTO,
    }
  }

  // Analisar padrões nas últimas mensagens para determinar estado
  const recentMessages = messages.slice(-6)
  const recentUserMessages = recentMessages.filter(m => m.role === 'user')
  const recentPachaiMessages = recentMessages.filter(m => m.role === 'pachai')

  // Detectar padrões de Clareamento (perguntas sobre dor, impacto, contexto)
  const clareamentoKeywords = [
    'dor', 'incomoda', 'problema', 'impacto', 'acontece se', 'valor', 'espera',
    'precisa', 'necessidade', 'dificuldade', 'desafio'
  ]
  const hasClareamentoSignals = recentUserMessages.some(msg =>
    clareamentoKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
  )

  // Detectar padrões de Convergência (resumos, entendimentos compartilhados)
  const convergenciaKeywords = [
    'entendi', 'resumir', 'entendimento', 'comum', 'concordo', 'faz sentido',
    'claro', 'percebi', 'conclusão', 'chegamos'
  ]
  const hasConvergenciaSignals = recentMessages.some(msg =>
    convergenciaKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
  )

  // Detectar Pausa (mensagens curtas, falta de engajamento)
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || ''
  const isShortMessage = lastUserMessage.length < 20
  const hasPauseSignals = isShortMessage && recentMessages.length >= 4

  // Lógica de inferência com confiança
  if (hasConvergenciaSignals && userMessages.length >= 5) {
    return {
      primary: ConversationState.CONVERGENCIA,
      confidence: 0.7,
      secondary: ConversationState.CLAREAMENTO,
    }
  }

  if (hasClareamentoSignals && userMessages.length >= 3) {
    return {
      primary: ConversationState.CLAREAMENTO,
      confidence: 0.65,
      secondary: ConversationState.EXPLORACAO,
    }
  }

  if (hasPauseSignals) {
    return {
      primary: ConversationState.PAUSA,
      confidence: 0.6,
      secondary: ConversationState.EXPLORACAO,
    }
  }

  // Estado padrão baseado no número de mensagens
  if (userMessages.length >= 5) {
    return {
      primary: ConversationState.CLAREAMENTO,
      confidence: 0.55,
      secondary: ConversationState.CONVERGENCIA,
    }
  }

  // Default: Exploração
  return {
    primary: ConversationState.EXPLORACAO,
    confidence: 0.7,
    secondary: ConversationState.CLAREAMENTO,
  }
}

/**
 * Infere o estado da conversa a partir do histórico (string)
 * Wrapper para compatibilidade com API route
 */
export function inferConversationState(conversationHistory: string): 'exploration' | 'clarification' | 'convergence' | 'veredict' | 'pause' {
  const history = conversationHistory.toLowerCase()
  
  // NOTA: 'reopen' não é mais retornado aqui
  // Reabertura é determinada pelo status da conversa (PAUSED), não pelo conteúdo das mensagens
  
  if (history.includes('veredito') || history.includes('decisão') || history.includes('fechar')) {
    return 'veredict'
  }
  
  if (history.length < 100) {
    return 'exploration'
  }
  
  if (history.includes('entendi') || history.includes('resumir') || history.includes('conclusão')) {
    return 'convergence'
  }
  
  if (history.includes('dor') || history.includes('problema') || history.includes('incomoda')) {
    return 'clarification'
  }
  
  return 'exploration'
}

