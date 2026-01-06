interface ErrorMessageProps {
  content: string
}

export default function ErrorMessage({ content }: ErrorMessageProps) {
  return (
    <div
      style={{
        maxWidth: '480px',
        marginTop: '24px',
        marginBottom: '28px',
        padding: 0,
        background: 'transparent',
        color: 'var(--text-soft)',
        opacity: 0.7,
        fontSize: '0.875rem',
        fontWeight: 300,
        fontStyle: 'italic',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      {content}
    </div>
  )
}

