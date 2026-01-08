'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'

interface ProductContextEditorProps {
  productId: string
}

export default function ProductContextEditor({ productId }: ProductContextEditorProps) {
  const [context, setContext] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editText, setEditText] = useState('')
  const [changeReason, setChangeReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchContext()
    checkPermissions()
  }, [productId])

  async function fetchContext() {
    try {
      setLoading(true)
      const response = await fetch(`/api/product-contexts?productId=${productId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          setContext(null)
          return
        }
        throw new Error('Failed to fetch context')
      }

      const data = await response.json()
      setContext(data.context?.content_text || null)
    } catch (err) {
      console.error('Error fetching context:', err)
      setContext(null)
    } finally {
      setLoading(false)
    }
  }

  async function checkPermissions() {
    try {
      // Verificar se usuário tem role owner ou editor
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCanEdit(false)
        return
      }

      const { data: member } = await supabase
        .from('product_members')
        .select('role')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single()

      if (member && (member.role === 'owner' || member.role === 'editor')) {
        setCanEdit(true)
        return
      }

      // Fallback: verificar se é owner original
      const { data: product } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', productId)
        .single()

      if (product && product.user_id === user.id) {
        setCanEdit(true)
      } else {
        setCanEdit(false)
      }
    } catch (err) {
      console.error('Error checking permissions:', err)
      setCanEdit(false)
    }
  }

  function handleEdit() {
    setEditText(context || '')
    setChangeReason('')
    setShowEditModal(true)
  }

  async function handleSave() {
    if (!editText.trim() || !changeReason.trim() || saving) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/product-contexts', {
        method: context ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          contentText: editText.trim(),
          changeReason: changeReason.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save context')
      }

      setShowEditModal(false)
      await fetchContext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar contexto')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return null
  }

  return (
    <>
      <div style={{
        borderBottom: '1px solid #e5e5e5',
        padding: '1.5rem 2rem',
        background: '#ffffff',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1rem',
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#1a1a1a',
            margin: 0,
          }}>
            Contexto Cognitivo do Produto
          </h2>
          {canEdit && (
            <button
              onClick={handleEdit}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '0.375rem',
                background: '#ffffff',
                color: '#666',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {context ? 'Editar' : 'Criar'}
            </button>
          )}
        </div>

        {context ? (
          <div style={{
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: '#333',
            whiteSpace: 'pre-wrap',
            padding: '1rem',
            background: '#f9f9f9',
            borderRadius: '0.5rem',
            border: '1px solid #e5e5e5',
          }}>
            {context}
          </div>
        ) : (
          <p style={{
            fontSize: '0.875rem',
            color: '#999',
            fontStyle: 'italic',
          }}>
            Ainda não há Contexto Cognitivo consolidado para este produto.
            {canEdit && ' Clique em "Criar" para começar.'}
          </p>
        )}
      </div>

      {showEditModal && (
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
              {context ? 'Editar' : 'Criar'} Contexto Cognitivo
            </h2>

            {error && (
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
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#666',
              }}>
                Contexto *
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                required
                rows={12}
                placeholder="Digite o Contexto Cognitivo do Produto..."
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
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                marginBottom: '0.5rem',
                color: '#666',
              }}>
                Motivo da {context ? 'atualização' : 'criação'} *
              </label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                required
                placeholder={`Ex: ${context ? 'Atualização' : 'Criação'} manual do Contexto Cognitivo`}
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
                onClick={() => {
                  setShowEditModal(false)
                  setError(null)
                }}
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
                type="button"
                onClick={handleSave}
                disabled={!editText.trim() || !changeReason.trim() || saving}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  background: saving ? '#ccc' : '#0070f3',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: (!editText.trim() || !changeReason.trim() || saving) ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
