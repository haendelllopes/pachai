import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { canShareProduct } from '@/app/lib/pachai/roles'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user
  const productId = params.id

  // Validar permissão de compartilhamento
  const canShare = await canShareProduct(productId, user.id)
  if (!canShare) {
    return NextResponse.json(
      { error: 'Forbidden: Only owners and editors can share products' },
      { status: 403 }
    )
  }

  // Validar que produto existe
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Validar dados do body
  const body = await request.json()
  const { email, role, message } = body

  // Validações
  if (!email || typeof email !== 'string' || !email.trim()) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }

  // Validação básica de formato de e-mail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    return NextResponse.json(
      { error: 'Invalid email format' },
      { status: 400 }
    )
  }

  if (!role || !['editor', 'viewer'].includes(role)) {
    return NextResponse.json(
      { error: 'Role must be either "editor" or "viewer"' },
      { status: 400 }
    )
  }

  // Validar que não está convidando a si mesmo
  if (email.trim().toLowerCase() === user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: 'You cannot invite yourself' },
      { status: 400 }
    )
  }

  // Gerar token único
  const token = crypto.randomUUID()

  // Calcular expiração (7 dias)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  // Criar convite
  const { data: invitation, error: inviteError } = await supabase
    .from('product_invitations')
    .insert({
      product_id: productId,
      email: email.trim().toLowerCase(),
      role: role,
      token: token,
      invited_by: user.id,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (inviteError) {
    console.error('Error creating invitation:', inviteError)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }

  // Chamar Edge Function para enviar e-mail (assíncrono)
  // Nota: Em produção, isso pode ser feito via webhook ou fila
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${siteUrl}/invite/${token}`

    // Chamar Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (supabaseUrl) {
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-invite-email`
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (serviceRoleKey) {
        const edgeFunctionResponse = await fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            invitation_id: invitation.id,
            product_name: product.name,
            email: email.trim(),
            role: role,
            token: token,
            invite_url: inviteUrl,
            message: message || null,
          }),
        })

        if (!edgeFunctionResponse.ok) {
          console.error('Error calling edge function:', await edgeFunctionResponse.text())
          // Não falhar a requisição se o e-mail falhar - o convite já foi criado
        }
      } else {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not configured, skipping email send')
      }
    }
  } catch (error) {
    console.error('Error sending invitation email:', error)
    // Não falhar a requisição se o e-mail falhar
  }

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expires_at: invitation.expires_at,
    },
  })
}
