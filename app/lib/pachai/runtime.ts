import { BASE_PACHAI_PROMPT } from './prompts/base'
import { VEREDICT_CONFIRMATION_PROMPT } from './prompts/veredict'
import { REOPEN_PROMPT } from './prompts/reopen'
import { SEARCH_RESULTS_PROMPT, SUGGEST_SEARCH_PROMPT } from './prompts/search'
import { getPromptForState, ConversationState } from './prompts'
import { inferConversationStateFromMessages, VeredictSignal, ConversationStatus, ConversationState as StateEnum } from './states'
import { getConversationMessages, getConversation } from './db'
import { getPreviousVeredicts, getVeredictsForContext } from './agent'
import { getConversationAttachments } from './attachments'
import { getConversationSummary } from './reopen'
import { getProductContext } from './product-context'
import { shouldSuggestContextConsolidation } from './context-detection'
import { detectExplicitSearchIntent, shouldSuggestSearch } from './search-detection'
import { executeExternalSearch } from './search-execution'
import { SearchContext, SearchResult } from './search-types'
import { Message } from './agent'
import OpenAI from 'openai'
import { createClient } from '@/app/lib/supabase/server'

type PachaiRuntimeInput = {
  conversationId: string
  userMessage: string
  pauseRequested: boolean
  veredictSignal?: VeredictSignal
  searchContext?: SearchContext // NOVO: SearchContext temporário
}

type PachaiRuntimeOutput = {
  response: string
  suggestSearch?: { query: string } // Flag para sugerir busca
  searchResults?: { query: string; results: SearchResult[] } // Resultados quando busca foi executada
}

/**
 * Separa vereditos globais e do produto
 */
async function getVeredictsSeparated(
  productId: string,
  supabase: any
): Promise<{ global: Array<{ content: string }>; product: Array<{ content: string }> }> {
  const global: Array<{ content: string }> = []
  const product: Array<{ content: string }> = []

  // 1. Buscar vereditos globais (máximo 3)
  const { data: globalVeredicts, error: globalError } = await supabase
    .from('veredicts')
    .select('title, content, pain, value')
    .eq('scope', 'global')
    .order('created_at', { ascending: false })
    .limit(3)

  if (!globalError && globalVeredicts) {
    for (const v of globalVeredicts) {
      if (v.content) {
        global.push({ content: v.content })
      } else if (v.pain && v.value) {
        global.push({ content: `Dor: ${v.pain}\nValor: ${v.value}` })
      }
    }
  }

  // 2. Buscar vereditos do projeto (máximo 3)
  const { data: projectVeredicts, error: projectError } = await supabase
    .from('veredicts')
    .select('title, content, pain, value')
    .eq('product_id', productId)
    .or('scope.is.null,scope.eq.project')
    .order('created_at', { ascending: false })
    .limit(3)

  if (!projectError && projectVeredicts) {
    for (const v of projectVeredicts) {
      if (v.content) {
        product.push({ content: v.content })
      } else if (v.pain && v.value) {
        product.push({ content: `Dor: ${v.pain}\nValor: ${v.value}` })
      }
    }
  }

  return { global, product }
}

/**
 * Constrói contexto ordenado para o Pachai
 * Ordem obrigatória: Contexto Cognitivo do Produto → Search Context (temporário) → Vereditos → Anexos → Mensagens
 * 
 * 📌 Produto sempre vem antes do mundo externo.
 */
function buildContextString(
  productContext: string | null,
  searchContext: SearchContext | null,
  veredictsGlobal: Array<{ content: string }>,
  veredictsProduct: Array<{ content: string }>,
  attachments: Array<{ extracted_text: string }>,
  messages: Message[]
): string {
  let context = ''

  // 0. Contexto Cognitivo do Produto (sempre no topo)
  if (productContext) {
    context += `
━━━━━━━━━━━━━━━━━━
CONTEXTO COGNITIVO DO PRODUTO
━━━━━━━━━━━━━━━━━━

${productContext}
`
  }

  // 0.5. Search Context (temporário) - após Contexto Cognitivo, antes de Vereditos
  if (searchContext && searchContext.results.length > 0) {
    context += `
━━━━━━━━━━━━━━━━━━
CONTEXTO: Referências Externas (Temporárias)
━━━━━━━━━━━━━━━━━━

Busca realizada: "${searchContext.query}"

${searchContext.results.map((result, i) => `
${i + 1}. ${result.title}
   Fonte: ${result.source}
   ${result.snippet}
   URL: ${result.url}
`).join('\n')}

⚠️ Estes resultados são referências externas.
Use como insumo de raciocínio, não como verdade absoluta.
`
  }

  // 1. Vereditos Globais
  if (veredictsGlobal.length > 0) {
    context += `
━━━━━━━━━━━━━━━━━━
CONTEXTO: Vereditos Globais (Memória Deliberada)
━━━━━━━━━━━━━━━━━━

${veredictsGlobal.map((v, i) => `${i + 1}. ${v.content}`).join('\n\n')}
`
  }

  // 2. Vereditos do Produto
  if (veredictsProduct.length > 0) {
    context += `
━━━━━━━━━━━━━━━━━━
CONTEXTO: Vereditos do Produto (Memória Deliberada)
━━━━━━━━━━━━━━━━━━

${veredictsProduct.map((v, i) => `${i + 1}. ${v.content}`).join('\n\n')}
`
  }

  // 3. Anexos da conversa (extracted_text se disponível)
  if (attachments.length > 0) {
    context += `
━━━━━━━━━━━━━━━━━━
CONTEXTO: Anexos da Conversa
━━━━━━━━━━━━━━━━━━

${attachments.map((a, i) => `Anexo ${i + 1}:\n${a.extracted_text}`).join('\n\n')}
`
  }

  // 4. Mensagens da conversa (já formatadas)
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
  suggestConsolidation?: boolean
  hasSearchContext?: boolean
  shouldSuggestSearch?: boolean
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
  let prompt = getPromptForState(stateString as ConversationState)
  
  // Se tem SearchContext, adicionar prompt de uso de resultados
  if (params.hasSearchContext) {
    prompt += `

${SEARCH_RESULTS_PROMPT}
`
  }
  
  // Se deve sugerir busca, adicionar prompt de sugestão
  if (params.shouldSuggestSearch) {
    prompt += `

${SUGGEST_SEARCH_PROMPT}
`
  }
  
  // Se deve sugerir consolidação, adicionar instrução explícita ao prompt
  if (params.suggestConsolidation && stateString === 'exploration') {
    prompt += `

━━━━━━━━━━━━━━━━━━
AÇÃO REQUERIDA: Sugerir Consolidação de Contexto
━━━━━━━━━━━━━━━━━━

Esta é uma das primeiras conversas sobre o produto e ainda não existe um Contexto Cognitivo consolidado.
O usuário já trouxe informações suficientes sobre o produto.

Você DEVE perguntar explicitamente ao usuário:
"Deseja que eu consolide isso como o Contexto Cognitivo base do produto?"

IMPORTANTE:
- NUNCA assuma que deve consolidar automaticamente
- NUNCA crie contexto sem confirmação explícita
- Apenas PERGUNTE se deve consolidar
- Aguarde confirmação antes de qualquer ação
`
  }
  
  return {
    prompt,
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
 * 
 * Integração de busca:
 * - Detecta intenção explícita de busca
 * - Executa busca se necessário
 * - Detecta se deve sugerir busca
 * - Injeta SearchContext no contexto ordenado
 */
export async function getPachaiResponse({
  conversationId,
  userMessage,
  pauseRequested,
  veredictSignal,
  searchContext: providedSearchContext
}: PachaiRuntimeInput): Promise<PachaiRuntimeOutput> {
  // 1. Buscar informações da conversa (incluindo status)
  const conversation = await getConversation(conversationId)
  
  // 2. Buscar histórico de mensagens
  const history = await getConversationMessages(conversationId)

  // 2.5. Processar busca externa (antes de inferir estado)
  let searchContext: SearchContext | null = providedSearchContext || null
  let suggestSearchQuery: string | null = null

  // Se não foi fornecido SearchContext, verificar se há intenção explícita de busca
  if (!searchContext && conversation.status !== 'PAUSED') {
    const explicitIntent = detectExplicitSearchIntent(userMessage)
    if (explicitIntent) {
      // Executar busca explícita
      const results = await executeExternalSearch(explicitIntent.query)
      searchContext = {
        query: explicitIntent.query,
        results,
        executedAt: new Date().toISOString()
      }
    }
  }

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

  // 4. Buscar contexto do produto (sempre, se existir)
  let productContext: string | null = null
  try {
    const context = await getProductContext(conversation.product_id)
    productContext = context?.content_text || null
  } catch (error) {
    // Se não tiver permissão ou não existir, continua sem contexto
    productContext = null
  }

  // 5. Buscar contexto adicional (vereditos e anexos) se não estiver pausada
  let veredictsGlobal: Array<{ content: string }> = []
  let veredictsProduct: Array<{ content: string }> = []
  let attachments: Array<{ extracted_text: string }> = []

  if (conversation.status !== 'PAUSED') {
    const supabase = await createClient()
    
    // Buscar vereditos separados (globais e do produto)
    const veredictsSeparated = await getVeredictsSeparated(conversation.product_id, supabase)
    veredictsGlobal = veredictsSeparated.global
    veredictsProduct = veredictsSeparated.product
    
    // Buscar anexos da conversa (limite de injeção de contexto: 2 mais recentes prontos)
    attachments = await getConversationAttachments(conversationId, supabase, 2)
  }

  // 6. Verificar se deve sugerir busca (apenas se não há busca explícita e não está pausada)
  let shouldSuggest = false
  if (
    !searchContext &&
    conversation.status !== 'PAUSED' &&
    (inferredState === StateEnum.EXPLORATION || inferredState === StateEnum.CLARIFICATION)
  ) {
    const conversationContext = history.map(m => m.content).join('\n')
    shouldSuggest = shouldSuggestSearch(inferredState, conversationContext, userMessage)
    
    // Se deve sugerir, extrair query sugerida (simplificado - pode ser melhorado)
    if (shouldSuggest) {
      // Tentar extrair query da mensagem do usuário ou contexto
      const queryMatch = userMessage.match(/(?:sobre|de|em)\s+(.+)/i)
      suggestSearchQuery = queryMatch ? queryMatch[1].trim() : userMessage.trim()
    }
  }

  // 7. Verificar se deve sugerir consolidação (apenas em exploration, se não estiver pausada)
  let suggestConsolidation = false
  if (
    conversation.status !== 'PAUSED' &&
    inferredState === StateEnum.EXPLORATION
  ) {
    try {
      suggestConsolidation = await shouldSuggestContextConsolidation(
        conversation.product_id,
        conversationId
      )
    } catch (error) {
      // Se houver erro, não sugerir
      suggestConsolidation = false
    }
  }

  // 8. Obter prompt usando função centralizada
  const { prompt: basePrompt, maxHistoryMessages } = getPromptForConversationState({
    conversationStatus: conversation.status as ConversationStatus,
    inferredState,
    pauseRequested,
    conversationSummary,
    previousVeredicts,
    suggestConsolidation,
    hasSearchContext: searchContext !== null && searchContext.results.length > 0,
    shouldSuggestSearch: shouldSuggest
  })

  // 9. Construir contexto ordenado e adicionar ao prompt
  const contextString = buildContextString(
    productContext,
    searchContext,
    veredictsGlobal,
    veredictsProduct,
    attachments,
    history
  )
  const systemPrompt = basePrompt + contextString

  // 10. Gerar resposta
  const response = await callOpenAI({
    systemPrompt,
    messages: history,
    userMessage,
    maxHistoryMessages
  })

  // 11. Retornar resposta com flag de sugestão de busca e resultados se necessário
  const output: PachaiRuntimeOutput = {
    response
  }

  if (shouldSuggest && suggestSearchQuery) {
    output.suggestSearch = { query: suggestSearchQuery }
  }

  // Incluir resultados de busca se foram executados
  if (searchContext && searchContext.results.length > 0) {
    output.searchResults = {
      query: searchContext.query,
      results: searchContext.results
    }
  }

  return output
}

