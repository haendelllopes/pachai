'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  itemName: string
  cascadeWarning?: string
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  cascadeWarning,
}: ConfirmDeleteModalProps) {
  // Prevenir scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  // Renderizar modal usando Portal para garantir que fique acima de tudo
  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999, // Z-index muito alto para garantir que fique acima de tudo
        pointerEvents: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 100000,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: 'var(--text-main)',
        }}>
          {title}
        </h2>
        
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-soft)',
          marginBottom: cascadeWarning ? '0.5rem' : '1.5rem',
          lineHeight: 1.6,
        }}>
          {message}
        </p>

        {cascadeWarning && (
          <p style={{
            fontSize: '0.8125rem',
            color: '#d32f2f',
            marginBottom: '1.5rem',
            padding: '0.75rem',
            background: 'rgba(211, 47, 47, 0.1)',
            borderRadius: '6px',
            lineHeight: 1.5,
          }}>
            {cascadeWarning}
          </p>
        )}

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: 'var(--text-main)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#d32f2f',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )

  // Usar Portal para renderizar no body, garantindo que fique acima de tudo
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}

