import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cria um cliente Supabase para uso em Route Handlers (app/api/**/route.ts)
 * 
 * Esta função é um wrapper em torno de createServerClient que configura
 * corretamente os cookies para Route Handlers no App Router + PWA.
 * 
 * @param options - Opções contendo cookies (compatível com interface esperada)
 * @returns Cliente Supabase configurado para Route Handlers
 */
export async function createRouteHandlerClient({ cookies }: { cookies: typeof cookies }) {
  // Obter cookieStore do parâmetro cookies
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
            // Em Route Handlers, setAll pode falhar silenciosamente
            // O middleware já cuida da atualização de cookies
          }
        },
      },
    }
  )
}

