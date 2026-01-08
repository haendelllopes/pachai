import { NextRequest, NextResponse } from 'next/server'
import { detectVeredictSignal } from '@/app/lib/pachai/agent'
import { getPachaiResponse } from '@/app/lib/pachai/runtime'
import { getConversationMessages, saveMessage, pauseConversation, getConversation, markConversationReopened } from '@/app/lib/pachai/db'
import { shouldPauseConversation } from '@/app/lib/pachai/pause'

export async function POST(req: NextRequest) {
  try {
    const { conversationId, userMessage } = await req.json()

    if (!conversationId || !userMessage) {
      return NextResponse.json(
        { error: 'conversationId and userMessage are required' },
        { status: 400 }
      )
    }

    // 1. Buscar informações da conversa ANTES de salvar mensagem (para verificar status)
    const conversation = await getConversation(conversationId)
    const isReopening = conversation.status === 'PAUSED'

    // 2. Buscar histórico da conversa
    const messages = await getConversationMessages(conversationId)

    // 3. Salvar mensagem do usuário
    // Se está reabrindo (status === 'PAUSED'), não atualizar status ainda (será atualizado após resposta)
    await saveMessage({
      conversationId,
      role: 'user',
      content: userMessage,
      skipStatusUpdate: isReopening
    })

    // 4. Verificar se usuário pediu para pausar a conversa (evento explícito)
    const pauseRequested = shouldPauseConversation(userMessage)

    // 5. Detectar possível veredito (incluindo mensagem atual)
    // REGRA INVOLÁVEL 3: detectVeredictSignal apenas sugere, nunca força
    const userMessages = [
      ...messages.filter(m => m.role === 'user').map(m => m.content),
      userMessage
    ]
    const veredictSignal = detectVeredictSignal(userMessages)

    // 6. Gerar resposta do Pachai usando função centralizada
    // A função getPromptForConversationState() aplica prioridades automaticamente:
    // 1) status === 'PAUSED' → REOPEN_PROMPT
    // 2) pauseRequested → PAUSE_CONFIRMATION_PROMPT
    // 3) inferredState === 'VEREDICT_CHECK' → VEREDICT_CONFIRMATION_PROMPT
    // 4) outros estados → getPromptForState()
    const pachaiResponse = await getPachaiResponse({
      conversationId,
      userMessage,
      pauseRequested,
      veredictSignal
    })

    // 7. Se estava reabrindo (status === 'PAUSED'), marcar conversa como reaberta
    // Após primeira resposta em modo reabertura, status volta para ACTIVE
    if (isReopening) {
      await markConversationReopened(conversationId)
    }

    // 8. Se usuário pediu para pausar, atualizar status para PAUSED após resposta
    // PAUSE é um evento explícito: gerar uma resposta de confirmação e pausar
    if (pauseRequested) {
      await pauseConversation(conversationId)
    }

    // 9. Salvar resposta do Pachai
    await saveMessage({
      conversationId,
      role: 'pachai',
      content: pachaiResponse
    })

    // 10. Detectar se o agente sugeriu consolidação de contexto
    // Padrões que indicam sugestão de consolidação
    const suggestContextConsolidation = 
      pachaiResponse.includes('consolide isso como o Contexto Cognitivo') ||
      pachaiResponse.includes('consolidar isso como o Contexto Cognitivo') ||
      pachaiResponse.includes('Contexto Cognitivo base do produto') ||
      pachaiResponse.includes('Deseja que eu consolide')

    return NextResponse.json({ 
      message: pachaiResponse,
      suggestContextConsolidation 
    })
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
