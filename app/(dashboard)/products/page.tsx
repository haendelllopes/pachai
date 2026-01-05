'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/app/lib/supabase/client'

interface Product {
  id: string
  name: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
        
        // Se houver produtos, redirecionar para o primeiro
        if (data && data.length > 0) {
          router.push(`/products/${data[0].id}`)
        }
      }
      setLoading(false)
    }

    fetchProducts()
  }, [router])

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: '#888' }}>Carregando...</div>
      </div>
    )
  }

  // Estado vazio: nenhum produto criado
  if (products.length === 0) {
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
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: '#1a1a1a',
          }}>
            Vamos começar um novo produto
          </h1>
          
          <p style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
            color: '#666',
          }}>
            Produtos são contextos de pensamento no Pachai. Cada produto é um espaço onde você pode conversar com o Pachai sobre decisões, explorar dores e registrar vereditos conscientes.
          </p>
          
          <Link
            href="/products/new"
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: '#1a1a1a',
              color: '#ffffff',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a1a1a'
            }}
          >
            + Criar primeiro produto
          </Link>
        </div>
      </div>
    )
  }

  // Se houver produtos, este componente não será renderizado
  // porque o useEffect redireciona para o primeiro produto
  return null
}

