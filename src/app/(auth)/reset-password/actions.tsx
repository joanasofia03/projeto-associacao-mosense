'use server'

import { createClient } from '@/utils/supabase/server'

export async function resetPasswordAction(formData: FormData) {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
        return { errorCamposVazios: 'Os campos são de preenchimento obrigatório e devem conter, no mínimo, 6 caracteres.' }
    }

    if (password !== confirmPassword) {
        return { errorPalavraPasseDiferente: 'As palavras-passe não coincidem' }
    }

    if (password.length < 6) {
        return { errorTamanhoInferior: 'A palavra-passe deve ter pelo menos 6 caracteres' }
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error){
        return {error: error.message}
    }

    return {  sucess: 'Palavra-passe alterada com sucesso!'}

}
