'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'

interface Product {
  id: string
  name: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchProducts()
  }, [])

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
          Carregando produtos...
        </div>
      </div>
    )
  }

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
            className="landing-button"
          >
            + Criar primeiro produto
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem',
    }}>
      <div style={{
        marginBottom: '2rem',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: '#1a1a1a',
        }}>
          Produtos
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#666',
        }}>
          Selecione um produto para começar a conversar
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem',
      }}>
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            style={{
              display: 'block',
              padding: '1.5rem',
              border: '1px solid #e5e5e5',
              borderRadius: '0.5rem',
              background: '#ffffff',
              textDecoration: 'none',
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
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#1a1a1a',
            }}>
              {product.name}
            </h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#888',
            }}>
              Clique para abrir
            </p>
          </Link>
        ))}
      </div>

      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
      }}>
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
          className="landing-button"
        >
          + Criar novo produto
        </Link>
      </div>
    </div>
  )
}

