interface MessageBubbleProps {
  role: 'user' | 'pachai'
  content: string
  isFirst?: boolean
}

// Heurística simples apenas para espaçamento visual
// Não tem impacto semântico ou na lógica de estado
function isImportantMessage(content: string): boolean {
  const longMessage = content.length > 200
  const hasQuestion = content.includes('?') // Heurística - nem toda pergunta é profunda
  const hasSummaryKeywords = /resumindo|em resumo|em síntese/i.test(content)
  return longMessage || hasQuestion || hasSummaryKeywords
}

export default function MessageBubble({ role, content, isFirst = false }: MessageBubbleProps) {
  const isUser = role === 'pachai' ? false : true
  const isImportant = !isUser && isImportantMessage(content)
  
  // Calcular marginBottom dinamicamente (apenas visual)
  const marginBottom = isImportant ? '48px' : '28px'
  // Primeira mensagem não precisa de margin-top
  const marginTop = isFirst ? '0' : '24px'

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
        opacity: isUser ? 0.75 : 1,
        fontSize: '1rem',
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

