import { createClientFromRequest } from '@/app/lib/supabase/server-api'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Debug: verificar cookies recebidos
  const allCookies = request.cookies.getAll()
  const authCookies = allCookies.filter(c => 
    c.name.includes('auth') || c.name.includes('supabase') || c.name.includes('sb-')
  )
  console.log('[PATCH] Cookies recebidos:', {
    total: allCookies.length,
    authCookies: authCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 }))
  })
  
  // Criar response para propagar cookies atualizados
  let response = NextResponse.next({ request })
  
  // Criar cliente Supabase usando cookies do request (atualizados pelo middleware)
  const supabase = createClientFromRequest(request, response)
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[PATCH] Auth error:', {
      error: userError,
      cookiesReceived: allCookies.length,
      authCookiesReceived: authCookies.length
    })
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

  // Retornar resposta com cookies atualizados
  return NextResponse.json(data, {
    headers: response.headers,
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Debug: verificar cookies recebidos
  const allCookies = request.cookies.getAll()
  const authCookies = allCookies.filter(c => 
    c.name.includes('auth') || c.name.includes('supabase') || c.name.includes('sb-')
  )
  console.log('[DELETE] Cookies recebidos:', {
    total: allCookies.length,
    authCookies: authCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length || 0 }))
  })
  
  // Criar response para propagar cookies atualizados
  let response = NextResponse.next({ request })
  
  // Criar cliente Supabase usando cookies do request (atualizados pelo middleware)
  const supabase = createClientFromRequest(request, response)
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[DELETE] Auth error:', {
      error: userError,
      cookiesReceived: allCookies.length,
      authCookiesReceived: authCookies.length
    })
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
  await supabase
    .from('veredicts')
    .delete()
    .eq('conversation_id', params.id)

  // Excluir mensagens
  await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', params.id)

  // Excluir conversa
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Retornar resposta com cookies atualizados
  return NextResponse.json({ success: true }, {
    headers: response.headers,
  })
}

