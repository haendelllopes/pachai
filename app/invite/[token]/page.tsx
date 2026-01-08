'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'

type InviteStatus = 'loading' | 'invalid' | 'expired' | 'accepted' | 'processing' | 'success' | 'email_mismatch'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [status, setStatus] = useState<InviteStatus>('loading')
  const [productId, setProductId] = useState<string | null>(null)
  const [productName, setProductName] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      processInvite()
    }
  }, [token])

  async function processInvite() {
    const supabase = createClient()

    // Verificar se usuário está autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      // Não autenticado - armazenar token e redirecionar para login
      sessionStorage.setItem('pending_invite_token', token)
      router.push(`/login?redirect=/invite/${token}`)
      return
    }

    // Buscar convite pelo token
    const { data: invitation, error: inviteError } = await supabase
      .from('product_invitations')
      .select('*, products(name)')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      setStatus('invalid')
      return
    }

    // Verificar expiração
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt < new Date()) {
      // Marcar como expirado
      await supabase
        .from('product_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      setStatus('expired')
      return
    }

    // Verificar status
    if (invitation.status === 'accepted') {
      setStatus('accepted')
      setProductId(invitation.product_id)
      setProductName((invitation.products as any)?.name || null)
      return
    }

    if (invitation.status === 'expired') {
      setStatus('expired')
      return
    }

    // Validar que e-mail do usuário corresponde ao convite
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      setStatus('email_mismatch')
      return
    }

    // Verificar se já é membro do produto
    const { data: existingMember } = await supabase
      .from('product_members')
      .select('id')
      .eq('product_id', invitation.product_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Já é membro - marcar convite como aceito e redirecionar
      await supabase
        .from('product_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      setStatus('success')
      setProductId(invitation.product_id)
      setTimeout(() => {
        router.push(`/products/${invitation.product_id}`)
      }, 1500)
      return
    }

    // Processar aceitação
    setStatus('processing')

    try {
      // Criar registro em product_members
      const { error: memberError } = await supabase
        .from('product_members')
        .insert({
          product_id: invitation.product_id,
          user_id: user.id,
          role: invitation.role,
          created_by: invitation.invited_by,
        })

      if (memberError) {
        console.error('Error creating product member:', memberError)
        setStatus('invalid')
        return
      }

      // Atualizar convite para accepted
      const { error: updateError } = await supabase
        .from('product_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      if (updateError) {
        console.error('Error updating invitation:', updateError)
        // Não falhar - o membro já foi criado
      }

      setStatus('success')
      setProductId(invitation.product_id)
      setProductName((invitation.products as any)?.name || null)

      // Redirecionar após 1.5 segundos
      setTimeout(() => {
        router.push(`/products/${invitation.product_id}`)
      }, 1500)
    } catch (error) {
      console.error('Error processing invitation:', error)
      setStatus('invalid')
    }
  }

  // Renderizar estados
  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            marginBottom: '1rem',
          }}>
            Validando convite...
          </div>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}>
            Convite inválido
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            marginBottom: '2rem',
          }}>
            Este convite não existe ou não é mais válido.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Ir para login
          </a>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}>
            Convite expirado
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            marginBottom: '2rem',
          }}>
            Este convite expirou. Entre em contato com quem convidou você para receber um novo convite.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Ir para login
          </a>
        </div>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}>
            Convite já aceito
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            marginBottom: '2rem',
          }}>
            {productName ? `Você já tem acesso ao produto "${productName}".` : 'Este convite já foi aceito anteriormente.'}
          </p>
          {productId && (
            <a
              href={`/products/${productId}`}
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Ver produto
            </a>
          )}
        </div>
      </div>
    )
  }

  if (status === 'email_mismatch') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}>
            E-mail não corresponde
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            marginBottom: '2rem',
          }}>
            Este convite foi enviado para outro endereço de e-mail. Faça login com a conta correta para aceitar o convite.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Ir para login
          </a>
        </div>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <div style={{
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            marginBottom: '1rem',
          }}>
            Processando convite...
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--foreground)',
          }}>
            Convite aceito!
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--muted-foreground)',
            marginBottom: '2rem',
          }}>
            {productName 
              ? `Você agora tem acesso ao produto "${productName}". Redirecionando...`
              : 'Você agora tem acesso ao produto. Redirecionando...'}
          </p>
        </div>
      </div>
    )
  }

  return null
}
