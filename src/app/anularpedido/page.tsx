'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

// Import de Icons
import { GoSearch } from "react-icons/go";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { FaEye } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";

function AlterarPedido() {
  // Estados principais
  const [pedidos, setPedidos] = useState<Array<any>>([]);
  const [pedidosOriginal, setPedidosOriginal] = useState<Array<any>>([]); // Armazenar todos os pedidos originais
  const [pedidosItens, setPedidosItens] = useState<{[key: string]: Array<any>}>({});
  const [filtroValidade, setFiltroValidade] = useState('Todos');
  const [dataAtual, setDataAtual] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState("Todos");
  const [idEventoSelecionado, setIdEventoSelecionado] = useState('');
  const [nomeEventoSelecionado, setNomeEventoSelecionado] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [pedidosExpandidos, setPedidosExpandidos] = useState<{[key: number]: boolean}>({}); // Para controlar quais pedidos estão expandidos
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pedidoParaAnular, setPedidoParaAnular] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState<Array<{
    id: number;
    criando_em: string;
    nome: string;
    data_inicio: string | null;
    data_fim: string | null;
    em_execucao: boolean;
  }>>([]);

  // Constantes
  const filtros = ["Todos", "Confirmado", "Anulado"];
  
  // Exibir mensagem de erro quando ocorrer
  const MensagemErro = () => {
    if (!erro) return null;
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <span className="block sm:inline">{erro}</span>
        <span 
          className="absolute top-0 bottom-0 right-0 px-4 py-3" 
          onClick={() => setErro(null)}
        >
          <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Fechar</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      </div>
    );
  };

  // Modal de confirmação para anular o pedido
  const ModalConfirmacao = () => {
    if (!mostrarModal) return null;
    
    const handleConfirmar = async () => {
      if (pedidoParaAnular === null) return;
      
      setLoading(true);
      try {
        const { error } = await supabase
          .from('pedidos')
          .update({ estado_validade: 'Anulado' })
          .eq('id', pedidoParaAnular);

        if (error) {
          setErro(`Erro ao anular o pedido: ${error.message}`);
        } else {
          // Atualizar o estado do pedido na interface
          const novoPedidos = pedidos.map(pedido => {
            if (pedido.id === pedidoParaAnular) {
              return { ...pedido, estado_validade: 'Anulado' };
            }
            return pedido;
          });
          
          setPedidos(novoPedidos);
          setPedidosOriginal(novoPedidos.map(p => ({...p})));
        }
      } catch (err) {
        setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
        setMostrarModal(false);
        setPedidoParaAnular(null);
      }
    };

    return (
      <div className="fixed inset-0 bg-[#eaf2e9] flex items-center justify-center z-50">
        <div className="bg-[#FFFDF6] rounded-lg shadow-lg max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-[#032221] mb-4">Confirmar Anulação</h2>
          <p className="mb-6">Tem certeza que deseja anular este pedido? Esta ação não pode ser desfeita.</p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setMostrarModal(false);
                setPedidoParaAnular(null);
              }}
              className="px-4 py-2 rounded-lg bg-gray-200 text-[#032221] hover:bg-gray-300"
              disabled={loading}
            >
              Cancelar
            </button>
            
            <button
              onClick={handleConfirmar}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Anulando...' : 'Anular Pedido'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Carregar eventos disponíveis
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*');

        if (error) {
          setErro(`Erro ao buscar eventos: ${error.message}`);
          console.error('Erro na consulta Supabase:', error);
        } else {
          setEventos(data || []);
        }
      } catch (err) {
        setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Exceção ao buscar eventos:', err);
      }
    };

    fetchEventos();
  }, []);

  // Configurar data atual formatada
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

  // Buscar pedidos
  useEffect(() => {
    const fetchPedidos = async () => {
      if (!idEventoSelecionado) return;

      try {
        let query = supabase
          .from('pedidos')
          .select('*')
          .eq('id_evento', idEventoSelecionado);

        if (filtroValidade !== 'Todos') {
          query = query.eq('estado_validade', filtroValidade);
        }

        const { data, error } = await query;

        if (error) {
          setErro(`Erro ao buscar pedidos: ${error.message}`);
          console.error('Erro na consulta de pedidos:', error);
        } else {
          setPedidosOriginal(data || []);
          setPedidos(data || []);
          
          // Buscar os itens para cada pedido
          if (data && data.length > 0) {
            const pedidosIds = data.map(pedido => pedido.id);
            fetchPedidosItens(pedidosIds);
          } else {
            setPedidosItens({});
          }
        }
      } catch (err) {
        setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Exceção ao buscar pedidos:', err);
      }
    };

    fetchPedidos();
  }, [idEventoSelecionado, filtroValidade]);

  // Filtrar pedidos pela pesquisa
  useEffect(() => {
    if (!termoPesquisa.trim()) {
      // Se a pesquisa estiver vazia, mostrar todos os pedidos originais
      setPedidos(pedidosOriginal);
      return;
    }

    // Filtrar pedidos baseado no termo de pesquisa
    const termoLowerCase = termoPesquisa.toLowerCase().trim();
    
    const resultados = pedidosOriginal.filter(pedido => {
      // Verificar número do pedido (converter para string para garantir)
      const numeroPedido = String(pedido.numero_diario || '').toLowerCase();
      
      // Verificar nome do cliente (se existir)
      const nomeCliente = String(pedido.nome_cliente || '').toLowerCase();
      
      // Verificar contacto (se existir)
      const contacto = String(pedido.contacto || '').toLowerCase();
      
      // Retornar true se qualquer um dos campos contém o termo de pesquisa
      return numeroPedido.includes(termoLowerCase) || 
            nomeCliente.includes(termoLowerCase) || 
            contacto.includes(termoLowerCase);
    });
    
    setPedidos(resultados);
    
  }, [termoPesquisa, pedidosOriginal]);

  // Função de manipulação do input de pesquisa
  const handlePesquisaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermoPesquisa(e.target.value);
  };

  // Função para buscar itens dos pedidos
  const fetchPedidosItens = async (pedidosIds: number[]) => {
    if (!pedidosIds.length) return;
    
    try {
      // Primeiro, buscar os pedidos_itens
      const { data: pedidosItensData, error: pedidosItensError } = await supabase
        .from('pedidos_itens')
        .select('id, pedido_id, item_id, quantidade')
        .in('pedido_id', pedidosIds);

      if (pedidosItensError) {
        setErro(`Erro ao buscar itens dos pedidos: ${pedidosItensError.message}`);
        console.error('Erro na consulta de itens dos pedidos:', pedidosItensError);
        return;
      }
      
      // Obter todos os IDs de itens para buscar os detalhes
      const itensIds = pedidosItensData?.map(item => item.item_id) || [];
      
      // Buscar detalhes dos itens
      const { data: itensData, error: itensError } = await supabase
        .from('itens')
        .select('id, nome, preco')
        .in('id', itensIds);
        
      if (itensError) {
        setErro(`Erro ao buscar detalhes dos itens: ${itensError.message}`);
        console.error('Erro na consulta de detalhes dos itens:', itensError);
        return;
      }
      
      // Criar um mapa dos itens para acesso rápido
      const itensMap = new Map();
      itensData?.forEach(item => {
        itensMap.set(item.id, item);
      });
      
      // Agrupar itens por pedido_id e adicionar os detalhes do item
      const itensAgrupados: {[key: string]: Array<any>} = {};
      
      pedidosItensData?.forEach(pedidoItem => {
        if (!itensAgrupados[pedidoItem.pedido_id]) {
          itensAgrupados[pedidoItem.pedido_id] = [];
        }
        
        const itemDetalhes = itensMap.get(pedidoItem.item_id);
        
        if (itemDetalhes) {
          const itemCompleto = {
            ...pedidoItem,
            itens: itemDetalhes
          };
          
          itensAgrupados[pedidoItem.pedido_id].push(itemCompleto);
        }
      });
      
      setPedidosItens(itensAgrupados);
    } catch (err) {
      setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Exceção ao buscar itens dos pedidos:', err);
    }
  };

  // Atualizar o nome do evento quando um evento for selecionado
  useEffect(() => {
    if (idEventoSelecionado) {
      const eventoSelecionado = eventos.find(evento => evento.id.toString() === idEventoSelecionado);
      if (eventoSelecionado) {
        setNomeEventoSelecionado(eventoSelecionado.nome);
      }
    } else {
      setNomeEventoSelecionado('');
    }
  }, [idEventoSelecionado, eventos]);

  // Função para alternar a exibição expandida de um pedido
  const toggleExpansaoPedido = (pedidoId: number) => {
    setPedidosExpandidos(prev => ({
      ...prev,
      [pedidoId]: !prev[pedidoId]
    }));
  };

  // Função para anular um pedido
  const iniciarAnulacaoPedido = (pedidoId: number) => {
    setPedidoParaAnular(pedidoId);
    setMostrarModal(true);
  };

  // Função para editar um pedido (a ser implementada)
  const editarPedido = (pedidoId: number) => {
    // Esta função seria implementada para editar o pedido
    // Por enquanto, apenas mostra um alerta
    alert(`Editar pedido ${pedidoId} - Funcionalidade a ser implementada`);
  };

  // Função para formatar a data do pedido
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    return `${diasSemana[data.getDay()]}, ${data.getDate()} ${meses[data.getMonth()]}, ${data.getFullYear()}`;
  };

  // Função para formatar a hora do pedido
  const formatarHora = (dataString: string) => {
    const data = new Date(dataString);
    return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
  };

  // Função para calcular o total do pedido
  const calcularTotalPedido = (pedidoId: number) => {
    const itens = pedidosItens[pedidoId] || [];
    return itens.reduce((total, item) => {
      return total + ((item.itens?.preco || 0) * item.quantidade);
    }, 0).toFixed(2);
  };

  // Componente de Card de Pedido com Modal
  const CardPedido = ({ pedido }: { pedido: any }) => {
    const itens = pedidosItens[pedido.id] || [];
    const [modalAberto, setModalAberto] = useState(false);
    
    const abrirModal = () => setModalAberto(true);
    const fecharModal = () => setModalAberto(false);
    
    // Modal de Detalhes do Pedido
    const ModalDetalhesPedido = () => {
      if (!modalAberto) return null;
      
      return (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(234, 242, 233, 0.9)' }}>
          <div className="bg-[#FFFDF6] rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-[#032221]">
              <div className="flex items-center">
                <div className="bg-[#FFFDF6] rounded-lg p-2 mr-3">
                  <span className="text-[#032221] font-semibold text-lg">#{pedido.numero_diario}</span>
                </div>
                <h2 className="text-xl font-semibold text-[#FFFDF6]">Detalhes do Pedido</h2>
              </div>
              <button onClick={fecharModal} className="text-[#FFFDF6] hover:text-gray-300 cursor-pointer">
                <IoClose size={24} />
              </button>
            </div>
            
            {/* Informações do Cliente */}
            <div className="p-4">
              <h3 className="text-[#032221] font-semibold text-lg">{pedido.nome_cliente}</h3>
              <div className="text-sm text-gray-600 flex flex-col space-y-1">
                <div className="flex items-center gap-1">
                  <span className='font-semibold text-gray-700'>Contacto: </span><span>{pedido.contacto || 'N/A'}</span>
                </div>
                 <div className="flex items-center gap-1">
                  <span className='font-semibold text-gray-700'>Tipo de pedido: </span><span>{pedido.tipo_de_pedido}</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-1 font-semibold text-gray-700">Estado:</span>
                  <span
                    className={`py-1 px-2 rounded-lg text-xs font-medium flex items-center ${
                      pedido.estado_validade === 'Confirmado' ? 'bg-[#DDEB9D]' : 'bg-[#f8d7da]'
                    }`}
                  >
                    {pedido.estado_validade === 'Confirmado' ? (
                      <>
                        <IoCheckmarkDoneSharp size={12} className="mr-1" />
                        {pedido.estado_validade}
                      </>
                    ) : (
                      <>
                        <IoClose size={12} className="mr-1" />
                        {pedido.estado_validade}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Data e Hora */}
            <div className="w-full flex justify-between items-center px-4 py-2">
              <span className="font-normal text-sm text-gray-600">
                {formatarData(pedido.criado_em)}
              </span>
              <span className="font-normal text-sm text-gray-600">
                {formatarHora(pedido.criado_em)}
              </span>
            </div>
            
            {/* Itens do Pedido */}
            <div className="w-full px-4 py-3 border-t border-b border-gray-200">
              <div className="w-full flex justify-between items-center mb-2">
                <span className="font-normal text-sm w-3/5 text-gray-600">Itens</span>
                <span className="font-normal text-sm w-1/5 text-center text-gray-600">Qty</span>
                <span className="font-normal text-sm w-1/5 text-right text-gray-600">Preço</span>
              </div>
              
              <div className="w-full max-h-60 overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style jsx>{`div::-webkit-scrollbar {display: none;}`}</style> {/* Permite que haja scroll sem estar visivel a scroll bar */}
                {itens.map((item) => (
                  <div key={item.id} className="w-full flex justify-between items-center py-1">
                    <span className="text-[#032221] font-medium text-sm w-3/5">
                      {item.itens?.nome || 'Item não disponível'}
                    </span>
                    <span className="text-[#032221] font-medium text-sm w-1/5 text-center">{item.quantidade}</span>
                    <span className="text-[#032221] font-medium text-sm w-1/5 text-right">
                      {((item.itens?.preco || 0) * item.quantidade).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Total Faturado */}
            <div className="w-full flex justify-between items-center pt-2 px-4">
              <h3 className="text-[#032221] font-semibold text-lg">Total</h3>
              <h3 className="text-[#032221] font-semibold text-lg">{calcularTotalPedido(pedido.id)}€</h3>
            </div>
            
            {/* Botão de Fechar */}
            <div className="flex justify-end p-4">
              <button 
                onClick={fecharModal}
                className="bg-[#032221] text-[#FFFDF6] w-full py-2 px-6 rounded-md font-medium hover:bg-opacity-90 transition-colors cursor-pointer hover:bg-[#052e2d] transition-transform duration-300 hover:scale-102"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      );
    };
    
    return (
      <>
        <div className='bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col h-full'>
          {/* Cabeçalho do Card */}
          <div className='flex flex-row justify-between items-start w-full p-4 border-b border-gray-200'>
            <div className='bg-[#032221] rounded-lg p-3 mr-3'>
              <span className='text-[#FFFDF6] font-semibold text-lg'>{pedido.numero_diario}</span>
            </div>
            <div className='flex flex-col justify-start items-start flex-grow px-2'>
              <h1 className='text-[#032221] font-semibold text-lg truncate'>{pedido.nome_cliente}</h1>
              <span className='font-medium text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>
                {pedido.contacto || 'N/A'} / {pedido.tipo_de_pedido}
              </span>
            </div>
            <div className={`flex flex-row justify-center items-center h-7 gap-1 py-1 px-2 rounded-lg ${
              pedido.estado_validade === 'Confirmado' ? 'bg-[#DDEB9D]' : 'bg-[#f8d7da]'
            }`}>
              {pedido.estado_validade === 'Confirmado' ? (
                <IoCheckmarkDoneSharp size={12} className='text-[#032221] font-semibold text-xs'/>
              ) : (
                <IoClose size={12} className='text-[#032221] font-semibold text-xs'/>
              )}
              <span className='text-[#032221] font-medium text-xs'>{pedido.estado_validade}</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className='p-4 mt-auto'>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => editarPedido(pedido.id)}
                className="bg-[#DDEB9D] text-[#032221] cursor-pointer py-2 px-4 rounded-md font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                disabled={pedido.estado_validade === 'Anulado'}
              >
                <MdOutlineEdit className="mr-1 h-4 w-4" /> Editar
              </button>
              
              <button 
                onClick={() => iniciarAnulacaoPedido(pedido.id)}
                className="bg-[rgba(210,102,90,0.1)] cursor-pointer text-[#D2665A] py-2 px-4 rounded-md font-medium hover:bg-[rgba(210,102,90,0.15)] transition-colors flex items-center justify-center cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                disabled={pedido.estado_validade === 'Anulado'}
              >
                <RiDeleteBin6Line className="mr-1 h-4 w-4" /> Anular
              </button>
            </div>
            
            <button 
              onClick={abrirModal}
              className="w-full mt-3 bg-[#032221] text-[#FFFDF6] py-2 px-4 rounded-md font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center cursor-pointer hover:bg-[#052e2d] transition-transform duration-300 hover:scale-102"
            >
              <FaEye className="mr-1" /> Ver Detalhes
            </button>
          </div>
        </div>
        
        {/* Modal de Detalhes do Pedido */}
        <ModalDetalhesPedido />
      </>
    );
  };

  return (
    <main className="w-full h-full px-6 py-6 bg-[#eaf2e9] flex flex-col overflow-y-hidden">
      {/* Componente de erro (será exibido somente quando houver erro) */}
      {erro && <MensagemErro />}
      
      {/* Modal de confirmação */}
      <ModalConfirmacao />
      
      {/* Primeira linha */}
      <div className='w-full min-h-12 flex flex-1 flex-row justify-between items-center gap-2'>
        {/* Título da Página */}
        <div className='min-w-116 min-h-15 flex items-center justify-start pl-2'>
          <h1 className='font-bold text-2xl text-[#032221]'>Alteração de Pedidos</h1>
        </div>

        {/* Search Bar */}
        <div className='h-10 p-4 mr-4 flex justify-between gap-1 items-center bg-[#FFFDF6] w-full rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
          <GoSearch size={20}/>
          <input
            type="text"
            placeholder="Pesquisar por nº de pedido, nome do cliente ou contacto..."
            className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
            value={termoPesquisa}
            onChange={handlePesquisaChange}
          />
          {termoPesquisa && (
            <button 
              onClick={() => setTermoPesquisa('')}
              className="text-gray-500 hover:text-gray-700"
            >
              <IoClose size={18} />
            </button>
          )}
        </div>

        {/* Data Atual */}
        <div className='min-w-110 min-h-15 flex items-center justify-center'>
          <h1 className='font-light text-2xl text-[#032221]'>{dataAtual}</h1>
        </div>
      </div>

      {/* Filtro e Lista de Pedidos */}
      <div className='flex w-full h-full flex-col gap-2 mt-4'>
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

          <div className="relative flex flex-row items-center">
            <label className="mr-3 text-md font-semibold text-[#032221]">Selecionar Evento:</label>
            <select
              value={idEventoSelecionado}
              onChange={(e) => setIdEventoSelecionado(e.target.value)}
              className="bg-[#032221] text-[#FFFDF6] font-semibold rounded-lg px-20 py-2 text-sm border-none outline-none cursor-pointer shadow-[1px_1px_3px_rgba(3,34,33,0.1)] appearance-none"
            >
              <option value="" disabled hidden>Selecione...</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nome}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#FFFDF6]">
              <MdKeyboardArrowDown size={4} className='fill-current h-4 w-4'/>
            </div>
          </div>
        </div>

        {/* Lista de Pedidos - Agora com 3 colunas e layout adaptável */}
        <div className='w-full h-full p-2 overflow-y-auto'>
          {pedidos.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {pedidos.map((pedido) => (
                <CardPedido key={pedido.id} pedido={pedido} />
              ))}
            </div>
          ) : (
            <div className='flex justify-center items-center p-8 bg-[#FFFDF6] rounded-xl'>
              <p className='text-[#032221] font-medium text-lg'>
                {idEventoSelecionado && termoPesquisa
                  ? 'Nenhum pedido encontrado para este termo de pesquisa.'
                  : idEventoSelecionado 
                    ? 'Nenhum pedido encontrado para este evento e filtro.' 
                    : 'Selecione um evento para visualizar os pedidos.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default VerificacaoDePermissoes(AlterarPedido, ['Administrador', 'Funcionario de Banca']);