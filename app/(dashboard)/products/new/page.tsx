'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'

export default function NewProductPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || loading) return

    setLoading(true)
    const supabase = createClient()

    try {
      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({ name: name.trim() })
        .select()
        .single()

      if (productError) throw productError

      // Create conversation automatically
      const { error: conversationError } = await supabase
        .from('conversations')
        .insert({ product_id: product.id })

      if (conversationError) throw conversationError

      // Redirect to product chat
      router.push(`/products/${product.id}`)
    } catch (error) {
      console.error('Error creating product:', error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}>
          Novo Produto
        </h1>
        
        <p style={{
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2rem',
          color: '#666',
        }}>
          Crie um espaço para suas decisões de produto.
        </p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do produto"
            required
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #e5e5e5',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              marginBottom: '1rem',
            }}
          />
          
          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{
              width: '100%',
              padding: '0.75rem 2rem',
              background: loading || !name.trim() ? '#ccc' : '#1a1a1a',
              color: '#ffffff',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Criando...' : 'Criar produto'}
          </button>
        </form>
      </div>
    </div>
  )
}

