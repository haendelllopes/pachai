'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatInterface from '@/app/components/chat/ChatInterface'
import { useProducts } from '@/app/contexts/ProductsContext'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const conversationId = params.conversationId as string
  
  const { products, conversationsByProduct, fetchProducts, fetchConversations } = useProducts()
  const [error, setError] = useState<string | null>(null)

  // Buscar produto e conversas quando a página carregar
  useEffect(() => {
    if (productId && conversationId) {
      fetchProducts()
      fetchConversations(productId)
    }
  }, [productId, conversationId, fetchProducts, fetchConversations])

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
      
      <ChatInterface
        productId={productId}
        conversationId={conversationId}
      />
    </div>
  )
}

