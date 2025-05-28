'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Image from 'next/image';
import '../globals.css'

//Import de Shadcn
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Import de Icons
import { GoSearch } from "react-icons/go";
import { MdKeyboardArrowDown } from "react-icons/md";
import { TbChartBarPopular } from "react-icons/tb";
import { FaRegFilePdf } from "react-icons/fa6";
import { ImPrinter } from "react-icons/im";
import { IoCheckmarkDoneOutline, IoClose, IoChevronDown, IoChevronUp, IoFilter } from 'react-icons/io5';
import { FcTodoList } from "react-icons/fc";
import { MdKeyboardArrowUp } from "react-icons/md";
import { IoFilterOutline } from "react-icons/io5";
import { MdOutlineStoreMallDirectory } from "react-icons/md";

function VerEstatisticas() {
  // Estados principais
  const [pedidos, setPedidos] = useState<Array<any>>([]);
  const [pedidosOriginal, setPedidosOriginal] = useState<Array<any>>([]); // Armazenar todos os pedidos originais
  const [pedidosItens, setPedidosItens] = useState<{[key: string]: Array<any>}>({});
  const [filtroValidade, setFiltroValidade] = useState('Todos');
  const [dataAtual, setDataAtual] = useState('');
  const [idEventoSelecionado, setIdEventoSelecionado] = useState('');
  const [nomeEventoSelecionado, setNomeEventoSelecionado] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [totalFaturado, setTotalFaturado] = useState(0);
  const [termoPesquisa, setTermoPesquisa] = useState(''); // Novo estado para armazenar o termo de pesquisa
  const [totalPedidosConfirmados, setTotalPedidosConfirmados] = useState(0);
  const [mostrarSheetFiltro, setMostrarSheetFiltro] = useState(false);
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

    // Aplicar filtro de itens
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
  }, [termoPesquisa, pedidosOriginal, filtroValidade, itensAplicadosNoFiltro, pedidosItens]);

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
    setItensAplicadosNoFiltro([]);
  };

  const aplicarFiltroItens = () => {
    setItensAplicadosNoFiltro([...itensSelecionados]);
  };

  const formatarEventoSelect = (evento: any) => {
    const dataInicio = evento.data_inicio ? 
      new Date(evento.data_inicio).toLocaleDateString('pt-PT') : '';
    const dataFim = evento.data_fim ? 
      new Date(evento.data_fim).toLocaleDateString('pt-PT') : '';
    
    let textoEvento = evento.nome;
    
    if (dataInicio && dataFim) {
      textoEvento += ` (${dataInicio} - ${dataFim})`;
    } else if (dataInicio) {
      textoEvento += ` (${dataInicio})`;
    }
    
    if (evento.em_execucao) {
      textoEvento += ' • Em Execução';
    }
    
    return textoEvento;
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

  
  //Função para lidar com mudança de filtro de validade
  const handleFiltroValidadeChange = (novoFiltro: string) => {
    setFiltroValidade(novoFiltro);
  };

  //Função para lidar com mudança de evento
  const handleEventoChange = (eventoId: string) => {
    setIdEventoSelecionado(eventoId);
  };

  const CardPedido = ({ pedido }: { pedido: any }) => {
    const itens = pedidosItens[pedido.id] || [];
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Verificar se o pedido está selecionado
    const estaSelecionado = pedidosSelecionados.includes(pedido.id);

    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };

    // Formatação de data para exibição (formato do AlterarPedido)
    const formatarData = (dataString: string) => {
      const data = new Date(dataString);
      const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      
      return `${diasSemana[data.getDay()]}, ${data.getDate()} ${meses[data.getMonth()]}, ${data.getFullYear()}`;
    };

    // Formatação de hora para exibição (formato do AlterarPedido)
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

    const toggleSelecaoPedido = (pedidoId: number, checked: boolean) => {
      if (checked) {
        setPedidosSelecionados(prev => [...prev, pedidoId]);
      } else {
        setPedidosSelecionados(prev => prev.filter(id => id !== pedidoId));
      }
    };

    return (
      <div className='w-full mt-2 flex flex-col rounded-2xl bg-[#FFFDF6] shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
        {/* Linha principal do pedido - CLICÁVEL */}
        <div 
          className='w-full min-h-24 flex flex-row justify-between items-center cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors'
          onClick={toggleExpanded}
        >
          {/* Checkbox, icon, título e data*/}
          <div className='min-w-10 h-full flex flex-row justify-between items-center space-x-3 p-4'>
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox 
                className="size-5 border-2 border-[#032221] data-[state=checked]:bg-[#032221] data-[state=checked]:border-[#032221]"
                checked={estaSelecionado}
                onCheckedChange={(checked) => toggleSelecaoPedido(pedido.id, checked as boolean)}
                disabled={pedido.estado_validade === 'Anulado'}
              />
            </div>
            <FcTodoList size={36} className="text-[#FFFDF6]" />
            <div className='flex flex-col justify-between items-start'>
              <h3 className='font-semibold text-[#032221] text-base'>
                Pedido #{pedido.numero_diario || 'N/A'} - {pedido.nome_cliente || 'Cliente não informado'}
              </h3>
              <span className='font-normal text-sm text-gray-500'>
                {pedido.criado_em ? formatarData(pedido.criado_em) + ' às ' + formatarHora(pedido.criado_em) : 'Data não disponível'}
              </span>
            </div>
          </div>

          {/* Estado, contacto e tipo de pedido*/}
          <div className='min-w-10 h-full flex flex-col justify-center items-center'>
            <span className={`flex flex-row items-center space-x-2 ${
              pedido.estado_validade === 'Confirmado' ? 'text-[#A4B465]' : 'text-red-500'
            }`}>
              {pedido.estado_validade === 'Confirmado' ? 
                <IoCheckmarkDoneOutline size={14} /> : 
                <IoClose size={14} />
              }
              {pedido.estado_validade || 'N/A'}
            </span>
            <span className='text-sm text-gray-500'>
              {pedido.contacto || 'N/A'} / {pedido.tipo_de_pedido || 'N/A'}
            </span>
          </div>

          {/* Evento e Criado por*/}
          <div className='min-w-10 h-full flex flex-col justify-center items-center'>
            <span className='text-[#032221] font-semibold text-sm'>Evento: {nomeEventoSelecionado}</span>
            <span className='text-gray-500 font-medium text-sm'>
              Criado Por: {pedido.profiles?.nome || 'N/A'}
            </span>
          </div>

          {/* Seta de expansão */}
          <div className='min-w-10 h-full flex flex-row justify-center items-center space-x-3 p-4'>
            {isExpanded ? (
              <MdKeyboardArrowUp 
                size={20} 
                className='text-[#032221] hover:text-[#A4B465] transition-colors'
              />
            ) : (
              <MdKeyboardArrowDown 
                size={20} 
                className='text-[#032221] hover:text-[#A4B465] transition-colors'
              />
            )}
          </div>
        </div>
        
        {/* Seção expandida com detalhes dos itens */}
        {isExpanded && (
          <div className='w-full px-6 pb-4 border-t border-gray-200'>
            <div className='mt-4'>
              <h4 className='font-normal text-sm text-gray-500 mb-2 px-2'>
                <b className='text-[#032221]'>Notas:</b> {pedido.nota || 'Sem Informações'}
              </h4>
              {itens && itens.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Imagem</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center w-[100px]">Quantidade</TableHead>
                      <TableHead className="text-right w-[100px]">Preço Unit.</TableHead>
                      <TableHead className="text-right w-[80px]">IVA (%)</TableHead>
                      <TableHead className="text-right w-[100px]">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, itemIndex) => (
                      <TableRow key={itemIndex}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={item.itens?.imagem_url || `/api/placeholder/32/32`} 
                              alt={item.itens?.nome || 'Item'} 
                            />
                            <AvatarFallback className="bg-[#032221] text-[#FFFDF6] text-xs">
                              {(item.itens?.nome || 'IT').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="text-[#032221]">
                          {item.itens?.nome || 'Item não encontrado'}
                        </TableCell>
                        <TableCell className="text-center text-[#032221]">
                          {item.quantidade}
                        </TableCell>
                        <TableCell className="text-right text-[#032221]">
                          €{(item.itens?.preco || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-[#032221]">
                          {item.itens?.IVA || 23}%
                        </TableCell>
                        <TableCell className="text-right text-[#032221] font-medium">
                          €{((item.itens?.preco || 0) * item.quantidade).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-bold text-[#032221] text-lg">
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#032221] text-lg">
                        €{calcularTotalPedido(pedido.id)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              ) : (
                <p className='text-gray-500'>Nenhum item encontrado para este pedido.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="w-full h-full p-6 bg-[#eaf2e9] flex flex-col justify-between items-center gap-2 overflow-y-hidden">
      {/* Componente de erro (será exibido somente quando houver erro) */}
      {erro && <MensagemErro />}
      {/* Primeira linha */}
      <div className='w-full min-h-12 flex flex-row justify-between items-center gap-2'>
        {/* Título da Página */}
        <div className='min-w-116 min-h-15 flex items-center justify-start pl-2'>
          <h1 className='font-bold text-2xl text-[#032221]'>Gerir Pedidos - Edição ou Exclusão</h1>
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
      </div>

      {/* Segunda Linha */}
      <div className='w-full min-h-12 flex flex-row justify-between items-center'>
        {/* Botões */}
        <div className='space-x-4 flex flex-row items-center'>
          <Button 
            variant={filtroValidade === 'Todos' ? 'darkselecionado' : 'dark'}
            onClick={() => handleFiltroValidadeChange('Todos')}
          >
            <MdOutlineStoreMallDirectory size={20}/>Todos
          </Button>
          <Button 
            variant={filtroValidade === 'Confirmado' ? 'confirmarselecionado' : 'confirmar'}
            onClick={() => handleFiltroValidadeChange('Confirmado')}
          >
            <IoCheckmarkDoneOutline size={20}/>Confirmados
          </Button>
          <Button 
            variant={filtroValidade === 'Anulado' ? 'anularselecionado' : 'anular'}
            onClick={() => handleFiltroValidadeChange('Anulado')}
          >
            <IoClose size={20}/>Anulados
          </Button>

          <div className="border-r py-4 border-[#032221]/20 h-full w-1"></div>

          <Sheet open={mostrarSheetFiltro} onOpenChange={setMostrarSheetFiltro}>
            <SheetTrigger asChild>
              <Button variant="dark">
                <IoFilterOutline size={20}/>
                {itensAplicadosNoFiltro.length > 0 && (
                  <span className="ml-1 bg-[#A4B465] text-[#032221] rounded-full px-2 py-1 text-xs font-medium">
                    {itensAplicadosNoFiltro.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-[#FFFDF6]">
              <SheetHeader>
                <SheetTitle className="text-[#032221] text-lg font-medium">Filtrar Pedidos por Itens</SheetTitle>
                <SheetDescription className="text-[#032221]/70">
                  Selecione os itens para filtrar os pedidos que os contêm.
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex flex-col h-200 px-4">
                {/* Contador de itens selecionados */}
                <div className="pb-1 border-b text-[#032221]/70">
                  <p className="text-sm text-[#032221]/70">
                    {itensSelecionados.length > 0 
                      ? `${itensSelecionados.length} item(ns) selecionado(s)`
                      : 'Nenhum item selecionado'
                    }
                  </p>
                  {itensAplicadosNoFiltro.length > 0 && (
                    <p className="text-xs text-[#84AE92] font-medium mt-1">
                      Filtro ativo com {itensAplicadosNoFiltro.length} item(ns)
                    </p>
                  )}
                </div>

                {/* Lista de itens */}
                <div className="flex-1 overflow-y-auto py-2">
                  <div className="space-y-2">
                    {todosItens.map(item => {
                      const estaSelecionado = itensSelecionados.includes(item.id);
                      const estaAplicado = itensAplicadosNoFiltro.includes(item.id);
                      
                      return (
                        <div 
                          key={item.id}
                          className={`flex items-center space-x-4 p-3 rounded-lg cursor-pointer transition-colors ${
                            estaSelecionado 
                              ? 'bg-[rgba(3,98,76,0.1)] shadow-md' 
                              : estaAplicado
                              ? 'bg-[rgba(164,180,101,0.1)] shadow-md'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => toggleItemSelecionado(item.id)}
                        >
                          <Checkbox
                            checked={estaSelecionado}
                            onClick={() => toggleItemSelecionado(item.id)}
                            onCheckedChange={() => toggleItemSelecionado(item.id)}
                            className="size-5 border-2 border-[#032221] data-[state=checked]:bg-[#032221] data-[state=checked]:border-[#032221] cursor-pointer"
                          />
                          
                          <div className="flex items-center space-x-3 flex-1">
                            {item.imagem_url ? (
                              <div className="w-12 h-12 overflow-hidden rounded-full">
                                <Image
                                  src={item.imagem_url}
                                  alt={item.nome}
                                  width={48}
                                  height={48}
                                  className="object-cover w-full h-full"
                                  unoptimized={true}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-lg">🍽️</span>
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-[#032221] truncate">{item.nome}</h4>
                              <p className="text-sm text-gray-500">{item.preco.toFixed(2)}€</p>
                              {estaAplicado && (
                                <p className="text-xs text-[#84AE92] font-medium">• Filtro ativo</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer com botões */}
                <SheetFooter className="border-t border-gray-200">
                  <div className="flex flex-col justify-between w-full gap-2">
                    <div className="flex flex-row justify-between w-full gap-2">
                      <div className="w-full"> 
                        <Button
                          onClick={() => {
                            limparFiltroItens();
                          }}
                          disabled={itensSelecionados.length === 0 && itensAplicadosNoFiltro.length === 0}
                          className='w-full border border-[#7D0A0A]/30 text-[#7D0A0A] bg-transparent hover:bg-[#7D0A0A]/10 hover:border-[#7D0A0A] cursor-pointer'
                        >
                          Limpar Tudo
                        </Button>
                      </div>
                      <div className="w-full"> 
                        <Button
                          className='w-full'
                          variant="botaocancelar"
                          onClick={() => setMostrarSheetFiltro(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="botaoguardar"
                      onClick={() => {
                        aplicarFiltroItens();
                        setMostrarSheetFiltro(false);
                      }}
                      disabled={false} // Removido a condição que desabilitava o botão
                    >
                      Aplicar Filtro {itensSelecionados.length > 0 && `(${itensSelecionados.length})`}
                    </Button>
                  </div>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="dark" >
            <FaRegFilePdf size={20}/>
          </Button>

          <Button variant="dark" >
            <ImPrinter size={20}/>
          </Button>
        </div>

        {/* Evento */}
        <div>
          <Select value={idEventoSelecionado} onValueChange={handleEventoChange}>
            <SelectTrigger className="w-[480px] bg-[#032221] text-[#FFFDF6] cursor-pointer [&_svg]:text-[#FFFDF6] data-[placeholder]:text-[#FFFDF6]">
              <SelectValue 
                className="text-[#FFFDF6] placeholder:text-[#FFFDF6]" 
                placeholder="Selecionar Evento"
              />
            </SelectTrigger>
            <SelectContent className='bg-[#032221] text-[#FFFDF6] max-h-60'>
              {eventos.length === 0 ? (
                <SelectItem value="sem-eventos" disabled>
                  Nenhum evento disponível
                </SelectItem>
              ) : (
                eventos.map((evento) => (
                  <SelectItem 
                    key={evento.id} 
                    value={evento.id.toString()}
                    className="text-[#FFFDF6] hover:bg-[#1a4443] cursor-pointer"
                  >
                    {formatarEventoSelect(evento)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Data Atual */}
        <div className='min-h-15 flex items-center justify-center'>
          <h1 className='font-light text-2xl text-[#032221]'>{dataAtual}</h1>
        </div>
      </div>

      {/* Histórico e Estatisticas Globais */}
      <div className='w-full h-full flex flex-row justify-between items-center gap-4 overflow-y-hidden'>
        {/* Histórico Pedidos - Container com altura fixa e scroll */}
        <div className="w-full h-full bg-transparent rounded-2xl flex flex-col overflow-y-auto" 
             style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
             <style jsx>{`div::-webkit-scrollbar {display: none;}`}</style>
          {pedidos.length > 0 ? (
            pedidos.map((pedido: any) => (
              <CardPedido key={pedido.id} pedido={pedido} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-[#032221] font-medium text-lg">
                {idEventoSelecionado 
                  ? 'Nenhum pedido encontrado para os filtros aplicados.' 
                  : 'Selecione um evento para visualizar os pedidos.'}
              </p>
            </div>
          )}
        </div>
        
        {/* Coluna 2 - Estatísticas */}
        <div className='min-w-110 h-full flex flex-col jusitfy-between items-center gap-4'>
          {/* Estatísticas dos Pedidos */}
          <div className='bg-[#032221] rounded-xl w-full min-h-20 flex flex-row items-center space-y-2 py-1'>
            {/* Total de Pedidos */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center p-2'>
              <h1 className='text-[#FFFDF6] font-normal text-xl'>Total de Pedidos</h1>
              <span className='text-[#DDEB9D] font-extralight text-xs'>
                {nomeEventoSelecionado ? `* ${nomeEventoSelecionado}` : '* Selecione um evento'}
              </span>
              <h1 className='text-[#FFFDF6] font-bold text-4xl py-2'>{totalPedidosConfirmados}</h1>
            </div>
            {/* Total Faturado */}
            <div className='w-full h-full border-r-1 border-[rgba(241,246,247,0.2)] flex flex-col justify-center items-center p-2'>
              <h1 className='text-[#FFFDF6] font-normal text-xl'>Total Faturado</h1>
              <span className='text-[#DDEB9D] font-extralight text-xs'>
                {nomeEventoSelecionado ? `* ${nomeEventoSelecionado}` : '* Selecione um evento'}
              </span>
              <h1 className='text-[#FFFDF6] font-bold text-4xl py-2'>{totalFaturadoConfirmados.toFixed(2)}€</h1>
            </div>
          </div>

          {/* Pratos Populares */}
          <div className="w-full h-full flex-1 bg-[#FFFDF6] rounded-2xl flex flex-col pt-2 shadow-[1px_1px_3px_rgba(3,34,33,0.2)] overflow-y-auto">
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
            <div className='w-full h-full flex-1 flex flex-col px-2 mb-4 overflow-y-auto' style={{scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style jsx>{`div::-webkit-scrollbar {display: none;}`}</style>
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
                          unoptimized={true}
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
                <div className='flex justify-center items-center p-4 flex-1'>
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
    </main>
  );
}

export default VerificacaoDePermissoes(VerEstatisticas, ['Administrador', 'Funcionario de Banca']);