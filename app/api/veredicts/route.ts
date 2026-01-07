import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  // Usar getSession() em vez de getUser() para App Router + PWA
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = session.user

  const { product_id, conversation_id, pain, value, notes, title } = await request.json()

  if (!product_id || !conversation_id || !pain || !value) {
    return NextResponse.json(
      { error: 'product_id, conversation_id, pain, and value are required' },
      { status: 400 }
    )
  }

  // Verify product belongs to user
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('id', product_id)
    .eq('user_id', user.id)
    .single()

  if (!product) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update conversation title if provided
  if (title) {
    await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversation_id)
  }

  // Get latest version number
  const { data: existingVeredicts } = await supabase
    .from('veredicts')
    .select('version')
    .eq('product_id', product_id)
    .order('version', { ascending: false })
    .limit(1)

  const nextVersion = existingVeredicts && existingVeredicts.length > 0
    ? existingVeredicts[0].version + 1
    : 1

  // Create veredict
  const { data, error } = await supabase
    .from('veredicts')
    .insert({
      product_id,
      conversation_id,
      pain: pain.trim(),
      value: value.trim(),
      notes: notes?.trim() || null,
      version: nextVersion,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

