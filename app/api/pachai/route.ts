import { NextRequest, NextResponse } from 'next/server'
import { detectVeredictSignal } from '@/app/lib/pachai/agent'
import { getPachaiResponse } from '@/app/lib/pachai/runtime'
import { getConversationMessages, saveMessage } from '@/app/lib/pachai/db'

export async function POST(req: NextRequest) {
  try {
    const { conversationId, userMessage } = await req.json()

    if (!conversationId || !userMessage) {
      return NextResponse.json(
        { error: 'conversationId and userMessage are required' },
        { status: 400 }
      )
    }

    // 1. Buscar histórico da conversa
    const messages = await getConversationMessages(conversationId)

    // 2. Salvar mensagem do usuário
    await saveMessage({
      conversationId,
      role: 'user',
      content: userMessage
    })

    // 3. Detectar possível veredito
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)

    const veredictSignal = detectVeredictSignal(userMessages)

    // 4. Se houver suspeita, mudar o modo de resposta
    const mode = veredictSignal.suspected
      ? 'VEREDICT_CONFIRMATION'
      : 'NORMAL'

    // 5. Gerar resposta do Pachai
    const pachaiResponse = await getPachaiResponse({
      conversationId,
      userMessage,
      mode
    })

    // 6. Salvar resposta do Pachai
    await saveMessage({
      conversationId,
      role: 'pachai',
      content: pachaiResponse
    })

    return NextResponse.json({ message: pachaiResponse })
  } catch (error) {
    console.error('Error in Pachai API:', error)
    
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
