import { createRouteHandlerClient } from '@/app/lib/supabase/route-handler'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getProductContext, createProductContext, updateProductContext, hasProductContext } from '@/app/lib/pachai/product-context'
import { canEditContext } from '@/app/lib/pachai/roles'

/**
 * GET /api/product-contexts?productId=xxx
 * Retorna contexto do produto se existir
 * Valida permissão via RLS
 */
export async function GET(request: Request) {
  const supabase = await createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  try {
    const context = await getProductContext(productId)
    
    if (!context) {
      return NextResponse.json({ context: null })
    }

    return NextResponse.json({ context })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      if (error.message === 'Forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    console.error('Error fetching product context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/product-contexts
 * Cria contexto inicial
 * Body: { productId, contentText, changeReason }
 * Apenas owner/editor pode criar
 */
export async function POST(request: Request) {
  const supabase = await createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user

  try {
    const { productId, contentText, changeReason } = await request.json()

    if (!productId || !contentText || !changeReason) {
      return NextResponse.json(
        { error: 'productId, contentText, and changeReason are required' },
        { status: 400 }
      )
    }

    // Validar permissão
    const canEdit = await canEditContext(productId, user.id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden: Only owners and editors can create context' },
        { status: 403 }
      )
    }

    // Verificar se já existe
    const exists = await hasProductContext(productId)
    if (exists) {
      return NextResponse.json(
        { error: 'Product context already exists. Use PUT to update.' },
        { status: 400 }
      )
    }

    const context = await createProductContext(
      productId,
      contentText,
      user.id,
      changeReason
    )

    return NextResponse.json({ context })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('required')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error('Error creating product context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/product-contexts
 * Atualiza contexto existente
 * Body: { productId, contentText, changeReason }
 * Apenas owner/editor pode atualizar
 * Sempre exige confirmação explícita (validação no frontend)
 */
export async function PUT(request: Request) {
  const supabase = await createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user

  try {
    const { productId, contentText, changeReason } = await request.json()

    if (!productId || !contentText || !changeReason) {
      return NextResponse.json(
        { error: 'productId, contentText, and changeReason are required' },
        { status: 400 }
      )
    }

    // Validar campos obrigatórios
    if (!contentText.trim()) {
      return NextResponse.json(
        { error: 'contentText cannot be empty' },
        { status: 400 }
      )
    }

    if (!changeReason.trim()) {
      return NextResponse.json(
        { error: 'changeReason cannot be empty' },
        { status: 400 }
      )
    }

    // Validar permissão
    const canEdit = await canEditContext(productId, user.id)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden: Only owners and editors can update context' },
        { status: 403 }
      )
    }

    const context = await updateProductContext(
      productId,
      contentText,
      user.id,
      changeReason
    )

    return NextResponse.json({ context })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('required') || error.message.includes('does not exist')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error('Error updating product context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
