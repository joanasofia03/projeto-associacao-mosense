'use server'

import { createClient } from '../../utils/supabase/server'

const USER_TYPES_VALIDOS = {
    'administrador': 'Administrador',
    'funcionario banca': 'Funcionario Banca',
    'cliente': 'Cliente'
} as const

type UserType = keyof typeof USER_TYPES_VALIDOS //UserType representa os 3 valores;

export async function addUserAction(formData: FormData) {
    try {
        const nome = formData.get('nome') as string
        const email = formData.get('email') as string
        const telemovel = formData.get('telemovel') as string
        const telemovelNumber = telemovel ? Number(telemovel) : null
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string
        const tipo = formData.get('tipo') as string
        const aceitouTermos = formData.get('aceitouTermos') === 'true'

        //Validações
        if (!nome?.trim() || !email?.trim() || !password || !confirmPassword || !tipo) {
            return { success: false, message: 'Todos os campos obrigatórios devem ser preenchidos.' }
        }
        if (!email.includes('@')) {
            return { success: false, message: 'O email deve ser válido.' }
        }
        if (password !== confirmPassword) {
            return { success: false, message: 'As palavras-passe não coincidem!' }
        }
        if (password.length < 6) {
            return { success: false, message: 'A palavra-passe deve ter pelo menos 6 caracteres.' }
        }
        if (telemovel && isNaN(telemovelNumber ?? NaN)) {
            return { success: false, message: 'O número de telemóvel deve ser um número válido.' }
        }
        if (!Object.keys(USER_TYPES_VALIDOS).includes(tipo as UserType)) {
            return { success: false, message: 'Tipo de utilizador inválido.' }
        }
        if (!aceitouTermos) {
            return { success: false, message: 'É necessário aceitar os termos de utilização e política de privacidade.' }
        }

        const supabase = await createClient()

        //Criar Utilizador
        const { error, data: signUpData } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nome: nome.trim(),
                    tipo: USER_TYPES_VALIDOS[tipo as UserType],
                    aceitou_TU_e_PP: 'sim',
                    telemovel: telemovelNumber
                }
            }
        })

        if (error) {
            console.error('Erro ao criar utilizador', error)

            if (error.message.includes('already registered')) {
                return { success: false, message: 'Já existe um utilizador com este email.' }
            }
            if (error.message.includes('Password should be at least')) {
                return { success: false, message: 'A palavra-passe deve ter pelo menos 6 caracteres.' }
            }
            if (error.message.includes('Invalid email')) {
                return { success: false, message: 'O email fornecido não é válido.' }
            }

            return { success: false, message: 'Erro ao criar conta. Tente novamente.' }
        }

        if (!signUpData.user) {
            return { success: false, message: 'Erro inesperado ao criar conta.' }
        }

        return { success: true, message: 'Conta criada com sucesso! Verifique o seu email' }
    } catch (error) {
        console.log('Erro inesperado:', error)
        return { success: false, message: 'Erro inesperado ocorreu.' }
    }
}