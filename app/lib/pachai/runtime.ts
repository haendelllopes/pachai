import { BASE_PACHAI_PROMPT } from './prompts/base'
import { VEREDICT_CONFIRMATION_PROMPT } from './prompts/veredict'
import { getPromptForState, ConversationState } from './prompts'
import { inferConversationState } from './states'
import { getConversationMessages } from './db'
import { Message } from './agent'
import OpenAI from 'openai'

export type PachaiMode = 'NORMAL' | 'VEREDICT_CONFIRMATION'

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

  // Adicionar histórico (últimas 20 mensagens)
  const recentMessages = params.messages.slice(-20)
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
  const history = await getConversationMessages(conversationId)

  let systemPrompt = BASE_PACHAI_PROMPT

  if (mode === 'VEREDICT_CONFIRMATION') {
    systemPrompt = `
${BASE_PACHAI_PROMPT}

${VEREDICT_CONFIRMATION_PROMPT}
`
  } else {
    // Modo NORMAL: usar sistema de prompts por estado
    const conversationHistory = history
      .map(m => `${m.role === 'user' ? 'Usuário' : 'Pachai'}: ${m.content}`)
      .join('\n')

    const state = inferConversationState(conversationHistory || '') as ConversationState
    const statePrompt = getPromptForState(state)
    systemPrompt = statePrompt
  }

  return callOpenAI({
    systemPrompt,
    messages: history,
    userMessage
  })
}

