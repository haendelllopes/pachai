import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar produtos
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
  }

  // Se houver produtos, redirecionar para o primeiro
  if (products && products.length > 0) {
    redirect(`/products/${products[0].id}`)
  }

  // Estado vazio: nenhum produto criado
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

