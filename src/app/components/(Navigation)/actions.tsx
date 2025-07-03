'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../../utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type UserType = 'Cliente' | 'Administrador' | 'Funcionario Banca'

export async function getCurrentUser() {
    const supabase = await createClient()

    try {
        //1. Obter o utilizador autenticado (Validação feita pelo Supabase)
        const { error: userError, data: { user } } = await supabase.auth.getUser()

        if (userError || !user) {
            return { user: null, profile: null, error: userError?.message || 'Utilizador inválido / Sessão inválida' }
        }

        //2. Se existir a sessão, vamos buscar os dados do utilizador
        const { error: profileError, data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single() //Mais seguro para evitar arrays

        if (profileError) {
            return { user: user, profile: null, error: profileError.message }
        }

        //3. Aqui retorna os dados do utilizador
        return { user: user, profile, error: null }
    } catch (error) {
        console.error('Erro ao obter utilizador:', error)
        return { user: null, profile: null, error: 'Erro inesperado ao carregar dados do utilizador' }
    }
}

export async function LogOutAction() {
    const supabase = await createClient()

    try {
        const { error: LogOutError } = await supabase.auth.signOut()
        if (LogOutError) {
            console.error('Erro no logout:', LogOutError)
            return { LogOutError: 'Erro ao desconectar' }
        }
        revalidatePath('/', 'layout')
        redirect('/login')
    } catch (error) {
        console.error('Erro no logout', error)
        return { sucesso: false, error: 'Erro inesperado ao terminar sessão' }
    }
}
