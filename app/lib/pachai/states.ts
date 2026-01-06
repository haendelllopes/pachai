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
export function inferConversationState(
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

  // Se há vereditos anteriores e a conversa está retomando, pode ser Reabertura
  if (previousVeredicts.length > 0 && messages.length > 0) {
    const lastVeredict = previousVeredicts[0]
    const lastMessage = messages[messages.length - 1]
    
    // Se a primeira mensagem menciona algo relacionado ao veredito anterior
    if (userMessages.length <= 2) {
      const firstUserMessage = userMessages[0]?.content.toLowerCase() || ''
      const mentionsPrevious = 
        firstUserMessage.includes('mudou') ||
        firstUserMessage.includes('atualizar') ||
        firstUserMessage.includes('revisar') ||
        firstUserMessage.includes('retomar')
      
      if (mentionsPrevious) {
        return {
          primary: ConversationState.REABERTURA,
          confidence: 0.75,
          secondary: ConversationState.EXPLORACAO,
        }
      }
    }
  }

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

