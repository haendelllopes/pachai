/**
 * Testes de Conformidade dos Vereditos Fundadores
 * 
 * Estes testes garantem que:
 * 1. Cada veredito bloqueia comportamento proibido
 * 2. Prompts nunca vencem vereditos
 * 3. Estados nunca forçam violação
 * 4. Resposta final respeita fechamento e não cria perguntas reflexivas
 * 5. Enforcement é determinístico (não usa LLM)
 * 
 * Para executar: Integrar com framework de testes (Jest, Vitest, etc.)
 */

import { applyFoundationalVeredicts, GovernanceInput, clearVeredictsCache } from '../foundational-governance'
import { ConversationState } from '../states'
import { Message } from '../states'

// Helper para criar mensagens de teste
function createMessage(role: 'user' | 'pachai', content: string): Message {
  return { role, content, created_at: new Date().toISOString() }
}

describe('Vereditos Fundadores - Conformidade', () => {
  beforeEach(() => {
    clearVeredictsCache()
  })

  describe('REACTIVE_BEHAVIOR', () => {
    it('deve bloquear prompt com pergunta reflexiva', async () => {
      const input: GovernanceInput = {
        conversationId: 'test-1',
        userMessage: 'Teste',
        messages: [createMessage('user', 'Teste')],
        prompt: 'Você pode reformular o que acabou de dizer?'
      }

      const result = await applyFoundationalVeredicts('pre_prompt', input)

      expect(result.allowed).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.violations[0].veredict_code).toBe('REACTIVE_BEHAVIOR')
      expect(result.violations[0].was_blocked).toBe(true)
    })

    it('deve permitir prompt sem padrões reflexivos', async () => {
      const input: GovernanceInput = {
        conversationId: 'test-2',
        userMessage: 'Teste',
        messages: [createMessage('user', 'Teste')],
        prompt: 'Responda de forma direta e objetiva.'
      }

      const result = await applyFoundationalVeredicts('pre_prompt', input)

      // Pode ter outras violações, mas não REACTIVE_BEHAVIOR
      const reactiveViolation = result.violations.find(
        v => v.veredict_code === 'REACTIVE_BEHAVIOR'
      )
      expect(reactiveViolation).toBeUndefined()
    })
  })

  describe('CLOSURE_RECOGNITION', () => {
    it('deve bloquear prompt que reabre discussão após fechamento', async () => {
      const input: GovernanceInput = {
        conversationId: 'test-3',
        userMessage: 'Esse é o conceito',
        messages: [
          createMessage('user', 'Esse é o conceito')
        ],
        prompt: 'Mas e se considerarmos também outras possibilidades?'
      }

      const result = await applyFoundationalVeredicts('pre_prompt', input)

      expect(result.allowed).toBe(false)
      const closureViolation = result.violations.find(
        v => v.veredict_code === 'CLOSURE_RECOGNITION'
      )
      expect(closureViolation).toBeDefined()
      expect(closureViolation?.was_blocked).toBe(true)
    })

    it('deve detectar resposta que não reconhece fechamento', async () => {
      const input: GovernanceInput = {
        conversationId: 'test-4',
        userMessage: 'Esse é o conceito',
        messages: [
          createMessage('user', 'Esse é o conceito')
        ],
        response: 'Mas e se pensarmos melhor sobre isso?'
      }

      const result = await applyFoundationalVeredicts('post_response', input)

      const closureViolation = result.violations.find(
        v => v.veredict_code === 'CLOSURE_RECOGNITION_RESPONSE'
      )
      expect(closureViolation).toBeDefined()
    })

    it('deve permitir resposta que reconhece fechamento', async () => {
      const input: GovernanceInput = {
        conversationId: 'test-5',
        userMessage: 'Esse é o conceito',
        messages: [
          createMessage('user', 'Esse é o conceito')
        ],
        response: 'Entendido. Assumido como base.'
      }

      const result = await applyFoundationalVeredicts('post_response', input)

      const closureViolation = result.violations.find(
        v => v.veredict_code === 'CLOSURE_RECOGNITION_RESPONSE'
      )
      expect(closureViolation).toBeUndefined()
    })
  })

  describe('EXTERNAL_SEARCH_CONSCIOUS', () => {
    it('deve validar SearchContext apenas quando confirmado', async () => {
      // SearchContext só existe se confirmado explicitamente
      // A validação real acontece no runtime antes de criar SearchContext
      // Aqui apenas garantimos que o enforcement não bloqueia SearchContext válido
      
      const input: GovernanceInput = {
        conversationId: 'test-6',
        userMessage: 'Buscar sobre X',
        messages: [createMessage('user', 'Buscar sobre X')],
        searchContext: {
          query: 'X',
          results: [{ title: 'Result', snippet: 'Snippet', source: 'Source', url: 'URL' }],
          executedAt: new Date().toISOString()
        }
      }

      const result = await applyFoundationalVeredicts('pre_context', input)

      // SearchContext confirmado não deve gerar violação
      const searchViolation = result.violations.find(
        v => v.veredict_code === 'EXTERNAL_SEARCH_CONSCIOUS'
      )
      // Pode não ter violação se SearchContext foi confirmado corretamente
      expect(result.allowed).toBe(true)
    })
  })

  describe('MEMORY_SHARING', () => {
    it('deve garantir isolamento de mensagens entre conversas', async () => {
      // Este veredito é aplicado através da filtragem de contexto
      // O sistema garante que apenas mensagens da conversa atual são incluídas
      
      const input: GovernanceInput = {
        conversationId: 'test-7',
        userMessage: 'Teste',
        messages: [
          createMessage('user', 'Mensagem da conversa atual')
        ]
      }

      const result = await applyFoundationalVeredicts('pre_context', input)

      // Não deve haver violação se apenas mensagens da conversa atual estão presentes
      expect(result.allowed).toBe(true)
    })
  })

  describe('EXPLICIT_CONTEXT_EVOLUTION', () => {
    it('deve garantir que contexto só evolui por decisão explícita', async () => {
      // Este veredito é aplicado nas funções de update de contexto
      // Aqui apenas garantimos que não há tentativa automática
      
      const input: GovernanceInput = {
        conversationId: 'test-8',
        userMessage: 'Teste',
        productContext: 'Contexto existente'
      }

      const result = await applyFoundationalVeredicts('pre_context', input)

      // Não deve haver violação se não há tentativa de atualização automática
      expect(result.allowed).toBe(true)
    })
  })

  describe('Precedência sobre Prompts', () => {
    it('vereditos devem sempre vencer conflitos com prompts', async () => {
      // Se um prompt viola um veredito, o veredito deve bloquear
      const input: GovernanceInput = {
        conversationId: 'test-9',
        userMessage: 'Esse é o conceito',
        messages: [createMessage('user', 'Esse é o conceito')],
        prompt: 'Explore mais possibilidades e considere também outras alternativas'
      }

      const result = await applyFoundationalVeredicts('pre_prompt', input)

      // Veredito deve bloquear mesmo que prompt sugira exploração
      expect(result.allowed).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
    })
  })

  describe('Enforcement Determinístico', () => {
    it('não deve depender de LLM para validação', async () => {
      // Todos os enforcements são baseados em padrões determinísticos
      const input: GovernanceInput = {
        conversationId: 'test-10',
        userMessage: 'Você pode reformular isso?',
        messages: [createMessage('user', 'Você pode reformular isso?')],
        prompt: 'Você pode reformular o que acabou de dizer?'
      }

      const result = await applyFoundationalVeredicts('pre_prompt', input)

      // Deve detectar violação de forma determinística
      expect(result.violations.length).toBeGreaterThan(0)
      
      // Verificar que violação foi detectada por padrão, não por LLM
      const violation = result.violations[0]
      expect(violation.details?.pattern).toBeDefined()
    })
  })

  describe('Prompt Injection (Reforço Semântico)', () => {
    it('deve gerar seção de prompt injection na fase pre_prompt', async () => {
      const input: GovernanceInput = {
        conversationId: 'test-11',
        userMessage: 'Teste',
        messages: [createMessage('user', 'Teste')],
        prompt: 'Prompt normal'
      }

      const result = await applyFoundationalVeredicts('pre_prompt', input)

      // Deve gerar seção de reforço semântico
      expect(result.injectedPromptSection).toBeDefined()
      expect(result.injectedPromptSection).toContain('REGRAS FUNDADORAS DO PACHai')
    })
  })
})

// Exportar para uso em outros testes
export { createMessage }
