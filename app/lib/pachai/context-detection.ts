import { createClient } from '@/app/lib/supabase/server'
import { hasProductContext } from './product-context'

/**
 * Verifica se deve sugerir consolidação do contexto do produto
 * 
 * Critérios:
 * - Não existe contexto do produto
 * - É primeira conversa do produto (ou uma das primeiras)
 * - Mensagens do usuário têm conteúdo suficiente
 */
export async function shouldSuggestContextConsolidation(
  productId: string,
  conversationId: string
): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  // 1. Verificar se já existe contexto
  try {
    const hasContext = await hasProductContext(productId)
    if (hasContext) {
      return false // Já existe contexto, não sugerir
    }
  } catch (error) {
    // Se houver erro de permissão, não sugerir
    return false
  }

  // 2. Verificar se é uma das primeiras conversas do produto
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: true })

  if (convError || !conversations || conversations.length === 0) {
    return false
  }

  // Verificar se é uma das 3 primeiras conversas
  const isEarlyConversation = conversations.findIndex(c => c.id === conversationId) < 3
  if (!isEarlyConversation) {
    return false
  }

  // 3. Verificar se há mensagens do usuário com conteúdo suficiente
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .eq('role', 'user')
    .order('created_at', { ascending: true })

  if (messagesError || !messages || messages.length === 0) {
    return false
  }

  // Threshold: pelo menos 2 mensagens do usuário OU 1 mensagem com mais de 200 caracteres
  const userMessages = messages.map(m => m.content)
  const totalLength = userMessages.reduce((sum, msg) => sum + msg.length, 0)
  const hasLongMessage = userMessages.some(msg => msg.length > 200)
  const hasMultipleMessages = userMessages.length >= 2

  // Sugerir se tiver múltiplas mensagens OU mensagem longa
  return hasMultipleMessages || hasLongMessage || totalLength > 300
}
