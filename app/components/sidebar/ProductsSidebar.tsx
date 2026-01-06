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
  const [collapsed, setCollapsed] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário')
        setUserEmail(user.email || '')
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

  const sidebarWidth = collapsed ? '64px' : '240px'
  
  // Detectar se está em uma conversa ativa
  const isInConversation = pathname?.includes('/conversations/')

  return (
    <aside style={{
      width: sidebarWidth,
      borderRight: '1px solid var(--border-soft)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-soft)',
      transition: 'width 0.2s, opacity 0.3s ease',
      opacity: isInConversation ? 0.55 : 1,
    }}>
      {/* Header */}
      <div style={{
        padding: collapsed ? '1rem 0.5rem' : '1.5rem',
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '0.5rem',
      }}>
        {!collapsed && (
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 500,
            opacity: 1,
            margin: 0,
          }}>
            Projetos
          </h2>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: '0.5rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
          }}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* New Product Button */}
      {!collapsed && (
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e5e5',
        }}>
          <Link
            href="/products/new"
            style={{
              display: 'block',
              padding: '0.5rem 1rem',
              background: '#1a1a1a',
              color: '#ffffff',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'center',
              transition: 'background 0.2s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a1a1a'
            }}
          >
            + Novo projeto
          </Link>
        </div>
      )}

      {/* Projects List */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: collapsed ? '0.5rem 0' : '0.5rem',
      }}>
        {loading ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: '#888',
            fontSize: collapsed ? '0.75rem' : '0.875rem',
          }}>
            {collapsed ? '...' : 'Carregando...'}
          </div>
        ) : products.length === 0 ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: '#888',
            fontSize: '0.875rem',
          }}>
            {collapsed ? '...' : 'Nenhum projeto ainda'}
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {products.map((product) => {
              const isExpanded = expandedProducts.has(product.id)
              const conversations = conversationsByProduct[product.id] || []
              const isProductPage = pathname === `/products/${product.id}`
              const isConversationPage = pathname?.startsWith(`/products/${product.id}/conversations/`)

              return (
                <li key={product.id}>
                  {/* Product Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <button
                      onClick={() => toggleProduct(product.id)}
                      style={{
                        flex: 1,
                        padding: collapsed ? '0.75rem 0.5rem' : '0.75rem 1rem',
                        borderRadius: '0.375rem',
                        marginBottom: '0.25rem',
                        fontSize: '0.875rem',
                        color: (isProductPage || isConversationPage) ? '#1a1a1a' : '#666',
                        background: (isProductPage || isConversationPage) ? '#ffffff' : 'transparent',
                        fontWeight: 400,
                        opacity: 0.85,
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                      onMouseEnter={(e) => {
                        if (!isProductPage && !isConversationPage) {
                          e.currentTarget.style.background = '#f0f0f0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isProductPage && !isConversationPage) {
                          e.currentTarget.style.background = 'transparent'
                        }
                      }}
                    >
                      {!collapsed && (
                        <span style={{ fontSize: '0.75rem' }}>
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      )}
                      {collapsed ? '📁' : product.name}
                    </button>
                    {!collapsed && isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCreateConversation(product.id)
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: 'transparent',
                          border: '1px solid #e5e5e5',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          color: '#666',
                        }}
                        title="Nova conversa"
                      >
                        +
                      </button>
                    )}
                  </div>

                  {/* Conversations List */}
                  {!collapsed && isExpanded && (
                    <ul style={{
                      listStyle: 'none',
                      margin: 0,
                      paddingLeft: '1.5rem',
                      marginBottom: '0.5rem',
                    }}>
                      {conversations.map((conversation) => {
                        const isActive = pathname === `/products/${product.id}/conversations/${conversation.id}`
                        return (
                          <li key={conversation.id}>
                            <Link
                              href={`/products/${product.id}/conversations/${conversation.id}`}
                              style={{
                                display: 'block',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '0.375rem',
                                marginBottom: '0.25rem',
                                fontSize: '0.8125rem',
                                color: '#666',
                                background: isActive ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                                borderLeft: isActive ? '2px solid var(--accent)' : 'none',
                                fontWeight: 300,
                                opacity: 0.65,
                                transition: 'all 0.2s',
                                textDecoration: 'none',
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive) {
                                  e.currentTarget.style.background = 'transparent'
                                }
                              }}
                            >
                              {conversation.title || 'Nova conversa'}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {/* Profile Menu */}
      {!collapsed && (
        <div style={{
          borderTop: '1px solid #e5e5e5',
          padding: '1rem',
          position: 'relative',
        }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: showProfileMenu ? '#ffffff' : 'transparent',
              border: '1px solid #e5e5e5',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <div style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#1a1a1a',
            }}>
              {userName}
            </div>
            {userEmail && (
              <div style={{
                fontSize: '0.75rem',
                color: '#888',
              }}>
                {userEmail}
              </div>
            )}
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '1rem',
              right: '1rem',
              marginBottom: '0.5rem',
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '0.375rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#d32f2f',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      )}

      {collapsed && (
        <div style={{
          borderTop: '1px solid #e5e5e5',
          padding: '0.5rem',
          display: 'flex',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#1a1a1a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </aside>
  )
}
