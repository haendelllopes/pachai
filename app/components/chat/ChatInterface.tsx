'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import MessageBubble from './MessageBubble'
import VeredictForm from './VeredictForm'
import { createClient } from '@/app/lib/supabase/client'

interface Message {
  id: string
  role: 'user' | 'pachai'
  content: string
  created_at: string
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
  
  const MAX_HEIGHT = 160

  useEffect(() => {
    fetchMessages()
  }, [conversationId])

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
      setMessages(data || [])
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

    // Save user message
    const { data: userMessage, error: userError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: userContent,
      })
      .select()
      .single()

    if (userError) {
      console.error('Error saving user message:', userError)
      setLoading(false)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
      return
    }

    setMessages(prev => [...prev, userMessage])

    // Generate Pachai response using API
    try {
      // Chamar API route (a detecção de veredito é feita no servidor)
      const response = await fetch('/api/pachai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      // Mostrar mensagem de erro ao usuário
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'pachai',
        content: 'Desculpe, não consegui processar sua mensagem agora. Pode tentar novamente?',
        created_at: new Date().toISOString(),
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
        {/* Header minimalista */}
        <header
          className="chat-header"
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-soft)',
            fontSize: '0.9rem',
            opacity: 0.7,
            color: 'var(--text-main)',
          }}
        >
          <span className="chat-title">Pachai</span>
        </header>

        {/* Área de mensagens */}
        <div
          className="chat-messages"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 1.5rem',
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
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}
              {loading && (
                <div
                  style={{
                    maxWidth: '640px',
                    marginBottom: '1.5rem',
                    color: 'var(--text-soft)',
                    fontSize: '1rem',
                    fontStyle: 'italic',
                  }}
                >
                  Pensando...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Caixa de escrita */}
        <form
          className="chat-input"
          onSubmit={handleSend}
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '1rem',
            borderTop: '1px solid var(--border-soft)',
            background: 'var(--bg-soft)',
          }}
        >
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
            placeholder="Conte-me o que está em aberto…"
            disabled={loading}
            style={{
              flex: 1,
              resize: 'none',
              maxHeight: '160px',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-soft)',
              background: 'white',
              fontSize: '1rem',
              lineHeight: '1.5',
              fontFamily: 'inherit',
              color: 'var(--text-main)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: loading || !input.trim() ? 'var(--border-soft)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              transition: 'opacity 0.2s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (!loading && input.trim()) {
                e.currentTarget.style.opacity = '0.85'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
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


