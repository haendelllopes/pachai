import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria um cliente Supabase para uso em API routes (Route Handlers)
 * 
 * Usa cookies() do next/headers, mesma abordagem das outras rotas de API
 * que funcionam corretamente (/api/messages, /api/products, etc.)
 * 
 * O middleware atualiza os cookies antes da rota executar,
 * então cookies() deve ter acesso aos cookies atualizados
 */
export async function createClientFromRequest() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Route Handler.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

