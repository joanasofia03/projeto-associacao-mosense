'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Image from 'next/image';
import '../globals.css'

// Import de Icons
import { GoSearch } from "react-icons/go";
import { MdKeyboardArrowDown } from "react-icons/md";
import { TbChartBarPopular } from "react-icons/tb";
import { FaRegFilePdf } from "react-icons/fa6";
import { ImPrinter } from "react-icons/im";
import { IoCheckmarkDoneOutline, IoClose, IoChevronDown, IoChevronUp, IoFilter } from 'react-icons/io5';
import { FcTodoList } from "react-icons/fc";
import { FaCheck } from "react-icons/fa6";

function VerEstatisticas() {
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
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [totalFaturado, setTotalFaturado] = useState(0);
  const [termoPesquisa, setTermoPesquisa] = useState(''); // Novo estado para armazenar o termo de pesquisa
  const [totalPedidosConfirmados, setTotalPedidosConfirmados] = useState(0);
  const [totalFaturadoConfirmados, setTotalFaturadoConfirmados] = useState(0);
  const [itensAplicadosNoFiltro, setItensAplicadosNoFiltro] = useState<number[]>([]);
  const [pedidosSelecionados, setPedidosSelecionados] = useState<number[]>([]);
  const [selecionarTodos, setSelecionarTodos] = useState(false);
  const [pratosPopulares, setPratosPopulares] = useState<Array<{
    id: number;
    nome: string;
    quantidade: number;
    preco: number;
    imagem_url?: string;
  }>>([]);
  const [eventos, setEventos] = useState<Array<{
    id: number;
    criando_em: string;
    nome: string;
    data_inicio: string | null;
    data_fim: string | null;
    em_execucao: boolean;
  }>>([]);
  const [todosItens, setTodosItens] = useState<Array<{
    id: number;
    nome: string;
    preco: number;
    imagem_url?: string;
  }>>([]);
  const [itensSelecionados, setItensSelecionados] = useState<number[]>([]);
  const [mostrarFiltroItens, setMostrarFiltroItens] = useState(false);

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

  //Carregar eventos disponíveis 
  useEffect(() => {
    // Carregar eventos apenas uma vez quando o componente é montado
    const fetchEventos = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('data_inicio', { ascending: false });

        if (error) {
          setErro(`Erro ao buscar eventos: ${error.message}`);
          console.error('Erro na consulta Supabase:', error);
        } else {
          setEventos(data || []);
          
          // Verificar se há um evento em execução para selecionar automaticamente
          const eventoAtivo = data?.find(evento => evento.em_execucao);
          if (eventoAtivo) {
            setIdEventoSelecionado(eventoAtivo.id.toString());
            setNomeEventoSelecionado(eventoAtivo.nome);
          }
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

  // Função para buscar itens dos pedidos confirmados (apenas para estatísticas)
  const fetchPedidosItensConfirmados = async (pedidosConfirmadosIds: number[]) => {
    if (!pedidosConfirmadosIds.length) return;
    
    try {
      // Primeiro, buscar os pedidos_itens dos pedidos confirmados
      const { data: pedidosItensData, error: pedidosItensError } = await supabase
        .from('pedidos_itens')
        .select('id, pedido_id, item_id, quantidade')
        .in('pedido_id', pedidosConfirmadosIds);

      if (pedidosItensError) {
        setErro(`Erro ao buscar itens dos pedidos confirmados: ${pedidosItensError.message}`);
        console.error('Erro na consulta de itens dos pedidos confirmados:', pedidosItensError);
        return;
      }
      
      // Obter todos os IDs de itens para buscar os detalhes
      const itensIds = pedidosItensData?.map(item => item.item_id) || [];
      
      // Buscar detalhes dos itens
      const { data: itensData, error: itensError } = await supabase
        .from('itens')
        .select('id, nome, preco, imagem_url')
        .in('id', itensIds);
        
      if (itensError) {
        setErro(`Erro ao buscar detalhes dos itens confirmados: ${itensError.message}`);
        console.error('Erro na consulta de detalhes dos itens confirmados:', itensError);
        return;
      }
      
      // Criar um mapa dos itens para acesso rápido
      const itensMap = new Map();
      itensData?.forEach(item => {
        itensMap.set(item.id, item);
      });
      
      // Calcular o valor total faturado para pedidos confirmados
      let valorTotalConfirmado = 0;
      
      pedidosItensData?.forEach(pedidoItem => {
        const itemDetalhes = itensMap.get(pedidoItem.item_id);
        
        if (itemDetalhes) {
          // Calcular valor total para pedidos confirmados
          valorTotalConfirmado += (itemDetalhes.preco || 0) * pedidoItem.quantidade;
        }
      });
      
      setTotalFaturadoConfirmados(valorTotalConfirmado);
    } catch (err) {
      setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Exceção ao buscar itens dos pedidos confirmados:', err);
    }
  };

  //Função para filtrar os pedidos pela pesquisa
  useEffect(() => {
    // Verificar se temos dados originais para filtrar
    if (!pedidosOriginal.length) {
      setPedidos([]);
      setTotalPedidos(0);
      return;
    }

    // Se não há termo de pesquisa mas há filtro de validade
    if (!termoPesquisa.trim()) {
      // Filtrar apenas por validade
      const pedidosFiltrados = filtroValidade !== 'Todos'
        ? pedidosOriginal.filter(pedido => pedido.estado_validade === filtroValidade)
        : [...pedidosOriginal];
        
      setPedidos(pedidosFiltrados);
      setTotalPedidos(pedidosFiltrados.length);
      return;
    }

    // Filtrar pedidos baseado no termo de pesquisa e estado de validade
    const termoLowerCase = termoPesquisa.toLowerCase().trim();
    
    const resultados = pedidosOriginal.filter(pedido => {
      // Primeiro verificar se o pedido atende ao filtro de validade
      if (filtroValidade !== 'Todos' && pedido.estado_validade !== filtroValidade) {
        return false;
      }
      
      // Depois verificar se atende ao termo de pesquisa
      const numeroPedido = String(pedido.numero_diario || '').toLowerCase();
      const nomeCliente = String(pedido.nome_cliente || '').toLowerCase();
      const contacto = String(pedido.contacto || '').toLowerCase();
      
      return numeroPedido.includes(termoLowerCase) || 
            nomeCliente.includes(termoLowerCase) || 
            contacto.includes(termoLowerCase);
    });
    
    setPedidos(resultados);
    setTotalPedidos(resultados.length);
  }, [termoPesquisa, pedidosOriginal, filtroValidade]);

  // Função de manipulação do input de pesquisa
  const handlePesquisaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermoPesquisa(e.target.value);
  };

  //Função para buscar itens dos pedidos - função fetchPedidosItens
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
      
      if (!pedidosItensData || pedidosItensData.length === 0) {
        setPedidosItens({});
        return;
      }
      
      // Obter todos os IDs de itens únicos para buscar os detalhes
      const itensIds = [...new Set(pedidosItensData.map(item => item.item_id))];
      
      // Buscar detalhes dos itens
      const { data: itensData, error: itensError } = await supabase
        .from('itens')
        .select('id, nome, preco, imagem_url')
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
      let valorTotal = 0;
      
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
          
          // Calcular valor total
          valorTotal += (itemDetalhes.preco || 0) * pedidoItem.quantidade;
        }
      });
      
      setPedidosItens(itensAgrupados);
      setTotalFaturado(valorTotal);
      
    } catch (err) {
      setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Exceção ao buscar itens dos pedidos:', err);
    }
  };


  useEffect(() => {
    const fetchPedidos = async () => {
      if (!idEventoSelecionado) return;

      try {
        // Buscar pedidos com base no filtro para exibição nos cards
        let query = supabase
          .from('pedidos')
          .select(`
            *,
            profiles:registado_por (
              nome
            )
          `)
          .eq('id_evento', idEventoSelecionado);

        if (filtroValidade !== 'Todos') {
          query = query.eq('estado_validade', filtroValidade);
        }

        const { data, error } = await query;

        if (error) {
          setErro(`Erro ao buscar pedidos: ${error.message}`);
        } else {
          setPedidosOriginal(data || []); // Armazenar os dados originais
          setPedidos(data || []);
          setTotalPedidos(data?.length || 0);
          
          // IMPORTANTE: Sempre buscar TODOS os pedidos confirmados para estatísticas
          const { data: confirmados, error: erroConfirmados } = await supabase
            .from('pedidos')
            .select('*')
            .eq('id_evento', idEventoSelecionado)
            .eq('estado_validade', 'Confirmado');
            
          if (erroConfirmados) {
            setErro(`Erro ao buscar pedidos confirmados: ${erroConfirmados.message}`);
          } else {
            // Atualizar estatísticas com pedidos confirmados
            setTotalPedidosConfirmados(confirmados?.length || 0);
            
            // Para calcular pratos populares, precisamos das informações dos itens dos pedidos CONFIRMADOS
            if (confirmados && confirmados.length > 0) {
              const confirmadosIds = confirmados.map(pedido => pedido.id);
              
              // Calcular faturamento de pedidos confirmados
              fetchPedidosItensConfirmados(confirmadosIds);
              
              // Buscar itens para TODOS os pedidos confirmados para cálculo de pratos populares
              fetchPedidosItensPratosPopulares(confirmadosIds);
            } else {
              setTotalFaturadoConfirmados(0);
              setPratosPopulares([]);
            }
            
            // Buscar itens para os pedidos filtrados (para exibição nos cards)
            if (data && data.length > 0) {
              const pedidosFiltradosIds = data.map(pedido => pedido.id);
              fetchPedidosItens(pedidosFiltradosIds);
            } else {
              setPedidosItens({});
            }
          }
        }
      } catch (err) {
        setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    fetchPedidos();
  }, [idEventoSelecionado, filtroValidade]);

  // Adicione esta nova função para buscar itens apenas para cálculo de pratos populares
  const fetchPedidosItensPratosPopulares = async (pedidosConfirmadosIds: number[]) => {
    if (!pedidosConfirmadosIds.length) return;
    
    try {
      // Primeiro, buscar os pedidos_itens dos pedidos confirmados
      const { data: pedidosItensData, error: pedidosItensError } = await supabase
        .from('pedidos_itens')
        .select('id, pedido_id, item_id, quantidade')
        .in('pedido_id', pedidosConfirmadosIds);

      if (pedidosItensError) {
        setErro(`Erro ao buscar itens dos pedidos confirmados: ${pedidosItensError.message}`);
        console.error('Erro na consulta de itens dos pedidos confirmados:', pedidosItensError);
        return;
      }
      
      if (!pedidosItensData || pedidosItensData.length === 0) {
        setPratosPopulares([]);
        return;
      }
      
      // Obter todos os IDs de itens únicos para buscar os detalhes
      const itensIds = [...new Set(pedidosItensData.map(item => item.item_id))];
      
      // Buscar detalhes dos itens
      const { data: itensData, error: itensError } = await supabase
        .from('itens')
        .select('id, nome, preco, imagem_url')
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
      
      // Calcular os pratos mais populares diretamente aqui
      const pratosMaisPopulares = calcularPratosPopulares(itensAgrupados, pedidosConfirmadosIds);
      setPratosPopulares(pratosMaisPopulares);
      
    } catch (err) {
      setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Exceção ao buscar itens dos pedidos para pratos populares:', err);
    }
  };

  //Função calcularPratosPopulares
  const calcularPratosPopulares = (pedidosItensPorPedido: {[key: string]: Array<any>}, pedidosConfirmadosIds: number[]) => {
    // Contador para cada item
    const contadorItens: { [key: number]: { 
      id: number, 
      nome: string, 
      quantidade: number, 
      preco: number,
      imagem_url?: string 
    } } = {};
    
    // Verificar se temos pedidos confirmados para processar
    if (!pedidosConfirmadosIds || pedidosConfirmadosIds.length === 0) {
      return [];
    }
    
    //Percorrer apenas os pedidos confirmados
    pedidosConfirmadosIds.forEach(pedidoId => {
      const itensPedido = pedidosItensPorPedido[pedidoId];
      
      if (!itensPedido || itensPedido.length === 0) {
        return;
      }
      
      // Contar a quantidade de cada item no pedido confirmado
      itensPedido.forEach(item => {
        if (!item || !item.item_id) {
          return;
        }
        
        const itemId = item.item_id;
        
        if (!contadorItens[itemId]) {
          contadorItens[itemId] = {
            id: itemId,
            nome: item.itens?.nome || 'Item não disponível',
            quantidade: 0,
            preco: item.itens?.preco || 0,
            imagem_url: item.itens?.imagem_url
          };
        }
        
        // Adicionar a quantidade deste pedido ao contador total
        contadorItens[itemId].quantidade += (item.quantidade || 0);
      });
    });
    
    // Convertendo para array e ordenando...
    const itensArray = Object.values(contadorItens);
    return itensArray.sort((a, b) => b.quantidade - a.quantidade);
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

  // Função para calcular o total do pedido
  const calcularTotalPedido = (pedidoId: number) => {
    const itens = pedidosItens[pedidoId] || [];
    return itens.reduce((total, item) => {
      return total + ((item.itens?.preco || 0) * item.quantidade);
    }, 0).toFixed(2);
  };

  const fetchTodosItens = async () => {
    try {
      const { data, error } = await supabase
        .from('itens')
        .select('id, nome, preco, imagem_url')
        .order('nome', { ascending: true });

      if (error) {
        setErro(`Erro ao buscar itens: ${error.message}`);
        console.error('Erro na consulta de itens:', error);
      } else {
        setTodosItens(data || []);
      }
    } catch (err) {
      setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Exceção ao buscar itens:', err);
    }
  };

  useEffect(() => {
    fetchTodosItens();
  }, []);

  useEffect(() => {
    // Verificar se temos dados originais para filtrar
    if (!pedidosOriginal.length) {
      setPedidos([]);
      setTotalPedidos(0);
      return;
    }

    let pedidosFiltrados = [...pedidosOriginal];

    // Aplicar filtro de validade
    if (filtroValidade !== 'Todos') {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => 
        pedido.estado_validade === filtroValidade
      );
    }

    // Aplicar filtro de pesquisa
    if (termoPesquisa.trim()) {
      const termoLowerCase = termoPesquisa.toLowerCase().trim();
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const numeroPedido = String(pedido.numero_diario || '').toLowerCase();
        const nomeCliente = String(pedido.nome_cliente || '').toLowerCase();
        const contacto = String(pedido.contacto || '').toLowerCase();
        
        return numeroPedido.includes(termoLowerCase) || 
              nomeCliente.includes(termoLowerCase) || 
              contacto.includes(termoLowerCase);
      });
    }

    // Aplicar filtro de itens - AGORA USA itensAplicadosNoFiltro
    if (itensAplicadosNoFiltro.length > 0) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const itensPedido = pedidosItens[pedido.id] || [];
        const itensIdsNoPedido = itensPedido.map(item => item.item_id);
        
        // Verificar se TODOS os itens selecionados estão no pedido (operador AND)
        return itensAplicadosNoFiltro.every(itemId => 
          itensIdsNoPedido.includes(itemId)
        );
      });
    }

    setPedidos(pedidosFiltrados);
    setTotalPedidos(pedidosFiltrados.length);
  }, [termoPesquisa, pedidosOriginal, filtroValidade, itensAplicadosNoFiltro, pedidosItens]); // Mudou aqui também

  const toggleFiltroItens = () => {
    setMostrarFiltroItens(!mostrarFiltroItens);
  };

  const toggleItemSelecionado = (itemId: number) => {
    setItensSelecionados(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const limparFiltroItens = () => {
    setItensSelecionados([]);
    setItensAplicadosNoFiltro([]); // Limpar também os aplicados
  };

  const aplicarFiltroItens = () => {
    setItensAplicadosNoFiltro([...itensSelecionados]); // Aplicar os itens selecionados
    setMostrarFiltroItens(false);
  };

  //MODAL DA FILTRAGEM DOS PEDIDOS POR ITEM
  const FiltroItens = () => {
    if (!mostrarFiltroItens) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(234, 242, 233, 0.9)' }}>
        <div className="bg-[#FFFDF6] rounded-xl shadow-lg w-96 max-h-150 flex flex-col">
          {/* Cabeçalho */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#032221]">Filtrar por Itens</h3>
            <button 
              onClick={toggleFiltroItens}
              className="text-gray-500 hover:text-[#052e2d] cursor-pointer"
            >
              <IoClose size={24} />
            </button>
          </div>

          {/* Lista de itens */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {todosItens.map(item => (
                <label 
                  key={item.id} 
                  className="flex items-center space-x-4 cursor-pointer hover:bg-[rgba(3,98,76,0.1)] p-2 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={itensSelecionados.includes(item.id)}
                    onChange={() => toggleItemSelecionado(item.id)}
                    className="w-4 h-4 text-[#032221] rounded focus:ring-[#032221]"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    {item.imagem_url ? (
                      <div className="w-10 h-10 overflow-hidden pt-2">
                        <Image
                          src={item.imagem_url}
                          alt={item.nome}
                          width={32}
                          height={32}
                          className="object-cover rounded-full"
                          unoptimized={true}
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs text-[#032221]">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <span className="text-lg font-medium text-[#032221] truncate">{item.nome}</span>
                      <span className="text-xs text-gray-500 ml-2">{item.preco.toFixed(2)}€</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Rodapé com botões */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200">
            <button
              onClick={limparFiltroItens}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Limpar ({itensSelecionados.length})
            </button>
            <div className="space-x-2">
              <button
                onClick={toggleFiltroItens}
                className="px-4 py-2 text-sm font-medium text-[#032221] rounded-lg bg-[rgba(3,98,76,0.2)] hover:bg-[rgba(3,98,76,0.3)] transition-transform duration-300 hover:scale-102 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarFiltroItens}
                className="px-4 py-2 text-sm font-medium bg-[#032221] text-[#FFFDF6] rounded-lg hover:bg-[#052e2d] transition-transform duration-300 hover:scale-102 cursor-pointer"
              >
                Aplicar Filtro
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Função para selecionar/desselecionar um pedido
  const togglePedidoSelecionado = (pedidoId: number) => {
    setPedidosSelecionados(prevSelecionados => {
      if (prevSelecionados.includes(pedidoId)) {
        return prevSelecionados.filter(id => id !== pedidoId);
      } else {
        return [...prevSelecionados, pedidoId];
      }
    });
  };

  // Função para selecionar/desselecionar todos os pedidos
  const toggleSelecionarTodos = () => {
    if (selecionarTodos || pedidosSelecionados.length === pedidos.length) {
      // Se todos já estão selecionados, desmarca todos
      setPedidosSelecionados([]);
      setSelecionarTodos(false);
    } else {
      // Seleciona todos os pedidos visíveis
      const todosPedidosIds = pedidos.map(pedido => pedido.id);
      setPedidosSelecionados(todosPedidosIds);
      setSelecionarTodos(true);
    }
  };

  const CardPedido = ({ pedido }: { pedido: any }) => {
    const itens = pedidosItens[pedido.id] || [];
    const [isExpanded, setIsExpanded] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState(0);
    
    // Verificar se o pedido está selecionado
    const estaSelecionado = pedidosSelecionados.includes(pedido.id);
    
    // Calcular a altura real do conteúdo quando expande
    useEffect(() => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    }, [isExpanded, itens]);

    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };
    
    // Formatação de data completa para exibição
    const formatarDataCompleta = (dateString: string) => {
      const date = new Date(dateString);
      
      const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      const diaSemana = diasSemana[date.getDay()];
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      const ano = date.getFullYear();
      
      const horas = date.getHours().toString().padStart(2, '0');
      const minutos = date.getMinutes().toString().padStart(2, '0');
      
      return `${diaSemana}, ${dia} ${mes}, ${ano} às ${horas}h${minutos}`;
    };
    
    return (
      <div className="relative w-full">
        {/* Linha vertical de conexão entre cards */}
        <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-[rgba(3,98,76,0.2)] -z-10"></div>

        <div className="w-full bg-[#FFFDF6] rounded-xl shadow-md overflow-hidden mb-4 relative z-10">
          {/* Header clicável */}
          <div className={`flex flex-row justify-between items-center p-4 transition-colors ${isExpanded ? 'rounded-t-xl bg-[rgba(3,34,33,1)]' : ''}`}>
            {/* Checkbox para seleção + Ícone e dados do pedido */}
            <div className="flex items-center space-x-3">
              {/* Checkbox */}
              <div 
                className="w-6 h-6 flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePedidoSelecionado(pedido.id);
                }}
              >
                <div className={`w-5 h-5 rounded border ${estaSelecionado ? 'bg-[#032221] border-[#032221]' : 'border-gray-400'} flex items-center justify-center`}>
                  {estaSelecionado && (
                    <FaCheck className="h-4 w-4 text-white"/>
                  )}
                </div>
              </div>
              
              {/* Ícone do pedido */}
              <div className="flex items-center justify-center">
                <FcTodoList size={32} className="text-[#FFFDF6]"/>
              </div>
              
              <div 
                className={'flex flex-col cursor-pointer'}
                onClick={toggleExpanded}
              >
                <h3 className={`font-semibold text-[#032221] text-base ${isExpanded ? 'text-[#FFFDF6]' : ''}`}>
                  Pedido #{pedido.numero_diario} - {pedido.nome_cliente}
                </h3>
                <span className={`font-normal text-xs text-gray-500 ${isExpanded ? 'text-white' : ''}`}>
                  {formatarDataCompleta(pedido.criado_em)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-row items-center gap-4">
              {/* Coluna com estado e contacto */}
              <div className="flex flex-col items-end">
                {/* Estado do Pedido */}
                <div className='flex items-center gap-1 py-1 px-2 rounded-lg'>
                  {pedido.estado_validade === 'Confirmado' ? (
                    <IoCheckmarkDoneOutline size={14} className="text-[#A4B465]"/>
                  ) : (
                    <IoClose size={14} className="text-[#FF6347]"/>
                  )}
                  <span className={`text-sm font-medium ${
                    pedido.estado_validade === 'Confirmado' ? 'text-[#A4B465]' : 'text-[#FF6347]'
                  }`}>{pedido.estado_validade}</span>
                </div>
                
                {/* Contato e tipo de pedido */}
                <span className={`text-xs text-gray-500 mt-1 ${isExpanded ? 'text-white' : ''}`}>
                  {pedido.contacto || 'N/A'} / {pedido.tipo_de_pedido}
                </span>
              </div>

              {/* Ícone de expandir/recolher */}
              <div 
                className="text-[#032221] cursor-pointer"
                onClick={toggleExpanded}
              >
                {isExpanded ? <IoChevronUp size={20} className='text-white' /> : <IoChevronDown size={20} className='text-[#032221]'/>}
              </div>
            </div>
          </div>
          
          {/* Conteúdo expansível com altura dinâmica */}
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ 
              maxHeight: isExpanded ? `${contentHeight}px` : '0px',
              opacity: isExpanded ? 1 : 0
            }}
          >
            <div ref={contentRef} className="px-4 pb-4">
              {/* Informações adicionais: evento, notas e criador */}
              <div className="mb-4 grid grid-cols-3 gap-4 pt-3">
                <div className="flex flex-col">
                  <span className="text-[#032221] font-semibold text-sm">Evento:</span>
                  <span className="text-gray-600 text-sm">{pedido.eventoNome || nomeEventoSelecionado}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[#032221] font-semibold text-sm">Notas:</span>
                  <span className="text-gray-600 text-sm truncate">{pedido.nota || 'Nenhuma nota'}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[#032221] font-semibold text-sm">Criado por:</span>
                  <span className="text-gray-600 text-sm">{pedido.profiles.nome || 'Sistema'}</span>
                </div>
              </div>
              
              {/* Cabeçalho da tabela de itens */}
              <div className="w-full grid grid-cols-12 gap-2 text-xs text-gray-500 mt-2 mb-2 border-t border-gray-300 pt-3">
                <span className="col-span-7">Itens</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-3 text-right">Preço</span>
              </div>
              
              {/* Lista de itens */}
              <div className="space-y-2 max-h-48 overflow-y-auto border-b border-gray-300 pb-3" style={{scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style jsx>{`div::-webkit-scrollbar {display: none;}`}</style>
                {itens.length > 0 ? (
                  itens.map((item) => (
                    <div key={item.id} className="w-full grid grid-cols-12 gap-2 py-1">
                      <span className="text-gray-700 font-medium text-sm col-span-7 truncate">
                        {item.itens?.nome || 'Item não disponível'}
                      </span>
                      <span className="text-gray-700 font-medium text-sm col-span-2 text-center">{item.quantidade}</span>
                      <span className="text-gray-700 font-medium text-sm col-span-3 text-right">
                        {((item.itens?.preco || 0) * item.quantidade).toFixed(2)}€
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-gray-500">Nenhum item neste pedido</div>
                )}
              </div>
              
              {/* Total */}
              <div className="pt-3 flex justify-between items-center">
                <span className="font-bold text-[#032221]">Total</span>
                <span className="font-bold text-[#032221] text-lg">{calcularTotalPedido(pedido.id)}€</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="w-full h-full px-6 py-6 bg-[#eaf2e9] flex flex-col overflow-y-hidden">
      {/* Componente de erro (será exibido somente quando houver erro) */}
      {erro && <MensagemErro />}
      {/* Primeira linha */}
      <div className='w-full min-h-12 flex flex-1 flex-row justify-between items-center gap-2'>
        {/* Título da Página */}
        <div className='min-w-116 min-h-15 flex items-center justify-start pl-2'>
          <h1 className='font-bold text-2xl text-[#032221]'>Histórico & Estatísticas de Pedidos</h1>
        </div>

        {/* Search Bar - Agora com funcionalidade */}
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
                  className={`w-30 flex justify-center items-center px-3 py-2 text-sm font-semibold rounded-lg ease-in-out duration-200 shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1 cursor-pointer
                    ${
                      filtroAtivo === filtro
                        ? 'bg-[#032221] text-[#FFFDF6]'
                        : 'bg-[#FFFDF6] text-[#032221] hover:bg-[#dce6e7]'
                    }`}
                >
                  {filtro}
                </button>
              ))}
              <button 
                onClick={toggleFiltroItens}
                className={`w-10 flex justify-center items-center px-3 py-2 text-sm font-semibold rounded-lg ease-in-out duration-200 
                            shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1 cursor-pointer
                            ${itensAplicadosNoFiltro.length > 0 
                              ? 'bg-[#032221] text-[#FFFDF6]' 
                              : 'bg-[#FFFDF6] text-[#032221] hover:bg-[#dce6e7]'
                            }`}
              >
                <IoFilter size={20}/>
                {itensAplicadosNoFiltro.length > 0 && (
                  <span className="absolute bg-[#DDEB9D] text-[#032221] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itensAplicadosNoFiltro.length}
                  </span>
                )}
              </button>
            </div>

            {/* SELECIONAR EVENTO */}
            <div className="relative flex flex-row items-center gap-4 mr-1">
              <label className="text-md font-semibold text-[#032221]">Selecionar Evento:</label>
              <select
                value={idEventoSelecionado}
                onChange={(e) => setIdEventoSelecionado(e.target.value)}
                className="bg-[#032221] text-[#FFFDF6] font-semibold rounded-lg px-18 py-2 text-sm border-none outline-none cursor-pointer shadow-[1px_1px_3px_rgba(3,34,33,0.1)] appearance-none"
              >
                <option value="" disabled hidden>Selecione...</option>
                {eventos.map((evento) => (
                  <option key={evento.id} value={evento.id}>
                    {evento.nome}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#FFFDF6] mr-28">
                <MdKeyboardArrowDown size={5} className='fill-current h-4 w-4'/>
              </div>
              <button className='w-10 flex justify-center items-center px-3 py-2 text-sm font-semibold bg-[#FFFDF6] text-[#032221] rounded-lg ease-in-out duration-200 
                              hover:bg-[#dce6e7] shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1 cursor-pointer'>
                <FaRegFilePdf size={20}/>
              </button>
              <button className='w-10 flex justify-center items-center px-3 py-2 text-sm font-semibold bg-[#FFFDF6] text-[#032221] rounded-lg ease-in-out duration-200 
                              hover:bg-[#dce6e7] shadow-[1px_1px_3px_rgba(3,34,33,0.2)] transition-transform duration-300 hover:-translate-y-1 cursor-pointer'>
                <ImPrinter size={20}/>
              </button>
            </div>
          </div> 

          {/* Histórico Pedidos - Agora mostrando resultados filtrados */}
          <div className="w-full bg-transparent rounded-2xl p-1 mb-8 space-y-2 overflow-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`div::-webkit-scrollbar {display: none;}`}</style> {/* Permite que haja scroll sem estar visivel a scroll bar */}
            {pedidos.map((pedido: any) => (
              <CardPedido key={pedido.id} pedido={pedido} />
            ))}
          </div>
        </div>

        {/* Coluna 2 - Estatísticas */}
        <div className='min-w-110 h-full flex flex-1 flex-col gap-4'>
          {/* Estatísticas dos Pedidos - Agora atualizadas com a pesquisa */}
          <div className='w-full h-40 flex flex-row bg-[#032221] rounded-xl'>
            {/* Total de Pedidos */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center'>
              <h1 className='text-[#FFFDF6] font-normal text-xl'>Total de Pedidos</h1>
              <span className='text-[#DDEB9D] font-extralight text-xs'>
                {nomeEventoSelecionado ? `* ${nomeEventoSelecionado}` : '* Selecione um evento'}
              </span>
              <h1 className='text-[#FFFDF6] font-bold text-4xl py-2'>{totalPedidosConfirmados}</h1>
            </div>
            {/* Total Faturado */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center'>
              <h1 className='text-[#FFFDF6] font-normal text-xl'>Total Faturado</h1>
              <span className='text-[#DDEB9D] font-extralight text-xs'>
                {nomeEventoSelecionado ? `* ${nomeEventoSelecionado}` : '* Selecione um evento'}
              </span>
              <h1 className='text-[#FFFDF6] font-bold text-4xl py-2'>{totalFaturadoConfirmados.toFixed(2)}€</h1>
            </div>
          </div>

          {/* Pratos Populares */}
          <div className='w-full h-full bg-[#FFFDF6] rounded-2xl flex flex-col pt-2 shadow-[1px_1px_3px_rgba(3,34,33,0.2)] mb-13'>
            {/* Título */}
            <div className='w-full h-10 flex flex-row justify-between items-center px-3 py-4'>
              <h1 className='font-semibold text-2xl text-[#032221]'>Pratos Populares</h1>
              <TbChartBarPopular size={24} className='font-normal text-[#032221]'/>
            </div>

            {/* Rank & Nome */}
            <div className='w-64 h-10 flex flex-row justify-between items-center px-3'>
              <span className='font-light text-base text-gray-600'>Posição</span>
              <span className='font-light text-base text-gray-600'>Nome</span>
            </div>

            {/* Exibição de Itens */}
            <div className='w-full h-150 flex flex-col px-2 overflow-y-auto' style={{scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`div::-webkit-scrollbar {display: none;}`}</style> {/* Permite que haja scroll sem estar visivel a scroll bar */}
              {pratosPopulares.length > 0 ? (
                pratosPopulares.map((item, index) => (
                  <div key={item.id} className='flex flex-row justify-around items-center border-b-1 border-[rgba(32,41,55,0.1)] py-2'>
                    <div className='w-30 h-full flex items-center justify-start pl-5'>
                      <span className='font-semibold text-2xl text-[#032221]'>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                      <div className="relative w-35 h-full rounded-full overflow-hidden flex items-center justify-center">
                        {item.imagem_url ? (
                          <Image
                            src={item.imagem_url}
                            alt={item.nome}
                            fill
                            className="object-cover rounded-full"
                            unoptimized={true} // Importante para URLs externas
                          />
                        ) : (
                          <Image
                            src="/CaldoVerde.jpg"
                            alt={item.nome}
                            fill
                            className="object-cover rounded-full"
                          />
                        )}
                      </div>
                    <div className='w-full h-full flex flex-col items-start justify-center pl-7'>
                      <h1 className='font-semibold text-lg text-[#032221]'>{item.nome}</h1>
                      <span className='font-light text-base text-gray-600'>
                        Pedidos: <strong>{item.quantidade}</strong> ({(item.preco * item.quantidade).toFixed(2)}€)
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='col-span-8 flex justify-center items-center p-4'>
                  <p className='text-[#032221] font-medium text-lg'>
                    {idEventoSelecionado 
                      ? 'Nenhum item encontrado para este evento.' 
                      : 'Selecione um evento para visualizar os itens populares.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <FiltroItens />
    </main>
  );
}

export default VerificacaoDePermissoes(VerEstatisticas, ['Administrador', 'Funcionario de Banca']);