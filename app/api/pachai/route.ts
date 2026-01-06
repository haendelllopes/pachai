import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { inferConversationState } from '@/app/lib/pachai/states'
import { buildPrompt } from '@/app/lib/pachai/prompts'
import { detectVeredictSignal } from '@/app/lib/pachai/agent'

// Inicializar OpenAI apenas se a chave estiver configurada
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, userMessage } = await request.json()

    if (!conversationId || !userMessage) {
      return NextResponse.json(
        { error: 'conversationId and userMessage are required' },
        { status: 400 }
      )
    }

    // Buscar conversa e verificar permissão
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('product_id, products!inner(user_id)')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const productId = conversation.product_id
    if ((conversation.products as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Buscar histórico de mensagens
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Buscar vereditos anteriores do produto (para contexto de reabertura)
    const { data: previousVeredicts, error: veredictsError } = await supabase
      .from('veredicts')
      .select('pain, value, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (veredictsError) {
      console.error('Error fetching previous veredicts:', veredictsError)
      // Não falhar se não conseguir buscar vereditos, apenas continuar sem eles
    }

    // Preparar mensagens para análise (incluindo a nova mensagem do usuário)
    const allMessages = [
      ...(messages || []),
      {
        role: 'user' as const,
        content: userMessage,
        created_at: new Date().toISOString(),
      },
    ]

    // Extrair apenas mensagens do usuário para detectar veredito
    const userMessages = allMessages
      .filter(m => m.role === 'user')
      .map(m => m.content)

    // Detectar sinal de veredito
    const verdictSignal = detectVeredictSignal(userMessages)

    // Inferir estado atual da conversa (como tendência)
    const stateTendency = inferConversationState(
      allMessages.map(m => ({ role: m.role, content: m.content })),
      previousVeredicts || []
    )

    // Construir prompt completo
    const prompt = buildPrompt(
      stateTendency,
      allMessages.map(m => ({ role: m.role, content: m.content })),
      previousVeredicts || [],
      verdictSignal.detected
    )

    // Chamar OpenAI API
    if (!openai || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Usando gpt-4o-mini para custo-benefício, pode ser alterado para gpt-4 se necessário
      messages: [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500, // Limitar tamanho da resposta para manter concisão
    })

    const pachaiResponse = completion.choices[0]?.message?.content?.trim() || ''

    if (!pachaiResponse) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      response: pachaiResponse,
      state: stateTendency.primary,
      hasVeredictSignal: verdictSignal.detected,
      suggestedTitle: verdictSignal.suggestedTitle,
    })
  } catch (error) {
    console.error('Error in Pachai API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

