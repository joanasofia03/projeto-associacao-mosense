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
  const { error, data: signUpData } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      nome: nome,
      tipo: "Cliente",
      aceitou_TU_e_PP: 'sim',
      telemovel: telemovelNumber
    }
  }
});

  if (error || !signUpData.user) {
    console.error('Erro ao criar utilizador:', error)
    return { error: error?.message || 'Erro ao criar conta' }
  }

  return { sucess: 'Conta criada! Por favor, consulte o seu email.' }
}
