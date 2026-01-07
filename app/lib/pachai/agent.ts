import { getPromptForState, ConversationState } from './prompts';
import { inferConversationState as inferStateFromMessages } from './states';

export interface Message {
  role: 'user' | 'pachai'
  content: string
}

export type VeredictSignal = {
  suspected: boolean
  reason?: string
}

/**
 * Detecta sinais explícitos de veredito nas mensagens do usuário
 * Determinístico e rápido - não usa LLM
 */
export function detectVeredictSignal(userMessages: string[]): VeredictSignal {
  const signals = [
    'acho que chegamos',
    'isso ficou claro',
    'vamos fechar assim',
    'pra mim está decidido',
    'faz sentido fechar',
    'acho que é isso',
    'podemos concluir'
  ]

  const lastMessage = userMessages[userMessages.length - 1]?.toLowerCase()

  if (!lastMessage) {
    return { suspected: false }
  }

  const matched = signals.find(signal =>
    lastMessage.includes(signal)
  )

  if (matched) {
    return {
      suspected: true,
      reason: matched
    }
  }

  return { suspected: false }
}

/**
 * Infere o estado da conversa a partir do histórico (string)
 * Converte para o formato esperado pelo sistema de prompts
 */
export function inferConversationState(conversationHistory: string): ConversationState {
  // Por enquanto, implementação simples baseada no tamanho e conteúdo
  // Pode ser melhorada depois com análise mais sofisticada
  // NOTA: 'reopen' não é mais retornado aqui - reabertura é determinada pelo status da conversa
  const history = conversationHistory.toLowerCase()
  
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
 * Mantida para compatibilidade com código existente
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

/**
 * Busca vereditos para contexto do Pachai
 * Ordem determinística (NÃO por relevância):
 * 1. Vereditos globais (scope='global') - created_at DESC
 * 2. Vereditos do projeto (scope='project' ou NULL, product_id) - created_at DESC
 * 
 * Limite: máximo 3 globais + 3 do projeto
 * Usa campos existentes (pain, value) se novos campos (title, content) não existirem
 */
export async function getVeredictsForContext(
  productId: string,
  supabase: any
): Promise<Array<{ content: string }>> {
  const veredicts: Array<{ content: string }> = []

  // 1. Buscar vereditos globais (máximo 3)
  // Por enquanto, vereditos sem scope são tratados como do projeto
  // Quando scope='global' existir, buscar aqui
  const { data: globalVeredicts, error: globalError } = await supabase
    .from('veredicts')
    .select('title, content, pain, value')
    .eq('scope', 'global')
    .order('created_at', { ascending: false })
    .limit(3)

  if (!globalError && globalVeredicts) {
    for (const v of globalVeredicts) {
      // Usar content se existir, senão usar pain + value
      if (v.content) {
        veredicts.push({ content: v.content })
      } else if (v.pain && v.value) {
        veredicts.push({ content: `Dor: ${v.pain}\nValor: ${v.value}` })
      }
    }
  }

  // 2. Buscar vereditos do projeto (máximo 3)
  // Inclui vereditos com scope='project' ou scope NULL (compatibilidade)
  const { data: projectVeredicts, error: projectError } = await supabase
    .from('veredicts')
    .select('title, content, pain, value')
    .eq('product_id', productId)
    .or('scope.is.null,scope.eq.project')
    .order('created_at', { ascending: false })
    .limit(3)

  if (!projectError && projectVeredicts) {
    for (const v of projectVeredicts) {
      // Usar content se existir, senão usar pain + value
      if (v.content) {
        veredicts.push({ content: v.content })
      } else if (v.pain && v.value) {
        veredicts.push({ content: `Dor: ${v.pain}\nValor: ${v.value}` })
      }
    }
  }

  return veredicts
}
