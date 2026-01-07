'use client'

import { useRef } from 'react'

interface AttachmentTriggerProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

/**
 * Botão discreto (+) que abre seletor de arquivos
 * Isolado - apenas abre seletor, não gerencia upload
 */
export default function AttachmentTrigger({ onFileSelect, disabled }: AttachmentTriggerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
      // Reset input para permitir selecionar o mesmo arquivo novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.mp3,.wav,.m4a,image/*,video/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'transparent',
          border: '1px solid var(--border-soft)',
          color: 'var(--text-muted)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.25rem',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'var(--bg-soft)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'var(--border-soft)'
          }
        }}
        title="Anexar arquivo"
      >
        +
      </button>
    </>
  )
}

