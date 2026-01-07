import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Cria um cliente Supabase para uso em API routes (Route Handlers)
 * 
 * IMPORTANTE: Em Route Handlers, especialmente em PWAs/serverless,
 * cookies() do next/headers pode não estar sincronizado com os cookies
 * atualizados pelo middleware. Por isso, usamos request.cookies diretamente,
 * que são atualizados pelo middleware antes da rota executar.
 */
export function createClientFromRequest(
  request: NextRequest,
  response?: NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Usar cookies do request (atualizados pelo middleware)
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          // Atualizar cookies no request
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          // Se temos uma response, atualizar também
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

