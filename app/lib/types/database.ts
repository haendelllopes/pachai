export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          product_id: string
          title: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          title?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          title?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'pachai'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'pachai'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'pachai'
          content?: string
          created_at?: string
        }
      }
      veredicts: {
        Row: {
          id: string
          product_id: string
          conversation_id: string
          pain: string
          value: string
          notes: string | null
          version: number
          scope: 'global' | 'project' | null
          title: string | null
          content: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          conversation_id: string
          pain: string
          value: string
          notes?: string | null
          version?: number
          scope?: 'global' | 'project' | null
          title?: string | null
          content?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          conversation_id?: string
          pain?: string
          value?: string
          notes?: string | null
          version?: number
          scope?: 'global' | 'project' | null
          title?: string | null
          content?: string | null
          created_at?: string
        }
      }
      conversation_attachments: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          type: 'document' | 'image' | 'audio' | 'video'
          file_name: string
          mime_type: string
          file_url: string
          extracted_text: string | null
          source: 'upload' | 'recording'
          status: 'processing' | 'ready' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          type: 'document' | 'image' | 'audio' | 'video'
          file_name: string
          mime_type: string
          file_url: string
          extracted_text?: string | null
          source?: 'upload' | 'recording'
          status?: 'processing' | 'ready' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          type?: 'document' | 'image' | 'audio' | 'video'
          file_name?: string
          mime_type?: string
          file_url?: string
          extracted_text?: string | null
          source?: 'upload' | 'recording'
          status?: 'processing' | 'ready' | 'failed'
          created_at?: string
        }
      }
      product_contexts: {
        Row: {
          id: string
          product_id: string
          content_text: string
          embedding: string | null // JSON string ou vector, dependendo da disponibilidade da extensão
          change_reason: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          id?: string
          product_id: string
          content_text: string
          embedding?: string | null
          change_reason: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          id?: string
          product_id?: string
          content_text?: string
          embedding?: string | null
          change_reason?: string
          updated_at?: string
          updated_by?: string
        }
      }
      product_members: {
        Row: {
          id: string
          product_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
          created_by?: string
        }
      }
      global_veredicts: {
        Row: {
          id: string
          code: string
          title: string
          rule_text: string
          enforcement_scope: 'pre_state' | 'pre_prompt' | 'pre_context' | 'post_response'
          priority: number
          is_active: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          title: string
          rule_text: string
          enforcement_scope: 'pre_state' | 'pre_prompt' | 'pre_context' | 'post_response'
          priority: number
          is_active?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          title?: string
          rule_text?: string
          enforcement_scope?: 'pre_state' | 'pre_prompt' | 'pre_context' | 'post_response'
          priority?: number
          is_active?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      veredict_audit: {
        Row: {
          id: string
          veredict_code: string
          phase: 'pre_state' | 'pre_prompt' | 'pre_context' | 'post_response'
          conversation_id: string | null
          detected_at: string
          details: Json | null
          was_blocked: boolean
        }
        Insert: {
          id?: string
          veredict_code: string
          phase: 'pre_state' | 'pre_prompt' | 'pre_context' | 'post_response'
          conversation_id?: string | null
          detected_at?: string
          details?: Json | null
          was_blocked?: boolean
        }
        Update: {
          id?: string
          veredict_code?: string
          phase?: 'pre_state' | 'pre_prompt' | 'pre_context' | 'post_response'
          conversation_id?: string | null
          detected_at?: string
          details?: Json | null
          was_blocked?: boolean
        }
      }
    }
  }
}

