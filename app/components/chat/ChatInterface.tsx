'use client'

import { useState, useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import VeredictForm from './VeredictForm'
import { generatePachaiResponse, detectVeredictSignal } from '@/app/lib/pachai/agent'
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
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userContent = input.trim()
    setInput('')
    setLoading(true)

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
      return
    }

    // Generate Pachai response
    const allMessages = [...messages, userMessage]
    const pachaiContent = generatePachaiResponse(allMessages)

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
    } else {
      setMessages(prev => [...prev, pachaiMessage])
      
      // Check if Pachai response is asking for title confirmation
      if (pachaiContent.includes('Posso registrar esta conversa como:')) {
        const titleMatch = pachaiContent.match(/"([^"]+)"/)
        if (titleMatch) {
          setSuggestedTitle(titleMatch[1])
          setShowVeredictForm(true)
        }
      }
    }

    setLoading(false)
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
            display: 'flex',
            gap: '0.75rem',
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Conte-me sobre o que está te incomodando..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '1px solid #e5e5e5',
                borderRadius: '0.5rem',
                fontSize: '1rem',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '0.75rem 2rem',
                background: loading || !input.trim() ? '#ccc' : '#1a1a1a',
                color: '#ffffff',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Enviar
            </button>
          </div>
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

