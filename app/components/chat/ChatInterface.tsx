'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import MessageBubble from './MessageBubble'
import ErrorMessage from './ErrorMessage'
import VeredictForm from './VeredictForm'
import AttachmentTrigger from './AttachmentTrigger'
import AttachmentContextBar from './AttachmentContextBar'
import { useAttachmentManager } from '@/app/hooks/useAttachmentManager'
import { createClient } from '@/app/lib/supabase/client'
import { useProducts } from '@/app/contexts/ProductsContext'

interface Message {
  id: string
  role: 'user' | 'pachai'
  content: string
  created_at: string
  isError?: boolean
}

interface ChatInterfaceProps {
  productId: string
  conversationId: string
}

export default function ChatInterface({ productId, conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVeredictForm, setShowVeredictForm] = useState(false)
  const [suggestedTitle, setSuggestedTitle] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()
  
  // AttachmentManager isolado - gerencia upload e estado de anexos
  const { attachments, uploading, uploadFile, deleteAttachment, refreshAttachments } = useAttachmentManager(conversationId)
  
  // Contexto para atualização de título
  const { generateAndUpdateConversationTitle } = useProducts()
  
  const MAX_HEIGHT = 160

  useEffect(() => {
    fetchMessages()
    refreshAttachments(conversationId)
  }, [conversationId, refreshAttachments])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Focar o input quando o componente é montado ou conversationId muda
    setTimeout(() => {
      inputRef.current?.focus()
      if (inputRef.current) {
        const el = inputRef.current
        el.style.height = 'auto'
        
        if (el.scrollHeight <= MAX_HEIGHT) {
          el.style.height = `${el.scrollHeight}px`
          el.style.overflowY = 'hidden'
        } else {
          el.style.height = `${MAX_HEIGHT}px`
          el.style.overflowY = 'auto'
        }
      }
    }, 100)
  }, [conversationId])

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
    } else {
      // Deduplicar mensagens por ID para garantir que não haja duplicatas
      // Mesmo se houver duplicatas no banco, apenas uma aparecerá no estado
      const uniqueMessages = Array.from(
        new Map((data || []).map(msg => [msg.id, msg])).values()
      )
      setMessages(uniqueMessages)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }


  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as any)
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userContent = input.trim()
    setInput('')
    setLoading(true)
    
    // Resetar altura e restaurar foco no input após limpar o campo
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto'
        inputRef.current.focus()
      }
    })

    // A API /api/pachai é responsável por salvar a mensagem do usuário
    // Não inserir mensagem aqui para evitar duplicação
    // A mensagem será buscada via fetchMessages() após a resposta da API

    // Generate Pachai response using API
    try {
      // Chamar API route (a detecção de veredito é feita no servidor)
      const response = await fetch('/api/pachai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId,
          userMessage: userContent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate response')
      }

      const data = await response.json()
      const pachaiContent = data.message

      if (!pachaiContent) {
        throw new Error('Empty response from Pachai')
      }

      // A mensagem já foi salva pela API route, buscar atualizada
      await fetchMessages()
      
      // Gerar título automaticamente após 2 mensagens do usuário
      // Verificar após buscar mensagens atualizadas
      const checkAndGenerateTitle = async () => {
        const supabase = createClient()
        const { data: currentMessages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
        
        if (!currentMessages) return
        
        // Contar mensagens do usuário (não total)
        const userMessages = currentMessages.filter(m => m.role === 'user')
        
        // Verificar após 2 mensagens do usuário
        if (userMessages.length >= 2) {
          // Verificar se título é null ou "Nova conversa"
          const { data: conv } = await supabase
            .from('conversations')
            .select('title')
            .eq('id', conversationId)
            .single()
          
          if (!conv?.title || conv.title === 'Nova conversa') {
            try {
              // Usar função do contexto em vez de reload
              await generateAndUpdateConversationTitle(conversationId, productId, currentMessages)
            } catch (error) {
              console.error('Error generating conversation title:', error)
              // Não bloquear o fluxo se falhar
            }
          }
        }
      }
      
      checkAndGenerateTitle()
      
      // Check if Pachai response is asking about veredict confirmation
      // O prompt de confirmação pode indicar que há suspeita de veredito
      if (pachaiContent.includes('veredito para você') ||
          pachaiContent.includes('ainda está em aberto') ||
          pachaiContent.includes('representa um veredito')) {
        // Não mostrar formulário automaticamente - aguardar resposta do usuário
        // O formulário será mostrado quando o usuário confirmar explicitamente
      }
    } catch (error) {
      console.error('Error generating Pachai response:', error)
      // Buscar mensagens do backend para garantir consistência mesmo em caso de erro
      await fetchMessages()
      // Mostrar mensagem de erro ao usuário com linguagem humana e contextual
      // Esta é uma mensagem temporária de erro, não persistida no backend
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'pachai',
        content: 'Houve uma interrupção técnica agora. Quando quiser, pode escrever novamente.',
        created_at: new Date().toISOString(),
        isError: true,
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setLoading(false)
    
    // Restaurar foco no input após processar a mensagem
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  async function handleVeredictConfirm(title: string, pain: string, value: string, notes?: string) {
    setLoading(true)

    try {
      // Update conversation title
      await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId)

      // Get latest version number
      const { data: existingVeredicts } = await supabase
        .from('veredicts')
        .select('version')
        .eq('product_id', productId)
        .order('version', { ascending: false })
        .limit(1)

      const nextVersion = existingVeredicts && existingVeredicts.length > 0
        ? existingVeredicts[0].version + 1
        : 1

      // Create veredict
      await supabase
        .from('veredicts')
        .insert({
          product_id: productId,
          conversation_id: conversationId,
          pain,
          value,
          notes: notes || null,
          version: nextVersion,
        })

      setShowVeredictForm(false)
      setLoading(false)
    } catch (error) {
      console.error('Error saving veredict:', error)
      setLoading(false)
    }
  }

  return (
    <>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Área de mensagens */}
        <div
          className="chat-messages"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2.5rem 1.5rem 2rem',
            background: 'var(--bg-main)',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
              }}
            >
              <div
                style={{
                  maxWidth: '600px',
                  textAlign: 'center',
                }}
              >
                <Image
                  src="/image/hero-icon.jpeg"
                  alt="Pachai"
                  width={64}
                  height={64}
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 1.5rem',
                    opacity: 0.85,
                  }}
                />
                <div
                  style={{
                    marginBottom: '1.5rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '1.125rem',
                      lineHeight: 1.6,
                      color: 'var(--text-main)',
                      margin: 0,
                      marginBottom: '1rem',
                    }}
                  >
                    Olá! Este é um espaço para você explorar o que está doendo, pensar sobre decisões importantes e registrar vereditos conscientes.
                  </p>
                  <p
                    style={{
                      fontSize: '1rem',
                      lineHeight: 1.6,
                      color: 'var(--text-soft)',
                      margin: 0,
                    }}
                  >
                    O que você gostaria de conversar hoje?
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {messages.map((message, index) => {
                // Se for mensagem de erro, usar componente separado
                if (message.isError) {
                  return (
                    <ErrorMessage
                      key={message.id}
                      content={message.content}
                    />
                  )
                }
                
                // Passar mensagem anterior para detectar mensagens consecutivas do Pachai
                const previousMessage = index > 0 ? messages[index - 1] : null
                return (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    isFirst={index === 0}
                    previousMessage={previousMessage && !previousMessage.isError ? previousMessage : null}
                  />
                )
              })}
              {loading && (
                <div
                  style={{
                    maxWidth: '640px',
                    marginTop: '24px',
                    marginBottom: '28px',
                    padding: 0,
                    background: 'transparent',
                    color: 'var(--text-main)',
                    opacity: 0.6,
                    fontSize: '1rem',
                    fontWeight: 400,
                    lineHeight: 1.6,
                  }}
                >
                  Pensando...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Barra de contexto de anexos */}
        <AttachmentContextBar
          attachments={attachments}
          onDelete={deleteAttachment}
        />

        {/* Caixa de escrita */}
        <form
          className="chat-input"
          onSubmit={handleSend}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem',
            borderTop: attachments.length > 0 ? 'none' : '1px solid var(--border-soft)',
            background: 'var(--bg-soft)',
          }}
        >
          <AttachmentTrigger
            onFileSelect={async (file) => {
              await uploadFile(file, conversationId)
            }}
            disabled={loading || uploading}
          />
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              
              if (el.scrollHeight <= MAX_HEIGHT) {
                el.style.height = `${el.scrollHeight}px`
                el.style.overflowY = 'hidden'
              } else {
                el.style.height = `${MAX_HEIGHT}px`
                el.style.overflowY = 'auto'
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escreva no seu tempo. Não precisa decidir nada agora."
            disabled={loading}
            style={{
              flex: 1,
              resize: 'none',
              minHeight: '60px',
              maxHeight: '160px',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-soft)',
              background: 'white',
              fontSize: '1rem',
              lineHeight: '1.5',
              fontFamily: 'inherit',
              color: 'var(--text-main)',
              outline: 'none',
              alignSelf: 'flex-start',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: loading || !input.trim() ? 'transparent' : 'var(--accent)',
              color: loading || !input.trim() ? 'transparent' : 'white',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              opacity: loading || !input.trim() ? 0 : 1,
              transition: 'opacity 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim()) {
                e.currentTarget.style.opacity = '0.85'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && input.trim()) {
                e.currentTarget.style.opacity = '1'
              }
            }}
          >
            ↑
          </button>
        </form>
      </div>

      {showVeredictForm && (
        <VeredictForm
          suggestedTitle={suggestedTitle}
          onConfirm={handleVeredictConfirm}
          onCancel={() => setShowVeredictForm(false)}
        />
      )}
    </>
  )
}


