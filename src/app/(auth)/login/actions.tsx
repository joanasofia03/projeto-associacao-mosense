'use server'

import { createClient } from '../../../utils/supabase/server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()

  const { error, data: loginData } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !loginData.user) {
    console.error('Erro no login', error)
    return { error: error?.message || 'Erro ao iniciar sessão' }
  }

  const { error: nomeError, data: nomeUtilizador } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', loginData.user.id)
    .single()

  if (nomeError || !nomeUtilizador?.nome) {
    console.error('Erro ao buscar o nome do utilizador', nomeError)
    return { error: nomeError?.message || 'Erro ao buscar o nome do utilizador' }
  }

  return { nome: nomeUtilizador.nome }
}
