interface MessageBubbleProps {
  role: 'user' | 'pachai'
  content: string
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={`message ${isUser ? 'user' : 'pachai'}`}
      style={{
        maxWidth: '640px',
        marginBottom: '1.5rem',
        marginLeft: isUser ? 'auto' : '0',
        marginRight: isUser ? '0' : 'auto',
        color: 'var(--text-main)',
        opacity: isUser ? 0.85 : 1,
        fontSize: '1rem',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      {content}
    </div>
  )
}

