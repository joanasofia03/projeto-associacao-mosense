'use server'

import { createClient } from '../../../utils/supabase/server'

const TYPE_OPTIONS = {
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

export async function adicionarItemAction(formData: FormData) {
    const supabase = await createClient();

    const nome = formData.get('nome') as string;
    const preco = formData.get('preco') as string;
    const tipo = formData.get('tipo') as string;
    const isMenu = formData.get('isMenu') === 'true';
    const taxaIVA = formData.get('taxaIVA') as string;

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

    //Verificar se o item já existe
    const itemExists = await checkItemExistsAction(nome);
    if (itemExists.exists) {
        return { success: false, message: itemExists.message };
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

    //Adicionar item na tabela
    const { data: adicionarData, error: adicionarError } = await supabase
        .from('itens')
        .insert([{
            nome,
            tipo: TYPE_OPTIONS[tipo as TypeOptions],
            isMenu,
            preco: parseFloat(preco),
            IVA: parseFloat(taxaIVA),
            imagem_url: imagemUrl
        }])
        .select();

    if (adicionarError) {
        return { success: false, message: adicionarError.message };
    }

    return { success: true, data: adicionarData };
}

export async function adicionarImagemAction(formData: FormData) {
    const supabase = await createClient();
    const file = formData.get('imagem') as File;

    if (!file || file.size === 0) {
        console.error('Nenhum arquivo válido encontrado.');
        return { success: false, message: 'Nenhum arquivo foi enviado.' };
    }

    console.log('Arquivo encontrado:', {
        name: file.name,
        size: file.size,
        type: file.type
    });

    //validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        return { success: false, message: 'Apenas arquivos de imagem são permitidos.' };
    }

    //Gerar um nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    console.log('Nome do arquivo gerado:', fileName);

    //upload da imagem para o bucket 'imagens'
    try {
        // Upload da imagem para o bucket 'imagens'
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('imagens')
            .upload(`items/${fileName}`, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Erro no upload:', uploadError);
            return { success: false, message: `Erro no upload: ${uploadError.message}` };
        }

        console.log('Upload realizado com sucesso:', uploadData);

        // Criar uma URL pública para o arquivo
        const { data: publicUrlData } = supabase.storage
            .from('imagens')
            .getPublicUrl(`items/${fileName}`);

        console.log('URL pública criada:', publicUrlData);

        return {
            success: true,
            data: {
                signedUrl: publicUrlData.publicUrl,
                path: uploadData.path
            }
        };

    } catch (error) {
        console.error('Erro durante o processo de upload:', error);
        return { success: false, message: 'Erro interno durante o upload.' };
    }
}

//verificar se o item já existe
export async function checkItemExistsAction(nome: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('itens')
        .select('id')
        .ilike('nome', nome.trim());

    if (error) {
        console.error('Erro ao verificar se o item existe:', error.message);
        return { exists: false, message: error.message };
    }

    return {
        exists: data && data.length > 0,
        message: data && data.length > 0 ? 'Item já existe.' : ''
    };
}