import { createClient } from '@/app/lib/supabase/server'
import { canEditContext, canViewContext } from './roles'

export interface ProductContext {
  id: string
  product_id: string
  content_text: string
  embedding: string | null // JSON string ou vector, dependendo da disponibilidade da extensão
  change_reason: string
  updated_at: string
  updated_by: string
}

/**
 * Busca contexto do produto
 * Qualquer role pode ler
 * Retorna null se não existir
 */
export async function getProductContext(
  productId: string
): Promise<ProductContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar permissão de visualização
  const canView = await canViewContext(productId, user.id)
  if (!canView) {
    throw new Error('Forbidden')
  }

  const { data, error } = await supabase
    .from('product_contexts')
    .select('*')
    .eq('product_id', productId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Não encontrado - retorna null
      return null
    }
    throw new Error(`Failed to fetch product context: ${error.message}`)
  }

  return data as ProductContext
}

/**
 * Verifica se existe contexto do produto
 * Qualquer role pode verificar
 */
export async function hasProductContext(productId: string): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verificar permissão de visualização
  const canView = await canViewContext(productId, user.id)
  if (!canView) {
    return false
  }

  const { data, error } = await supabase
    .from('product_contexts')
    .select('id')
    .eq('product_id', productId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Não encontrado
      return false
    }
    throw new Error(`Failed to check product context: ${error.message}`)
  }

  return data !== null
}

/**
 * Cria contexto inicial do produto
 * Apenas owner/editor pode criar
 * Exige change_reason
 */
export async function createProductContext(
  productId: string,
  contentText: string,
  userId: string,
  changeReason: string
): Promise<ProductContext> {
  const supabase = await createClient()

  // Validar permissão
  const canEdit = await canEditContext(productId, userId)
  if (!canEdit) {
    throw new Error('Forbidden: Only owners and editors can create context')
  }

  // Validar campos obrigatórios
  if (!contentText || !contentText.trim()) {
    throw new Error('contentText is required')
  }

  if (!changeReason || !changeReason.trim()) {
    throw new Error('changeReason is required')
  }

  // Verificar se já existe contexto
  const exists = await hasProductContext(productId)
  if (exists) {
    throw new Error('Product context already exists. Use updateProductContext instead.')
  }

  const { data, error } = await supabase
    .from('product_contexts')
    .insert({
      product_id: productId,
      content_text: contentText.trim(),
      change_reason: changeReason.trim(),
      updated_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create product context: ${error.message}`)
  }

  return data as ProductContext
}

/**
 * Atualiza contexto existente do produto
 * Apenas owner/editor pode atualizar
 * Exige change_reason
 * Atualiza updated_at e updated_by automaticamente
 */
export async function updateProductContext(
  productId: string,
  contentText: string,
  userId: string,
  changeReason: string
): Promise<ProductContext> {
  const supabase = await createClient()

  // Validar permissão
  const canEdit = await canEditContext(productId, userId)
  if (!canEdit) {
    throw new Error('Forbidden: Only owners and editors can update context')
  }

  // Validar campos obrigatórios
  if (!contentText || !contentText.trim()) {
    throw new Error('contentText is required')
  }

  if (!changeReason || !changeReason.trim()) {
    throw new Error('changeReason is required')
  }

  // Verificar se contexto existe
  const exists = await hasProductContext(productId)
  if (!exists) {
    throw new Error('Product context does not exist. Use createProductContext instead.')
  }

  const { data, error } = await supabase
    .from('product_contexts')
    .update({
      content_text: contentText.trim(),
      change_reason: changeReason.trim(),
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('product_id', productId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update product context: ${error.message}`)
  }

  return data as ProductContext
}
