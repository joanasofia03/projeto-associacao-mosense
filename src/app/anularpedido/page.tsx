'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

// Import de Icons
import { GoSearch } from "react-icons/go";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { FaEye } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoCheckmarkDoneOutline, IoClose, IoCheckmarkDoneSharp, IoChevronDown} from "react-icons/io5";
import { MdOutlineStoreMallDirectory } from "react-icons/md";
import { FcTodoList } from "react-icons/fc";

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

  //ModalAnular para anular pedido;
  const ModalAnular = () => {
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
      <AlertDialog open={mostrarModal} onOpenChange={setMostrarModal}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#032221]">
              Tem a certeza absoluta?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Esta ação não pode ser desfeita. Isto irá alterar permanentemente 
              o estado do pedido para anulado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-100 text-[#032221] hover:bg-gray-200"
              onClick={() => {
                setMostrarModal(false);
                setPedidoParaAnular(null);
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleConfirmar}
              disabled={loading}
            >
              {loading ? 'A anular...' : 'Continuar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // Carregar eventos disponíveis
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('nome', { ascending: true }); // Ordenar por nome

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
      if (!idEventoSelecionado) {
        // Limpar pedidos se nenhum evento estiver selecionado
        setPedidos([]);
        setPedidosOriginal([]);
        setPedidosItens({});
        return;
      }

      try {
        let query = supabase
          .from('pedidos')
          .select(`
            *,
            profiles:registado_por (
              nome
            )
          `)
          .eq('id_evento', idEventoSelecionado)
          .order('criado_em', { ascending: false }); // Ordenar por data/hora (mais recente primeiro)

        if (filtroValidade !== 'Todos') {
          query = query.eq('estado_validade', filtroValidade);
        }

        const { data, error } = await query;

        if (error) {
          setErro(`Erro ao buscar pedidos: ${error.message}`);
          console.error('Erro na consulta de pedidos:', error);
        } else {
          // Ordenação adicional no cliente para garantir ordem correta
          const pedidosOrdenados = (data || []).sort((a, b) => {
            const dataA = new Date(a.criado_em || 0);
            const dataB = new Date(b.criado_em || 0);
            return dataB.getTime() - dataA.getTime(); // Mais recente primeiro
          });
          
          setPedidosOriginal(pedidosOrdenados);
          setPedidos(pedidosOrdenados);
          
          // Buscar os itens para cada pedido
          if (pedidosOrdenados && pedidosOrdenados.length > 0) {
            const pedidosIds = pedidosOrdenados.map(pedido => pedido.id);
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
    
    // Manter a ordenação por data/hora nos resultados filtrados
    const resultadosOrdenados = resultados.sort((a, b) => {
      const dataA = new Date(a.criado_em || 0);
      const dataB = new Date(b.criado_em || 0);
      return dataB.getTime() - dataA.getTime(); // Mais recente primeiro
    });
    
    setPedidos(resultadosOrdenados);
    
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
      
      // Buscar detalhes dos itens incluindo o campo iva
      const { data: itensData, error: itensError } = await supabase
        .from('itens')
        .select('id, nome, preco, iva')
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

  // Função para lidar com a mudança de evento no select
  const handleEventoChange = (value: string) => {
    setIdEventoSelecionado(value);
    // Limpar a pesquisa quando mudar de evento
    setTermoPesquisa('');
    // Limpar pedidos expandidos
    setPedidosExpandidos({});
  };

  // Função para formatar o texto do evento no select
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

  const aplicarFiltroValidade = (filtro: string) => {
    setFiltroValidade(filtro);
  };

  return (
    <main className="w-full h-full px-6 py-6 bg-[#eaf2e9] flex flex-col overflow-y-hidden space-y-1">
      {/* Componente de erro (será exibido somente quando houver erro) */}
      {erro && <MensagemErro />}

      {/* Primeiro Linha */}
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
            onClick={() => aplicarFiltroValidade('Todos')}
          >
            <MdOutlineStoreMallDirectory size={20}/>Todos
          </Button>
          <Button 
            variant={filtroValidade === 'Confirmado' ? 'confirmarselecionado' : 'confirmar'} 
            onClick={() => aplicarFiltroValidade('Confirmado')}
          >
            <IoCheckmarkDoneOutline size={20}/>Confirmados
          </Button>
          <Button 
            variant={filtroValidade === 'Anulado' ? 'anularselecionado' : 'anular'} 
            onClick={() => aplicarFiltroValidade('Anulado')}
          >
            <IoClose size={20}/>Anulados
          </Button>
          <Button variant="anular"><RiDeleteBin6Line size={20}/></Button>
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
        <div className='min-w-110 min-h-15 flex items-center justify-center'>
          <h1 className='font-light text-2xl text-[#032221]'>{dataAtual}</h1>
        </div>
      </div>

      {/* Terceira linha - Lista de Pedidos */}
      <div className='w-full h-full flex flex-col items-center overflow-y-auto space-y-2 py-1' 
           style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              <style jsx>{`div::-webkit-scrollbar {display: none;}`}</style>
        {/* Verificar se há pedidos para mostrar */}
        {pedidos.length === 0 ? (
          <div className='w-full h-32 flex items-center justify-center'>
            <p className='text-gray-500 text-lg'>
              {idEventoSelecionado ? 'Nenhum pedido encontrado para este evento.' : 'Selecione um evento para ver os pedidos.'}
            </p>
          </div>
        ) : (
          pedidos.map((pedido, index) => (
            <div key={pedido.id} className='w-full mt-2 flex flex-col rounded-2xl bg-[#FFFDF6] shadow-md'>
              {/* Linha principal do pedido - CLICÁVEL */}
              <div 
                className='w-full min-h-24 flex flex-row justify-between items-center cursor-pointer hover:bg-gray-50 rounded-2xl transition-colors'
                onClick={() => toggleExpansaoPedido(pedido.id)}
              >
                {/* Checkbox, icon, título e data*/}
                <div className='min-w-10 h-full flex flex-row justify-between items-center space-x-3 p-4'>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox className="size-5 border-2 border-[#032221] data-[state=checked]:bg-[#032221] data-[state=checked]:border-[#032221]"/>
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

                {/* Editar & Eliminar*/}
                <div className='min-w-10 h-full flex flex-row justify-center items-center space-x-3 p-4'>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button variant="confirmar" onClick={() => editarPedido(pedido.id)}>Editar</Button>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button variant="anular" onClick={() => iniciarAnulacaoPedido(pedido.id)}>Eliminar</Button>
                  </div>
                  {pedidosExpandidos[pedido.id] ? (
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
              {pedidosExpandidos[pedido.id] && (
              <div className='w-full px-6 pb-4 border-t border-gray-200'>
                <div className='mt-4'>
                  <h4 className='font-normal text-sm text-gray-500 mb-2 px-2'>
                    <b className='text-[#032221]'>Notas:</b> {pedido.nota || 'Sem Informações'}
                  </h4>
                  {pedidosItens[pedido.id] && pedidosItens[pedido.id].length > 0 ? (
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
                        {pedidosItens[pedido.id].map((item, itemIndex) => (
                          <TableRow key={itemIndex}>
                            <TableCell>
                              <Avatar className="h-8 w-8">
                                <AvatarImage 
                                  src={`/api/placeholder/32/32`} 
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
                              {item.itens?.iva || 23}%
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
          ))
        )}
      </div>

      {/* Modal de confirmação */}
      <ModalAnular />
    </main>
  );
}

export default VerificacaoDePermissoes(AlterarPedido, ['Administrador', 'Funcionario de Banca']);