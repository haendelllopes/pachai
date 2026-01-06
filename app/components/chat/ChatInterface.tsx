'use client'

import { useState, useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import VeredictForm from './VeredictForm'
import { detectVeredictSignal } from '@/app/lib/pachai/agent'
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

    // Check for veredict signal
    const allUserMessages = [...messages.filter(m => m.role === 'user'), userMessage]
      .map(m => m.content)
    const verdictSignal = detectVeredictSignal(allUserMessages)

    if (verdictSignal.detected && verdictSignal.suggestedTitle) {
      setSuggestedTitle(verdictSignal.suggestedTitle)
      setShowVeredictForm(true)
      setLoading(false)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
      return
    }

    // Generate Pachai response using API
    try {
      // Construir histórico da conversa como string
      const conversationHistory = messages
        .map(m => `${m.role === 'user' ? 'Usuário' : 'Pachai'}: ${m.content}`)
        .join('\n')

      // Chamar API route
      const response = await fetch('/api/pachai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory,
          userMessage: userContent,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate response')
      }

      const data = await response.json()
      const pachaiContent = data.reply

      if (!pachaiContent) {
        throw new Error('Empty response from Pachai')
      }

      // Save Pachai message
      const { data: pachaiMessage, error: pachaiError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'pachai',
          content: pachaiContent,
        })
        .select()
        .single()

      if (pachaiError) {
        console.error('Error saving pachai message:', pachaiError)
        throw pachaiError
      }

      setMessages(prev => [...prev, pachaiMessage])
      
      // Check if Pachai response is asking for title confirmation
      // A API também pode retornar sinal de veredito na resposta
      if (pachaiContent.includes('Posso registrar esta conversa como:') || 
          pachaiContent.includes('veredito para você') ||
          pachaiContent.includes('registrar isso como')) {
        const titleMatch = pachaiContent.match(/"([^"]+)"/)
        if (titleMatch) {
          setSuggestedTitle(titleMatch[1])
          setShowVeredictForm(true)
        } else if (verdictSignal.suggestedTitle) {
          setSuggestedTitle(verdictSignal.suggestedTitle)
          setShowVeredictForm(true)
        }
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
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
        }}>
          {messages.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
            }}>
              <div style={{
                maxWidth: '600px',
                textAlign: 'center',
              }}>
                <div style={{
                  marginBottom: '1.5rem',
                }}>
                  <p style={{
                    fontSize: '1.125rem',
                    lineHeight: 1.6,
                    color: '#1a1a1a',
                    margin: 0,
                    marginBottom: '1rem',
                  }}>
                    Olá! Este é um espaço para você explorar o que está doendo, pensar sobre decisões importantes e registrar vereditos conscientes.
                  </p>
                  <p style={{
                    fontSize: '1rem',
                    lineHeight: 1.6,
                    color: '#666',
                    margin: 0,
                  }}>
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: '1rem',
                }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    background: '#f0f0f0',
                    color: '#888',
                    fontSize: '0.9375rem',
                  }}>
                    Pensando...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSend} style={{
          borderTop: '1px solid #e5e5e5',
          padding: '1rem 2rem',
          background: '#ffffff',
        }}>
          <div style={{
            border: '1px solid #e5e5e5',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem',
            background: '#ffffff',
          }}>
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
              placeholder="Conte-me sobre o que está te incomodando..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                border: 'none',
                borderRadius: '0',
                fontSize: '0.875rem',
                resize: 'none',
                overflow: 'hidden',
                minHeight: '1.5rem',
                maxHeight: `${MAX_HEIGHT}px`,
                lineHeight: '1.5',
                fontFamily: 'inherit',
                background: 'transparent',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                width: '2rem',
                height: '2rem',
                padding: 0,
                borderRadius: '50%',
                background: loading || !input.trim() ? '#e5e5e5' : '#1a1a1a',
                color: loading || !input.trim() ? '#999' : '#ffffff',
                border: 'none',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'opacity 0.2s, background-color 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.opacity = '0.8'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              ↑
            </button>
          </div>
          <p style={{
            fontSize: '0.75rem',
            color: '#999',
            marginTop: '0.5rem',
            marginLeft: '0.25rem',
            marginBottom: 0,
          }}>
            Enter para enviar · Shift + Enter para nova linha
          </p>
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


