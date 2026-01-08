/**
 * Regras de governança para o Contexto Cognitivo do Produto
 * 
 * Proteções obrigatórias:
 * - NUNCA atualizar contexto automaticamente
 * - SEMPRE exigir confirmação explícita
 * - SEMPRE mostrar preview antes de salvar (quando aplicável)
 * - SEMPRE registrar updated_by e updated_at
 * - SEMPRE exigir change_reason
 * - BLOQUEAR qualquer tentativa de bypass
 */

export interface ContextUpdateParams {
  productId: string
  userId: string
  contentText: string
  changeReason: string
}

/**
 * Valida atualização de contexto
 * Verifica que todos os requisitos de governança estão atendidos
 */
export function validateContextUpdate(params: ContextUpdateParams): { valid: boolean; error?: string } {
  // 1. Validar campos obrigatórios
  if (!params.contentText || !params.contentText.trim()) {
    return {
      valid: false,
      error: 'contentText is required and cannot be empty'
    }
  }

  if (!params.changeReason || !params.changeReason.trim()) {
    return {
      valid: false,
      error: 'changeReason is required and cannot be empty'
    }
  }

  // 2. Validar tamanho do contexto (limite de 10.000 caracteres)
  if (params.contentText.length > 10000) {
    return {
      valid: false,
      error: 'contentText exceeds maximum length of 10,000 characters'
    }
  }

  // 3. Validar tamanho do motivo (limite de 500 caracteres)
  if (params.changeReason.length > 500) {
    return {
      valid: false,
      error: 'changeReason exceeds maximum length of 500 characters'
    }
  }

  // 4. Validar que não está tentando atualizar automaticamente
  // (isso é validado no nível de aplicação, não aqui)

  return { valid: true }
}

/**
 * Valida change_reason
 * Garante que não está vazio e tem tamanho razoável
 */
export function validateChangeReason(reason: string): boolean {
  if (!reason || !reason.trim()) {
    return false
  }

  if (reason.length > 500) {
    return false
  }

  return true
}

/**
 * Garante que toda atualização passa por confirmação explícita
 * Esta função deve ser chamada antes de qualquer atualização
 * 
 * NOTA: A confirmação explícita é garantida no nível de UI,
 * mas esta função serve como documentação e validação adicional
 */
export function requireExplicitConfirmation(): void {
  // Esta função não faz nada no código, mas serve como documentação
  // e pode ser usada em testes ou validações futuras
  // A confirmação explícita é garantida pelo fluxo de UI
}

/**
 * Log de auditoria para rastreabilidade
 * Registra todas as criações/atualizações de contexto
 */
export function logContextAudit(params: {
  action: 'create' | 'update'
  productId: string
  userId: string
  changeReason: string
  timestamp: string
}): void {
  // Log estruturado para auditoria
  console.log('[CONTEXT_AUDIT]', {
    action: params.action,
    productId: params.productId,
    userId: params.userId,
    changeReason: params.changeReason,
    timestamp: params.timestamp,
  })

  // Em produção, isso poderia ser enviado para um serviço de logging
  // ou salvo em uma tabela de auditoria
}

/**
 * Validação de segurança adicional
 * Bloqueia tentativas de bypass das regras de governança
 */
export function validateGovernanceRules(params: {
  hasExplicitConfirmation: boolean
  hasPreview: boolean
  hasChangeReason: boolean
}): { valid: boolean; error?: string } {
  if (!params.hasExplicitConfirmation) {
    return {
      valid: false,
      error: 'Explicit confirmation is required for context updates'
    }
  }

  if (!params.hasChangeReason) {
    return {
      valid: false,
      error: 'changeReason is required for context updates'
    }
  }

  // Preview não é obrigatório em todos os casos (ex: edição manual),
  // mas é recomendado para consolidações
  // if (!params.hasPreview) {
  //   return {
  //     valid: false,
  //     error: 'Preview is required for context updates'
  //   }
  // }

  return { valid: true }
}
