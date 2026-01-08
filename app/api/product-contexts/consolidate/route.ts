import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getProductContext, hasProductContext } from '@/app/lib/pachai/product-context'
import { canEditContext } from '@/app/lib/pachai/roles'
import { getConversationMessages } from '@/app/lib/pachai/db'
import OpenAI from 'openai'

/**
 * POST /api/product-contexts/consolidate
 * Consolida mensagens da conversa ou atualiza contexto com novo veredito
 * Body: { conversationId?, productId, currentContext?, newVeredict? }
 * 
 * Comportamento:
 * - Usa LLM para gerar texto consolidado
 * - NUNCA salva automaticamente
 * - Retorna preview editável
 * - Valida que usuário tem permissão (owner/editor)
 */
export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user

  try {
    const { conversationId, productId, currentContext, newVeredict } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    // Validar permissão
    const canEdit = await canEditContext(productId, user.id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden: Only owners and editors can consolidate context' },
        { status: 403 }
      )
    }

    // Buscar contexto atual se não foi fornecido
    let existingContext: string | null = currentContext || null
    if (!existingContext) {
      try {
        const context = await getProductContext(productId)
        existingContext = context?.content_text || null
      } catch (error) {
        // Se não existir, continua com null
        existingContext = null
      }
    }

    // Buscar mensagens da conversa se conversationId foi fornecido
    let conversationMessages: Array<{ role: string; content: string }> = []
    if (conversationId) {
      try {
        const messages = await getConversationMessages(conversationId)
        conversationMessages = messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      } catch (error) {
        console.error('Error fetching conversation messages:', error)
        // Continua sem mensagens se houver erro
      }
    }

    // Preparar prompt para consolidação
    let consolidationPrompt = `Você é um assistente especializado em consolidar entendimentos sobre produtos.

Sua tarefa é criar ou atualizar um "Contexto Cognitivo do Produto" - um texto estruturado que capture o entendimento essencial sobre o produto.

REGRAS IMPORTANTES:
1. O contexto deve ser claro, conciso e estruturado
2. Foque no entendimento do produto, não em detalhes de conversas específicas
3. Se houver contexto existente, integre novas informações de forma coerente
4. Se houver um novo veredito, incorpore-o naturalmente ao contexto
5. Use formatação clara (títulos, listas, parágrafos)
6. Mantenha o tom profissional e objetivo

`

    if (existingContext) {
      consolidationPrompt += `CONTEXTO ATUAL DO PRODUTO:
${existingContext}

`
    }

    if (newVeredict) {
      consolidationPrompt += `NOVO VEREDITO A SER INCORPORADO:
Dor: ${newVeredict.pain}
Valor: ${newVeredict.value}
${newVeredict.notes ? `Notas: ${newVeredict.notes}` : ''}

`
    }

    if (conversationMessages.length > 0) {
      const userMessages = conversationMessages
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('\n\n')
      
      consolidationPrompt += `MENSAGENS DA CONVERSA (para contexto):
${userMessages}

`
    }

    if (!existingContext && conversationMessages.length === 0 && !newVeredict) {
      return NextResponse.json(
        { error: 'No content provided for consolidation' },
        { status: 400 }
      )
    }

    consolidationPrompt += `Gere um texto consolidado que represente o Contexto Cognitivo do Produto. 
${existingContext ? 'Atualize o contexto existente incorporando novas informações.' : 'Crie um novo contexto baseado nas informações fornecidas.'}
${newVeredict ? 'Certifique-se de incorporar o novo veredito de forma natural.' : ''}

O texto deve ser direto ao ponto e útil para futuras conversas sobre o produto.`

    // Chamar OpenAI para gerar texto consolidado
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: consolidationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    const consolidatedText = completion.choices[0]?.message?.content?.trim() || ''

    if (!consolidatedText) {
      return NextResponse.json(
        { error: 'Failed to generate consolidated text' },
        { status: 500 }
      )
    }

    // Retornar preview (não salva automaticamente)
    return NextResponse.json({
      consolidatedText,
      preview: consolidatedText, // Mesmo texto formatado para preview
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('required')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error('Error consolidating product context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
