import { createClient } from '../../utils/supabase/server'
import RegistarPedido from './registerPedido'
import { fetchItens, fetchEventoEmExecucao, getCurrentUser, fetchPedidoParaEdicao } from './actions'
import { redirect } from 'next/navigation'

type MenuItem = {
    id: number
    nome: string
    preco: number
    tipo: string
    imagem_url: string | null
    IVA: number
}

type Evento = {
    id: number
    nome: string
    em_execucao: boolean
}

type User = {
    id: string
    email?: string
}

type PedidoParaEdicao = {
    pedido: {
        id: number
        nome_cliente: string
        contacto: string | null
        notas: string | null
        tipo_de_pedido: string
    }
    itens: Array<{
        quantidade: number
        itens: MenuItem
    }>
} | null

interface PageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ searchParams }: PageProps) {
    //Verificar se há algum pedido para editar
    const editarPedidoId = searchParams.editarPedido as string | undefined

    //Buscar dados
    const [
        itensResult,
        eventoResult,
        userResult,
        pedidoEdicaoResult
    ] = await Promise.all([
        fetchItens(),
        fetchEventoEmExecucao(),
        getCurrentUser(),
        editarPedidoId ? fetchPedidoParaEdicao(editarPedidoId) : Promise.resolve ({ success: false, data: null, message: '' })
    ])

    if(!userResult.success){
        redirect('/login')
    }

    //Verificar se há um evento em execução
    if (!eventoResult.success) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Nenhum evento em execução</h1>
                    <p className="text-gray-600">Não é possível registrar pedidos no momento.</p>
                </div>
            </div>
        )
    }

    //Verificar se os itens foram carregados
    if (!itensResult.success) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar menu</h1>
                    <p className="text-gray-600">{itensResult.message}</p>
                </div>
            </div>
        )
    }

    //Verificar se o pedido para edição existe
    let pedidoParaEdicao: PedidoParaEdicao = null
    if(editarPedidoId){
        if (!pedidoEdicaoResult.success) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar pedido</h1>
                        <p className="text-gray-600">{pedidoEdicaoResult.message}</p>
                    </div>
                </div>
            )
        }
        pedidoParaEdicao = pedidoEdicaoResult.data
    }

    return (
        <div className="h-screen">
            <RegistarPedido
                initialItens={itensResult.data as MenuItem[]}
                evento={eventoResult.data as Evento}
                user={userResult.data as User}
                pedidoParaEdicao={pedidoParaEdicao}
            />
        </div>
    )
}