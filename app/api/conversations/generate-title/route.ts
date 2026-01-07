import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Usar createRouteHandlerClient para Route Handlers (App Router + PWA)
  const supabase = await createRouteHandlerClient({ cookies })
  // Usar getSession() em vez de getUser() para App Router + PWA
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = session.user

  const { conversationId, messages } = await request.json()

  if (!conversationId || !messages) {
    return NextResponse.json(
      { error: 'conversationId and messages are required' },
      { status: 400 }
    )
  }

  // Contar mensagens do usuário
  const userMessages = messages.filter((m: any) => m.role === 'user')
  
  if (userMessages.length < 2) {
    return NextResponse.json(
      { error: 'At least 2 user messages are required' },
      { status: 400 }
    )
  }

  // Verificar se a conversa pertence ao usuário
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, product_id, title')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Verificar se título é null ou "Nova conversa" antes de gerar
  if (conversation.title && conversation.title !== 'Nova conversa') {
    return NextResponse.json({ title: conversation.title })
  }

  // Gerar título baseado nas mensagens (heurística simples)
  // Pegar primeiras mensagens do usuário para criar título
  const userMessagesContent = userMessages
    .slice(0, 3)
    .map((m: any) => m.content)
    .join(' ')

  // Criar título simples baseado nas primeiras palavras
  const words = userMessagesContent.split(' ').slice(0, 8).join(' ')
  const title = words.length > 50 ? words.substring(0, 50) + '...' : words

  // Atualizar título da conversa
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ title })
}

