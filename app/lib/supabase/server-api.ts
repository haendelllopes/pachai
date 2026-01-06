import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

/**
 * Cria um cliente Supabase para uso em API routes
 * Usa os cookies diretamente da requisição Request
 */
export function createClientFromRequest(request: NextRequest | Request) {
  const requestHeaders = new Headers(request.headers)
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Extrair cookies do header Cookie da requisição
          const cookieHeader = requestHeaders.get('cookie') || ''
          const cookies: Array<{ name: string; value: string }> = []
          
          cookieHeader.split(';').forEach((cookie) => {
            const [name, ...valueParts] = cookie.trim().split('=')
            if (name && valueParts.length > 0) {
              cookies.push({
                name: name.trim(),
                value: valueParts.join('=').trim(),
              })
            }
          })
          
          return cookies
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          // Em API routes, não podemos setar cookies diretamente
          // O middleware já cuida disso
        },
      },
    }
  )
}

