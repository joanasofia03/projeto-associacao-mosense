'use server'

import { createClient } from '../../../utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { User } from '@supabase/supabase-js'

export type UserType = 'Cliente' | 'Administrador' | 'Funcionario Banca'

export interface UserProfile {
    id: string
    nome: string
    email: string
    tipo: UserType
}

export interface UserData {
    user: User | null;
    profile: UserProfile | null;
    error: string | null;
}

export async function getCurrentUser(): Promise<UserData> {
    const supabase = await createClient()

    try {
        //1. Obter o utilizador autenticado
        const { error: userError, data: { user } } = await supabase.auth.getUser()

        // Se não há sessão, retorna dados vazios sem erro
        if (userError || !user) {
            return { user: null, profile: null, error: null }
        }

        //2. Buscar dados do perfil
        const { error: profileError, data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError) {
            console.error('Erro ao buscar perfil:', profileError)
            return { user: user, profile: null, error: `Erro ao carregar perfil: ${profileError.message}` }
        }

        if (!profile) {
            return { user: user, profile: null, error: 'Perfil não encontrado' }
        }

        //3. Retornar os dados válidos
        return { user: user, profile, error: null }
    } catch (error) {
        console.error('Erro inesperado ao obter utilizador:', error)
        return { user: null, profile: null, error: 'Erro inesperado ao carregar dados do utilizador' }
    }
}

//Função LogOut
export async function LogOutAction() {
    const supabase = await createClient()

    try {
        const { error: logOutError } = await supabase.auth.signOut()

        if (logOutError) {
            console.error('Erro no logout:', logOutError)
            return { success: false, error: 'Erro ao desconectar' }
        }

        // Revalidar e redirecionar
        revalidatePath('/', 'layout')
        return { success: true, error: null }
    } catch (error) {
        console.error('Erro inesperado no logout:', error)
        return { success: false, error: 'Erro inesperado ao terminar sessão' }
    }
}

//Refresh das informações
export async function refreshUserData(): Promise<UserData> {
    return await getCurrentUser()
}