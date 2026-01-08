'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import Image from 'next/image'

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

      // Aguardar data.session antes de atualizar
      if (result.data?.session) {
        console.log('SignUp success, session established')
        // Verificar se há convite pendente
        const pendingInviteToken = sessionStorage.getItem('pending_invite_token')
        if (pendingInviteToken) {
          sessionStorage.removeItem('pending_invite_token')
          router.push(`/invite/${pendingInviteToken}`)
        } else {
          // Verificar redirect da URL
          const redirect = new URLSearchParams(window.location.search).get('redirect')
          router.push(redirect || '/products')
        }
      } else if (result.data?.user) {
        // Se não houver sessão imediatamente, aguardar e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 300))
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Session established after wait')
          // Verificar se há convite pendente
          const pendingInviteToken = sessionStorage.getItem('pending_invite_token')
          if (pendingInviteToken) {
            sessionStorage.removeItem('pending_invite_token')
            router.push(`/invite/${pendingInviteToken}`)
          } else {
            // Verificar redirect da URL
            const redirect = new URLSearchParams(window.location.search).get('redirect')
            router.push(redirect || '/products')
          }
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

      // Aguardar data.session antes de navegar
      if (result.data?.session) {
        console.log('Session established')
        // Verificar se há convite pendente
        const pendingInviteToken = sessionStorage.getItem('pending_invite_token')
        if (pendingInviteToken) {
          sessionStorage.removeItem('pending_invite_token')
          router.push(`/invite/${pendingInviteToken}`)
        } else {
          // Verificar redirect da URL
          const redirect = new URLSearchParams(window.location.search).get('redirect')
          router.push(redirect || '/products')
        }
      } else {
        // Se não houver sessão imediatamente, aguardar e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 300))
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('Session established after wait')
          // Verificar se há convite pendente
          const pendingInviteToken = sessionStorage.getItem('pending_invite_token')
          if (pendingInviteToken) {
            sessionStorage.removeItem('pending_invite_token')
            router.push(`/invite/${pendingInviteToken}`)
          } else {
            // Verificar redirect da URL
            const redirect = new URLSearchParams(window.location.search).get('redirect')
            router.push(redirect || '/products')
          }
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
    <main
      className="auth-page"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundImage: 'url(/image/background-icon.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: 'var(--bg-main)',
        backgroundBlendMode: 'multiply',
        padding: '2rem',
      }}
    >
      <section
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(6px)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
        }}
      >
        <Image
          src="/image/hero-icon.jpeg"
          alt="Pachai"
          width={64}
          height={64}
          className="auth-icon"
          style={{
            width: '64px',
            height: '64px',
            marginBottom: '1.5rem',
            opacity: 0.85,
            margin: '0 auto 1.5rem',
          }}
        />

        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 400,
            fontFamily: 'Georgia, "Times New Roman", serif',
            marginBottom: '1.5rem',
            color: 'var(--text-main)',
            letterSpacing: '-0.01em',
          }}
        >
          {mode === 'signin' ? 'Entrar no Pachai' : 'Criar conta'}
        </h1>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '2rem',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError(null)
            }}
            style={{
              padding: '0.5rem 1rem',
              background: mode === 'signin' ? 'var(--text-main)' : 'transparent',
              color: mode === 'signin' ? 'var(--bg-main)' : 'var(--text-soft)',
              border: `1px solid var(--border-soft)`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 400,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
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
              background: mode === 'signup' ? 'var(--text-main)' : 'transparent',
              color: mode === 'signup' ? 'var(--bg-main)' : 'var(--text-soft)',
              border: `1px solid var(--border-soft)`,
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 400,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            Criar conta
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(204, 51, 51, 0.1)',
              color: 'oklch(0.50 0.15 25)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
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
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'white',
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
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'white',
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
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'white',
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
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'white',
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
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'white',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 2rem',
                background: loading ? 'var(--border-soft)' : 'var(--text-main)',
                color: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 400,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = '0.85'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
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
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'white',
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
                  border: '1px solid var(--border-soft)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '1rem',
                  color: 'var(--text-main)',
                  backgroundColor: 'white',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem 2rem',
                background: loading ? 'var(--border-soft)' : 'var(--text-main)',
                color: 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 400,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.opacity = '0.85'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
