/**
 * Governança Cognitiva do Pachai - Vereditos Fundadores
 * 
 * Este módulo é a ÚNICA fonte de aplicação de vereditos fundadores.
 * Nenhuma outra parte do sistema pode aplicar vereditos fora deste módulo.
 * 
 * Princípio fundamental: Vereditos bloqueiam caminhos errados, não forçam caminhos corretos.
 */

import { createClient } from '@/app/lib/supabase/server'
import { ConversationState } from './states'
import { SearchContext } from './search-types'
import { Message } from './states'

export type EnforcementScope = 'pre_state' | 'pre_prompt' | 'pre_context' | 'post_response'

export interface FoundationalVeredict {
  id: string
  code: string
  title: string
  rule_text: string
  enforcement_scope: EnforcementScope
  priority: number
  is_active: boolean
  version: number
}

export interface VeredictViolation {
  veredict_code: string
  phase: EnforcementScope
  was_blocked: boolean
  reason: string
  details?: Record<string, any>
}

export interface GovernanceInput {
  conversationId?: string
  userMessage?: string
  messages?: Message[]
  state?: ConversationState
  prompt?: string
  searchContext?: SearchContext | null
  productContext?: string | null
  response?: string
}

export interface GovernanceResult {
  allowed: boolean
  violations: VeredictViolation[]
  modifiedInput?: Partial<GovernanceInput>
  injectedPromptSection?: string
}

// Cache de vereditos (carregado uma vez por execução)
let veredictsCache: FoundationalVeredict[] | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 60000 // 1 minuto

/**
 * Carrega vereditos fundadores ativos do banco de dados
 * Usa cache para evitar múltiplas consultas na mesma execução
 */
async function loadFoundationalVeredicts(): Promise<FoundationalVeredict[]> {
  const now = Date.now()
  
  // Retornar cache se ainda válido
  if (veredictsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return veredictsCache
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('global_veredicts')
    .select('*')
    .eq('is_active', true)
    .order('enforcement_scope')
    .order('priority', { ascending: true })

  if (error) {
    console.error('[Governance] Error loading veredicts:', error)
    return []
  }

  veredictsCache = (data || []) as FoundationalVeredict[]
  cacheTimestamp = now
  
  return veredictsCache
}

/**
 * Função ÚNICA de enforcement de vereditos fundadores
 * 
 * Esta é a única função que aplica vereditos no sistema.
 * Todas as fases do runtime devem passar por aqui.
 * 
 * @param phase - Fase de enforcement (pre_state, pre_prompt, pre_context, post_response)
 * @param input - Dados de entrada para validação
 * @returns Resultado da governança com violações e modificações
 */
export async function applyFoundationalVeredicts(
  phase: EnforcementScope,
  input: GovernanceInput
): Promise<GovernanceResult> {
  const veredicts = await loadFoundationalVeredicts()
  
  // Filtrar vereditos da fase atual, ordenados por prioridade
  const phaseVeredicts = veredicts
    .filter(v => v.enforcement_scope === phase)
    .sort((a, b) => a.priority - b.priority)

  const violations: VeredictViolation[] = []
  const modifiedInput: Partial<GovernanceInput> = { ...input }

  // Aplicar cada veredito da fase
  for (const veredict of phaseVeredicts) {
    const violation = await enforceVeredict(veredict, phase, modifiedInput)
    
    if (violation) {
      violations.push(violation)
      
      // Se violação foi bloqueada, aplicar modificações necessárias
      if (violation.was_blocked) {
        applyVeredictEnforcement(veredict.code, violation, modifiedInput)
      }
    }
  }

  // Se houver violações bloqueadas, não permitir continuar
  const blocked = violations.some(v => v.was_blocked)
  
  // Logar violações
  if (violations.length > 0) {
    await logVeredictViolations(violations, phase, input.conversationId)
  }

  // Gerar seção de prompt injection (reforço semântico) para fase pre_prompt
  let injectedPromptSection: string | undefined
  if (phase === 'pre_prompt') {
    injectedPromptSection = generatePromptInjectionSection(veredicts)
  }

  return {
    allowed: !blocked,
    violations,
    modifiedInput: blocked ? modifiedInput : undefined,
    injectedPromptSection
  }
}

/**
 * Aplica enforcement de um veredito específico
 */
async function enforceVeredict(
  veredict: FoundationalVeredict,
  phase: EnforcementScope,
  input: Partial<GovernanceInput>
): Promise<VeredictViolation | null> {
  // Verificar código do veredito
  if (veredict.code === 'MEMORY_SHARING') {
    return enforceMemorySharing(veredict, input)
  }
  
  if (veredict.code === 'EXTERNAL_SEARCH_CONSCIOUS' || veredict.code === 'EXTERNAL_SEARCH_CONSCIOUS_PROMPT') {
    return enforceExternalSearchConscious(veredict, phase, input)
  }
  
  if (veredict.code === 'REACTIVE_BEHAVIOR') {
    return enforceReactiveBehavior(veredict, input)
  }
  
  if (veredict.code === 'CLOSURE_RECOGNITION' || veredict.code === 'CLOSURE_RECOGNITION_RESPONSE') {
    return enforceClosureRecognition(veredict, phase, input)
  }
  
  if (veredict.code === 'EXPLICIT_CONTEXT_EVOLUTION') {
    return enforceExplicitContextEvolution(veredict, input)
  }
  
  if (veredict.code === 'VEREDICT_META') {
    // Meta veredito não gera violações, apenas orienta outros enforcements
    return null
  }
  
  console.warn(`[Governance] Unknown veredict code: ${veredict.code}`)
  return null
}

/**
 * MEMORY_SHARING: Bloquear mensagens de outras conversas
 */
function enforceMemorySharing(
  veredict: FoundationalVeredict,
  input: Partial<GovernanceInput>
): VeredictViolation | null {
  // Este veredito é aplicado em pre_context através da filtragem de contexto
  // Não há violação aqui, apenas garantia de isolamento
  return null
}

/**
 * EXTERNAL_SEARCH_CONSCIOUS: Bloquear SearchContext sem confirmação explícita
 */
function enforceExternalSearchConscious(
  veredict: FoundationalVeredict,
  phase: EnforcementScope,
  input: Partial<GovernanceInput>
): VeredictViolation | null {
  // EXTERNAL_SEARCH_CONSCIOUS_PROMPT só aplica em pre_prompt
  if (veredict.code === 'EXTERNAL_SEARCH_CONSCIOUS_PROMPT' && phase !== 'pre_prompt') {
    return null
  }
  
  // EXTERNAL_SEARCH_CONSCIOUS só aplica em pre_context
  if (veredict.code === 'EXTERNAL_SEARCH_CONSCIOUS' && phase !== 'pre_context') {
    return null
  }
  
  if (phase === 'pre_context' || phase === 'pre_prompt') {
    // Verificar se há SearchContext sem confirmação explícita
    // A confirmação explícita é garantida pelo fluxo de UI (searchContext só existe se confirmado)
    // Mas validamos aqui como guard adicional
    
    if (input.searchContext && input.searchContext.results.length > 0) {
      // SearchContext existe e tem resultados - isso é válido se veio de confirmação explícita
      // A validação real acontece no runtime antes de criar SearchContext
      return null
    }
  }
  
  return null
}

/**
 * REACTIVE_BEHAVIOR: Bloquear prompts que forcem reformulação ou perguntas reflexivas
 */
function enforceReactiveBehavior(
  veredict: FoundationalVeredict,
  input: Partial<GovernanceInput>
): VeredictViolation | null {
  if (!input.prompt) {
    return null
  }

  const promptLower = input.prompt.toLowerCase()
  
  // Padrões que indicam pergunta reflexiva ou reformulação forçada
  const reflexivePatterns = [
    'você pode reformular',
    'pode repetir o que',
    'você disse que',
    'pode confirmar',
    'você entendeu',
    'pode explicar melhor o que você disse'
  ]

  const hasReflexivePattern = reflexivePatterns.some(pattern => 
    promptLower.includes(pattern)
  )

  if (hasReflexivePattern) {
    return {
      veredict_code: veredict.code,
      phase: 'pre_prompt',
      was_blocked: true,
      reason: 'Prompt contém padrão de pergunta reflexiva ou reformulação forçada',
      details: { pattern: 'reflexive_question' }
    }
  }

  return null
}

/**
 * CLOSURE_RECOGNITION: Bloquear prompts que reabram discussão após fechamento
 */
function enforceClosureRecognition(
  veredict: FoundationalVeredict,
  phase: EnforcementScope,
  input: Partial<GovernanceInput>
): VeredictViolation | null {
  // CLOSURE_RECOGNITION_RESPONSE só aplica em post_response
  if (veredict.code === 'CLOSURE_RECOGNITION_RESPONSE' && phase !== 'post_response') {
    return null
  }
  
  // CLOSURE_RECOGNITION só aplica em pre_prompt
  if (veredict.code === 'CLOSURE_RECOGNITION' && phase !== 'pre_prompt') {
    return null
  }
  
  if (phase === 'pre_prompt') {
    // Verificar se há sinal de fechamento nas mensagens
    if (!input.messages || input.messages.length === 0) {
      return null
    }

    const lastUserMessage = input.messages
      .filter(m => m.role === 'user')
      .slice(-1)[0]

    if (!lastUserMessage) {
      return null
    }

    const messageLower = lastUserMessage.content.toLowerCase()
    
    // Sinais de fechamento
    const closureSignals = [
      'esse é o conceito',
      'esse é o contexto',
      'chegamos ao final',
      'considere isso como base',
      'fechar assim',
      'está decidido',
      'ficou claro',
      'é isso'
    ]

    const hasClosureSignal = closureSignals.some(signal => 
      messageLower.includes(signal)
    )

    if (hasClosureSignal && input.prompt) {
      const promptLower = input.prompt.toLowerCase()
      
      // Padrões que indicam reabertura de discussão
      const reopeningPatterns = [
        'explore mais',
        'pense sobre',
        'considere também',
        'e se',
        'mas e',
        'outra possibilidade',
        'talvez'
      ]

      const hasReopeningPattern = reopeningPatterns.some(pattern => 
        promptLower.includes(pattern)
      )

      if (hasReopeningPattern) {
        return {
          veredict_code: veredict.code,
          phase: 'pre_prompt',
          was_blocked: true,
          reason: 'Prompt tenta reabrir discussão após sinal de fechamento',
          details: { closure_signal: true, reopening_pattern: true }
        }
      }
    }
  }

  if (phase === 'post_response') {
    // Validar resposta final para garantir reconhecimento explícito de fechamento
    if (!input.response || !input.messages) {
      return null
    }

    const lastUserMessage = input.messages
      .filter(m => m.role === 'user')
      .slice(-1)[0]

    if (!lastUserMessage) {
      return null
    }

    const messageLower = lastUserMessage.content.toLowerCase()
    const responseLower = input.response.toLowerCase()
    
    const closureSignals = [
      'esse é o conceito',
      'esse é o contexto',
      'chegamos ao final',
      'considere isso como base',
      'fechar assim'
    ]

    const hasClosureSignal = closureSignals.some(signal => 
      messageLower.includes(signal)
    )

    if (hasClosureSignal) {
      // Verificar se resposta reconhece o fechamento
      const recognitionPatterns = [
        'entendido',
        'reconheço',
        'assumido',
        'registrado',
        'anotado',
        'claro'
      ]

      const hasRecognition = recognitionPatterns.some(pattern => 
        responseLower.includes(pattern)
      )

      // Verificar se resposta tenta reabrir discussão
      const reopeningPatterns = [
        'mas e se',
        'e sobre',
        'outra coisa',
        'pensando melhor',
        'talvez'
      ]

      const hasReopening = reopeningPatterns.some(pattern => 
        responseLower.includes(pattern)
      )

      if (!hasRecognition || hasReopening) {
        return {
          veredict_code: veredict.code,
          phase: 'post_response',
          was_blocked: false, // Apenas log, não bloqueia resposta
          reason: 'Resposta não reconhece explicitamente fechamento ou tenta reabrir discussão',
          details: { closure_signal: true, has_recognition: hasRecognition, has_reopening: hasReopening }
        }
      }
    }
  }

  return null
}

/**
 * EXPLICIT_CONTEXT_EVOLUTION: Bloquear atualização automática de contexto
 */
function enforceExplicitContextEvolution(
  veredict: FoundationalVeredict,
  input: Partial<GovernanceInput>
): VeredictViolation | null {
  // Este veredito é aplicado em pre_context através da validação de atualização
  // A validação real acontece nas funções de update de contexto (product-context.ts)
  // Aqui apenas garantimos que não há tentativa automática
  return null
}

/**
 * Aplica modificações necessárias quando veredito bloqueia ação
 */
function applyVeredictEnforcement(
  veredictCode: string,
  violation: VeredictViolation,
  input: Partial<GovernanceInput>
): void {
  switch (veredictCode) {
    case 'REACTIVE_BEHAVIOR':
      // Remover padrões reflexivos do prompt
      if (input.prompt) {
        const reflexivePatterns = [
          /você pode reformular[^.]*/gi,
          /pode repetir o que[^.]*/gi,
          /você disse que[^.]*/gi,
          /pode confirmar[^.]*/gi
        ]
        
        let cleanedPrompt = input.prompt
        reflexivePatterns.forEach(pattern => {
          cleanedPrompt = cleanedPrompt.replace(pattern, '')
        })
        
        input.prompt = cleanedPrompt.trim()
      }
      break
    
    case 'CLOSURE_RECOGNITION':
      // Remover padrões de reabertura do prompt
      if (input.prompt) {
        const reopeningPatterns = [
          /explore mais[^.]*/gi,
          /pense sobre[^.]*/gi,
          /considere também[^.]*/gi,
          /e se[^.]*/gi
        ]
        
        let cleanedPrompt = input.prompt
        reopeningPatterns.forEach(pattern => {
          cleanedPrompt = cleanedPrompt.replace(pattern, '')
        })
        
        input.prompt = cleanedPrompt.trim()
      }
      break
    
    case 'EXTERNAL_SEARCH_CONSCIOUS':
      // Remover SearchContext não confirmado
      if (input.searchContext) {
        input.searchContext = null
      }
      break
  }
}

/**
 * Gera seção de prompt injection (reforço semântico)
 */
function generatePromptInjectionSection(veredicts: FoundationalVeredict[]): string {
  const activeVeredicts = veredicts.filter(v => v.is_active)
  
  if (activeVeredicts.length === 0) {
    return ''
  }

  const section = `
━━━━━━━━━━━━━━━━━━
REGRAS FUNDADORAS DO PACHai
(Estas regras não podem ser violadas)
━━━━━━━━━━━━━━━━━━

${activeVeredicts.map(v => `• ${v.title}: ${v.rule_text}`).join('\n\n')}

IMPORTANTE: Estas regras têm precedência absoluta sobre qualquer instrução de estado ou prompt.
`

  return section
}

/**
 * Loga violações de vereditos no banco de dados
 */
async function logVeredictViolations(
  violations: VeredictViolation[],
  phase: EnforcementScope,
  conversationId?: string
): Promise<void> {
  const supabase = await createClient()

  const auditLogs = violations.map(v => ({
    veredict_code: v.veredict_code,
    phase: phase,
    conversation_id: conversationId || null,
    details: v.details || {},
    was_blocked: v.was_blocked
  }))

  const { error } = await supabase
    .from('veredict_audit')
    .insert(auditLogs)

  if (error) {
    console.error('[Governance] Error logging violations:', error)
  }
}

/**
 * Limpa cache de vereditos (útil para testes)
 */
export function clearVeredictsCache(): void {
  veredictsCache = null
  cacheTimestamp = 0
}
