'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

//Import de Icons
import { GoSearch } from "react-icons/go";
import { PiBellRingingLight } from "react-icons/pi";

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

  useEffect(() => { //Função da exibição da data atual;
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const capitalizada = dataFormatada.replace(/\b\p{L}/gu, (letra) => letra.toUpperCase());
    setDataAtual(capitalizada);
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
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center gap-2'>
              <h1 className='text-[#f1f6f7] font-normal text-xl'>Total de Pedidos</h1>
              <h1 className='text-[#f1f6f7] font-bold text-4xl'>160</h1>
            </div>
            {/* Total Faturado */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center gap-2'>
              <h1 className='text-[#f1f6f7] font-normal text-xl'>Total Faturado</h1>
              <h1 className='text-[#f1f6f7] font-bold text-4xl'>1.500€</h1>
            </div>
          </div>

          {/* Coluna 2 - Pratos Populares  */}
          <div className='w-full h-full bg-[#f1f6f7] rounded-2xl flex flex-col gap-2'>
            {/* Título */}
            <div className='w-full h-20 bg-gray-500'></div>

            {/* Rank & Nome */}
            <div className='w-full h-10 bg-gray-500'></div>

            {/* Exibição de Itens */}
            <div className='w-full h-full bg-gray-500'></div>
          </div>
        </div>
      </div>

  
    </main>
  );
}

export default VerificacaoDePermissoes(VerEstatisticas, ['Administrador', 'Funcionario de Banca']);
