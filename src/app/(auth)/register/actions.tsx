'use server';

import { supabase } from '../../../../lib/supabaseClient';
import SignUp from './page';

export default async function handleSignUp() {

    const { data: profiles, error } = await supabase
        .from('profiles')
        .insert([
            {
                nome: 'someValue',
                tipo: 'otherValue',
                aceitou_TU_e_PP: 'someValue',
                telemovel: 'otherValue',
            },
        ])
        .select()
    if (error) {
        throw new Error(error.message);
    }


    async function VerificarUtilizador() {
        const { data: profiles, error } = await supabase.from('profiles').select('*')
        if (error) {
            throw new Error(error.message);
        }

        return (
            <SignUp profiles={profiles} />
        )
    }

    return (
        <></>
    )
}