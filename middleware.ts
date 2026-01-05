import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  const pathname = request.nextUrl.pathname

  // Não proteger /login nem /
  if (pathname === '/login' || pathname === '/') {
    return res
  }

  // Proteger apenas rotas /products
  if (pathname.startsWith('/products')) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Redirecionar para /login se não houver sessão
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

