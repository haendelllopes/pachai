'use client'

import { useState, useEffect } from 'react'

interface ContextUpdateAfterVeredictFormProps {
  productId: string
  newVeredict: { pain: string; value: string; notes?: string }
  onConfirm: () => void
  onCancel: () => void
}

export default function ContextUpdateAfterVeredictForm({ 
  productId, 
  newVeredict,
  onConfirm, 
  onCancel 
}: ContextUpdateAfterVeredictFormProps) {
  const [consolidatedText, setConsolidatedText] = useState('')
  const [changeReason, setChangeReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Buscar texto consolidado com novo veredito
    async function fetchConsolidatedText() {
      try {
        setLoading(true)
        const response = await fetch('/api/product-contexts/consolidate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            productId,
            newVeredict,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to consolidate context')
        }

        const data = await response.json()
        setConsolidatedText(data.consolidatedText || '')
        setChangeReason('Atualização do Contexto Cognitivo após novo veredito')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao consolidar contexto')
      } finally {
        setLoading(false)
      }
    }

    fetchConsolidatedText()
  }, [productId, newVeredict])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consolidatedText.trim() || !changeReason.trim() || saving) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/product-contexts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          contentText: consolidatedText.trim(),
          changeReason: changeReason.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update context')
      }

      onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar contexto')
    } finally {
      setSaving(false)
    }
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
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}>
          Atualizar Contexto Cognitivo do Produto
        </h2>

        <p style={{
          fontSize: '0.875rem',
          color: '#666',
          marginBottom: '1.5rem',
        }}>
          Esse veredito altera o entendimento base do produto. Deseja atualizar o Contexto Cognitivo?
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Gerando texto consolidado...</p>
          </div>
        ) : error ? (
          <div style={{
            padding: '1rem',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            color: '#c33',
          }}>
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#666',
              }}>
                Contexto Consolidado *
              </label>
              <textarea
                value={consolidatedText}
                onChange={(e) => setConsolidatedText(e.target.value)}
                required
                rows={12}
                placeholder="Texto consolidado do entendimento do produto..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <p style={{
                fontSize: '0.75rem',
                color: '#999',
                marginTop: '0.25rem',
              }}>
                Você pode editar o texto antes de salvar
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#666',
              }}>
                Motivo da atualização *
              </label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                required
                placeholder="Ex: Atualização do Contexto Cognitivo após novo veredito"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  background: '#ffffff',
                  color: '#666',
                  fontSize: '1rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!consolidatedText.trim() || !changeReason.trim() || saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: saving ? '#ccc' : '#0070f3',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: (!consolidatedText.trim() || !changeReason.trim() || saving) ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Salvando...' : 'Atualizar Contexto'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
