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
          created_at?: string
        }
      }
    }
  }
}

