import { BASE_PACHAI_PROMPT } from './prompts/base'
import { VEREDICT_CONFIRMATION_PROMPT } from './prompts/veredict'
import { REOPEN_PROMPT } from './prompts/reopen'
import { getPromptForState, ConversationState } from './prompts'
import { inferConversationState } from './states'
import { getConversationMessages, getConversation } from './db'
import { getPreviousVeredicts } from './agent'
import { getConversationSummary } from './reopen'
import { Message } from './agent'
import OpenAI from 'openai'
import { createClient } from '@/app/lib/supabase/server'

export type PachaiMode = 'NORMAL' | 'VEREDICT_CONFIRMATION' | 'PAUSE' | 'REOPENING'

type PachaiRuntimeInput = {
  conversationId: string
  userMessage: string
  mode: PachaiMode
}

/**
 * Chama OpenAI com os parâmetros especificados
 */
async function callOpenAI(params: {
  systemPrompt: string
  messages: Message[]
  userMessage: string
  maxHistoryMessages?: number
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  // Construir histórico de mensagens para o OpenAI
  const openAIMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: params.systemPrompt,
    },
  ]

  // Limitar histórico baseado no parâmetro (padrão 20, mas pode ser reduzido para 6-8)
  const maxHistory = params.maxHistoryMessages || 20
  const recentMessages = params.messages.slice(-maxHistory)
  for (const msg of recentMessages) {
    openAIMessages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })
  }

  // Adicionar mensagem atual do usuário
  openAIMessages.push({
    role: 'user',
    content: params.userMessage,
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: openAIMessages,
    temperature: 0.4,
    max_tokens: 400,
  })

  const reply = completion.choices[0]?.message?.content?.trim() || ''

  if (!reply) {
    throw new Error('No response generated')
  }

  return reply
}

/**
 * Gera resposta do Pachai baseado no modo e histórico
 */
export async function getPachaiResponse({
  conversationId,
  userMessage,
  mode
}: PachaiRuntimeInput): Promise<string> {
  // 1. Buscar informações da conversa (incluindo status)
  const conversation = await getConversation(conversationId)
  
  // 2. Buscar histórico de mensagens
  const history = await getConversationMessages(conversationId)

  let systemPrompt = BASE_PACHAI_PROMPT
  let messagesToSend = history
  let maxHistoryMessages = 20

  if (mode === 'PAUSE') {
    // Modo de pausa: usuário pediu explicitamente para pausar
    // Usar prompt de pause para validar a escolha consciente
    systemPrompt = getPromptForState('pause')
    // Limitar histórico a apenas últimas 2-3 mensagens para contexto mínimo
    maxHistoryMessages = 3
  } else if (mode === 'REOPENING') {
    // Modo de reabertura: conversa pausada sendo retomada
    // Este modo ativa por apenas UMA resposta
    const supabase = await createClient()
    const previousVeredicts = await getPreviousVeredicts(conversation.product_id, supabase)
    
    // Obter resumo do tema da conversa
    const conversationSummary = getConversationSummary(history)

    systemPrompt = `
${BASE_PACHAI_PROMPT}

${REOPEN_PROMPT}

━━━━━━━━━━━━━━━━━━
CONTEXTO: Tema da Conversa Anterior
━━━━━━━━━━━━━━━━━━

${conversationSummary}
`

    // Se há veredito anterior, adicionar contexto
    if (previousVeredicts.length > 0) {
      const lastVeredict = previousVeredicts[0]
      systemPrompt += `

━━━━━━━━━━━━━━━━━━
CONTEXTO: Veredito Anterior
━━━━━━━━━━━━━━━━━━

Na última conversa, foi registrado:

Dor: ${lastVeredict.pain}
Valor: ${lastVeredict.value}
`
    }

    // Limitar histórico para reabertura (apenas últimas 4-5 mensagens para contexto mínimo)
    maxHistoryMessages = 5
  } else if (mode === 'VEREDICT_CONFIRMATION') {
    // Modo de confirmação de veredito
    systemPrompt = `
${BASE_PACHAI_PROMPT}

${VEREDICT_CONFIRMATION_PROMPT}
`
    // Limitar histórico mesmo em modo de veredito
    maxHistoryMessages = 8
  } else {
    // Modo NORMAL com conversa ACTIVE: usar sistema de prompts por estado
    // NUNCA usar prompt de reabertura quando status === 'ACTIVE'
    const conversationHistory = history
      .map(m => `${m.role === 'user' ? 'Usuário' : 'Pachai'}: ${m.content}`)
      .join('\n')

    const state = inferConversationState(conversationHistory || '') as ConversationState
    
    // Garantir que nunca retorne 'reopen' quando status é ACTIVE
    const finalState = state === 'reopen' ? 'exploration' : state
    
    const statePrompt = getPromptForState(finalState)
    systemPrompt = statePrompt
    
    // Limitar histórico a 6-8 mensagens quando ACTIVE
    maxHistoryMessages = 8
  }

  return callOpenAI({
    systemPrompt,
    messages: messagesToSend,
    userMessage,
    maxHistoryMessages
  })
}

