'use client'

import { useState, useCallback, useEffect } from 'react'
import { Database } from '@/app/lib/types/database'

type Attachment = Database['public']['Tables']['conversation_attachments']['Row']

interface UseAttachmentManagerReturn {
  attachments: Attachment[]
  uploading: boolean
  uploadFile: (file: File, conversationId: string) => Promise<Attachment | null>
  deleteAttachment: (attachmentId: string) => Promise<boolean>
  refreshAttachments: (conversationId: string) => Promise<void>
}

/**
 * Hook para gerenciar upload e estado de anexos
 * Isolado do ChatInterface para evitar acoplamento
 */
export function useAttachmentManager(conversationId: string): UseAttachmentManagerReturn {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)

  /**
   * Busca anexos da conversa
   */
  const refreshAttachments = useCallback(async (convId: string) => {
    try {
      const response = await fetch(`/api/attachments?conversation_id=${convId}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setAttachments(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
    }
  }, [])

  // Inicializar attachments quando conversationId mudar
  useEffect(() => {
    if (conversationId) {
      refreshAttachments(conversationId)
    }
  }, [conversationId, refreshAttachments])

  /**
   * Faz upload de arquivo
   */
  const uploadFile = useCallback(async (file: File, convId: string): Promise<Attachment | null> => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversation_id', convId)

      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload file')
      }

      const attachment = await response.json()
      
      // Atualizar lista de anexos
      await refreshAttachments(convId)
      
      return attachment
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    } finally {
      setUploading(false)
    }
  }, [refreshAttachments])

  /**
   * Deleta anexo
   */
  const deleteAttachment = useCallback(async (attachmentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete attachment')
      }

      // Remover da lista local
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      
      // Atualizar lista completa
      await refreshAttachments(conversationId)
      
      return true
    } catch (error) {
      console.error('Error deleting attachment:', error)
      return false
    }
  }, [conversationId, refreshAttachments])

  return {
    attachments,
    uploading,
    uploadFile,
    deleteAttachment,
    refreshAttachments,
  }
}

