import { detectVeredictSignal, Message } from './agent'

export function detectVeredictFromHistory(
  history: Message[]
) {
  const userMessages = history
    .filter(message => message.role === 'user')
    .map(message => message.content)
    .filter(Boolean)

  return detectVeredictSignal(userMessages)
}

