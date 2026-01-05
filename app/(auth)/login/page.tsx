'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validação frontend
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setLoading(false)
      return
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Preencha todos os campos')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      console.log('Attempting sign up...', { email: email.trim() })

      const result = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      })

      console.log('SignUp result:', { 
        hasData: !!result.data, 
        hasError: !!result.error,
        hasUser: !!result.data?.user 
      })

      if (result.error) {
        console.error('SignUp error:', result.error)
        setError(result.error.message || 'Erro ao criar conta')
        setLoading(false)
        return
      }

      // Aguardar data.session antes de redirecionar
      if (result.data?.session) {
        console.log('SignUp success, session established, refreshing router and redirecting...')
        router.refresh()
        router.push('/products')
      } else if (result.data?.user) {
        // Se não houver sessão imediatamente, aguardar e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 300))
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Session established after wait, refreshing router and redirecting...')
          router.refresh()
          router.push('/products')
        } else {
          console.error('Session not established yet')
          setError('Erro ao estabelecer sessão. Tente novamente.')
          setLoading(false)
        }
      } else {
        console.error('SignUp: No user in response')
        setError('Falha ao criar conta. Tente novamente.')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('SignUp exception:', err)
      setError(err.message || 'Erro ao criar conta')
      setLoading(false)
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      console.log('Attempting sign in...', { email: email.trim() })

      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      console.log('SignIn result:', { 
        hasData: !!result.data, 
        hasError: !!result.error,
        hasUser: !!result.data?.user 
      })

      if (result.error) {
        console.error('SignIn error:', result.error)
        setError(result.error.message || 'E-mail ou senha incorretos')
        setLoading(false)
        return
      }

      // Aguardar data.session antes de atualizar
      if (result.data?.session) {
        console.log('Session established, refreshing router...')
        router.refresh()
        // Middleware faz redirect para /products
      } else {
        // Se não houver sessão imediatamente, aguardar e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 300))
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Session established after wait, refreshing router...')
          router.refresh()
          // Middleware faz redirect para /products
        } else {
          console.error('Session not established')
          setError('Erro ao estabelecer sessão. Tente novamente.')
          setLoading(false)
        }
      }
    } catch (err: any) {
      console.error('SignIn exception:', err)
      setError(err.message || 'Erro ao fazer login')
      setLoading(false)
    }
  }

  if (!mounted) {
    return null // Evitar hydration mismatch
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
          {mode === 'signin' ? 'Entrar no Pachai' : 'Criar conta'}
        </h1>

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          justifyContent: 'center',
        }}>
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError(null)
            }}
            style={{
              padding: '0.5rem 1rem',
              background: mode === 'signin' ? '#1a1a1a' : 'transparent',
              color: mode === 'signin' ? '#ffffff' : '#666',
              border: '1px solid #e5e5e5',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
            }}
            style={{
              padding: '0.5rem 1rem',
              background: mode === 'signup' ? '#1a1a1a' : 'transparent',
              color: mode === 'signup' ? '#ffffff' : '#666',
              border: '1px solid #e5e5e5',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Criar conta
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#fee',
            color: '#c33',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {mode === 'signup' ? (
          <form onSubmit={handleSignUp}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Sobrenome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="landing-button"
              style={{
                width: '100%',
                padding: '0.75rem 2rem',
                background: loading ? '#ccc' : '#1a1a1a',
                color: '#ffffff',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="landing-button"
              style={{
                width: '100%',
                padding: '0.75rem 2rem',
                background: loading ? '#ccc' : '#1a1a1a',
                color: '#ffffff',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
