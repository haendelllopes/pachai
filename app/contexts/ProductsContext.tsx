'use client'

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react'
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

interface ProductsContextType {
  products: Product[]
  conversationsByProduct: Record<string, Conversation[]>
  loading: boolean
  fetchProducts: () => Promise<void>
  fetchConversations: (productId: string, force?: boolean) => Promise<void>
  addConversation: (productId: string, conversation: Conversation) => void
  updateProductName: (productId: string, newName: string) => Promise<void>
  updateConversationTitle: (conversationId: string, productId: string, newTitle: string) => Promise<void>
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [conversationsByProduct, setConversationsByProduct] = useState<Record<string, Conversation[]>>({})
  const [loading, setLoading] = useState(true)
  const fetchedConversationsRef = useRef<Set<string>>(new Set())

  const fetchProducts = useCallback(async () => {
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
  }, [])

  const fetchConversations = useCallback(async (productId: string, force: boolean = false) => {
    // Se forçar refresh, remover do ref para permitir nova busca
    if (force) {
      fetchedConversationsRef.current.delete(productId)
    }
    
    // Verificar se já temos os dados usando ref
    if (!force && fetchedConversationsRef.current.has(productId)) {
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
    } else {
      fetchedConversationsRef.current.add(productId)
      setConversationsByProduct(prev => ({
        ...prev,
        [productId]: data || []
      }))
    }
  }, [])

  const addConversation = useCallback((productId: string, conversation: Conversation) => {
    fetchedConversationsRef.current.add(productId)
    setConversationsByProduct(prev => ({
      ...prev,
      [productId]: [conversation, ...(prev[productId] || [])]
    }))
  }, [])

  const updateProductName = useCallback(async (productId: string, newName: string) => {
    // Atualização otimista: atualizar estado imediatamente
    const previousProducts = [...products]
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, name: newName } : p
    ))

    try {
      // Fazer chamada PATCH em segundo plano
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newName }),
      })

      if (!response.ok) {
        // Reverter em caso de erro
        setProducts(previousProducts)
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar nome do projeto')
      }
    } catch (error) {
      // Reverter em caso de erro
      setProducts(previousProducts)
      console.error('Error updating product name:', error)
      throw error
    }
  }, [products])

  const updateConversationTitle = useCallback(async (conversationId: string, productId: string, newTitle: string) => {
    // Atualização otimista: salvar estado anterior e atualizar imediatamente
    let previousConversations: Conversation[] = []
    setConversationsByProduct(prev => {
      previousConversations = prev[productId] ? [...prev[productId]] : []
      return {
        ...prev,
        [productId]: (prev[productId] || []).map(c =>
          c.id === conversationId ? { ...c, title: newTitle } : c
        )
      }
    })

    try {
      // Fazer chamada PATCH em segundo plano
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle }),
      })

      if (!response.ok) {
        // Reverter em caso de erro
        setConversationsByProduct(prev => ({
          ...prev,
          [productId]: previousConversations
        }))
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar título da conversa')
      }
    } catch (error) {
      // Reverter em caso de erro
      setConversationsByProduct(prev => ({
        ...prev,
        [productId]: previousConversations
      }))
      console.error('Error updating conversation title:', error)
      throw error
    }
  }, [])

  return (
    <ProductsContext.Provider
      value={{
        products,
        conversationsByProduct,
        loading,
        fetchProducts,
        fetchConversations,
        addConversation,
        updateProductName,
        updateConversationTitle,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider')
  }
  return context
}

