'use client'

import { useEffect, useRef, useState } from 'react'

interface ContextMenuProps {
  items: Array<{
    label: string
    onClick: () => void
    danger?: boolean
  }>
  onClose: () => void
}

export default function ContextMenu({ items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        background: '#ffffff', // Fundo branco sólido e opaco
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)', // Sombra mais forte para destacar
        overflow: 'hidden',
        minWidth: '160px',
        zIndex: 10000, // Z-index muito alto para garantir que fique acima de tudo
        isolation: 'isolate', // Cria novo contexto de empilhamento
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          style={{
            width: '100%',
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '0.875rem',
            color: item.danger ? '#d32f2f' : 'var(--text-main)',
            transition: 'background 0.2s',
            borderTop: index > 0 ? '1px solid var(--border-subtle)' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)' // Hover mais visível
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

