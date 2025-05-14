'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

//Import de Icons
import { GoSearch } from "react-icons/go";

function VerEstatisticas() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [ordem, setOrdem] = useState<'data' | 'cliente'>('data');
  const [filtroValidade, setFiltroValidade] = useState<string>('Todos');
  const [totais, setTotais] = useState({
    total: 0,
    totalFaturado: 0,
    porEstadoValidade: {} as Record<string, number>,
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [itensDoPedido, setItensDoPedido] = useState<any[]>([]);
  const [numeroDiarioSelecionado, setNumeroDiarioSelecionado] = useState<string | null>(null);
  const [notaSelecionada, setNotaSelecionada] = useState<string | null>(null);
  const [dataAtual, setDataAtual] = useState('');

  useEffect(() => {
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const primeiraLetraMaiuscula =
      dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

    setDataAtual(primeiraLetraMaiuscula);
  }, []);


  const fetchPedidos = async () => {
    let query = supabase
      .from('pedidos')
      .select(`
        id,
        numero_diario,
        nome_cliente,
        criado_em,
        estado_validade,
        pedidos_itens (
          item_id,
          itens (
            preco
          )
        )
      `);

    if (ordem === 'data') {
      query = query.order('criado_em', { ascending: false });
    } else {
      query = query.order('nome_cliente', { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar pedidos:', error);
      return;
    }

    const filtrados = data.filter((p) => {
      const passaValidade =
        filtroValidade === 'Todos' || p.estado_validade === filtroValidade;
      return passaValidade;
    });

    const contagemValidade: Record<string, number> = {};
    let totalFaturado = 0;

    filtrados.forEach((p) => {
      contagemValidade[p.estado_validade] =
        (contagemValidade[p.estado_validade] || 0) + 1;

      if (p.estado_validade === 'Confirmado') {
        const soma = p.pedidos_itens?.reduce((s: number, item: any) => {
          return s + (item.itens?.preco || 0);
        }, 0);
        totalFaturado += soma || 0;
      }
    });

    setTotais({
      total: filtrados.length,
      totalFaturado,
      porEstadoValidade: contagemValidade,
    });

    setPedidos(filtrados);
  };

  const fetchItensDoPedido = async (pedidoId: number, numeroDiario: string) => {
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('nota')
      .eq('id', pedidoId)
      .single();

    if (pedidoError) {
      console.error('Erro ao obter nota do pedido:', pedidoError);
      return;
    }

    const { data: itens, error } = await supabase
      .from('pedidos_itens')
      .select(`
        id, item_id, quantidade, para_levantar_depois,
        itens (nome)
      `)
      .eq('pedido_id', pedidoId);

    if (error) {
      console.error('Erro ao carregar itens do pedido:', error);
      return;
    }

    setItensDoPedido(itens);
    setNumeroDiarioSelecionado(numeroDiario);
    setNotaSelecionada(pedido.nota || null);
    setMostrarModal(true);
  };

  useEffect(() => {
    fetchPedidos();
  }, [ordem, filtroValidade]);

  const estadosValidade = ['Todos', 'Confirmado', 'Anulado'];

  return (
    <main className="w-full h-full px-6 py-6 bg-[#eaf2e9] flex flex-col">
      {/* Primeira linha */}
      <div className='w-full min-h-12 flex flex-1 flex-row justify-between items-center gap-2'>
        {/* Título da Página */}
        <div className='min-w-116 min-h-15 flex items-center justify-start pl-2'>
          <h1 className='font-bold text-2xl text-[#032221]'>Histórico & Estatísticas de Pedidos</h1>
        </div>

        {/* Search Bard */}
        <div className='h-10 p-4 mr-2 flex justify-between gap-1 items-center bg-[#f1f6f7] w-full rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
          <GoSearch size={20}/>
            <input
              type="text"
              placeholder="Pesquisar..."
              className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
            />
        </div>

        {/* Data Atual */}
        <div className='min-w-110 min-h-15 flex items-center justify-center'>
          <h1 className='font-light text-2xl text-[#032221]'>{dataAtual}</h1>
        </div>
      </div>

      {/* Filtro e Estatisticas Globais */}
      <div className='flex w-full h-full gap-4 mt-2'>
        {/* Coluna 1 - Filtros e Histórico de Pedidos */}
        <div className='w-full h-full bg-gray-500'>
          {/* Filtros */}
          <div></div>

          {/* Histórico Pedidos */}
          <div></div>
        </div>

        {/* Coluna 2 - Estatisticas  */}
        <div className='min-w-110 h-full flex flex-1 flex-col gap-4'>

          {/* Estatisticas dos Pedidos */}
          <div className='w-full h-40 flex flex-row bg-[#032221] rounded-xl gapb-4'>
            {/* Total de Pedido */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center'>
              <h1 className='text-[#f1f6f7] font-normal text-xl'>Total de Pedidos</h1>
              <span className='text-[#DDEB9D] font-extralight text-xs'>* Festa do Imigrante</span>
              <h1 className='text-[#f1f6f7] font-bold text-4xl py-2'>160</h1>
            </div>
            {/* Total Faturado */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center'>
              <h1 className='text-[#f1f6f7] font-normal text-xl'>Total Faturado</h1>
              <span className='text-[#DDEB9D] font-extralight text-xs'>* Festa do Imigrante</span>
              <h1 className='text-[#f1f6f7] font-bold text-4xl py-2'>1.500€</h1>
            </div>
          </div>

          {/* Coluna 2 - Pratos Populares  */}
          <div className='w-full h-full bg-[#f1f6f7] rounded-2xl flex flex-col gapt-2 shadow-[1px_1px_3px_rgba(3,34,33,0.2)]'>
            {/* Título */}
            <div className='w-full h-10 flex flex-row justify-between items-center px-3 py-4'>
              <h1 className='font-semibold text-2xl text-[#032221]'>Pratos Populares</h1>
              <span className='font-normal text-base text-[#03624c]'>Ver Todos</span>
            </div>

            {/* Rank & Nome */}
            <div className='w-64 h-10 flex flex-row justify-between items-center px-3'>
              <span className='font-light text-base text-gray-600'>Posição</span>
              <span className='font-light text-base text-gray-600'>Nome</span>
            </div>

            {/* Exibição de Itens */}
            <div className='w-full h-full grid grid-rows-8 gap-2 px-2'>
              <div className='flex flex-row justify-around items-center border-b-1 border-[rgba(32,41,55,0.1)]'>
                <div className='w-30 h-full flex items-center justify-start pl-5'>
                  <span className='font-semibold text-2xl text-[#032221]'>01</span>
                </div>
                <div className='w-35 h-full flex items-center justify-center'>
                  <img src="/CaldoVerde.jpg" alt="Teste" width={120} height={40}  className='rounded-full'/>
                </div>
                <div className='w-full h-full flex flex-col items-start justify-center pl-7'>
                  <h1 className='font-semibold text-lg text-[#032221]'>Título do item</h1>
                  <span className='font-light text-base text-gray-600'>Pedidos:</span>
                </div>
              </div>

              <div className='flex flex-row justify-around items-center border-b-1 border-[rgba(32,41,55,0.1)]'>
                <div className='w-30 h-full flex items-center justify-start pl-5'>
                  <span className='font-semibold text-2xl text-[#032221]'>01</span>
                </div>
                <div className='w-35 h-full flex items-center justify-center'>
                  <img src="/CaldoVerde.jpg" alt="Teste" width={120} height={40}  className='rounded-full'/>
                </div>
                <div className='w-full h-full flex flex-col items-start justify-center pl-7'>
                  <h1 className='font-semibold text-lg text-[#032221]'>Título do item</h1>
                  <span className='font-light text-base text-gray-600'>Pedidos:</span>
                </div>
              </div>
            
            </div>
          </div>
        </div>
      </div>

  
    </main>
  );
}

export default VerificacaoDePermissoes(VerEstatisticas, ['Administrador', 'Funcionario de Banca']);
