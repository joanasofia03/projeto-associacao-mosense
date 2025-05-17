'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Image from 'next/image';

// Import de Icons
import { GoSearch } from "react-icons/go";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { MdKeyboardArrowDown } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import { TbChartBarPopular } from "react-icons/tb";

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
          // Garantir que o mesmo formato de dados da definição SQL seja respeitado
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
    if (!termoPesquisa.trim()) {
      // Se a pesquisa estiver vazia, mostrar todos os pedidos originais
      setPedidos(pedidosOriginal);
      setTotalPedidos(pedidosOriginal.length);
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

  // Função auxiliar para calcular o total faturado para um conjunto específico de pedidos
  const calcularTotalFaturadoParaPedidos = (pedidosIds: number[]) => {
    let total = 0;
    
    pedidosIds.forEach(pedidoId => {
      const itens = pedidosItens[pedidoId] || [];
      itens.forEach(item => {
        total += (item.itens?.preco || 0) * item.quantidade;
      });
    });
    
    return total;
  };

  // Função de manipulação do input de pesquisa
  const handlePesquisaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermoPesquisa(e.target.value);
  };

  // Função para buscar itens dos pedidos
  // Modificar a função fetchPedidosItens para atualizar os pratos populares
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
      
      // Buscar apenas os pedidos confirmados do evento atual para calcular os pratos populares
      const pedidosConfirmados = pedidosOriginal.filter(pedido => pedido.estado_validade === 'Confirmado');
      const pedidosConfirmadosIds = pedidosConfirmados.map(pedido => pedido.id);
      
      console.log(`Calculando pratos populares para ${pedidosConfirmadosIds.length} pedidos confirmados`);
      
      if (pedidosConfirmadosIds.length > 0) {
        const pratosMaisPopulares = calcularPratosPopulares(itensAgrupados, pedidosConfirmadosIds);
        setPratosPopulares(pratosMaisPopulares);
        console.log("Pratos populares calculados:", pratosMaisPopulares);
      } else {
        console.log("Nenhum pedido confirmado encontrado para calcular pratos populares");
        setPratosPopulares([]);
      }
      
    } catch (err) {
      setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Exceção ao buscar itens dos pedidos:', err);
    }
  };

  useEffect(() => {
    const fetchPedidos = async () => {
      if (!idEventoSelecionado) return;

      try {
        // Buscar todos os pedidos para o evento selecionado (para exibição)
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
          setPedidosOriginal(data || []); // Armazenar os dados originais
          setPedidos(data || []);
          setTotalPedidos(data?.length || 0);
          
          // CORREÇÃO: Buscar separadamente todos os pedidos confirmados para estatísticas
          // independentemente do filtro atual
          const { data: confirmados, error: erroConfirmados } = await supabase
            .from('pedidos')
            .select('*')
            .eq('id_evento', idEventoSelecionado)
            .eq('estado_validade', 'Confirmado');
            
          if (erroConfirmados) {
            setErro(`Erro ao buscar pedidos confirmados: ${erroConfirmados.message}`);
            console.error('Erro na consulta de pedidos confirmados:', erroConfirmados);
          } else {
            // Atualizar estatísticas apenas com pedidos confirmados
            setTotalPedidosConfirmados(confirmados?.length || 0);
            
            // CORREÇÃO: Garantir que estamos buscando itens mesmo se não houver pedidos no filtro atual
            // mas existirem pedidos confirmados para estatísticas
            let todosOsPedidosIds: number[] = [];
            
            // Adicionar IDs dos pedidos filtrados para exibição
            if (data && data.length > 0) {
              todosOsPedidosIds = [...data.map(pedido => pedido.id)];
            }
            
            // Adicionar IDs dos pedidos confirmados para estatísticas (se não estiverem já incluídos)
            if (confirmados && confirmados.length > 0) {
              const confirmadosIds = confirmados.map(pedido => pedido.id);
              confirmadosIds.forEach(id => {
                if (!todosOsPedidosIds.includes(id)) {
                  todosOsPedidosIds.push(id);
                }
              });
              
              // Calcular faturamento de pedidos confirmados
              if (confirmados.length > 0) {
                fetchPedidosItensConfirmados(confirmadosIds);
              } else {
                setTotalFaturadoConfirmados(0);
              }
            } else {
              setTotalFaturadoConfirmados(0);
            }
            
            // CORREÇÃO: Buscar itens para todos os pedidos (filtrados + confirmados)
            if (todosOsPedidosIds.length > 0) {
              fetchPedidosItens(todosOsPedidosIds);
            } else {
              setPedidosItens({});
              setPratosPopulares([]);
            }
          }
        }
      } catch (err) {
        setErro(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Exceção ao buscar pedidos:', err);
      }
    };

    fetchPedidos();
  }, [idEventoSelecionado, filtroValidade]);

  // Corrigir a função calcularPratosPopulares para lidar melhor com valores nulos/indefinidos
  const calcularPratosPopulares = (pedidosItensPorPedido: {[key: string]: Array<any>}, pedidosConfirmadosIds: number[]) => {
    // Contador para cada item
    const contadorItens: { [key: number]: { 
      id: number, 
      nome: string, 
      quantidade: number, 
      preco: number,
      imagem_url?: string 
    } } = {};
    
    console.log(`Calculando pratos populares para ${pedidosConfirmadosIds.length} pedidos confirmados`);
    
    // Verificar se temos pedidos confirmados para processar
    if (!pedidosConfirmadosIds || pedidosConfirmadosIds.length === 0) {
      console.log("Nenhum pedido confirmado para calcular pratos populares");
      return [];
    }
    
    // Percorrer apenas os pedidos confirmados
    pedidosConfirmadosIds.forEach(pedidoId => {
      const itensPedido = pedidosItensPorPedido[pedidoId];
      
      if (!itensPedido || itensPedido.length === 0) {
        console.log(`Pedido confirmado #${pedidoId} não tem itens disponíveis`);
        return;
      }
      
      console.log(`Processando pedido confirmado #${pedidoId} com ${itensPedido.length} itens`);
      
      // Contar a quantidade de cada item no pedido confirmado
      itensPedido.forEach(item => {
        if (!item || !item.item_id) {
          console.log("Item inválido encontrado:", item);
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
    
    // Converter o objeto em array para ordenação
    const itensArray = Object.values(contadorItens);
    console.log(`Encontrados ${itensArray.length} itens únicos para classificação de popularidade`);
    
    // Ordenar pelo número de pedidos (maior para menor)
    return itensArray.sort((a, b) => b.quantidade - a.quantidade).slice(0, 8);
  };

  useEffect(() => {
    // Se não há pedidos ou pedidos itens, limpar os pratos populares
    if (!pedidosOriginal.length || Object.keys(pedidosItens).length === 0) {
      setPratosPopulares([]);
      return;
    }
    
    // Filtrar apenas os pedidos confirmados para calcular os pratos populares
    const pedidosConfirmados = pedidosOriginal.filter(pedido => pedido.estado_validade === 'Confirmado');
    const pedidosConfirmadosIds = pedidosConfirmados.map(pedido => pedido.id);
    
    console.log(`Recalculando pratos populares após atualização de dados: ${pedidosConfirmadosIds.length} pedidos confirmados`);
    
    if (pedidosConfirmadosIds.length > 0) {
      const pratosMaisPopulares = calcularPratosPopulares(pedidosItens, pedidosConfirmadosIds);
      setPratosPopulares(pratosMaisPopulares);
      console.log(pratosMaisPopulares)
    } else {
      setPratosPopulares([]);
    }
  }, [pedidosOriginal, pedidosItens]);

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

  //Componente CardPedido
  const CardPedido = ({ pedido }: { pedido: any }) => {
    const itens = pedidosItens[pedido.id] || [];
    const [mostrarTodos, setMostrarTodos] = useState(false);
    
    // Número de itens a mostrar inicialmente
    const itensMostrados = 5;
    
    // Calcular se há mais itens para mostrar
    const temMaisItens = itens.length > itensMostrados;
    
    // Filtrar os itens que serão exibidos inicialmente
    const itensParaExibir = mostrarTodos ? itens : itens.slice(0, itensMostrados);
    
    // Quantidade de itens extras não mostrados
    const itensExtras = itens.length - itensMostrados;
    
    return (
      <div className='w-full h-105 bg-[#FFFDF6] rounded-xl shadow-[1px_1px_3px_rgba(3,34,33,0.1)] flex flex-col'>
        {/* Nome, Nº e Estado */}
        <div className='flex flex-row justify-between items-start w-full h-20 px-3 py-4'>
          <div className='bg-[#032221] rounded-lg p-3'>
            <span className='text-[#FFFDF6] font-semibold text-lg'>{pedido.numero_diario}</span>
          </div>
          <div className='flex flex-col justify-start items-start w-190 h-full px-3'>
            <h1 className='text-[#032221] font-semibold text-lg'>{pedido.nome_cliente}</h1>
            <span className='font-medium text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>
              {pedido.contacto || 'N/A'} / {pedido.tipo_de_pedido}
            </span>
          </div>
          <div className={`flex flex-1 flex-row justify-center content-center items-center w-full h-7 gap-1 py-1 px-2 rounded-lg ${
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

        {/* Data&Hora e Evento */}
        <div className='w-full h-6 flex flex-row justify-between items-center px-3 pb-2 border-b-1 border-[rgba(32,41,55,0.1)]'>
          <span className='font-normal text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>
            {formatarData(pedido.criado_em)}
          </span>
          <span className='font-normal text-xs' style={{ color: "rgba(3, 34, 33, 0.6)" }}>
            {formatarHora(pedido.criado_em)}
          </span>
        </div>

        {/* Display de Itens, Quantidade e Preço */}
        <div className='w-full flex flex-col px-3 pt-2 border-b-1 border-[rgba(32,41,55,0.1)]'>
          {/* Cabeçalho da tabela de itens */}
          <div className='w-full h-6 flex flex-row justify-between items-center mb-1'>
            <span className='font-normal text-xs w-3/5' style={{ color: "rgba(3, 34, 33, 0.6)" }}>Itens</span>
            <span className='font-normal text-xs w-1/5 text-center' style={{ color: "rgba(3, 34, 33, 0.6)" }}>Qty</span>
            <span className='font-normal text-xs w-1/5 text-right' style={{ color: "rgba(3, 34, 33, 0.6)" }}>Preço</span>
          </div>
          
          {/* Container para os itens */}
          <div className='w-full'>
            {!mostrarTodos ? (
              // Container sem scroll quando mostrando apenas os primeiros itens
              <div className='w-full'>
                {itensParaExibir.map((item) => (
                  <div key={item.id} className='w-full flex flex-row justify-between items-center py-1'>
                    <span className='text-[#032221] font-medium text-sm w-3/5 truncate'>
                      {item.itens?.nome || 'Item não disponível'}
                    </span>
                    <span className='text-[#032221] font-medium text-sm w-1/5 text-center'>{item.quantidade}</span>
                    <span className='text-[#032221] font-medium text-sm w-1/5 text-right'>
                      {((item.itens?.preco || 0) * item.quantidade).toFixed(2)}€
                    </span>
                  </div>
                ))}
                
                {/* Botão "Ver mais" estilizado inspirado na imagem de referência */}
                {temMaisItens && (
                  <div 
                    className='w-full h-8 flex justify-center items-center mt-1 relative overflow-hidden cursor-pointer'
                    onClick={() => setMostrarTodos(true)}
                  >
                    {/* Gradient overlay */}
                    <div className='absolute inset-0 bg-gradient-to-t from-[#FFFDF6] to-transparent pointer-events-none'></div>
                    
                    {/* Botão "Ver mais" com estilo moderno */}
                    <div className='bg-[#F5F8F9] border border-gray-200 rounded-full px-3 py-1 flex items-center justify-center shadow-sm z-10'>
                      <span className='text-[#5A6978] font-medium text-xs'>+{itensExtras} more</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Container com scroll quando "Ver mais" é clicado
              <div className='flex flex-col'>
                <div className='w-full max-h-28 overflow-y-auto pr-1'>
                  {itens.map((item) => (
                    <div key={item.id} className='w-full flex flex-row justify-between items-center py-1'>
                      <span className='text-[#032221] font-medium text-sm w-3/5 truncate'>
                        {item.itens?.nome || 'Item não disponível'}
                      </span>
                      <span className='text-[#032221] font-medium text-sm w-1/5 text-center'>{item.quantidade}</span>
                      <span className='text-[#032221] font-medium text-sm w-1/5 text-right'>
                        {((item.itens?.preco || 0) * item.quantidade).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Botão "Ver menos" com estilo consistente */}
                <div 
                  className='w-full h-8 flex justify-center items-center mt-1'
                  onClick={() => setMostrarTodos(false)}
                >
                  <div className='bg-[#F5F8F9] border border-gray-200 rounded-full px-3 py-1 flex items-center justify-center shadow-sm'>
                    <span className='text-[#5A6978] font-medium text-xs'>Ver menos</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Total Faturado */}
        <div className='w-full h-10 flex flex-row justify-between items-center px-3 pt-2'>
          <h1 className='text-[#032221] font-semibold text-lg'>Total</h1>
          <h1 className='text-[#032221] font-semibold text-lg'>{calcularTotalPedido(pedido.id)}€</h1>
        </div>

        {/* Botão Ver Detalhes */}
        <div className='w-full px-3 pb-4 pt-1'>
          <button className='bg-[#032221] text-[#FFFDF6] rounded-lg w-full flex justify-center items-center py-2 cursor-pointer hover:bg-[#052e2d] transition-transform duration-300 hover:scale-102'>
            Ver Detalhes
          </button>
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

          {/* Histórico Pedidos - Agora mostrando resultados filtrados */}
          <div className='w-full h-full grid grid-cols-2 gap-4 px-2 overflow-y-scroll'>
            {pedidos.length > 0 ? (
              pedidos.map((pedido) => (
                <CardPedido key={pedido.id} pedido={pedido} />
              ))
            ) : (
              <div className='col-span-2 flex justify-center items-center p-4 bg-[#FFFDF6] rounded-xl'>
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
          <div className='w-full h-full bg-[#FFFDF6] rounded-2xl flex flex-col pt-2 shadow-[1px_1px_3px_rgba(3,34,33,0.2)]'>
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
            <div className='w-full h-full grid grid-rows-8 gap-2 px-2 overflow-y-scroll'>
              {pratosPopulares.length > 0 ? (
                pratosPopulares.map((item, index) => (
                  <div key={item.id} className='flex flex-row justify-around items-center border-b-1 border-[rgba(32,41,55,0.1)]'>
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
    </main>
  );
}

export default VerificacaoDePermissoes(VerEstatisticas, ['Administrador', 'Funcionario de Banca']);