import { createClient } from '@/app/lib/supabase/server'
import { Message } from './agent'

/**
 * Busca todas as mensagens de uma conversa
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar se a conversa pertence ao usuário
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('product_id, products!inner(user_id)')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    throw new Error('Conversation not found')
  }

  if ((conversation.products as any).user_id !== user.id) {
    throw new Error('Forbidden')
  }

  // Buscar mensagens
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    throw new Error('Failed to fetch messages')
  }

  return (messages || []).map((m: any) => ({
    role: m.role as 'user' | 'pachai',
    content: m.content,
  }))
}

/**
 * Salva uma mensagem na conversa
 */
export async function saveMessage(params: {
  conversationId: string
  role: 'user' | 'pachai'
  content: string
}): Promise<Message> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar se a conversa pertence ao usuário
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('product_id, products!inner(user_id)')
    .eq('id', params.conversationId)
    .single()

  if (convError || !conversation) {
    throw new Error('Conversation not found')
  }

  if ((conversation.products as any).user_id !== user.id) {
    throw new Error('Forbidden')
  }

  // Salvar mensagem
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content.trim(),
    })
    .select('role, content')
    .single()

  if (messageError || !message) {
    throw new Error('Failed to save message')
  }

  return {
    role: message.role as 'user' | 'pachai',
    content: message.content,
  }
}

