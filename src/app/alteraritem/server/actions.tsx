'use server'

import { createClient } from '../../../utils/supabase/server'
import { checkItemExistsAction, adicionarImagemAction } from '../../adicionaritem/server/actions';
import { revalidatePath } from 'next/cache';

const TYPE_OPTIONS = {
    'Todos os Itens': 'Todos os Itens',
    'Sopas': 'Sopas',
    'Comida': 'Comida',
    'Sobremesas': 'Sobremesas',
    'Bebida': 'Bebida',
    'Álcool': 'Álcool',
    'Brindes': 'Brindes',
} as const

const IVA_OPTIONS = {
    23: '23% (Padrão)',
    13: '13% (Intermédio)',
    6: '6% (Reduzido)',
    0: '0% (Isento)'
} as const

type TypeOptions = keyof typeof TYPE_OPTIONS; //TypeOptions representa os 6 valores;

export async function fetchItensAction() {
    const supabase = await createClient();

    const { data: fetchData, error: fetchError } = await supabase
        .from('itens')
        .select('id, nome, preco, tipo, criado_em, isMenu, IVA, imagem_url')
        .order('criado_em', { ascending: false });

    if (fetchError) {
        console.error('Erro ao buscar item:', fetchError);
        return { success: false, message: 'Erro ao buscar item.' };
    }

    return { success: true, data: fetchData }
}

export async function updateItemAction(formData: FormData) {
    const id = formData.get('id') as string;
    const nome = formData.get('nome') as string;
    const tipo = formData.get('tipo') as TypeOptions;
    const preco = formData.get('preco') as string;
    const taxaIVA = formData.get('taxaIVA') as string;
    const isMenu = formData.get('isMenu') === 'true';
    const criado_em = new Date().toISOString();

    //Validações
    if (!nome || !tipo || !preco || isNaN(Number(preco)) || Number(preco) <= 0 || !taxaIVA) {
        console.error('Os campos são obrigatórios.');
        return { success: false, message: 'Todos os campos são obrigatórios.' };
    }
    if (!Object.keys(TYPE_OPTIONS).includes(tipo as TypeOptions)) {
        return { success: false, message: 'Tipo de item inválido.' }
    }
    if (!Object.keys(IVA_OPTIONS).map(String).includes(taxaIVA)) {
        return { success: false, message: 'Tipo de IVA inválido.' }
    }

    //Processar imagem se existir
    const file = formData.get('imagem') as File;
    let imagemUrl = null;
    if (file && file.size > 0) {
        const imagemResult = await adicionarImagemAction(formData);
        if (!imagemResult.success) {
            return { success: false, message: imagemResult.message };
        }
        imagemUrl = imagemResult.data?.signedUrl;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from('itens')
        .update({
            nome,
            tipo: TYPE_OPTIONS[tipo as TypeOptions],
            preco: parseFloat(preco),
            IVA: parseFloat(taxaIVA),
            isMenu,
            criado_em,
            imagem_url: imagemUrl
        })
        .eq('id', id);

    if (error) {
        console.error('Erro ao atualizar item:', error);
        return { success: false, message: 'Erro ao atualizar item.' };
    }
    revalidatePath('/alteraritem');
    return { success: true, message: 'Item atualizado com sucesso!', data };
}

export async function deleteItemAction(id: string) {
    try {
        const supabase = await createClient()

        //Buscar Imagem para eliminar a seguir no bucket 'imagens'
        const { data: fetchImagemData, error: fetchImagemError } = await supabase
            .from('itens')
            .select('imagem_url')
            .eq('id', id)
            .single();
        if (fetchImagemError) {
            console.error('Erro ao buscar item:', fetchImagemError)
            return { success: false, message: 'Erro ao buscar imagem!' }
        }
        if (fetchImagemData?.imagem_url) {
            const url = new URL(fetchImagemData.imagem_url);
            const pathname = url.pathname;
            const regex = /\/imagens\/(.+)$/;
            const match = pathname.match(regex);
            if (match && match[1]) {
                const imageName = match[1];
                await supabase.storage
                    .from('imagens')
                    .remove([imageName]);
            }
        }

        //Eliminar item da tabela 'itens'
        const { error: deleteError } = await supabase
            .from('itens')
            .delete()
            .eq('id', id);
        if (deleteError) {
            console.error('Erro ao eliminar item:', deleteError)
            return { success: false, message: 'Erro ao eliminar item' }
        }
    } catch (error) {
        console.log('Erro inesperado ao eliminar item:', error)
        return { success: false, message: 'Erro inesperado ao eliminar item.' } // Corrigido: estava "sucess"
    }

    revalidatePath('/alteraritem');
    return { success: true, message: 'Item eliminado com sucesso!' }
}