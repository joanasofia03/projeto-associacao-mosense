import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROUTES_WITH_AUTH = {
  //Para qualquer UserType
  '/menu': ['Cliente', 'Administrador', 'Funcionario Banca'],
  '/help': ['Cliente', 'Administrador', 'Funcionario Banca'],
  '/editarperfil': ['Cliente', 'Administrador', 'Funcionario Banca'],

  //Para UserType = Administrador
  '/adicionarevento': ['Administrador'],
  '/alterarevento': ['Administrador'],
  '/adicionaritem': ['Administrador'],
  '/alteraritem': ['Administrador'],
  '/adicionarutilizador': ['Administrador'],
  '/verestatisticas': ['Administrador'],

  //Para UserType = Administrador & Funcionario Banca
  '/registarpedido': ['Administrador', 'Funcionario Banca'],
  '/anularpedido': ['Administrador', 'Funcionario Banca'],
} as const

const ROUTES_WITHOUT_AUTH = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/not-found',
]

export async function updateSession(request: NextRequest) {
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
        setAll(cookiesToSet) {
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

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  //Verificar se a rota é uma rota pública
  const isPublicRoute = ROUTES_WITHOUT_AUTH.some(route => pathname.startsWith(route))

  //Se não houver utilizador autenticado e a rota não for pública
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  //Se houver utilizador autenticado e a rota for /login ou /signup redirecionar para /menu
  if (user && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/menu'
    return NextResponse.redirect(url)
  }

  //Verificar se a rota requer autenticação
  let allowedUserTypes: readonly string[] | undefined
  for (const [route, userTypes] of Object.entries(ROUTES_WITH_AUTH)) {
    if (pathname.startsWith(route)) {
      allowedUserTypes = userTypes
      break
    }
  }

  if (user && allowedUserTypes) {
    try {
      //Buscar o perfil do utilizador
      const { data: profile, error: profileError } = await supabase.from('profiles')
        .select('tipo')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        console.error('Error ao buscar perfil:', profileError)
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }

      //Verificar se o utilizador tem o tipo permitido para a rota
      if (!allowedUserTypes.includes(profile.tipo)) {
        const url = request.nextUrl.clone()
        url.pathname = '/not-found'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Erro na verificação das permissões do utilizador:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is
  return supabaseResponse
}