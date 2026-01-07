import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Usar createRouteHandlerClient para Route Handlers (App Router + PWA)
  const supabase = await createRouteHandlerClient({ cookies })
  
  // Usar getSession() em vez de getUser() para App Router + PWA
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    console.error('[PATCH products] No session found')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = session.user

  const { name } = await request.json()

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Verificar se o produto pertence ao usuário
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Atualizar nome do produto
  const { data, error } = await supabase
    .from('products')
    .update({ name: name.trim() })
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
  
  // Usar getSession() em vez de getUser() para App Router + PWA
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    console.error('[DELETE products] No session found')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = session.user

  // Verificar se o produto pertence ao usuário
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Exclusão em cascata: primeiro excluir vereditos relacionados
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('product_id', params.id)

  if (conversations && conversations.length > 0) {
    const conversationIds = conversations.map(c => c.id)
    
    // Excluir vereditos
    await supabase
      .from('veredicts')
      .delete()
      .in('conversation_id', conversationIds)

    // Excluir mensagens
    await supabase
      .from('messages')
      .delete()
      .in('conversation_id', conversationIds)

    // Excluir conversas
    await supabase
      .from('conversations')
      .delete()
      .eq('product_id', params.id)
  }

  // Excluir produto
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

