import { NextRequest, NextResponse } from 'next/server'
import { executeExternalSearch } from '@/app/lib/pachai/search-execution'
import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'

/**
 * API Route para executar busca externa
 * 
 * Restrições:
 * - Não persiste resultados
 * - Não atualiza contexto cognitivo
 * - Apenas retorna resultados temporários
 * - Validação: usuário deve ter acesso à conversa
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationId, query } = await req.json()

    if (!conversationId || !query) {
      return NextResponse.json(
        { error: 'conversationId and query are required' },
        { status: 400 }
      )
    }

    // Validar que usuário tem acesso à conversa
    const supabase = await createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // Verificar se conversa existe e pertence ao usuário através do produto
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('product_id, products!inner(user_id)')
      .eq('id', conversationId)
      .single()

    if (conversationError || !conversation || (conversation.products as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Executar busca externa
    const results = await executeExternalSearch(query)

    return NextResponse.json({
      query,
      results
    })
  } catch (error) {
    console.error('Error in Search API:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (error.message === 'Conversation not found') {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
