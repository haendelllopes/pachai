import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Usar createRouteHandlerClient para Route Handlers (App Router + PWA)
  const supabase = await createRouteHandlerClient({ cookies })
  
  // Usar getUser() para autenticação segura (valida com servidor Supabase)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('[PATCH] Authentication error:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title } = await request.json()

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  // Verificar se a conversa pertence ao usuário (via produto)
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, product_id, products!inner(user_id)')
    .eq('id', params.id)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Verificar se o produto pertence ao usuário
  const product = (conversation as any).products
  if (!product || product.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Atualizar título da conversa
  const { data, error } = await supabase
    .from('conversations')
    .update({ title: title.trim() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Usar createRouteHandlerClient para Route Handlers (App Router + PWA)
  const supabase = await createRouteHandlerClient({ cookies })
  
  // Usar getUser() para autenticação segura (valida com servidor Supabase)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('[DELETE] Authentication error:', authError)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verificar se a conversa pertence ao usuário (via produto)
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, product_id, products!inner(user_id)')
    .eq('id', params.id)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Verificar se o produto pertence ao usuário
  const product = (conversation as any).products
  if (!product || product.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Exclusão em cascata: primeiro excluir vereditos relacionados
  const { error: veredictsError } = await supabase
    .from('veredicts')
    .delete()
    .eq('conversation_id', params.id)

  if (veredictsError) {
    console.error('[DELETE] Error deleting veredicts:', veredictsError)
    return NextResponse.json({ error: 'Failed to delete veredicts: ' + veredictsError.message }, { status: 500 })
  }

  // Excluir mensagens
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', params.id)

  if (messagesError) {
    console.error('[DELETE] Error deleting messages:', messagesError)
    return NextResponse.json({ error: 'Failed to delete messages: ' + messagesError.message }, { status: 500 })
  }

  // Excluir conversa
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[DELETE] Error deleting conversation:', error)
    return NextResponse.json({ error: 'Failed to delete conversation: ' + error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

