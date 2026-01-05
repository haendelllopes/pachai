import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Sempre atualizar sessão (mantém cookies frescos)
  await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Permitir acesso a /login sem verificação
  if (pathname === '/login') {
    return supabaseResponse
  }

  // Proteger rotas /products/*
  if (pathname.startsWith('/products')) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Redirecionar para /login se não houver sessão
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/products/:path*', '/login'],
}

