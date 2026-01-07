import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

/**
 * Cria um cliente Supabase para uso em API routes
 * Usa os cookies diretamente do request para garantir sincronização com o middleware
 */
export function createClientFromRequest(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          // Em API routes, não podemos definir cookies diretamente
          // O middleware já cuida de atualizar os cookies na resposta
          // Apenas atualizamos na requisição para uso interno
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )
}

