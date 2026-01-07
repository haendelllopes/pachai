'use client'

import { Database } from '@/app/lib/types/database'

type Attachment = Database['public']['Tables']['conversation_attachments']['Row']

interface AttachmentContextBarProps {
  attachments: Attachment[]
  onDelete?: (attachmentId: string) => void
}

/**
 * Exibe anexos vinculados à conversa de forma não intrusiva
 * Mostra apenas "Contexto anexado" de forma discreta
 */
export default function AttachmentContextBar({ attachments, onDelete }: AttachmentContextBarProps) {
  if (attachments.length === 0) {
    return null
  }

  const getTypeLabel = (type: Attachment['type']) => {
    switch (type) {
      case 'document':
        return '📄'
      case 'image':
        return '🖼️'
      case 'audio':
        return '🎵'
      case 'video':
        return '🎥'
      default:
        return '📎'
    }
  }

  const getStatusLabel = (status: Attachment['status']) => {
    switch (status) {
      case 'processing':
        return 'processando contexto...'
      case 'ready':
        return 'contexto anexado'
      case 'failed':
        return 'erro ao processar'
      default:
        return ''
    }
  }

  return (
    <div
      style={{
        padding: '0.5rem 1rem',
        borderTop: '1px solid var(--border-soft)',
        background: 'var(--bg-soft)',
        fontSize: '0.875rem',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius)',
              background: attachment.status === 'processing' ? 'var(--accent)' : 'transparent',
              color: attachment.status === 'processing' ? 'white' : 'var(--text-muted)',
            }}
          >
            <span>{getTypeLabel(attachment.type)}</span>
            <span>{attachment.file_name}</span>
            <span style={{ opacity: 0.7 }}>
              {getStatusLabel(attachment.status)}
            </span>
            {onDelete && attachment.status === 'ready' && (
              <button
                type="button"
                onClick={() => onDelete(attachment.id)}
                style={{
                  marginLeft: '0.25rem',
                  padding: '0.125rem 0.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  opacity: 0.7,
                }}
                title="Remover anexo"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

