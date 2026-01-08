import { ConversationState } from './states'
import { SearchIntent } from './search-types'

/**
 * Detecta intenção explícita de busca na mensagem do usuário
 * 
 * Regras obrigatórias:
 * - Alta precisão > recall
 * - Sem ambiguidade: se houver dúvida → não buscar
 * - Detecta apenas comandos claros e explícitos
 */
export function detectExplicitSearchIntent(userMessage: string): SearchIntent | null {
  const message = userMessage.toLowerCase().trim()
  
  // Padrões explícitos de busca (alta precisão)
  // Adicionar mais variações para melhorar detecção
  const explicitPatterns = [
    // Padrão mais simples primeiro (mais comum)
    {
      pattern: /pesquise\s+(?:sobre|de|em)?\s*(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /^pesquise\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /^busque\s+referências?\s+(?:sobre|de|em)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /busque\s+referências?\s+(?:sobre|de|em)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /^procure\s+exemplos?\s+(?:de|sobre)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /procure\s+exemplos?\s+(?:de|sobre)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /^encontre\s+estudos?\s+(?:sobre|de)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /encontre\s+estudos?\s+(?:sobre|de)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /^pesquise\s+referências?\s+(?:sobre|de|em)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /^busque\s+(?:sobre|de|em)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    },
    {
      pattern: /busque\s+(?:sobre|de|em)\s+(.+)/i,
      extractQuery: (match: RegExpMatchArray) => match[1].trim()
    }
  ]

  for (const { pattern, extractQuery } of explicitPatterns) {
    const match = message.match(pattern)
    if (match) {
      const query = extractQuery(match)
      // Validar que a query não está vazia e tem conteúdo mínimo
      if (query && query.length >= 3) {
        console.log('[Search Detection] Pattern matched:', pattern.toString(), 'Query extracted:', query)
        return {
          query,
          confidence: 1.0 // Alta confiança para padrões explícitos
        }
      }
    }
  }

  // Se não encontrou padrão explícito, retornar null
  // Regra: se houver dúvida → não buscar
  console.log('[Search Detection] No pattern matched for:', userMessage)
  return null
}

/**
 * Determina se o Pachai deve sugerir uma busca
 * 
 * Regras obrigatórias:
 * - Só pode sugerir busca nos estados: EXPLORATION e CLARIFICATION
 * - NUNCA sugerir busca em: CONVERGENCE ou VEREDICT_CHECK
 * - O Pachai não sugere busca quando o usuário já está convergindo ou fechando uma decisão
 * - Sugestão deve ser rara e justificada
 * 
 * @param state Estado atual da conversa
 * @param conversationContext Contexto da conversa (mensagens recentes)
 * @param userMessage Mensagem atual do usuário
 * @returns true se deve sugerir busca, false caso contrário
 */
export function shouldSuggestSearch(
  state: ConversationState,
  conversationContext: string,
  userMessage: string
): boolean {
  // REGRA INVOLÁVEL: Só sugerir em EXPLORATION ou CLARIFICATION
  if (state !== ConversationState.EXPLORATION && state !== ConversationState.CLARIFICATION) {
    return false
  }

  // REGRA INVOLÁVEL: Nunca sugerir se já há intenção explícita de busca
  // (isso seria redundante)
  if (detectExplicitSearchIntent(userMessage) !== null) {
    return false
  }

  // REGRA INVOLÁVEL: Não sugerir se há sinais de convergência ou fechamento
  const contextLower = conversationContext.toLowerCase()
  const messageLower = userMessage.toLowerCase()
  
  const convergenceSignals = [
    'então',
    'resumindo',
    'conclusão',
    'fechar',
    'decidir',
    'chegamos',
    'ficou claro',
    'vamos fechar',
    'pra mim está decidido'
  ]

  const hasConvergenceSignal = convergenceSignals.some(signal => 
    contextLower.includes(signal) || messageLower.includes(signal)
  )

  if (hasConvergenceSignal) {
    return false
  }

  // Heurística conservadora: sugerir apenas se:
  // 1. Usuário está explorando um tópico específico
  // 2. Menciona necessidade de referências externas (implícita)
  // 3. Não está fechando ou convergindo

  // Padrões que indicam que busca externa seria útil
  const searchHelpfulPatterns = [
    /\b(?:como|quais?|onde|quando)\s+(?:outros?|outras?|empresas?|produtos?|times?)\s+/i,
    /\b(?:referências?|exemplos?|casos?)\s+(?:de|sobre|em)\s+/i,
    /\b(?:preciso|queria|gostaria)\s+(?:saber|entender|conhecer)\s+(?:mais|sobre|como)\s+/i
  ]

  const hasSearchHelpfulPattern = searchHelpfulPatterns.some(pattern => 
    pattern.test(messageLower)
  )

  // Sugestão deve ser rara: apenas se há padrão claro + estado adequado
  return hasSearchHelpfulPattern
}
