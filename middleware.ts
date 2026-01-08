import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          // Atualizar cookies na requisição E na resposta
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            // Usar opções do Supabase, mas garantir SameSite para PWA se não estiver definido
            const cookieOptions = {
              ...options,
              // Se SameSite não estiver definido, usar 'lax' para compatibilidade com PWA
              // Isso permite cookies em requisições cross-site (necessário para PWAs)
              sameSite: options?.sameSite || 'lax',
            }
            response.cookies.set(name, value, cookieOptions)
          })
          // Recriar response para garantir que os cookies atualizados sejam propagados
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              sameSite: options?.sameSite || 'lax',
            }
            response.cookies.set(name, value, cookieOptions)
          })
        },
      },
    }
  )

  // Permitir acesso público à rota /invite/[token]
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/invite/')) {
    // Permitir acesso sem autenticação
    await supabase.auth.getSession()
    return response
  }

  // Sempre atualizar sessão (mantém cookies frescos)
  // Isso atualiza automaticamente os cookies de autenticação
  await supabase.auth.getSession()

  return response
}

export const config = {
  matcher: ['/products/:path*', '/login', '/api/:path*', '/invite/:path*'],
}

