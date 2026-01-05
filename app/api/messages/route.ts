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

  const { conversation_id, role, content } = await request.json()

  if (!conversation_id || !role || !content) {
    return NextResponse.json(
      { error: 'conversation_id, role, and content are required' },
      { status: 400 }
    )
  }

  if (!['user', 'pachai'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Verify conversation belongs to user's product
  const { data: conversation } = await supabase
    .from('conversations')
    .select('product_id, products!inner(user_id)')
    .eq('id', conversation_id)
    .single()

  if (!conversation || (conversation.products as any).user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      role,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

