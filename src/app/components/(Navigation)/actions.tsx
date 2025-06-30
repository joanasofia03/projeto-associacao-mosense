'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../../utils/supabase/server'

export type UserType = 'Cliente' | 'Administrador' | 'Funcionario de Banca'

export async function getCurrentUser() {
    const supabase = await createClient()

    try {
        //1. Recolher a sessão do utilizador (Login Token)
        const { error: sessionError, data: { session } } = await supabase.auth.getSession()

        if (sessionError || !session) {
            return { user: null, profile: null, error: sessionError?.message }
        }

        //2. Se existir a sessão, vamos buscar os dados do utilizador
        const { error: profileError, data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single() //Mais seguro para evitar arrays

        if (profileError) {
            return { user: session.user, profile: null, error: profileError.message }
        }

        //3. Aqui retorna os dados do utilizador
        return { user: session.user, profile, error: null }
    } catch (error) {
        return { user: null, profile: null, error: 'Erro inesperado' }
    }
}

export async function checkUserPermissions(permissionUserType: UserType[]) {
    const { user, profile } = await getCurrentUser()

    //Se a sessão não estiver iniciada ou se o utilizador não tiver um tipo atribuido -> redirecionar para o /login;
    if (!user || !profile || !permissionUserType.includes(profile.user_type)) {
        redirect('/login')
    }

    return { user, profile }
}

export async function LogOutAction() {
    const supabase = await createClient()

    try {
        const { error: LogOutError } = await supabase.auth.signOut()
        if (LogOutError) {
            return { LogOutError: 'Erro ao desconectar' }
        }
        redirect('/login')
    } catch (error) {
        console.error('Erro no logout', error)
        return { sucesso: false, error: 'Erro inesperado' }
    }
}

export async function requireAdmin(){
    return await checkUserPermissions(['Administrador'])
}

export async function requireBanca(){
    return await checkUserPermissions(['Funcionario de Banca'])
}

export async function requireCliente(){
    return await checkUserPermissions(['Cliente'])
}
