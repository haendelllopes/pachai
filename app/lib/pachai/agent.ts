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
 * Gera resposta do Pachai usando a API route
 */
export async function generatePachaiResponse(
  conversationId: string,
  userMessage: string
): Promise<string> {
  try {
    const response = await fetch('/api/pachai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        userMessage,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate response')
    }

    const data = await response.json()
    return data.response || ''
  } catch (error) {
    console.error('Error generating Pachai response:', error)
    // Fallback para resposta básica em caso de erro
    return 'Desculpe, não consegui processar sua mensagem agora. Pode tentar novamente?'
  }
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

