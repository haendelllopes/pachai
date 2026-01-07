import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Criar cliente Supabase diretamente na rota usando cookies()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorar se não conseguir (middleware já cuida disso)
          }
        },
      },
    }
  )
  
  // Chamar getSession() primeiro para garantir que a sessão seja inicializada
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.error('[PATCH] No session found')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[PATCH] Auth error:', userError)
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
  // Criar cliente Supabase diretamente na rota usando cookies()
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorar se não conseguir (middleware já cuida disso)
          }
        },
      },
    }
  )
  
  // Chamar getSession() primeiro para garantir que a sessão seja inicializada
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    console.error('[DELETE] No session found')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[DELETE] Auth error:', userError)
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

  return NextResponse.json({ success: true })
}

