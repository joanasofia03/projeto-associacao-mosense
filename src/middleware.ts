import { type NextRequest } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Primeiro, processa a sessão do Supabase e verifica as permissões
  // Isso é necessário para garantir que o usuário esteja autenticado e tenha as permissões corretas
  const response = await updateSession(request)
  
  // Adiciona o pathname aos headers para o layout poder acessar
  response.headers.set('x-pathname', request.nextUrl.pathname)
  
  return response
}

export const config = {
  matcher: [
    //Matcher geral
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}