import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Primeiro, processa a sessão do Supabase
  const response = await updateSession(request)
  
  // Adiciona o pathname aos headers para o layout poder acessar
  response.headers.set('x-pathname', request.nextUrl.pathname)
  
  return response
}

export const config = {
  matcher: [
    '/login/:path*',
    '/register/:path*',
    '/reset-password/:path*',
    '/forgot-password/:path*',
    '/not-found/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}