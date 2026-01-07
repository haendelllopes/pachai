import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Usar createRouteHandlerClient para Route Handlers (App Router + PWA)
  const supabase = await createRouteHandlerClient({ cookies })
  // Usar getSession() em vez de getUser() para App Router + PWA
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user
  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversation_id')

  if (!conversationId) {
    return NextResponse.json(
      { error: 'conversation_id is required' },
      { status: 400 }
    )
  }

  // Verificar se a conversa pertence ao usuário (via produto)
  const { data: conversation } = await supabase
    .from('conversations')
    .select('product_id, products!inner(user_id)')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Verificar se o produto pertence ao usuário
  const product = (conversation as any).products
  if (!product || product.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Buscar anexos da conversa
  const { data, error } = await supabase
    .from('conversation_attachments')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

