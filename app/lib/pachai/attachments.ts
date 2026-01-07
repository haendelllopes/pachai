import { Database } from '@/app/lib/types/database'

type Attachment = Database['public']['Tables']['conversation_attachments']['Row']

/**
 * Busca anexos da conversa para uso no contexto do Pachai
 * 
 * Retorna apenas anexos com status='ready'
 * Usa extracted_text se existir, ignora silenciosamente se NULL
 * Limite de injeção de contexto no runtime: máximo 2 anexos mais recentes prontos
 * 
 * Nota: A conversa pode ter muitos anexos históricos, mas o Pachai consome apenas os 2 mais recentes prontos
 */
export async function getConversationAttachments(
  conversationId: string,
  supabase: any,
  limit: number = 2
): Promise<Array<{ extracted_text: string }>> {
  const { data, error } = await supabase
    .from('conversation_attachments')
    .select('extracted_text')
    .eq('conversation_id', conversationId)
    .eq('status', 'ready')
    .not('extracted_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching conversation attachments:', error)
    return []
  }

  // Filtrar apenas anexos com extracted_text não nulo
  // (já filtrado na query, mas garantindo aqui também)
  return (data || [])
    .filter((attachment: Attachment) => attachment.extracted_text !== null)
    .map((attachment: Attachment) => ({
      extracted_text: attachment.extracted_text!
    }))
}

