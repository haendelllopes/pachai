import { Message } from './agent'

/**
 * Extrai um resumo breve do tema principal da conversa
 * Usado para contexto ao reabrir conversas pausadas
 * 
 * @param messages Histórico de mensagens da conversa
 * @returns Resumo breve (2-3 frases máximo) do tema tratado
 */
export function getConversationSummary(messages: Message[]): string {
  if (!messages || messages.length === 0) {
    return 'Conversa sem histórico anterior.'
  }

  // Pegar últimas 8-10 mensagens para contexto
  const recentMessages = messages.slice(-10)
  
  // Filtrar apenas mensagens do usuário para identificar tema principal
  const userMessages = recentMessages
    .filter(m => m.role === 'user')
    .map(m => m.content.trim())
    .filter(Boolean)

  if (userMessages.length === 0) {
    return 'Conversa iniciada recentemente.'
  }

  // Extrair palavras-chave e temas das mensagens do usuário
  // Focar nas últimas 3-4 mensagens do usuário para tema mais recente
  const lastUserMessages = userMessages.slice(-4)
  
  // Criar resumo simples baseado no conteúdo das mensagens
  // Se houver múltiplas mensagens, tentar identificar tema comum
  if (lastUserMessages.length === 1) {
    const msg = lastUserMessages[0]
    // Limitar a 150 caracteres e adicionar reticências se necessário
    if (msg.length > 150) {
      return `Na última vez, você estava explorando: ${msg.substring(0, 150)}...`
    }
    return `Na última vez, você estava explorando: ${msg}`
  }

  // Para múltiplas mensagens, identificar tema comum
  // Pegar palavras mais frequentes (excluindo stop words básicas)
  const stopWords = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das',
    'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'sem',
    'que', 'qual', 'quais', 'quando', 'onde', 'como', 'porque',
    'é', 'são', 'foi', 'ser', 'estar', 'ter', 'há', 'tem',
    'eu', 'você', 'ele', 'ela', 'nós', 'eles', 'elas',
    'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes',
    'isso', 'isto', 'aquilo', 'aqui', 'ali', 'lá',
    'muito', 'mais', 'menos', 'pouco', 'muito', 'tanto',
    'já', 'ainda', 'sempre', 'nunca', 'agora', 'então', 'depois'
  ])

  // Extrair palavras significativas das últimas mensagens
  const words: string[] = []
  lastUserMessages.forEach(msg => {
    const msgWords = msg
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w))
    words.push(...msgWords)
  })

  // Contar frequência de palavras
  const wordCount: Record<string, number> = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  // Pegar palavras mais frequentes (top 3-5)
  const topWords = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  if (topWords.length > 0) {
    const theme = topWords.join(', ')
    return `Na última vez, estávamos explorando temas relacionados a: ${theme}.`
  }

  // Fallback: usar início da última mensagem do usuário
  const lastMessage = lastUserMessages[lastUserMessages.length - 1]
  if (lastMessage.length > 100) {
    return `Na última vez, você estava explorando: ${lastMessage.substring(0, 100)}...`
  }
  
  return `Na última vez, você estava explorando: ${lastMessage}`
}

