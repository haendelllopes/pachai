interface MessageBubbleProps {
  role: 'user' | 'pachai'
  content: string
}

export default function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
    }}>
      <div style={{
        maxWidth: '70%',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        background: isUser ? '#1a1a1a' : '#f0f0f0',
        color: isUser ? '#ffffff' : '#1a1a1a',
        fontSize: '0.9375rem',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}>
        {content}
      </div>
    </div>
  )
}

