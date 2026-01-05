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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
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
        .select('id, product_id')
        .eq('id', conversationId)
        .eq('product_id', productId)
        .single()

      if (conversationError || !conversation) {
        console.error('Error fetching conversation:', conversationError)
        setError('Conversa não encontrada')
        setLoading(false)
        return
      }

      setLoading(false)
    }

    if (productId && conversationId) {
      loadProductAndConversation()
    }
  }, [productId, conversationId])

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
        borderBottom: '1px solid #e5e5e5',
        padding: '1.5rem 2rem',
        background: '#ffffff',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '0.25rem',
          color: '#1a1a1a',
        }}>
          {productName || `Produto ${productId}`}
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: '#666',
          fontWeight: 400,
          margin: 0,
        }}>
          Um espaço para explorar decisões e registrar vereditos conscientes
        </p>
      </div>
      
      <ChatInterface
        productId={productId}
        conversationId={conversationId}
      />
    </div>
  )
}

