import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * Detecta termos-chave repetidos nas mensagens
 * Retorna termos que aparecem ≥3 vezes (substantivos, siglas, nomes próprios)
 */
function detectKeyTerms(messages: Array<{ content: string }>): string[] {
  const allText = messages.map(m => m.content.toLowerCase()).join(' ')
  
  // Remover pontuação e dividir em palavras
  const words = allText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2) // Ignorar palavras muito curtas
  
  // Contar frequência
  const frequency: Record<string, number> = {}
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1
  }
  
  // Filtrar termos que aparecem ≥3 vezes e são significativos
  // Ignorar palavras comuns em português
  const commonWords = new Set([
    'que', 'para', 'com', 'uma', 'por', 'mais', 'mas', 'são', 'foi',
    'como', 'sobre', 'pode', 'ser', 'tem', 'ter', 'fazer', 'faz',
    'você', 'voces', 'isso', 'essa', 'esse', 'aqui', 'onde', 'quando',
    'muito', 'mais', 'menos', 'também', 'tambem', 'ainda', 'sempre',
    'não', 'nao', 'sem', 'bem', 'mal', 'todo', 'toda', 'todos', 'todas'
  ])
  
  const keyTerms = Object.entries(frequency)
    .filter(([word, count]) => count >= 3 && !commonWords.has(word))
    .sort((a, b) => b[1] - a[1]) // Ordenar por frequência
    .slice(0, 3) // Top 3 termos
    .map(([word]) => word)
  
  return keyTerms
}

/**
 * Valida se o título gerado não é genérico demais
 */
function isGenericTitle(title: string): boolean {
  const genericTitles = [
    'conversa', 'contexto', 'tema', 'assunto', 'tópico', 'topico',
    'diálogo', 'dialogo', 'chat', 'mensagem', 'texto', 'conteúdo', 'conteudo'
  ]
  
  const titleLower = title.toLowerCase().trim()
  
  // Verificar se o título é exatamente um dos genéricos
  if (genericTitles.includes(titleLower)) {
    return true
  }
  
  // Verificar se começa com um genérico seguido apenas de "do", "da", "de"
  const genericPattern = new RegExp(`^(${genericTitles.join('|')})\\s+(do|da|de|dos|das)$`, 'i')
  if (genericPattern.test(titleLower)) {
    return true
  }
  
  return false
}

export async function POST(request: Request) {
  // Usar createRouteHandlerClient para Route Handlers (App Router + PWA)
  const supabase = await createRouteHandlerClient({ cookies })
  // Usar getSession() em vez de getUser() para App Router + PWA
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = session.user

  const { conversationId, messages } = await request.json()

  if (!conversationId || !messages) {
    return NextResponse.json(
      { error: 'conversationId and messages are required' },
      { status: 400 }
    )
  }

  // Contar mensagens do usuário e verificar mensagens longas
  const userMessages = messages.filter((m: any) => m.role === 'user')
  const hasLongMessage = userMessages.some((m: any) => m.content.length > 200)
  
  // Validar: pelo menos 2 mensagens do usuário OU 1 mensagem longa (>200 caracteres)
  if (userMessages.length < 2 && !hasLongMessage) {
    return NextResponse.json(
      { error: 'At least 2 user messages or 1 long message (>200 chars) are required' },
      { status: 400 }
    )
  }

  // Verificar se a conversa pertence ao usuário
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, product_id, title')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Verificar se título é null ou "Nova conversa" antes de gerar
  if (conversation.title && conversation.title !== 'Nova conversa') {
    return NextResponse.json({ title: conversation.title })
  }

  // Detectar termos-chave repetidos
  const keyTerms = detectKeyTerms(messages)

  // Construir prompt semântico
  const conversationText = messages
    .map((m: any) => `${m.role === 'user' ? 'Usuário' : 'Pachai'}: ${m.content}`)
    .join('\n\n')

  let prompt = `Leia a conversa abaixo e gere um título curto (máx. 4 palavras),
abstrato e conceitual, que represente o TEMA principal da conversa.
Não use frases completas.
Não use saudações.
Não use palavras como 'olá', 'quero', 'estou'.
Use substantivos.

Conversa:
${conversationText}`

  // Adicionar instrução sobre termos-chave se detectados
  if (keyTerms.length > 0) {
    prompt += `\n\nIMPORTANTE: A conversa menciona repetidamente os seguintes termos-chave: ${keyTerms.join(', ')}. O título DEVE incluir pelo menos um desses termos-chave.`
  }

  // Gerar título usando OpenAI
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    )
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 20,
    })

    const generatedTitle = completion.choices[0]?.message?.content?.trim() || ''

    if (!generatedTitle) {
      return NextResponse.json(
        { error: 'Failed to generate title' },
        { status: 500 }
      )
    }

    // Limitar a 4 palavras e remover pontuação final
    const titleWords = generatedTitle
      .replace(/[.,;:!?]$/, '')
      .split(/\s+/)
      .slice(0, 4)
      .join(' ')

    // Validar se não é genérico demais
    if (isGenericTitle(titleWords)) {
      // Retornar erro silencioso - não atualizar título
      return NextResponse.json(
        { error: 'Generated title is too generic' },
        { status: 400 }
      )
    }

    // Atualizar título da conversa
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ title: titleWords })
      .eq('id', conversationId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ title: titleWords })
  } catch (error) {
    console.error('Error generating title with OpenAI:', error)
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    )
  }
}

