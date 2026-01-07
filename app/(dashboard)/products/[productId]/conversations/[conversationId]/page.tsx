'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ChatInterface from '@/app/components/chat/ChatInterface'
import { createClient } from '@/app/lib/supabase/client'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const conversationId = params.conversationId as string
  
  const [productName, setProductName] = useState<string>('')
  const [conversationTitle, setConversationTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadProductAndConversation() {
    const supabase = createClient()

    // Buscar dados do produto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single()

    if (productError) {
      console.error('Error fetching product:', productError)
      setError('Produto não encontrado')
      setLoading(false)
      return
    }

    if (product) {
      setProductName(product.name)
    }

    // Verificar se a conversa existe e pertence ao produto
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, product_id, title')
      .eq('id', conversationId)
      .eq('product_id', productId)
      .single()

    if (conversationError || !conversation) {
      console.error('Error fetching conversation:', conversationError)
      setError('Conversa não encontrada')
      setLoading(false)
      return
    }

    if (conversation) {
      setConversationTitle(conversation.title)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (productId && conversationId) {
      loadProductAndConversation()
    }
  }, [productId, conversationId])

  // Atualizar título quando a página receber visibilidade (útil após renomear)
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible' && productId && conversationId && !loading) {
        loadProductAndConversation()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [productId, conversationId, loading])

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

