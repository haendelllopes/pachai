'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatInterface from '@/app/components/chat/ChatInterface'
import ShareProductModal from '@/app/components/product/ShareProductModal'
import { useProducts } from '@/app/contexts/ProductsContext'
import { createClient } from '@/app/lib/supabase/client'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const conversationId = params.conversationId as string
  
  const { products, conversationsByProduct, fetchProducts, fetchConversations } = useProducts()
  const [error, setError] = useState<string | null>(null)
  const [canShare, setCanShare] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Buscar produto e conversas quando a página carregar
  useEffect(() => {
    if (productId && conversationId) {
      fetchProducts()
      fetchConversations(productId)
      checkCanShare()
    }
  }, [productId, conversationId, fetchProducts, fetchConversations])

  async function checkCanShare() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setCanShare(false)
      return
    }

    // Verificar permissão via API ou diretamente
    try {
      const response = await fetch(`/api/products/${productId}/invite`, {
        method: 'HEAD',
        credentials: 'include',
      })
      // Se retornar 403, não tem permissão; se retornar 404, produto não existe; se retornar 401, não autenticado
      setCanShare(response.status === 200 || response.status === 400) // 400 significa que chegou até validação de body
    } catch {
      // Em caso de erro, verificar diretamente via product_members
      const { data: member } = await supabase
        .from('product_members')
        .select('role')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single()

      if (member && (member.role === 'owner' || member.role === 'editor')) {
        setCanShare(true)
        return
      }

      // Fallback: verificar se é owner original
      const { data: product } = await supabase
        .from('products')
        .select('user_id')
        .eq('id', productId)
        .single()

      setCanShare(product?.user_id === user.id)
    }
  }

  // Obter dados do contexto
  const product = products.find(p => p.id === productId)
  const productName = product?.name || ''
  const conversations = conversationsByProduct[productId] || []
  const conversation = conversations.find(c => c.id === conversationId)
  const conversationTitle = conversation?.title || null
  const loading = (!product && products.length > 0) || (!conversation && conversations.length > 0)

  // Verificar se produto ou conversa não foram encontrados
  useEffect(() => {
    if (products.length > 0 && !product) {
      setError('Produto não encontrado')
    } else if (conversations.length > 0 && !conversation) {
      setError('Conversa não encontrada')
    } else {
      setError(null)
    }
  }, [products, conversations, product, conversation])

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          color: '#888',
          fontSize: '1rem',
        }}>
          Carregando...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          color: '#888',
          fontSize: '1rem',
        }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        borderBottom: '1px solid var(--border-soft)',
        padding: '1rem 1.5rem 1.75rem',
        background: 'var(--bg-soft)',
        opacity: 0.85,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 400,
              fontFamily: 'Georgia, "Times New Roman", serif',
              marginBottom: '0.25rem',
              color: 'var(--text-main)',
              letterSpacing: '-0.01em',
              opacity: 0.9,
            }}>
              {productName || `Produto ${productId}`}
            </h1>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-soft)',
              fontWeight: 300,
              margin: 0,
              opacity: 0.75,
            }}>
              {conversationTitle || 'Nova conversa'}
            </p>
          </div>
          {canShare && (
            <button
              onClick={() => setShowShareModal(true)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Compartilhar
            </button>
          )}
        </div>
      </div>
      
      {showShareModal && (
        <ShareProductModal
          productId={productId}
          productName={productName}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
      
      <ChatInterface
        productId={productId}
        conversationId={conversationId}
      />
    </div>
  )
}

