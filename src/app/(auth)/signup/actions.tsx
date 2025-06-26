'use server'

import { createClient } from '../../../utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const nome = formData.get('nome') as string
  const telemovel = formData.get('telemovel') as string
  const telemovelNumber = telemovel ? parseInt(telemovel) : null

  if (password != confirmPassword) {
    return { error: 'As palavras-passe não coincidem' }
  }

  if (password.length < 6) {
    return { error: 'A palavra-passe deve ter pelo menos 6 caracteres' }
  }

  const supabase = await createClient()

  //1. Criar Utilizador
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  })

  if (signUpError || !signUpData.user) {
    return { error: signUpError?.message || 'Erro ao criar conta' }
  }

  const { id } = signUpData.user

  //2. Inserir novo utilizador na tabela "Profiles"
  const { error: profileError } = await supabase.from('profiles').insert({
    id,
    nome,
    tipo: 'Cliente', //Neste tipo de registo, o utilizado é sempre do tipo "Cliente";
    telemovel: telemovelNumber,
    aceitou_TU_e_PP: 'sim', //Como não temos uma aba para o utilizador aceitar os termos, ele automaticamente aceita ao criar uma conta;
  })

  if (profileError) {
    return { error: profileError?.message }
  }

  return { sucess: 'Conta criada! Por favor, consulte o seu email.' }
}
