'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatInterface from '@/app/components/chat/ChatInterface'
import { createClient } from '@/app/lib/supabase/client'

export default function ProductPage() {
  const params = useParams()
  const productId = params.productId as string
  
  const [productName, setProductName] = useState<string>('')
  const [conversationId, setConversationId] = useState<string>('')
  const [loading, setLoading] = useState(true)

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
        setLoading(false)
        return
      }

      if (product) {
        setProductName(product.name)
      }

      // Buscar conversa existente (V1: 1 produto = 1 conversa)
      const { data: existingConversation, error: conversationError } = await supabase
        .from('conversations')
        .select('id')
        .eq('product_id', productId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (conversationError) {
        console.error('Error fetching conversation:', conversationError)
        setLoading(false)
        return
      }

      // Se não existir conversa, criar uma nova
      if (!existingConversation) {
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({ product_id: productId })
          .select()
          .single()

        if (createError || !newConversation) {
          console.error('Error creating conversation:', createError)
          setLoading(false)
          return
        }

        setConversationId(newConversation.id)
      } else {
        setConversationId(existingConversation.id)
      }

      setLoading(false)
    }

    if (productId) {
      loadProductAndConversation()
    }
  }, [productId])

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

  if (!conversationId) {
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
          Erro ao carregar conversa
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
        padding: '1rem 2rem',
        background: '#ffffff',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
        }}>
          {productName || `Produto ${productId}`}
        </h1>
      </div>
      
      <ChatInterface
        productId={productId}
        conversationId={conversationId}
      />
    </div>
  )
}

