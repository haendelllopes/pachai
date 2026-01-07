import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cria um cliente Supabase para uso em API routes (Route Handlers)
 * 
 * Estratégia: Usa cookies() do next/headers que está sincronizado com o middleware.
 * O middleware atualiza os cookies antes da rota executar, então cookies() deve
 * ter acesso aos cookies atualizados.
 */
export async function createClientFromRequest(
  request: NextRequest,
  response?: NextResponse
) {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Usar cookies() do next/headers (sincronizado com middleware)
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          // Atualizar cookies no cookieStore
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Route Handler.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
          // Também atualizar no request e response se disponíveis
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          if (response) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          }
        },
      },
    }
  )
}

