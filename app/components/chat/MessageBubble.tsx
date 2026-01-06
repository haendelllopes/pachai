interface MessageBubbleProps {
  role: 'user' | 'pachai'
  content: string
  isFirst?: boolean
  previousMessage?: { role: 'user' | 'pachai' } | null
}

// Heurística simples apenas para espaçamento visual
// Não tem impacto semântico ou na lógica de estado
function isImportantMessage(content: string): boolean {
  const longMessage = content.length > 200
  const hasQuestion = content.includes('?') // Heurística - nem toda pergunta é profunda
  const hasSummaryKeywords = /resumindo|em resumo|em síntese/i.test(content)
  return longMessage || hasQuestion || hasSummaryKeywords
}

export default function MessageBubble({ role, content, isFirst = false, previousMessage = null }: MessageBubbleProps) {
  const isUser = role === 'pachai' ? false : true
  const isImportant = !isUser && isImportantMessage(content)
  
  // Calcular marginBottom dinamicamente (apenas visual)
  // Mensagens do usuário têm espaçamento extra após elas
  const marginBottom = isUser ? '32px' : (isImportant ? '48px' : '28px')
  
  // Detectar mensagens consecutivas do Pachai para reforçar turnos
  const needsExtraSpace = !isUser && previousMessage?.role === 'pachai'
  const marginTop = isFirst ? '0' : needsExtraSpace ? '40px' : '24px'

  return (
    <div
      className={`message ${isUser ? 'user' : 'pachai'}`}
      style={{
        maxWidth: '640px',
        marginTop: marginTop,
        marginBottom: marginBottom,
        marginLeft: isUser ? 'auto' : '0',
        marginRight: isUser ? '0' : 'auto',
        padding: 0,
        background: 'transparent',
        color: 'var(--text-main)',
        opacity: isUser ? 0.68 : 1,
        fontSize: isUser ? '0.9375rem' : '1rem',
        fontWeight: isUser ? 300 : 400,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      {content}
    </div>
  )
}

