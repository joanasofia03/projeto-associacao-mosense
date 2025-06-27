'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function forgotPasswordAction(formData: FormData) {
    const email = formData.get('email') as string

    if (!email) {
        return { error: 'Email é obrigatório' }
    }

    const supabase = await createClient()

    const { error: verifyError, data: verifyData } = await supabase.rpc('check_user_exists', { //Verificar se o email existe;
        email_to_check: email,
    });

    if (verifyError || !verifyData) {
        return { errorVerify: verifyError?.message || 'Este e-mail não está associado a nenhuma conta.' }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, { //Se o email existir então avançar com o reset da palavra-passe;
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    if (error) {
        return { error: error.message }
    }

    return { sucess: 'Verifique o seu email para redefinir a palavra-passe.' }
}