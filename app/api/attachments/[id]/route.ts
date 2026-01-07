import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Usar createRouteHandlerClient para Route Handlers (App Router + PWA)
  const supabase = await createRouteHandlerClient({ cookies })
  // Usar getSession() em vez de getUser() para App Router + PWA
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user

  // Buscar attachment
  const { data: attachment, error } = await supabase
    .from('conversation_attachments')
    .select('*, conversations!inner(product_id, products!inner(user_id))')
    .eq('id', params.id)
    .single()

  if (error || !attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Verificar se o produto pertence ao usuário
  const conversation = (attachment as any).conversations
  const product = conversation?.products
  if (!product || product.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Remover dados aninhados antes de retornar
  const { conversations, ...attachmentData } = attachment as any

  return NextResponse.json(attachmentData)
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user

  // Buscar attachment para verificar permissão e obter file_url
  const { data: attachment, error: fetchError } = await supabase
    .from('conversation_attachments')
    .select('file_url, conversations!inner(product_id, products!inner(user_id))')
    .eq('id', params.id)
    .single()

  if (fetchError || !attachment) {
    return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
  }

  // Verificar se o produto pertence ao usuário
  const conversation = (attachment as any).conversations
  const product = conversation?.products
  if (!product || product.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Extrair nome do arquivo da URL do storage
  const fileUrl = attachment.file_url as string
  const fileName = fileUrl.split('/attachments/')[1]

  // Deletar arquivo do storage
  if (fileName) {
    await supabase.storage.from('attachments').remove([fileName])
  }

  // Deletar registro do banco
  const { error: deleteError } = await supabase
    .from('conversation_attachments')
    .delete()
    .eq('id', params.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

