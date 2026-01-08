'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { useProducts } from '@/app/contexts/ProductsContext'
import ProductContextEditor from '@/app/components/product/ProductContextEditor'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  
  const { products, conversationsByProduct, fetchProducts, fetchConversations } = useProducts()
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [userRole, setUserRole] = useState<'owner' | 'editor' | 'viewer' | null>(null)

  // Buscar produto e conversas quando a página carregar
  useEffect(() => {
    if (productId) {
      fetchProducts()
      checkUserRole()
      // Apenas buscar conversas se não for viewer
      checkUserRole().then(role => {
        if (role !== 'viewer') {
          fetchConversations(productId)
        }
      })
    }
  }, [productId, fetchProducts, fetchConversations])

  async function checkUserRole() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setUserRole(null)
      return null
    }

    // Verificar role via product_members
    const { data: member } = await supabase
      .from('product_members')
      .select('role')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single()

    if (member) {
      setUserRole(member.role as 'owner' | 'editor' | 'viewer')
      return member.role as 'owner' | 'editor' | 'viewer'
    }

    // Fallback: verificar se é owner original
    const { data: product } = await supabase
      .from('products')
      .select('user_id')
      .eq('id', productId)
      .single()

    if (product && product.user_id === user.id) {
      setUserRole('owner')
      return 'owner'
    }

    setUserRole(null)
    return null
  }

  // Obter dados do contexto
  const product = products.find(p => p.id === productId)
  const productName = product?.name || ''
  const conversations = userRole !== 'viewer' ? (conversationsByProduct[productId] || []) : []
  const loading = !product && products.length > 0
  const isViewer = userRole === 'viewer'

  async function handleCreateConversation() {
    if (creatingConversation) return

    setCreatingConversation(true)
    const supabase = createClient()

    try {
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({ product_id: productId })
        .select()
        .single()

      if (createError || !newConversation) {
        console.error('Error creating conversation:', createError)
        setCreatingConversation(false)
        return
      }

      // Redirecionar para a nova conversa
      router.push(`/products/${productId}/conversations/${newConversation.id}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      setCreatingConversation(false)
    }
  }

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

      <ProductContextEditor productId={productId} />

      {isViewer ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              color: '#666',
            }}>
              Você tem acesso apenas ao contexto cognitivo e aos vereditos deste produto. Conversas são privadas e não são compartilhadas.
            </p>
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: '500px',
            textAlign: 'center',
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              color: '#1a1a1a',
            }}>
              Nenhuma conversa ainda
            </h2>
            <p style={{
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '2rem',
              color: '#666',
            }}>
              Comece uma nova conversa para explorar decisões e registrar vereditos conscientes.
            </p>
            <button
              onClick={handleCreateConversation}
              disabled={creatingConversation}
              style={{
                padding: '0.75rem 2rem',
                background: creatingConversation ? '#ccc' : '#1a1a1a',
                color: '#ffffff',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: creatingConversation ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {creatingConversation ? 'Criando...' : '+ Nova conversa'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
        }}>
          <div style={{
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#1a1a1a',
            }}>
              Conversas
            </h2>
            <button
              onClick={handleCreateConversation}
              disabled={creatingConversation}
              style={{
                padding: '0.5rem 1rem',
                background: creatingConversation ? '#ccc' : '#1a1a1a',
                color: '#ffffff',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: creatingConversation ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {creatingConversation ? 'Criando...' : '+ Nova conversa'}
            </button>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => router.push(`/products/${productId}/conversations/${conversation.id}`)}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  background: '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1a1a1a'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e5e5'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: '#1a1a1a',
                  marginBottom: '0.25rem',
                }}>
                  {conversation.title || 'Nova conversa'}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#888',
                }}>
                  {new Date(conversation.created_at).toLocaleDateString('pt-BR')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

