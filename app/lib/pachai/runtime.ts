import { BASE_PACHAI_PROMPT } from './prompts/base'
import { VEREDICT_CONFIRMATION_PROMPT } from './prompts/veredict'
import { REOPEN_PROMPT } from './prompts/reopen'
import { getPromptForState, ConversationState } from './prompts'
import { inferConversationStateFromMessages, VeredictSignal, ConversationStatus, ConversationState as StateEnum } from './states'
import { getConversationMessages, getConversation } from './db'
import { getPreviousVeredicts, getVeredictsForContext } from './agent'
import { getConversationAttachments } from './attachments'
import { getConversationSummary } from './reopen'
import { Message } from './agent'
import OpenAI from 'openai'
import { createClient } from '@/app/lib/supabase/server'

type PachaiRuntimeInput = {
  conversationId: string
  userMessage: string
  pauseRequested: boolean
  veredictSignal?: VeredictSignal
}

/**
 * Constrói contexto ordenado para o Pachai
 * Ordem: Vereditos → Anexos → Mensagens
 */
function buildContextString(
  veredicts: Array<{ content: string }>,
  attachments: Array<{ extracted_text: string }>,
  messages: Message[]
): string {
  let context = ''

  // 1. Vereditos (globais → projeto, ordem determinística)
  if (veredicts.length > 0) {
    context += `
━━━━━━━━━━━━━━━━━━
CONTEXTO: Vereditos (Memória Deliberada)
━━━━━━━━━━━━━━━━━━

${veredicts.map((v, i) => `${i + 1}. ${v.content}`).join('\n\n')}
`
  }

  // 2. Anexos da conversa (extracted_text se disponível)
  if (attachments.length > 0) {
    context += `
━━━━━━━━━━━━━━━━━━
CONTEXTO: Anexos da Conversa
━━━━━━━━━━━━━━━━━━

${attachments.map((a, i) => `Anexo ${i + 1}:\n${a.extracted_text}`).join('\n\n')}
`
  }

  // 3. Mensagens da conversa (já formatadas)
  if (messages.length > 0) {
    context += `
━━━━━━━━━━━━━━━━━━
CONTEXTO: Mensagens da Conversa
━━━━━━━━━━━━━━━━━━

${messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Pachai'}: ${m.content}`).join('\n\n')}
`
  }

  return context
}

/**
 * Constrói prompt de reabertura com contexto da conversa anterior
 */
function buildReopenPrompt(
  conversationSummary?: string,
  previousVeredicts?: Array<{ pain: string; value: string }>
): string {
  let prompt = `
${BASE_PACHAI_PROMPT}

${REOPEN_PROMPT}
`

  if (conversationSummary) {
    prompt += `

━━━━━━━━━━━━━━━━━━
CONTEXTO: Tema da Conversa Anterior
━━━━━━━━━━━━━━━━━━

${conversationSummary}
`
  }

  if (previousVeredicts && previousVeredicts.length > 0) {
    const lastVeredict = previousVeredicts[0]
    prompt += `

━━━━━━━━━━━━━━━━━━
CONTEXTO: Veredito Anterior
━━━━━━━━━━━━━━━━━━

Na última conversa, foi registrado:

Dor: ${lastVeredict.pain}
Valor: ${lastVeredict.value}
`
  }

  return prompt
}

/**
 * Mapeia explicitamente qual prompt usar para cada situação da conversa
 * 
 * REGRAS DE PRIORIDADE (em ordem):
 * 1. conversation.status === 'PAUSED' → REOPEN_PROMPT (prioridade máxima)
 * 2. pauseRequested === true → PAUSE_CONFIRMATION_PROMPT
 * 3. inferredState === 'VEREDICT_CHECK' → VEREDICT_CONFIRMATION_PROMPT
 * 4. Outros estados inferidos → getPromptForState(inferredState)
 * 5. Fallback → getPromptForState('exploration')
 */
function getPromptForConversationState(params: {
  conversationStatus: ConversationStatus
  inferredState: StateEnum
  pauseRequested: boolean
  conversationSummary?: string
  previousVeredicts?: Array<{ pain: string; value: string }>
}): { prompt: string; maxHistoryMessages: number } {
  // Prioridade 1: Reabertura (status === 'PAUSED')
  if (params.conversationStatus === 'PAUSED') {
    return {
      prompt: buildReopenPrompt(params.conversationSummary, params.previousVeredicts),
      maxHistoryMessages: 5 // Apenas últimas 4-5 mensagens para contexto mínimo
    }
  }

  // Prioridade 2: Pausa explícita (evento do usuário)
  if (params.pauseRequested) {
    return {
      prompt: getPromptForState('pause'),
      maxHistoryMessages: 3 // Apenas últimas 2-3 mensagens para contexto mínimo
    }
  }

  // Prioridade 3: Veredito check
  if (params.inferredState === StateEnum.VEREDICT_CHECK) {
    return {
      prompt: `
${BASE_PACHAI_PROMPT}

${VEREDICT_CONFIRMATION_PROMPT}
`,
      maxHistoryMessages: 8
    }
  }

  // Prioridade 4: Outros estados inferidos
  const stateMap: Record<StateEnum, ConversationState> = {
    [StateEnum.EXPLORATION]: 'exploration',
    [StateEnum.CLARIFICATION]: 'clarification',
    [StateEnum.CONVERGENCE]: 'convergence',
    [StateEnum.VEREDICT_CHECK]: 'veredict_check', // Não deve chegar aqui, mas fallback seguro
    [StateEnum.PAUSED]: 'pause' // Não deve chegar aqui, mas fallback seguro
  }

  const stateString = stateMap[params.inferredState] || 'exploration'
  
  // Prioridade 5: Fallback para EXPLORATION
  return {
    prompt: getPromptForState(stateString as ConversationState),
    maxHistoryMessages: 8
  }
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
 * Gera resposta do Pachai baseado no estado da conversa
 * 
 * Lógica centralizada em getPromptForConversationState() seguindo prioridades:
 * 1. conversation.status === 'PAUSED' → REOPEN_PROMPT
 * 2. pauseRequested → PAUSE_CONFIRMATION_PROMPT
 * 3. inferredState === 'VEREDICT_CHECK' → VEREDICT_CONFIRMATION_PROMPT
 * 4. Outros estados → getPromptForState()
 * 5. Fallback → EXPLORATION
 */
export async function getPachaiResponse({
  conversationId,
  userMessage,
  pauseRequested,
  veredictSignal
}: PachaiRuntimeInput): Promise<string> {
  // 1. Buscar informações da conversa (incluindo status)
  const conversation = await getConversation(conversationId)
  
  // 2. Buscar histórico de mensagens
  const history = await getConversationMessages(conversationId)

  // 3. Inferir estado apenas se conversa não estiver pausada
  // Se estiver pausada, não inferir (reabertura tem prioridade máxima)
  let inferredState: StateEnum = StateEnum.EXPLORATION
  let conversationSummary: string | undefined
  let previousVeredicts: Array<{ pain: string; value: string }> | undefined

  if (conversation.status === 'PAUSED') {
    // Buscar contexto para reabertura
    const supabase = await createClient()
    conversationSummary = getConversationSummary(history)
    previousVeredicts = await getPreviousVeredicts(conversation.product_id, supabase)
  } else {
    // Inferir estado normalmente
    inferredState = inferConversationStateFromMessages(
      history,
      conversation.status as ConversationStatus,
      veredictSignal
    )
  }

  // 4. Buscar contexto adicional (vereditos e anexos) se não estiver pausada
  let veredicts: Array<{ content: string }> = []
  let attachments: Array<{ extracted_text: string }> = []

  if (conversation.status !== 'PAUSED') {
    const supabase = await createClient()
    
    // Buscar vereditos para contexto (ordem determinística, limites aplicados)
    veredicts = await getVeredictsForContext(conversation.product_id, supabase)
    
    // Buscar anexos da conversa (limite de injeção de contexto: 2 mais recentes prontos)
    attachments = await getConversationAttachments(conversationId, supabase, 2)
  }

  // 5. Obter prompt usando função centralizada
  const { prompt: basePrompt, maxHistoryMessages } = getPromptForConversationState({
    conversationStatus: conversation.status as ConversationStatus,
    inferredState,
    pauseRequested,
    conversationSummary,
    previousVeredicts
  })

  // 6. Construir contexto ordenado e adicionar ao prompt
  const contextString = buildContextString(veredicts, attachments, history)
  const systemPrompt = basePrompt + contextString

  // 7. Gerar resposta
  return callOpenAI({
    systemPrompt,
    messages: history,
    userMessage,
    maxHistoryMessages
  })
}

