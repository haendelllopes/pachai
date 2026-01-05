import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/products')
  }

  async function signInWithGoogle() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/products`,
      },
    })
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 600,
          marginBottom: '1rem',
          textAlign: 'center',
        }}>
          Entrar no Pachai
        </h1>
        
        <p style={{
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2rem',
          textAlign: 'center',
          color: '#666',
        }}>
          Continue com sua conta Google para acessar seu espaço de decisões.
        </p>
        
        <form action={signInWithGoogle}>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem 2rem',
              background: '#1a1a1a',
              color: '#ffffff',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: 500,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1a1a1a'
            }}
          >
            Continuar com Google
          </button>
        </form>
      </div>
    </main>
  )
}

