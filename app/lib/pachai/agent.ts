interface Message {
  role: 'user' | 'pachai'
  content: string
}

interface VeredictSignal {
  detected: boolean
  suggestedTitle?: string
}

/**
 * Detecta sinais explícitos de veredito nas mensagens do usuário
 */
export function detectVeredictSignal(userMessages: string[]): VeredictSignal {
  const lastMessage = userMessages[userMessages.length - 1]?.toLowerCase() || ''
  
  const signals = [
    'é isso',
    'chegamos em um veredito',
    'vamos fechar assim',
    'faz sentido registrar isso',
    'podemos registrar',
    'vamos registrar',
    'chegamos a uma conclusão',
    'fechado',
  ]

  const hasSignal = signals.some(signal => lastMessage.includes(signal))

  if (!hasSignal) {
    return { detected: false }
  }

  // Tentar extrair contexto para sugerir título
  // Em V1, usamos uma abordagem simples: pegar palavras-chave das últimas mensagens
  const recentMessages = userMessages.slice(-3).join(' ')
  const words = recentMessages
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5)
  
  const suggestedTitle = words.length > 0 
    ? `Decisão sobre ${words.slice(0, 3).join(' ')}`
    : 'Decisão de produto'

  return {
    detected: true,
    suggestedTitle,
  }
}

/**
 * Gera resposta mock do Pachai baseada no comportamento definido
 */
export function generatePachaiResponse(messages: Message[]): string {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content)
  const lastUserMessage = userMessages[userMessages.length - 1] || ''
  
  // Verificar se há veredito sinalizado
  const verdictSignal = detectVeredictSignal(userMessages.map(m => m.content))
  if (verdictSignal.detected && verdictSignal.suggestedTitle) {
    return `Posso registrar esta conversa como: "${verdictSignal.suggestedTitle}"?`
  }

  // Comportamento básico: escuta, reflexão, provocação
  
  // Se é primeira mensagem do usuário
  if (userMessages.length === 1) {
    return `Entendo que você está lidando com algo relacionado a "${extractKeyTopic(lastUserMessage)}".\n\nO que especificamente está doendo nesse momento?`
  }

  // Reflexão: reformular entendimento
  if (userMessages.length % 3 === 0) {
    return `Deixa eu ver se entendi: você mencionou algo sobre "${extractKeyTopic(lastUserMessage)}".\n\nIsso está relacionado à dor que você sente ou ao valor que você busca?`
  }

  // Provocação: perguntar sobre dor/valor
  if (userMessages.length % 2 === 0) {
    return `Quando você pensa nisso, qual é a dor específica que você quer resolver? E que valor você espera criar?`
  }

  // Escuta: ecoar parcialmente
  return `Você disse: "${lastUserMessage.substring(0, 100)}${lastUserMessage.length > 100 ? '...' : ''}"\n\nConte mais sobre isso.`
}

/**
 * Extrai tópico principal de uma mensagem (implementação simples)
 */
function extractKeyTopic(message: string): string {
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 3)
  
  return words.join(' ') || 'esse tema'
}

/**
 * Busca vereditos anteriores do produto (para conexão)
 */
export async function getPreviousVeredicts(productId: string, supabase: any) {
  const { data, error } = await supabase
    .from('veredicts')
    .select('pain, value, created_at, version')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching previous veredicts:', error)
    return []
  }

  return data || []
}

