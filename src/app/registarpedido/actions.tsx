'use server'

import { createClient } from '../../utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = {
    success: boolean
    message: string
    data?: any
}

export async function registarPedido(formData: FormData): Promise<ActionResult> {
    const nome_cliente = formData.get('nome_cliente') as string
    const contacto = formData.get('contacto') as string
    const tipo_de_pedido = formData.get('tipo_de_pedido') as string
    const notas = formData.get('notas') as string
    const registado_por = formData.get('registado_por') as string
    const id_evento = formData.get('id_evento') as string

    //Extrair itens do FormData
    const itensJson = formData.get('itens') as string

    if (!nome_cliente?.trim()) {
        return { success: false, message: 'Por favor, preencha o campo nome.' }
    }

    if (!itensJson) {
        return { success: false, message: 'Nenhum item foi selecionado' }
    }

    let itens
    try {
        itens = JSON.parse(itensJson)
    } catch (error) {
        return { success: false, message: 'Erro ao processar itens do pedido' }
    }

    if (!Array.isArray(itens) || itens.length === 0) {
        return { success: false, message: 'Nenhum item válido foi selecionado.' }
    }

    const supabase = await createClient()

    try {
        //Inserir Pedido
        const { data: pedidoData, error: pedidoError } = await supabase
            .from('pedidos')
            .insert({
                nome_cliente,
                contacto: contacto || null,
                tipo_de_pedido: tipo_de_pedido || 'Comer Aqui',
                notas: notas || null,
                registado_por,
                estado_validade: 'Confirmado',
                id_evento: parseInt(id_evento)
            })
            .select()
            .single()

        if (pedidoError) {
            console.error('Erro ao registar o pedido', pedidoError)
            return { success: false, message: 'Erro ao registar o pedido.' }
        }

        //Inserir os itens do pedido
        const itensPedido = itens.map(item => ({
            pedido_id: pedidoData.id,
            item_id: item.id,
            quantidade: item.quantidade
        }))

        const { error: itensError } = await supabase
            .from('pedidos_itens')
            .insert(itensPedido)

        if (itensError) {
            console.error('Erro ao inserir itens do pedido', itensError)

            //Se der erro ao inserir os itens do pedido, logo o pedido também falhou
            await supabase.from('pedidos').update({ estado_validade: 'Anulado' }).eq('id', pedidoData.id)

            return { success: false, message: 'Erro ao registar itens do pedido.' }
        }

        revalidatePath('/')
        return {
            success: true,
            message: `Pedido para ${nome_cliente} registado com sucesso!`,
            data: { pedidoId: pedidoData.id }
        }
    } catch (error) {
        console.error('Erro inesperado:', error)
        return { success: false, message: 'Erro inesperado ao registar pedido.' }
    }
}

export async function atualizarPedido(pedidoId: string, formData: FormData): Promise<ActionResult> {
    const nome_cliente = formData.get('nome_cliente') as string
    const contacto = formData.get('contacto') as string
    const tipo_de_pedido = formData.get('tipo_de_pedido') as string
    const notas = formData.get('notas') as string
    const registado_por = formData.get('registado_por') as string
    const id_evento = formData.get('id_evento') as string
    const itensJson = formData.get('itens') as string

    if (!nome_cliente?.trim()) {
        return { success: false, message: 'Por favor, preencha o campo nome.' }
    }

    if (!itensJson) {
        return { success: false, message: 'Nenhum item foi selecionado.' }
    }

    let itens
    try {
        itens = JSON.parse(itensJson)
    } catch (error) {
        return { success: false, message: 'Erro ao processar itens do pedido.' }
    }

    const supabase = await createClient()
    try {
        //Anular Pedido Original
        const { error: anularError } = await supabase
            .from('pedidos')
            .update({ estado_validade: 'Anulado' })
            .eq('id', pedidoId)

        if (anularError) {
            console.error('Erro ao anular pedido:', anularError)
            return { success: false, message: 'Erro ao anular pedido original.' }
        }

        //Criar um novo pedido
        const { data: novoPedidoData, error: novoPedidoError } = await supabase
            .from('pedidos')
            .insert({
                nome_cliente,
                contacto: contacto || null,
                tipo_de_pedido: tipo_de_pedido || 'Comer Aqui',
                notas: notas || null,
                registado_por,
                estado_validade: 'Confirmado',
                id_evento: parseInt(id_evento)
            })
            .select()
            .single()

        if (novoPedidoError) {
            console.error('Erro ao criar novo pedido:', novoPedidoError)
            return { success: false, message: 'Erro ao criar pedido atualizado.' }
        }

        //Inserir os novos itens
        const itensPedido = itens.map((item: { id: string; quantidade: number }) => ({
            pedido_id: novoPedidoData.id,
            item_id: item.id,
            quantidade: item.quantidade
        }));

        const { error: itensError } = await supabase
            .from('pedidos_itens')
            .insert(itensPedido)

        if (itensError) {
            console.log('Erro ao inseriri itens do pedido.')
            return { success: false, message: 'Erro ao registar itens do pedido atualizado.' }
        }

        revalidatePath('/')
        return {
            success: true,
            message: `Pedido de ${nome_cliente} atualizado com sucesso!`,
            data: { pedidoId: novoPedidoData.id }
        }
    } catch (error) {
        console.error('Erro inesperado:', error)
        return { success: false, message: 'Erro inesperado ao atualizar pedido.' }
    }
}

export async function fetchItens(): Promise<ActionResult> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('itens')
            .select('*')
            .order('nome')

        if (error) {
            console.error('Erro ao buscar itens:', error)
            return { success: false, message: 'Erro ao buscar itens do menu.' }
        }

        return {
            success: true,
            data, message: 'itens carregados com sucesso!'
        }
    } catch (error) {
        console.error('Erro inesperado ao buscar itens:', error)
        return { success: false, message: 'Erro inesperado ao buscar itens do menu.' }
    }
}

export async function fetchEventoEmExecucao(): Promise<ActionResult> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('eventos')
            .select('*')
            .eq('em_execucao', true)
            .single()

        if (error) {
            console.error('Erro ao byscar evento em execução:', error)
            return { success: false, message: 'Erro ao buscar evento em execução.' }
        }

        return { success: true, data, message: 'Evento carregado com sucesso!' }
    } catch (error) {
        console.error('Erro inesperado ao buscar evento:', error)
        return { success: false, message: 'Erro inesperado ao buscar evento.' }
    }
}

export async function fetchPedidoParaEdicao(pedidoId: string): Promise<ActionResult> {
    const supabase = await createClient()

    try {
        //Buscar dados do pedido
        const { data: pedidoData, error: pedidoError } = await supabase
            .from('pedidos')
            .select('*')
            .eq('id', pedidoId)
            .single()

        if (pedidoError) {
            console.log('Erro ao buscar pedido:', pedidoError)
            return { success: false, message: 'Erro ao buscar pedido.' }
        }

        //Buscar itens do pedido
        const { data: itensData, error: itensError } = await supabase
            .from('pedidos_itens')
            .select(`
            quantidade,
            itens(*)
            `)
            .eq('pedido_id', pedidoId)

        if (itensError) {
            console.error('Erro ao buscar itens do pedido:', itensError)
            return { success: false, message: 'Erro ao buscar itens do pedido.' }
        }

        return {
            success: true,
            data: {
                pedido: pedidoData,
                itens: itensData
            },
            message: 'Pedido carregad com sucesso.'
        }
    } catch (error) {
        console.error('Erro inesperado ao buscar pedido:', error)
        return { success: false, message: 'Erro inesperado ao buscar pedido.' }
    }
}

export async function getCurrentUser(): Promise<ActionResult> {
    const supabase = await createClient()

    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error('Erro ao buscar utilizador:', error)
            return { success: false, message: 'Erro ao buscar utilizador.' }
        }

        if (!user) {
            return { success: false, message: 'Utilizador não autenticado.' }
        }

        return { success: true, data: user, message: 'Utilizador carregado com sucesso!' }
    } catch (error) {
        console.error('Erro inesperado ao buscar utilizador:', error)
        return { success: false, message: 'Erro inesperado ao buscar utilizador.' }
    }
}