'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'

interface Product {
  id: string
  name: string
}

interface Conversation {
  id: string
  title: string | null
  created_at: string
}

export default function ProductsSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [conversationsByProduct, setConversationsByProduct] = useState<Record<string, Conversation[]>>({})
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário')
      }
    }
    fetchUser()
  }, [])

  async function fetchProducts() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('products')
      .select('id, name')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  async function fetchConversations(productId: string) {
    if (conversationsByProduct[productId]) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
    } else {
      setConversationsByProduct(prev => ({
        ...prev,
        [productId]: data || []
      }))
    }
  }

  function toggleProduct(productId: string) {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
      fetchConversations(productId)
    }
    setExpandedProducts(newExpanded)
  }

  async function handleCreateConversation(productId: string) {
    const supabase = createClient()
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({ product_id: productId })
      .select()
      .single()

    if (error || !newConversation) {
      console.error('Error creating conversation:', error)
      return
    }

    // Atualizar lista de conversas
    setConversationsByProduct(prev => ({
      ...prev,
      [productId]: [newConversation, ...(prev[productId] || [])]
    }))

    // Expandir produto se não estiver expandido
    if (!expandedProducts.has(productId)) {
      setExpandedProducts(new Set([...expandedProducts, productId]))
    }

    // Navegar para a nova conversa
    router.push(`/products/${productId}/conversations/${newConversation.id}`)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Refresh products when pathname changes
  useEffect(() => {
    if (pathname && pathname !== '/products/new') {
      fetchProducts()
    }
  }, [pathname])

  // Auto-expand product if viewing a conversation
  useEffect(() => {
    const match = pathname?.match(/\/products\/([^/]+)\/conversations\/([^/]+)/)
    if (match) {
      const productId = match[1]
      if (!expandedProducts.has(productId)) {
        setExpandedProducts(new Set([...expandedProducts, productId]))
        fetchConversations(productId)
      }
    }
  }, [pathname])

  // Detectar se está em uma conversa ativa
  const isInConversation = pathname?.includes('/conversations/')

  return (
    <aside 
      className={`sidebar ${isInConversation ? 'in-conversation' : ''}`}
      style={{
        width: '260px',
        height: '100vh',
        background: 'var(--bg-main)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        transition: 'opacity 0.3s ease',
        opacity: isInConversation ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (isInConversation) {
          e.currentTarget.style.opacity = '0.9'
        }
      }}
      onMouseLeave={(e) => {
        if (isInConversation) {
          e.currentTarget.style.opacity = '0.6'
        }
      }}
    >
      {/* Título discreto */}
      <div
        className="sidebar-section-title"
        style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          opacity: 0.6,
          marginBottom: '12px',
        }}
      >
        PROJETOS
      </div>

      {/* Projects List */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
      }}>
        {loading ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            opacity: 0.6,
          }}>
            Carregando...
          </div>
        ) : products.length === 0 ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            opacity: 0.6,
          }}>
            Nenhum projeto ainda
          </div>
        ) : (
          <div>
            {products.map((product) => {
              const isExpanded = expandedProducts.has(product.id)
              const conversations = conversationsByProduct[product.id] || []
              const isProductPage = pathname === `/products/${product.id}`
              const isConversationPage = pathname?.startsWith(`/products/${product.id}/conversations/`)
              const isActive = isProductPage || isConversationPage

              return (
                <div key={product.id}>
                  {/* Project Item */}
                  <button
                    onClick={() => toggleProduct(product.id)}
                    className="project-item"
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                      opacity: isActive ? 1 : 0.85,
                      padding: '6px 4px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontWeight: isActive ? 500 : 400,
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      transition: 'all 0.2s',
                      marginBottom: '2px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1'
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = isActive ? '1' : '0.85'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {product.name}
                  </button>

                  {/* Conversations List */}
                  {isExpanded && (
                    <div
                      className="conversation-list"
                      style={{
                        marginLeft: '12px',
                        marginTop: '4px',
                        marginBottom: '8px',
                      }}
                    >
                      {conversations.map((conversation) => {
                        const isConvActive = pathname === `/products/${product.id}/conversations/${conversation.id}`
                        return (
                          <Link
                            key={conversation.id}
                            href={`/products/${product.id}/conversations/${conversation.id}`}
                            className="conversation-item"
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-main)',
                              opacity: isConvActive ? 0.9 : 0.6,
                              padding: '4px 4px',
                              cursor: 'pointer',
                              display: 'block',
                              textDecoration: 'none',
                              transition: 'all 0.2s',
                              marginBottom: '2px',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = '0.8'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = isConvActive ? '0.9' : '0.6'
                            }}
                          >
                            {conversation.title || 'Nova conversa'}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </nav>

      {/* Ação de criação */}
      <Link
        href="/products/new"
        className="create-project"
        style={{
          marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.9rem',
          color: 'var(--text-main)',
          opacity: 0.65,
          cursor: 'pointer',
          padding: '6px 4px',
          borderRadius: '6px',
          textDecoration: 'none',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.65'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>+</span>
        <span>Novo projeto</span>
      </Link>

      {/* Separador invisível */}
      <div style={{ flexGrow: 1 }} />

      {/* Menu do usuário */}
      <div
        className="sidebar-user"
        onClick={handleLogout}
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-main)',
          opacity: 0.6,
          cursor: 'pointer',
          padding: '8px 6px',
          borderRadius: '6px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.85'
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {userName}
      </div>
    </aside>
  )
}
