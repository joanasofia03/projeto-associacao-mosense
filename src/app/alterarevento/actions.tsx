'use server'

import { createClient } from '../../utils/supabase/server'
import { revalidatePath } from 'next/cache';

export async function updateEventoAction(formData: FormData) {
    const id = formData.get('id') as string;
    const nome = formData.get('nome') as string;
    const data_inicio_str = formData.get('data_inicio') as string;
    const data_fim_str = formData.get('data_fim') as string;
    const em_execucao = formData.get('em_execucao') === 'true';

    //Validar os campos obrigatórios
    if (!id || !nome || !data_inicio_str || !data_fim_str) {
        return { success: false, message: 'Por favor, preencha todos os campos obrigatórios.' }
    }

    //Converter as string em formato Date
    const data_inicio = new Date(data_inicio_str)
    const data_fim = new Date(data_fim_str)

    //Validar as datas 
    if (isNaN(data_inicio.getTime()) || isNaN(data_fim.getTime())) {
        return { success: false, message: 'Datas inválidas. Por favor, verifique as datas de início e fim.' }
    }

    //Validar se a data final é posterior á data inicial
    if (data_fim <= data_inicio) {
        return { success: false, message: 'A data final deve ser posterior à data inicial.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.from('eventos')
        .update({
            nome,
            data_inicio,
            data_fim,
            em_execucao,
        })
        .eq('id', id);
    if (error) {
        return { success: false, message: 'Erro ao atualizar evento.' };
    }
    revalidatePath('/alterarevento');
    return { success: true, message: 'Evento atualizado com sucesso!' };
}

export async function deleteEventoAction(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id)
    if (error) {
        return { success: false, message: 'Erro ao deletar evento.' }
    }
    revalidatePath('/alterarevento');
    return { success: true, message: 'Evento deletado com sucesso.' }
}

export async function fetchEventos() {
    const supabase = await createClient()
    const { error: fetchError, data: fetchData } = await supabase
        .from('eventos')
        .select('*')
        .order('criando_em', { ascending: false });

    if(fetchError || !fetchData){
        return { success: false, message: 'Erro ao buscar eventos', data: []}
    }

    return { success: true, message: 'Eventos exibidos com sucesso', data: fetchData }
}

