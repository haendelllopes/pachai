'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import ContextMenu from './ContextMenu'
import ConfirmDeleteModal from './ConfirmDeleteModal'
import { useProducts } from '@/app/contexts/ProductsContext'

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
  const { 
    products, 
    conversationsByProduct, 
    loading, 
    fetchProducts, 
    fetchConversations,
    addConversation,
    updateProductName,
    updateConversationTitle
  } = useProducts()
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [userName, setUserName] = useState<string>('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false)
  const [productRoles, setProductRoles] = useState<Record<string, 'owner' | 'editor' | 'viewer'>>({})
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{
    type: 'product' | 'conversation'
    id: string
    name: string
    x: number
    y: number
  } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    type: 'product' | 'conversation'
    id: string
    name: string
  } | null>(null)
  const [editingItem, setEditingItem] = useState<{
    type: 'product' | 'conversation'
    id: string
    currentName: string
  } | null>(null)
  
  // Estado collapsed com persistência em localStorage
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebarCollapsed') === 'true'
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(collapsed))
    }
  }, [collapsed])

  // Fechar menu do usuário ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

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

  // Buscar roles dos produtos
  useEffect(() => {
    async function fetchProductRoles() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const roles: Record<string, 'owner' | 'editor' | 'viewer'> = {}

      // Buscar roles via product_members
      const { data: members } = await supabase
        .from('product_members')
        .select('product_id, role')
        .eq('user_id', user.id)

      if (members) {
        members.forEach(m => {
          roles[m.product_id] = m.role as 'owner' | 'editor' | 'viewer'
        })
      }

      // Verificar produtos próprios (fallback)
      const { data: ownedProducts } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', user.id)

      if (ownedProducts) {
        ownedProducts.forEach(p => {
          if (!roles[p.id]) {
            roles[p.id] = 'owner'
          }
        })
      }

      setProductRoles(roles)
    }

    if (products.length > 0) {
      fetchProductRoles()
    }
  }, [products])


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
    const userRole = productRoles[productId]
    const isViewer = userRole === 'viewer'
    
    // Viewers não podem criar conversas
    if (isViewer) {
      return
    }
    
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

    // Adicionar nova conversa ao contexto
    addConversation(productId, newConversation)

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

  async function handleDeleteProduct(productId: string) {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        await fetchProducts()
        // Se estava na página do produto, redirecionar
        if (pathname?.includes(`/products/${productId}`)) {
          router.push('/products')
        }
      } else {
        const errorData = await response.json()
        console.error('Error deleting product:', errorData)
        alert('Erro ao excluir projeto: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  async function handleDeleteConversation(conversationId: string, productId: string) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) {
        // Recarregar conversas do contexto após deletar (forçar refresh)
        await fetchConversations(productId, true)
        // Fechar modal
        setDeleteModal(null)
        // Se estava na conversa deletada, redirecionar
        if (pathname?.includes(`/conversations/${conversationId}`)) {
          router.push(`/products/${productId}`)
        }
      } else {
        const errorData = await response.json()
        console.error('Error deleting conversation:', errorData)
        alert('Erro ao excluir conversa: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      alert('Erro ao excluir conversa')
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Refresh products when pathname changes
  useEffect(() => {
    if (pathname && pathname !== '/products/new') {
      fetchProducts()
    }
  }, [pathname, fetchProducts])

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
  }, [pathname, expandedProducts, fetchConversations])

  // Detectar se está em uma conversa ativa
  const isInConversation = pathname?.includes('/conversations/')
  const sidebarWidth = collapsed ? '64px' : '260px'

  return (
    <aside 
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : 'sidebar--expanded'} ${isInConversation ? 'in-conversation' : ''}`}
      style={{
        width: sidebarWidth,
        height: '100vh',
        background: 'var(--bg-main)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: collapsed ? '16px 8px' : '24px 16px',
        transition: 'width 0.2s ease, opacity 0.3s ease, padding 0.2s ease',
        opacity: isInConversation ? 0.6 : 1,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (isInConversation) {
          e.currentTarget.style.opacity = '0.9'
        }
        // Quando recolhida, mostrar affordance visual clara
        if (collapsed) {
          e.currentTarget.style.opacity = '1'
          setIsHoveringSidebar(true)
        }
      }}
      onMouseLeave={(e) => {
        if (isInConversation) {
          e.currentTarget.style.opacity = '0.6'
        }
        // Quando recolhida, voltar opacidade normal
        if (collapsed) {
          e.currentTarget.style.opacity = '1'
          setIsHoveringSidebar(false)
        }
      }}
    >
      {/* Topo: Ícone do Pachai + Botão Expandir/Recolher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        marginBottom: collapsed ? '24px' : '16px',
        gap: '8px',
      }}>
        {collapsed ? (
          /* Quando recolhida: mostrar apenas favicon, clicável, troca para expandir no hover */
          <button
            onClick={() => setCollapsed(false)}
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.2s',
            }}
            title="Expandir sidebar"
          >
            {isHoveringSidebar ? (
              /* Ícone de expandir no hover */
              <span style={{
                fontSize: '1.25rem',
                color: 'var(--text-main)',
                opacity: 0.7,
              }}>▶</span>
            ) : (
              /* Favicon quando não está em hover */
              <Image
                src="/icons/icon-192x192.png"
                alt="Pachai"
                width={32}
                height={32}
                style={{
                  width: '32px',
                  height: '32px',
                  opacity: 0.85,
                }}
              />
            )}
          </button>
        ) : (
          /* Quando expandida: mostrar ícone + texto + botão de recolher */
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Image
                src="/icons/icon-192x192.png"
                alt="Pachai"
                width={24}
                height={24}
                style={{
                  width: '24px',
                  height: '24px',
                  opacity: 0.85,
                }}
              />
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-main)',
              }}>
                Pachai
              </span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-main)',
                opacity: 0.7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7'
                e.currentTarget.style.background = 'transparent'
              }}
              title="Recolher sidebar"
            >
              ◀
            </button>
          </>
        )}
      </div>

      {/* Botão "+ Novo projeto" - logo acima de PROJETOS */}
      {!collapsed && (
        <Link
          href="/products/new"
          className="create-project"
          style={{
            marginBottom: '12px',
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
      )}

      {/* Título discreto - escondido quando colapsado */}
      {!collapsed && (
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
      )}

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
            fontSize: collapsed ? '0.75rem' : '0.875rem',
            opacity: 0.6,
            display: collapsed ? 'none' : 'block',
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
            display: collapsed ? 'none' : 'block',
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

              const isEditingProduct = editingItem?.type === 'product' && editingItem.id === product.id

              return (
                <div key={product.id} style={{ position: 'relative' }}>
                  {/* Project Item */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '2px',
                  }}>
                    {isEditingProduct ? (
                      <input
                        type="text"
                        defaultValue={product.name}
                        onBlur={async (e) => {
                          const newName = e.target.value.trim()
                          if (newName && newName !== product.name) {
                            try {
                              await updateProductName(product.id, newName)
                            } catch (error) {
                              console.error('Error updating product:', error)
                              alert('Erro ao atualizar nome do projeto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
                            }
                          }
                          setEditingItem(null)
                          setContextMenu(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur()
                          } else if (e.key === 'Escape') {
                            setEditingItem(null)
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          fontSize: '0.95rem',
                          padding: '6px 4px',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          background: 'white',
                          outline: 'none',
                          position: 'relative',
                          zIndex: 1000,
                        }}
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => toggleProduct(product.id)}
                          className="project-item"
                          style={{
                            flex: 1,
                            fontSize: '0.95rem',
                            color: 'var(--text-main)',
                            opacity: isActive ? 1 : 0.85,
                            padding: '6px 4px',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            fontWeight: isActive ? 500 : 400,
                            textAlign: 'left',
                            border: 'none',
                            background: 'transparent',
                            transition: 'all 0.2s',
                            display: collapsed ? 'none' : 'block',
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
                        {!collapsed && (
                          <div style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const rect = e.currentTarget.getBoundingClientRect()
                                setContextMenu({
                                  type: 'product',
                                  id: product.id,
                                  name: product.name,
                                  x: rect.right,
                                  y: rect.top,
                                })
                              }}
                              style={{
                                padding: '4px 8px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                color: 'var(--text-muted)',
                                opacity: 0.6,
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.6'
                              }}
                            >
                              ⋯
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Conversations List */}
                  {!collapsed && isExpanded && (() => {
                    const userRole = productRoles[product.id]
                    const isViewer = userRole === 'viewer'
                    
                    // Se for viewer, não mostrar conversas
                    if (isViewer) {
                      return (
                        <div
                          style={{
                            marginLeft: '12px',
                            marginTop: '4px',
                            marginBottom: '8px',
                            padding: '8px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            opacity: 0.6,
                            fontStyle: 'italic',
                          }}
                        >
                          Você tem acesso apenas ao contexto e vereditos deste produto. Conversas são privadas.
                        </div>
                      )
                    }
                    
                    return (
                      <div
                        className="conversation-list"
                        style={{
                          marginLeft: '12px',
                          marginTop: '4px',
                          marginBottom: '8px',
                        }}
                      >
                        {conversations.length === 0 ? (
                          <div style={{
                            padding: '4px 4px',
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            opacity: 0.5,
                            fontStyle: 'italic',
                          }}>
                            Nenhuma conversa
                          </div>
                        ) : (
                          conversations.map((conversation) => {
                        const isConvActive = pathname === `/products/${product.id}/conversations/${conversation.id}`
                        const isEditingConv = editingItem?.type === 'conversation' && editingItem.id === conversation.id
                        const convTitle = conversation.title || 'Nova conversa'

                        return (
                          <div key={conversation.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginBottom: '2px',
                          }}>
                            {isEditingConv ? (
                              <input
                                type="text"
                                defaultValue={convTitle}
                                onBlur={async (e) => {
                                  const newTitle = e.target.value.trim()
                                  if (newTitle && newTitle !== convTitle) {
                                    try {
                                      await updateConversationTitle(conversation.id, product.id, newTitle)
                                    } catch (error) {
                                      console.error('Error updating conversation:', error)
                                      alert('Erro ao atualizar título: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
                                    }
                                  }
                                  setEditingItem(null)
                                  setContextMenu(null)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur()
                                  } else if (e.key === 'Escape') {
                                    setEditingItem(null)
                                  }
                                }}
                                autoFocus
                                style={{
                                  flex: 1,
                                  fontSize: '0.85rem',
                                  padding: '4px 4px',
                                  border: '1px solid var(--border-subtle)',
                                  borderRadius: '6px',
                                  background: 'white',
                                  outline: 'none',
                                  position: 'relative',
                                  zIndex: 1000,
                                }}
                              />
                            ) : (
                              <>
                                <Link
                                  href={`/products/${product.id}/conversations/${conversation.id}`}
                                  className="conversation-item"
                                  style={{
                                    flex: 1,
                                    fontSize: '0.85rem',
                                    color: 'var(--text-main)',
                                    opacity: isConvActive ? 0.9 : 0.6,
                                    padding: '4px 4px',
                                    cursor: 'pointer',
                                    display: 'block',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.8'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = isConvActive ? '0.9' : '0.6'
                                  }}
                                >
                                  {convTitle}
                                </Link>
                                <div style={{ position: 'relative' }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setContextMenu({
                                        type: 'conversation',
                                        id: conversation.id,
                                        name: convTitle,
                                        x: rect.right,
                                        y: rect.top,
                                      })
                                    }}
                                    style={{
                                      padding: '2px 6px',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '0.875rem',
                                      color: 'var(--text-muted)',
                                      opacity: 0.6,
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.opacity = '1'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.opacity = '0.6'
                                    }}
                                  >
                                    ⋯
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )
                      }))}
                      </div>
                    )
                  })()}
                  )}
                </div>
              )
            })}
          </div>
        )}
      </nav>

      {/* Separador invisível */}
      <div style={{ flexGrow: 1 }} />

      {/* Menu do usuário */}
      <div ref={userMenuRef} style={{ position: 'relative' }}>
        <div
          className="sidebar-user"
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            opacity: 0.6,
            cursor: 'pointer',
            padding: collapsed ? '8px' : '8px 6px',
            borderRadius: '6px',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: collapsed ? '32px' : 'auto',
            height: collapsed ? '32px' : 'auto',
            margin: collapsed ? '0 auto' : '0',
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
          {collapsed ? (
            <div style={{
              width: '24px',
              height: '24px',
              minWidth: '24px',
              minHeight: '24px',
              borderRadius: '50%',
              background: 'var(--text-main)',
              color: 'var(--bg-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: 1,
              boxSizing: 'border-box',
              flexShrink: 0,
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
          ) : (
            userName
          )}
        </div>

        {/* Dropdown do menu do usuário */}
        {showUserMenu && !collapsed && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: '8px',
            background: 'white',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            minWidth: '160px',
            zIndex: 1000,
          }}>
            <div style={{
              padding: '0.5rem 0',
            }}>
              <div style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-main)',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '0.25rem',
              }}>
                {userName}
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false)
                  // Placeholder para configurações
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--text-main)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Configurações
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderTop: '1px solid var(--border-subtle)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#d32f2f',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                Sair
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
              {
                label: contextMenu.type === 'product' ? 'Renomear projeto' : 'Renomear conversa',
                onClick: () => {
                  setEditingItem({
                    type: contextMenu.type,
                    id: contextMenu.id,
                    currentName: contextMenu.name,
                  })
                  setContextMenu(null)
                },
              },
              {
                label: contextMenu.type === 'product' ? 'Excluir projeto' : 'Excluir conversa',
                onClick: () => {
                  // Capturar valores antes que o menu seja fechado pelo ContextMenu
                  const menuType = contextMenu.type
                  const menuId = contextMenu.id
                  const menuName = contextMenu.name
                  
                  // Definir deleteModal imediatamente antes que o ContextMenu feche
                  setDeleteModal({
                    type: menuType === 'product' ? 'product' : 'conversation',
                    id: menuId,
                    name: menuName,
                  })
                },
                danger: true,
              },
            ]}
            onClose={() => setContextMenu(null)}
          />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <ConfirmDeleteModal
          isOpen={true}
          onClose={() => setDeleteModal(null)}
          onConfirm={() => {
            if (deleteModal.type === 'product') {
              handleDeleteProduct(deleteModal.id)
            } else {
              // Encontrar productId da conversa
              const productId = Object.keys(conversationsByProduct).find(pId =>
                conversationsByProduct[pId].some(c => c.id === deleteModal.id)
              )
              if (productId) {
                handleDeleteConversation(deleteModal.id, productId)
              }
            }
          }}
          title={deleteModal.type === 'product' ? 'Excluir projeto?' : 'Excluir conversa?'}
          message={deleteModal.type === 'product' 
            ? `Tem certeza que deseja excluir o projeto "${deleteModal.name}"?`
            : `Tem certeza que deseja excluir a conversa "${deleteModal.name}"?`
          }
          itemName={deleteModal.name}
          cascadeWarning={deleteModal.type === 'product'
            ? 'Isso excluirá permanentemente todas as conversas, mensagens e vereditos associados a este projeto.'
            : 'Isso excluirá permanentemente todas as mensagens e vereditos associados a esta conversa.'
          }
        />
      )}
    </aside>
  )
}
