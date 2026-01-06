import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { conversationId, messages } = await request.json()

  if (!conversationId || !messages || messages.length < 3) {
    return NextResponse.json(
      { error: 'conversationId and at least 3 messages are required' },
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

  // Verificar se já tem título
  if (conversation.title) {
    return NextResponse.json({ title: conversation.title })
  }

  // Gerar título baseado nas mensagens (heurística simples)
  // Pegar primeiras mensagens do usuário para criar título
  const userMessages = messages
    .filter((m: any) => m.role === 'user')
    .slice(0, 3)
    .map((m: any) => m.content)
    .join(' ')

  // Criar título simples baseado nas primeiras palavras
  const words = userMessages.split(' ').slice(0, 8).join(' ')
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

