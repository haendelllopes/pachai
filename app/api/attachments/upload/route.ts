import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Usar createRouteHandlerClient para Route Handlers (App Router + PWA)
    const supabase = await createRouteHandlerClient({ cookies })
    // Usar getSession() em vez de getUser() para App Router + PWA
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // Obter FormData da requisição
    const formData = await request.formData()
    const file = formData.get('file') as File
    const conversationId = formData.get('conversation_id') as string

    if (!file || !conversationId) {
      return NextResponse.json(
        { error: 'file and conversation_id are required' },
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

    // Determinar tipo de arquivo baseado no mime type
    const mimeType = file.type
    let attachmentType: 'document' | 'image' | 'audio' | 'video' = 'document'

    if (mimeType.startsWith('image/')) {
      attachmentType = 'image'
    } else if (mimeType.startsWith('audio/')) {
      attachmentType = 'audio'
    } else if (mimeType.startsWith('video/')) {
      attachmentType = 'video'
    }

    // Validar tipos suportados (prioridade: PDF, TXT, MP3)
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/webm'
    ]

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `File type ${mimeType} not supported. Supported types: PDF, TXT, MP3, WAV, M4A, images, videos` },
        { status: 400 }
      )
    }

    // Upload para Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(fileName, file, {
        contentType: mimeType,
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Obter signed URL do arquivo (bucket é privado)
    // Signed URL expira em 1 ano (pode ajustar conforme necessário)
    const { data: urlData } = await supabase.storage
      .from('attachments')
      .createSignedUrl(fileName, 31536000) // 1 ano em segundos

    const fileUrl = urlData?.signedUrl || ''

    // Criar registro em conversation_attachments com status='processing'
    const { data: attachment, error: insertError } = await supabase
      .from('conversation_attachments')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        type: attachmentType,
        file_name: file.name,
        mime_type: mimeType,
        file_url: fileUrl,
        source: 'upload',
        status: 'processing',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating attachment record:', insertError)
      // Tentar deletar arquivo do storage se falhar ao criar registro
      await supabase.storage.from('attachments').remove([fileName])
      return NextResponse.json(
        { error: 'Failed to create attachment record' },
        { status: 500 }
      )
    }

    // Processamento simples (stub inicial)
    // Por enquanto, apenas marcar como 'ready' sem extrair texto
    // Processamento completo virá depois
    if (attachmentType === 'document' && mimeType === 'text/plain') {
      // Para arquivos de texto, ler conteúdo diretamente
      const text = await file.text()
      await supabase
        .from('conversation_attachments')
        .update({
          extracted_text: text,
          status: 'ready',
        })
        .eq('id', attachment.id)
    } else {
      // Para outros tipos, marcar como ready sem extracted_text
      // Processamento assíncrono completo virá depois
      await supabase
        .from('conversation_attachments')
        .update({
          status: 'ready',
        })
        .eq('id', attachment.id)
    }

    // Buscar attachment atualizado
    const { data: updatedAttachment } = await supabase
      .from('conversation_attachments')
      .select()
      .eq('id', attachment.id)
      .single()

    return NextResponse.json(updatedAttachment || attachment)
  } catch (error) {
    console.error('Error in attachment upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

