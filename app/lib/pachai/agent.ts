import { getPromptForState, ConversationState } from './prompts';
import { inferConversationState as inferStateFromMessages } from './states';

export interface Message {
  role: 'user' | 'pachai'
  content: string
}

interface VeredictSignal {
  detected: boolean
  suggestedTitle?: string
}

/**
 * Detecta sinais explícitos de veredito nas mensagens do usuário
 */
export function detectVeredictSignal(userMessages: string[]): VeredictSignal {
  const lastMessage = userMessages[userMessages.length - 1]?.toLowerCase() || ''
  
  const signals = [
    'é isso',
    'chegamos em um veredito',
    'vamos fechar assim',
    'faz sentido registrar isso',
    'podemos registrar',
    'vamos registrar',
    'chegamos a uma conclusão',
    'fechado',
  ]

  const hasSignal = signals.some(signal => lastMessage.includes(signal))

  if (!hasSignal) {
    return { detected: false }
  }

  // Tentar extrair contexto para sugerir título
  // Em V1, usamos uma abordagem simples: pegar palavras-chave das últimas mensagens
  const recentMessages = userMessages.slice(-3).join(' ')
  const words = recentMessages
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5)
  
  const suggestedTitle = words.length > 0 
    ? `Decisão sobre ${words.slice(0, 3).join(' ')}`
    : 'Decisão de produto'

  return {
    detected: true,
    suggestedTitle,
  }
}

/**
 * Infere o estado da conversa a partir do histórico (string)
 * Converte para o formato esperado pelo sistema de prompts
 */
export function inferConversationState(conversationHistory: string): ConversationState {
  // Por enquanto, implementação simples baseada no tamanho e conteúdo
  // Pode ser melhorada depois com análise mais sofisticada
  const history = conversationHistory.toLowerCase()
  
  if (history.includes('mudou') || history.includes('atualizar') || history.includes('revisar')) {
    return 'reopen'
  }
  
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

/**
 * Gera resposta do Pachai usando o sistema de prompts por estado
 */
export async function generatePachaiResponse(params: {
  conversationHistory: string;
  userMessage: string;
}) {
  const state = inferConversationState(params.conversationHistory);

  const systemPrompt = getPromptForState(state);

  return {
    systemPrompt,
    userMessage: params.userMessage
  };
}

/**
 * Busca contexto da conversa (mensagens recentes)
 */
export async function getConversationContext(
  conversationId: string,
  supabase: any,
  limit: number = 10
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching conversation context:', error)
    return []
  }

  // Reverter ordem para ter mensagens mais antigas primeiro
  return (data || []).reverse().map((m: any) => ({
    role: m.role as 'user' | 'pachai',
    content: m.content,
  }))
}

/**
 * Busca vereditos anteriores do produto (para conexão)
 */
export async function getPreviousVeredicts(productId: string, supabase: any) {
  const { data, error } = await supabase
    .from('veredicts')
    .select('pain, value, created_at, version')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching previous veredicts:', error)
    return []
  }

  return data || []
}
