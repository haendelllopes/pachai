'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'

interface ShareProductModalProps {
  productId: string
  productName: string
  isOpen: boolean
  onClose: () => void
}

export default function ShareProductModal({
  productId,
  productName,
  isOpen,
  onClose,
}: ShareProductModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!email.trim()) {
      setError('E-mail é obrigatório')
      return
    }

    // Validação básica de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('E-mail inválido')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/products/${productId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          role: role,
          message: message.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao enviar convite')
        setLoading(false)
        return
      }

      setSuccess(true)
      setEmail('')
      setMessage('')
      setRole('editor')

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError('Erro ao enviar convite. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setEmail('')
      setMessage('')
      setRole('editor')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: 'var(--radius)',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}
        >
          Compartilhar produto
        </h2>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--muted-foreground)',
            marginBottom: '1.5rem',
            lineHeight: 1.6,
          }}
        >
          Ao compartilhar este produto, a pessoa terá acesso ao contexto cognitivo e aos vereditos.
          <br />
          Conversas permanecem privadas.
        </p>

        {success && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--muted)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
            }}
          >
            Convite enviado com sucesso!
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--destructive)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              color: 'var(--destructive-foreground)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: 'var(--foreground)',
              }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--input)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
              }}
              placeholder="E-mail da pessoa"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: 'var(--foreground)',
              }}
            >
              Papel
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="editor"
                  checked={role === 'editor'}
                  onChange={() => setRole('editor')}
                  disabled={loading}
                />
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>Editor</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Pode editar o contexto e criar vereditos
                  </div>
                </div>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="viewer"
                  checked={role === 'viewer'}
                  onChange={() => setRole('viewer')}
                  disabled={loading}
                />
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--foreground)' }}>Viewer</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Apenas visualização
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="message"
              style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: 'var(--foreground)',
              }}
            >
              Mensagem pessoal (opcional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--input)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
              placeholder="Mensagem opcional para o convite"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid var(--input)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: loading ? 'var(--muted)' : 'var(--primary)',
                color: 'var(--primary-foreground)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
