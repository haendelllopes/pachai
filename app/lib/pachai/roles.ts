import { createClient } from '@/app/lib/supabase/server'

export type ProductRole = 'owner' | 'editor' | 'viewer'

/**
 * Obtém o papel do usuário em um produto
 * Retorna null se o usuário não tem acesso ao produto
 */
export async function getUserProductRole(
  productId: string,
  userId: string
): Promise<ProductRole | null> {
  const supabase = await createClient()

  // Primeiro, verificar em product_members
  const { data: member, error: memberError } = await supabase
    .from('product_members')
    .select('role')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .single()

  if (!memberError && member) {
    return member.role as ProductRole
  }

  // Fallback: verificar se é owner original (compatibilidade)
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('user_id')
    .eq('id', productId)
    .single()

  if (!productError && product && product.user_id === userId) {
    return 'owner'
  }

  return null
}

/**
 * Verifica se o usuário pode editar o contexto do produto
 * Apenas owner e editor podem editar
 */
export async function canEditContext(
  productId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserProductRole(productId, userId)
  return role === 'owner' || role === 'editor'
}

/**
 * Verifica se o usuário pode visualizar o contexto do produto
 * Qualquer role pode visualizar
 */
export async function canViewContext(
  productId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserProductRole(productId, userId)
  return role !== null
}

/**
 * Verifica se o usuário pode criar vereditos
 * Apenas owner e editor podem criar vereditos
 */
export async function canCreateVeredict(
  productId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserProductRole(productId, userId)
  return role === 'owner' || role === 'editor'
}
