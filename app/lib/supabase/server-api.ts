import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

/**
 * Cria um cliente Supabase para uso em API routes
 * Tenta usar cookies() primeiro (sincronizado com middleware), fallback para request.cookies
 */
export async function createClientFromRequest(request: NextRequest) {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Tentar usar cookies() primeiro (sincronizado com middleware)
          try {
            return cookieStore.getAll()
          } catch {
            // Fallback para cookies do request
            return request.cookies.getAll()
          }
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          // Atualizar na requisição para uso interno
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          // Tentar atualizar cookies() também
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignorar se não conseguir (middleware já cuida disso)
          }
        },
      },
    }
  )
}

