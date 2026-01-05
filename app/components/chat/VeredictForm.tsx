'use client'

import { useState } from 'react'

interface VeredictFormProps {
  suggestedTitle: string
  onConfirm: (title: string, pain: string, value: string, notes?: string) => void
  onCancel: () => void
}

export default function VeredictForm({ suggestedTitle, onConfirm, onCancel }: VeredictFormProps) {
  const [title, setTitle] = useState(suggestedTitle)
  const [pain, setPain] = useState('')
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pain.trim() || !value.trim() || loading) return
    
    setLoading(true)
    onConfirm(title, pain.trim(), value.trim(), notes.trim() || undefined)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '0.75rem',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}>
          Registrar Veredito
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#666',
            }}>
              Título da conversa
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#666',
            }}>
              Dor (pain) *
            </label>
            <textarea
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              required
              rows={3}
              placeholder="Qual é a dor que você quer resolver?"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#666',
            }}>
              Valor (value) *
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              rows={3}
              placeholder="Que valor você espera criar?"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              marginBottom: '0.5rem',
              color: '#666',
            }}>
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observações adicionais..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                background: '#ffffff',
                color: '#666',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !pain.trim() || !value.trim()}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading || !pain.trim() || !value.trim() ? '#ccc' : '#1a1a1a',
                color: '#ffffff',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: loading || !pain.trim() || !value.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Salvando...' : 'Salvar veredito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

