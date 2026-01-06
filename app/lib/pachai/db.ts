import { createClient } from '@/app/lib/supabase/server'
import { Message } from './agent'

export type ConversationStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED'

export interface Conversation {
  id: string
  status: ConversationStatus
  last_activity_at: string
  paused_at?: string
  reopened_at?: string
  product_id: string
}

/**
 * Busca informações da conversa (status, last_activity_at, etc.)
 */
export async function getConversation(conversationId: string): Promise<Conversation> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Buscar conversa com validação de permissão
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, status, last_activity_at, paused_at, reopened_at, product_id, products!inner(user_id)')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    throw new Error('Conversation not found')
  }

  if ((conversation.products as any).user_id !== user.id) {
    throw new Error('Forbidden')
  }

  return {
    id: conversation.id,
    status: (conversation.status || 'ACTIVE') as ConversationStatus,
    last_activity_at: conversation.last_activity_at || new Date().toISOString(),
    paused_at: conversation.paused_at || undefined,
    reopened_at: conversation.reopened_at || undefined,
    product_id: conversation.product_id,
  }
}

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

  // Verificar se a conversa pertence ao usuário (usar getConversation para validação)
  await getConversation(conversationId)

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
  skipStatusUpdate?: boolean
}): Promise<Message> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar se a conversa pertence ao usuário e obter status atual
  const conversation = await getConversation(params.conversationId)

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

  // Atualizar last_activity_at e status (se estava PAUSED, mudar para ACTIVE)
  // Mas apenas se skipStatusUpdate não for true (usado em modo REOPENING)
  const updates: { last_activity_at: string; status?: ConversationStatus } = {
    last_activity_at: new Date().toISOString(),
  }

  if (!params.skipStatusUpdate && conversation.status === 'PAUSED') {
    updates.status = 'ACTIVE'
  }

  await supabase
    .from('conversations')
    .update(updates)
    .eq('id', params.conversationId)

  return {
    role: message.role as 'user' | 'pachai',
    content: message.content,
  }
}

/**
 * Pausa uma conversa (muda status para PAUSED)
 */
export async function pauseConversation(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validar permissão
  await getConversation(conversationId)

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('conversations')
    .update({ 
      status: 'PAUSED',
      paused_at: now,
      last_activity_at: now
    })
    .eq('id', conversationId)

  if (error) {
    throw new Error('Failed to pause conversation')
  }
}

/**
 * Retoma uma conversa (muda status de PAUSED para ACTIVE)
 */
export async function resumeConversation(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validar permissão
  await getConversation(conversationId)

  const { error } = await supabase
    .from('conversations')
    .update({ 
      status: 'ACTIVE',
      last_activity_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (error) {
    throw new Error('Failed to resume conversation')
  }
}

/**
 * Marca uma conversa como reaberta após primeira resposta em modo REOPENING
 * Atualiza status para ACTIVE, reopened_at e last_activity_at
 */
export async function markConversationReopened(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validar permissão
  await getConversation(conversationId)

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('conversations')
    .update({ 
      status: 'ACTIVE',
      reopened_at: now,
      last_activity_at: now
    })
    .eq('id', conversationId)

  if (error) {
    throw new Error('Failed to mark conversation as reopened')
  }
}

