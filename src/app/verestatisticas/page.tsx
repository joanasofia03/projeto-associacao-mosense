'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

//Import de Icons
import { GoSearch } from "react-icons/go";
import { IoCheckmarkDoneSharp } from "react-icons/io5";

function VerEstatisticas() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [filtroValidade, setFiltroValidade] = useState<string>('Todos');
  const [totais, setTotais] = useState({
    total: 0,
    totalFaturado: 0,
    porEstadoValidade: {} as Record<string, number>,
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [itensDoPedido, setItensDoPedido] = useState<any[]>([]);
  const [dataAtual, setDataAtual] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [idEventoSelecionado, setIdEventoSelecionado] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [eventos, setEventos] = useState<any[]>([]); 

  //Filtros 
  const filtros = ["Todos", "Confirmado", "Anulado"];

  useEffect(() => {
    const fetchEventos = async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*');

      if (error) {
        setErro("Erro ao procurar evento");
        console.error(error);
      } else {
        setEventos(data);
      }
    };

    fetchEventos();
  }, []);

  //Função da Data Atual
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

  useEffect(() => {
    const fetchPedidos = async () => {
      if (!idEventoSelecionado) {
        return;
      }

      let query = supabase
        .from('pedidos')
        .select('*')
        .eq('id_evento', idEventoSelecionado);

      if (filtroValidade !== 'Todos') {
        query = query.eq('estado_validade', filtroValidade);
      }

      const { data, error } = await query;

      if (error) {
        setErro("Erro ao procurar pedidos");
        console.error(error);
      } else {
        setPedidos(data || []);
        console.log(data)
      }
    };

    fetchPedidos();
  }, [idEventoSelecionado, filtroValidade]);


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
        <div className='h-10 p-4 mr-4 flex justify-between gap-1 items-center bg-[#FFFDF6] w-full rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
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
        <div className='w-full h-full flex flex-col gap-2'>
          {/* Filtros */}
          <div className='w-full h-12 flex flex-row justify-between items-center px-2 gap-4'>
            <div className='flex flex-row w-110 h-full justify-between items-center'>
            {filtros.map((filtro) => (
              <button
                key={filtro}
                onClick={() => {
                  setFiltroValidade(filtro);
                  setFiltroAtivo(filtro);
                }}
                className={`w-35 flex justify-center items-center px-3 py-2 text-sm font-semibold rounded-lg ease-in-out duration-200 shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1 cursor-pointer
                  ${
                    filtroAtivo === filtro
                      ? 'bg-[#032221] text-[#FFFDF6]'
                      : 'bg-[#FFFDF6] text-[#032221] hover:bg-[#dce6e7]'
                  }`}
              >
                {filtro}
              </button>
            ))}
            </div>

           <div className="relative">
            <label className="mr-2 text-sm font-semibold text-[#032221]">Selecionar Evento:</label>
            <select
              value={idEventoSelecionado}
              onChange={(e) => setIdEventoSelecionado(e.target.value)}
              className="bg-[#032221] text-[#FFFDF6] font-semibold rounded-lg px-3 py-2 text-sm border-none outline-none cursor-pointer shadow-[1px_1px_3px_rgba(3,34,33,0.1)]"
            >
              <option value="" disabled hidden>Selecione...</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nome}
                </option>
              ))}
            </select>
          </div>
        </div> 

          {/* Histórico Pedidos */}
          <div className='w-full h-full grid grid-cols-3 gap-4 px-2'>
            <div className='w-full h-90 bg-[#FFFDF6] rounded-xl shadow-[1px_1px_3px_rgba(3,34,33,0.1)] flex flex-col'>
              {/* Nome, Nº e Estado */}
              <div className='flex flex-row justify-between items-start w-full h-20 px-3 py-4'>
                <div className='bg-[#032221] rounded-lg p-3'>
                  <span className='text-[#FFFDF6] font-semibold text-lg'>123</span>
                </div>
                <div className='flex flex-col justify-start items-start w-190 h-full px-3'>
                  <h1 className='text-[#032221] font-semibold text-lg'>David Moutinho</h1>
                  <span className='font-medium text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>933793188 / Comer Aqui</span>
                </div>
                <div className='flex flex-1 flex-row justify-center content-center items-center w-full h-7 gap-1 bg-[#DDEB9D] py-1 px-2 rounded-lg'>
                  <IoCheckmarkDoneSharp size={12} className='text-[#032221] font-semibold text-xs'/>
                  <span className='text-[#032221] font-medium text-xs'>Confirmado</span>
                </div>
              </div>

              {/* Data&Hora e Evento */}
              <div className='w-full h-6 flex flex-row justify-between items-center px-3 pb-2 border-b-1 border-[rgba(32,41,55,0.1)]'>
                <span className='font-normal text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>Quarta-Feira, 10 Agosto, 2025</span>
                <span className='font-normal text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>12:30</span>
              </div>

              {/* Display de Itens, Quantidade e Preço */}
              <div className='w-full h-full flex flex-col justify-between items-start px-3 pt-2 border-b-1 border-[rgba(32,41,55,0.1)]'>
                <div className=' w-full h-5 flex flex-row justify-between items-start'>
                  <span className='font-normal text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>Itens</span>
                  <span className='font-normal text-xs ml-20' style={{ color: "rgba(3, 34, 33, 0.6)" }}>Qty</span>
                  <span className='font-normal text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>Preço</span>
                </div>
                <div className=' w-full h-full grid grid-rows-4'>
                  <div className='w-full h-full flex flex-row justify-between items-center'>
                    <span className='text-[#032221] font-medium text-sm'>Caldo Verde</span>
                    <span className='text-[#032221] font-medium text-sm ml-7'>1</span>
                    <span className='text-[#032221] font-medium text-sm'>1.50€</span>
                  </div>
                </div>
              </div>

              {/* Total Faturado */}
              <div className='w-full h-10 flex flex-row justify-between items-start px-3 pt-2'>
                <h1 className='text-[#032221] font-semibold text-lg'>Total</h1>
                <h1 className='text-[#032221] font-semibold text-lg'>72.45€</h1>
              </div>

              {/* Botão Ver Destalhes */}
              <div className='w-full px-3 pb-4 pt-1'>
                <h1 className='bg-[#032221] text-[#FFFDF6] rounded-lg w-full flex justify-center items-center py-2 cursor-pointer hover:bg-[#052e2d] transition-transform duration-300 hover:scale-103'>Ver Detalhes</h1>
              </div>
            </div>
            <div className='w-full h-90 bg-[#FFFDF6] rounded-xl shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'></div>
            <div className='w-full h-90 bg-[#FFFDF6] rounded-xl shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'></div>
          </div>
        </div>

        {/* Coluna 2 - Estatisticas  */}
        <div className='min-w-110 h-full flex flex-1 flex-col gap-4'>

          {/* Estatisticas dos Pedidos */}
          <div className='w-full h-40 flex flex-row bg-[#032221] rounded-xl gapb-4'>
            {/* Total de Pedido */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center'>
              <h1 className='text-[#FFFDF6] font-normal text-xl'>Total de Pedidos</h1>
              <span className='text-[#DDEB9D] font-extralight text-xs'>* Festa do Imigrante</span>
              <h1 className='text-[#FFFDF6] font-bold text-4xl py-2'>160</h1>
            </div>
            {/* Total Faturado */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center'>
              <h1 className='text-[#FFFDF6] font-normal text-xl'>Total Faturado</h1>
              <span className='text-[#DDEB9D] font-extralight text-xs'>* Festa do Imigrante</span>
              <h1 className='text-[#FFFDF6] font-bold text-4xl py-2'>1.500€</h1>
            </div>
          </div>

          {/* Coluna 2 - Pratos Populares  */}
          <div className='w-full h-full bg-[#FFFDF6] rounded-2xl flex flex-col gapt-2 shadow-[1px_1px_3px_rgba(3,34,33,0.2)] pt-2'>
            {/* Título */}
            <div className='w-full h-10 flex flex-row justify-between items-center px-3 py-4'>
              <h1 className='font-semibold text-2xl text-[#032221]'>Pratos Populares</h1>
              <span className='font-normal text-sm text-[#399918] cursor-pointer'>Ver Todos</span>
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
