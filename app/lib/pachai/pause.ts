/**
 * Lista de frases explícitas que indicam intenção de pausar a conversa
 */
const PAUSE_PHRASES = [
  'vamos pausar',
  'pausar por aqui',
  'podemos parar por agora',
  'vamos retomar depois',
  'deixar isso em aberto',
  'pausar essa conversa'
]

/**
 * Verifica se a mensagem do usuário contém uma solicitação explícita de pausa
 * 
 * Regras:
 * - Retorna true apenas se a mensagem contém uma das frases permitidas
 * - Verificação case-insensitive
 * - Sem heurística vaga ou inferência automática
 * 
 * @param userMessage Mensagem do usuário a ser verificada
 * @returns true se a mensagem contém solicitação explícita de pausa, false caso contrário
 */
export function shouldPauseConversation(userMessage: string): boolean {
  if (!userMessage || typeof userMessage !== 'string') {
    return false
  }

  const normalizedMessage = userMessage.toLowerCase().trim()

  // Verificar se alguma das frases permitidas está presente na mensagem
  return PAUSE_PHRASES.some(phrase => normalizedMessage.includes(phrase.toLowerCase()))
}

