'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'

interface Product {
  id: string
  name: string
}

export default function ProductsSidebar() {
  const pathname = usePathname()
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

  // Refresh products when pathname changes (e.g., after creating new product)
  useEffect(() => {
    if (pathname && pathname !== '/products/new') {
      fetchProducts()
    }
  }, [pathname])

  return (
    <aside style={{
      width: '280px',
      borderRight: '1px solid #e5e5e5',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#fafafa',
    }}>
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #e5e5e5',
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1rem',
        }}>
          Produtos
        </h2>
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
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#333'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1a1a1a'
          }}
        >
          + Novo produto
        </Link>
      </div>
      
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem',
      }}>
        {loading ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: '#888',
          }}>
            Carregando...
          </div>
        ) : products.length === 0 ? (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: '#888',
            fontSize: '0.875rem',
          }}>
            Nenhum produto ainda
          </div>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    marginBottom: '0.25rem',
                    fontSize: '0.875rem',
                    color: pathname === `/products/${product.id}` ? '#1a1a1a' : '#666',
                    background: pathname === `/products/${product.id}` ? '#ffffff' : 'transparent',
                    fontWeight: pathname === `/products/${product.id}` ? 500 : 400,
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== `/products/${product.id}`) {
                      e.currentTarget.style.background = '#f0f0f0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== `/products/${product.id}`) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {product.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  )
}

