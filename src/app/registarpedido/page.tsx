'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Image from 'next/image';

// Import shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

//Import de Icons
import { GoSearch } from "react-icons/go";
import { CiEdit } from "react-icons/ci";
import { PiSquaresFour } from "react-icons/pi";
import { LuSoup } from "react-icons/lu";
import { IoFastFoodOutline } from "react-icons/io5";
import { LuDessert } from "react-icons/lu";
import { RiDrinks2Line } from "react-icons/ri";
import { BiDrink } from "react-icons/bi";
import { GoGift } from "react-icons/go";
import { MdDeleteOutline } from "react-icons/md";

type MenuItem = {
  id: number;
  nome: string;
  preco: number;
  tipo: string;
  imagem_url: string | null;
  IVA: number; // Campo para o IVA na tabela itens
  quantidade?: number;
};

function RegistarPedido() {
  const [itensMenu, setItensMenu] = useState<MenuItem[]>([]);
  const [itensFiltrados, setItensFiltrados] = useState<MenuItem[]>([]);
  const [itensSelecionados, setItensSelecionados] = useState<Record<number, MenuItem>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [contactoCliente, setContactoCliente] = useState('');
  
  // Estados para o dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempNome, setTempNome] = useState('');
  const [tempContacto, setTempContacto] = useState('');
  
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [filtroSelecionado, setFiltroSelecionado] = useState<string | null>("todos");
  const [contagemPorTipo, setContagemPorTipo] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventoEmExecucao, setEventoEmExecucao] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notas, setNotas] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 4 colunas x 2 linhas

  const filtros = [ //Organização dos filtros
    { nome: 'Todos os itens', id: 'todos', icon: PiSquaresFour },
    { nome: 'Sopas', id: 'Sopas', icon: LuSoup },
    { nome: 'Comida', id: 'Comida', icon: IoFastFoodOutline },
    { nome: 'Sobremesas', id: 'Sobremesas', icon: LuDessert },
    { nome: 'Bebida', id: 'Bebida', icon: RiDrinks2Line },
    { nome: 'Álcool', id: 'Álcool', icon: BiDrink },
    { nome: 'Brindes', id: 'Brindes', icon: GoGift },
  ];

  //ALTERAÇÂO PNP
  const [modoEdicao, setModoEdicao] = useState(false);
  const [pedidoOriginalId, setPedidoOriginalId] = useState<number | null>(null);
  const [pedidoOriginal, setPedidoOriginal] = useState<any>(null);

  //useEffect para carregar dados do pedido quando em modo edição ALTERAÇÂO PNP
  useEffect(() => {
    const carregarPedidoParaEdicao = async () => {
      // Verificar se há parâmetros na URL para modo edição
      const urlParams = new URLSearchParams(window.location.search);
      const pedidoId = urlParams.get('editarPedido');
      
      if (pedidoId) {
        try {
          // Buscar dados do pedido
          const { data: pedidoData, error: pedidoError } = await supabase
            .from('pedidos')
            .select('*')
            .eq('id', pedidoId)
            .single();

          if (pedidoError) throw pedidoError;

          // Buscar itens do pedido
          const { data: itensData, error: itensError } = await supabase
            .from('pedidos_itens')
            .select(`
              *,
              itens (*)
            `)
            .eq('pedido_id', pedidoId);

          if (itensError) throw itensError;

          // Configurar modo edição
          setModoEdicao(true);
          setPedidoOriginalId(parseInt(pedidoId));
          setPedidoOriginal(pedidoData);

          // Carregar dados do cliente
          setNomeCliente(pedidoData.nome_cliente);
          setContactoCliente(pedidoData.contacto || '');
          setNotas(pedidoData.nota || '');
          setOpcaoSelecionada(pedidoData.tipo_de_pedido);

          // Carregar itens selecionados
          const itensCarregados: Record<number, MenuItem> = {};
          itensData.forEach(item => {
            if (item.itens) {
              itensCarregados[item.itens.id] = {
                ...item.itens,
                quantidade: item.quantidade
              };
            }
          });
          setItensSelecionados(itensCarregados);

          toast.success('Pedido carregado para edição!');
        } catch (error) {
          console.error('Erro ao carregar pedido para edição:', error);
          toast.error('Erro ao carregar pedido para edição.');
          // Limpar parâmetros da URL em caso de erro
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };

    carregarPedidoParaEdicao();
  }, []);

  const handleNotasChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotas(event.target.value);
  };

  // Funções para o dialog
  const handleOpenDialog = () => {
    setTempNome(nomeCliente);
    setTempContacto(contactoCliente);
    setDialogOpen(true);
  };

  const handleSaveChanges = () => {
    setNomeCliente(tempNome);
    setContactoCliente(tempContacto);
    setDialogOpen(false);
  };

  const handleCancelChanges = () => {
    setTempNome(nomeCliente);
    setTempContacto(contactoCliente);
    setDialogOpen(false);
  };

  useEffect(() => {
    const fetchItens = async () => {
      const { data, error } = await supabase
        .from('itens')
        .select('*')

      if (error) {
        setErro('Erro ao carregar itens do menu.');
        toast.error('Erro ao carregar itens do menu.');
      } else {
        setItensMenu(data || []);
        setItensFiltrados(data || []);

        // Contar itens por tipo
        const contagem: Record<string, number> = {};
        for (const item of data || []) {
          const tipo = item.tipo;
          contagem[tipo] = (contagem[tipo] || 0) + 1;
        }

        // Adicionar total
        contagem["Todos"] = data.length;

        setContagemPorTipo(contagem);
      }
    };

    fetchItens();
  }, []);

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearch = useDebounce(searchQuery, 300); // 300ms de delay

  // Filtrar itens baseado no filtro selecionado e pesquisa
  useEffect(() => {
    let itensFiltrados = itensMenu;

    // Filtrar por tipo (categoria)
    if (filtroSelecionado && filtroSelecionado !== 'todos') {
      itensFiltrados = itensFiltrados.filter(item => 
        item.tipo === filtroSelecionado
      );
    }

    // Filtrar por pesquisa (usando debouncedSearch em vez de searchQuery)
    if (debouncedSearch) {
      itensFiltrados = itensFiltrados.filter(item =>
        item.nome.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    setItensFiltrados(itensFiltrados);
  }, [filtroSelecionado, debouncedSearch, itensMenu]);

 useEffect(() => {
    const fetchEventoEmExecucao = async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('em_execucao', true)
        .single();

      if (error) {
        setErro("Erro ao procurar evento");
        toast.error('Erro ao procurar evento.');
      } else {
        setEventoEmExecucao(data);
      }
    };

    const fetchUserId = async () => {
      const session = await supabase.auth.getSession();
      const user = session.data.session?.user;
      if (user) {
        setUserId(user.id);
      } else {
        setErro('Utilizador não autenticado');
        toast.error('Utilizador não autenticado.');
      }
    };

    fetchEventoEmExecucao();
    fetchUserId();
  }, []);

  // Funções para manipular a quantidade dos itens - CORRIGIDO: removida a duplicação
  const adicionarItem = (item: MenuItem) => {
    setItensSelecionados(prev => {
      const novoItem = { ...item, quantidade: 1 };
      return { ...prev, [item.id]: novoItem };
    });
  };

  const aumentarQuantidade = (itemId: number) => {
    setItensSelecionados(prev => {
      if (!prev[itemId]) return prev;
      
      const novoItem = { ...prev[itemId], quantidade: (prev[itemId].quantidade || 0) + 1 };
      return { ...prev, [itemId]: novoItem };
    });
  };

  const diminuirQuantidade = (itemId: number) => {
    setItensSelecionados(prev => {
      if (!prev[itemId] || (prev[itemId].quantidade || 0) <= 1) {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      }
      
      const novoItem = { ...prev[itemId], quantidade: (prev[itemId].quantidade || 0) - 1 };
      return { ...prev, [itemId]: novoItem };
    });
  };
  
  const removerItem = (itemId: number) => {
    setItensSelecionados(prev => {
      const newItems = { ...prev };
      delete newItems[itemId];
      return newItems;
    });
  };
  
  // Função para limpar todos os itens do pedido
  const limparTodosPedidos = () => {
    setItensSelecionados({});
  };

  // Função para obter o ícone conforme o tipo de item
  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case 'Sopas':
        return <LuSoup className="text-[#032221]" size={15} />;
      case 'Brindes':
        return <GoGift className="text-[#032221]" size={15} />;
      case 'Bebida':
        return <RiDrinks2Line className="text-[#032221]" size={15} />;
      case 'Comida':
        return <IoFastFoodOutline className="text-[#032221]" size={15} />;
      case 'Sobremesas':
        return <LuDessert className="text-[#032221]" size={15} />;
      case 'Álcool':
        return <BiDrink className="text-[#032221]" size={15} />;
      default:
        return <LuSoup className="text-[#032221]" size={15} />;
    }
  };

  //Cálculos para o pagamento (Subtotal, IVA e Total)
  const calcularTotais = () => {
    let subtotalSemIVA = 0;
    let totalIVA = 0;

    Object.values(itensSelecionados).forEach(item => {
      const quantidade = item.quantidade || 0;
      const precoUnitario = item.preco;
      const taxaIVA = item.IVA || 0; // Usar o valor de IVA do item
      
      //Calcular o valor sem IVA - Subtotal
      const valorSemIVA = (precoUnitario - precoUnitario*taxaIVA*0.01) * quantidade;
      
      //Calcular o valor do IVA
      const valorIVA = precoUnitario*taxaIVA*0.01*quantidade;
      
      subtotalSemIVA += valorSemIVA;
      totalIVA += valorIVA;
    });

    const total = subtotalSemIVA + totalIVA;

    return {
      subtotal: subtotalSemIVA,
      iva: totalIVA,
      total: total
    };
  };

  const { subtotal, iva, total } = calcularTotais();

  const efetuarPedido = async () => {
    if (!nomeCliente.trim()) {
      toast.error('O nome do cliente é obrigatório.');
      return;
    }

    if (Object.keys(itensSelecionados).length === 0) {
      toast.error('Nenhum item selecionado.');
      return;
    }
    
    const dadosPedido = {
      nome_cliente: nomeCliente,
      contacto: contactoCliente || null,
      nota: notas || null,
      tipo_de_pedido: opcaoSelecionada || 'Comer Aqui',
      registado_por: userId,
      estado_validade: 'Confirmado',
      id_evento: eventoEmExecucao.id,
    };

    try {
      // Começar transação
      if (modoEdicao && pedidoOriginalId) {
        // MODO EDIÇÃO: Anular pedido anterior e criar novo
        
        // 1. Anular pedido original
        const { error: errorAnular } = await supabase
          .from('pedidos')
          .update({ estado_validade: 'Anulado' })
          .eq('id', pedidoOriginalId);

        if (errorAnular) {
          throw new Error('Erro ao anular pedido original.');
        }

        // 2. Criar novo pedido com dados atualizados
        const { data: novoPedido, error: errorNovo } = await supabase
          .from('pedidos')
          .insert([dadosPedido])
          .select()
          .single();

        if (errorNovo) {
          throw new Error('Erro ao criar pedido atualizado.');
        }

        // 3. Inserir novos itens
        const itensPedido = Object.values(itensSelecionados).map(item => ({
          pedido_id: novoPedido.id,
          item_id: item.id,
          quantidade: item.quantidade,
        }));

        const { error: errorItens } = await supabase
          .from('pedidos_itens')
          .insert(itensPedido);

        if (errorItens) {
          throw new Error('Erro ao registrar itens do pedido atualizado.');
        }

        toast.success(`Pedido de ${nomeCliente} atualizado com sucesso!`);
      } else {
        // MODO NORMAL: Criar novo pedido
        const { data: pedidoInserido, error: erroPedido } = await supabase
          .from('pedidos')
          .insert([dadosPedido])
          .select()
          .single();

        if (erroPedido) {
          throw new Error('Erro ao registrar o pedido.');
        }

        const itensPedido = Object.values(itensSelecionados).map(item => ({
          pedido_id: pedidoInserido.id,
          item_id: item.id,
          quantidade: item.quantidade,
        }));

        const { error: erroItens } = await supabase
          .from('pedidos_itens')
          .insert(itensPedido);

        if (erroItens) {
          throw new Error('Erro ao registrar itens do pedido.');
        }

        toast.success(`Pedido para ${nomeCliente} registado com sucesso!`);
      }

      // Limpar formulário e sair do modo edição
      limparFormulario();

    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao processar pedido.';
      toast.error(errorMessage);
    }
  };

  const limparFormulario = () => {
    limparTodosPedidos();
    setNomeCliente('');
    setContactoCliente('');
    setNotas('');
    setOpcaoSelecionada(null);
    setModoEdicao(false);
    setPedidoOriginalId(null);
    setPedidoOriginal(null);
    
    // Limpar parâmetros da URL
    window.history.replaceState({}, '', window.location.pathname);
  };

  //Cálculos de paginação (adicionar após o useEffect dos filtros)
  const totalPages = Math.ceil(itensFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itensParaExibir = itensFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroSelecionado, debouncedSearch]);

  return (
    <div className='flex flex-row w-full h-full'>
      <Toaster position="top-center" />
      {/* Coluna 1 - Lado Esquerdo */}
      <div className="flex flex-col justify-between gap-2 flex-1 pt-1 pb-4 px-6 min-w-150 h-full bg-[#eaf2e9] transition-all duration-500">
        {/* Barra de Pesquisa */}
        <div className='h-10 p-4 mt-4 flex justify-between gap-1 items-center bg-[#FFFDF6] w-full rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
          <GoSearch size={20}/>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
          />
        </div>

        {/* Filtros */}
        <div className='w-full h-45 flex justify-between items-center'>
          <div className="relative w-full h-full flex justify-between items-center">
            <Carousel className="w-full px-10" opts={{ align: "start", loop: false }}> {/* Adiciona padding horizontal para dar espaço às setas */}
              <CarouselContent className="-ml-2 md:-ml-4 w-full h-full flex justify-between items-center p-2">
                {filtros.map((filtro) => {
                  const Icone = filtro.icon;
                  const isActive = filtroSelecionado === filtro.id;

                  return (
                    <CarouselItem key={filtro.id} className="w-full h-full pl-2 md:pl-4 basis-1/6">
                      <div
                        onClick={() => setFiltroSelecionado(filtro.id)}
                        className={`cursor-pointer w-full h-full flex flex-col justify-between py-3 px-5 rounded-2xl shadow-[1px_1px_3px_rgba(3,34,33,0.1)] transition-transform duration-300 hover:-translate-y-1
                          ${isActive ? 'bg-[#032221]' : 'bg-[#FFFDF6] hover:bg-[rgba(220,230,231,0.5)]'}`}
                      >
                        <Icone size={45} className={isActive ? 'text-[#FFFDF6]' : 'text-[#032221]'} />
                        <div className='flex flex-col justify-between'>
                          <h1 className={`font-semibold text-lg truncate ${isActive ? 'text-[#FFFDF6]' : 'text-[#032221]'}`}>
                            {filtro.nome}
                          </h1>
                          <span className={`font-normal text-xs ${isActive ? 'text-[#FFFDF6]/80' : 'text-[#032221]/80'}`}>
                            {filtro.id === 'todos'
                              ? `${contagemPorTipo["Todos"] || 0} itens`
                              : `${contagemPorTipo[filtro.id] || 0} itens`}
                          </span>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              {/* Posicionamento absoluto das setas para não sobrepor aos filtros */}
              <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
              <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
            </Carousel>
          </div>
        </div>

        {/* Itens - Integração do Menu aqui */}
        <div className='w-full h-full flex flex-col'>
          <div className='flex-1 overflow-hidden'>
            <div className='grid grid-cols-4 gap-4 w-full h-full grid-rows-2'>
              {itensParaExibir.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex flex-col justify-between bg-[#FFFDF6] rounded-2xl p-5 shadow-[1px_1px_3px_rgba(3,34,33,0.1)] ${itensSelecionados[item.id] ? 'ring-1 ring-[#03624c] ring-inset' : ''}`}
                  onClick={() => !itensSelecionados[item.id] && adicionarItem(item)}
                >
                  {/* Conteúdo do item */}
                  <div className="relative w-full flex-1 rounded-2xl overflow-hidden mb-3">
                    {item.imagem_url ? (
                      <Image 
                        src={item.imagem_url}
                        alt={item.nome} 
                        fill
                        className="object-cover rounded-2xl" 
                        unoptimized={true}
                      />
                    ) : (
                      <Image 
                        src="/CaldoVerde.jpg"
                        alt={item.nome} 
                        fill
                        className="object-cover rounded-2xl" 
                      />
                    )}
                  </div>

                  <div className="flex justify-start mb-2">
                    <h1 className='text-[#032221] text-xl font-semibold'>{item.nome}</h1>
                  </div>

                  <div className="flex flex-row justify-between items-center mb-3">
                    <span className='text-[#3F7D58] text-base font-semibold'>€{item.preco.toFixed(2)}</span>
                    <span className='flex flex-row items-center justify-center text-black font-normal text-base gap-2 text-gray-500'>
                      {getIconByType(item.tipo)}
                      <span className="relative top-[1px]">{item.tipo}</span>
                    </span>
                  </div>

                  {itensSelecionados[item.id] ? (
                    <div className="flex items-center justify-between bg-[rgba(3,98,76,0.15)] rounded-lg p-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          diminuirQuantidade(item.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-[#032221] text-[#FFFDF6] rounded-full font-bold text-xl cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-semibold text-[#032221]">
                        {itensSelecionados[item.id]?.quantidade || 0}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          aumentarQuantidade(item.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-[#032221] text-[#FFFDF6] rounded-full font-bold text-xl cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        adicionarItem(item);
                      }}
                      variant="botaoadicionar"
                      className="w-full h-12 py-2 text-base cursor-pointer"
                    >
                      Adicionar ao pedido
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Paginação */}
          <div className="mt-4 flex justify-center h-10"> {/* Altura fixa para evitar desformatação */}
            {totalPages > 1 ? (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : (
              // Espaço invisível quando há apenas uma página para manter a formatação consistente
              <div className="h-10 w-full"></div>
            )}
          </div>
        </div>
      </div>
      
      {/* Coluna 2 - Lado Direito */}
      <div className='flex flex-col justify-between gap-3 w-[400px] pt-3 px-3 pb-4 h-full bg-[#FFFDF6]'>
        {/* Nome com Dialog */}
        <div className='w-full h-20 px-2 py-1 flex flex-1 flex-row justify-between'>
          <div className="flex flex-col w-full justify-start">
            <h1 className="min-w-65 text-[#032221] text-lg font-semibold px-2 border border-transparent">
              {nomeCliente || "Nome & Sobrenome"}
            </h1>
            <span className="min-w-65 text-gray-500 text-sm font-normal px-2 border border-transparent">
              {contactoCliente || "Contacto"}
            </span>
          </div>

          <div className='flex w-full justify-end items-center'>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <CiEdit
                  size={40}
                  className='bg-gray-200 p-2 text-[#032221] font-bold rounded-xl cursor-pointer hover:bg-gray-300 transition-colors'
                  onClick={handleOpenDialog}
                />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Editar Informações do Cliente</DialogTitle>
                  <DialogDescription>
                    Atualize o nome e contacto do cliente aqui. Clique em guardar quando terminar.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nome" className="text-right">
                      Nome
                    </Label>
                    <Input
                      id="nome"
                      value={tempNome}
                      onChange={(e) => setTempNome(e.target.value)}
                      placeholder="Nome & Sobrenome"
                      className="col-span-3 border-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contacto" className="text-right">
                      Contacto
                    </Label>
                    <Input
                      id="contacto"
                      value={tempContacto}
                      onChange={(e) => setTempContacto(e.target.value)}
                      placeholder="Número de telefone ou email"
                      className="col-span-3 border-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCancelChanges}>
                    Cancelar
                  </Button>
                  <Button type="submit" onClick={handleSaveChanges} className="bg-[#032221] hover:bg-[#052e2d]">
                    Guardar alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tipo de Pedido (No Local/Take-Away) */}
        <div className='bg-[rgba(3,98,76,0.05)] w-full h-14 flex flex-row justify-around items-stretch rounded-3xl border border-[rgba(209,213,219,0.3)]'>
          {['Comer Aqui', 'Take Away', 'Entrega'].map((opcao) => (
            <h1
              key={opcao}
              onClick={() => setOpcaoSelecionada(opcao)}
              className={`text-sm font-bold flex-1 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:-translate-y-1
                rounded-3xl
                ${
                  opcaoSelecionada === opcao
                    ? 'bg-[#032221] text-[#FFFDF6] h-14'
                    : 'bg-transparent text-[#032221] h-14 hover:bg-[rgba(220,230,231,0.5)]'
                }`}
            >
              {opcao}
            </h1>
          ))}
        </div>

        {/* Resumo do Pedido */}
        <div className='w-full h-full px-4 py-3 overflow-y-auto bg-[rgba(3,98,76,0.05)] rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.2)]'>
          <div className='flex flex-row justify-between mb-2 pb-1 border-b border-[rgba(3,98,76,0.1)] items-center'>
            <h2 className="font-semibold text-lg text-[#032221]">Resumo do Pedido</h2>
            <MdDeleteOutline 
              size={20} 
              className='text-xs text-gray-600 cursor-pointer hover:text-red-500 transition-colors'
              onClick={limparTodosPedidos}
            />
          </div>
          
          {Object.values(itensSelecionados).length === 0 ? (
            <p className="text-gray-500 text-center py-6">Nenhum item selecionado</p>
          ) : (
            <div className="space-y-0">
              {Object.values(itensSelecionados).map(item => (
                <div key={item.id} className="flex justify-between items-start pb-2 border-b border-[rgba(3,98,76,0.1)]">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-lg text-[#032221]">{item.nome}</h3>
                      <button 
                        onClick={() => removerItem(item.id)}
                        className="text-gray-600 hover:text-gray-600 p-1"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center bg-[rgba(3,98,76,0.1)] rounded-lg">
                        <button 
                          onClick={() => diminuirQuantidade(item.id)}
                          className="w-15 h-7 flex items-center justify-center text-[#032221] font-bold text-lg"
                        >
                          -
                        </button>
                        <span className="px-2 text-sm font-medium text-[#032221]">
                          {item.quantidade || 0}
                        </span>
                        <button 
                          onClick={() => aumentarQuantidade(item.id)}
                          className="w-15 h-7 flex items-center justify-center text-[#032221] font-bold text-lg"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-600">{item.quantidade}x €{item.preco.toFixed(2)}</span>
                        <span className="font-semibold text-[#3F7D58]">€{(item.preco * (item.quantidade || 1)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="w-full h-27 py-2 rounded-lg">
          <Textarea
            placeholder="Adicione notas sobre o pedido..."
            value={notas}
            onChange={handleNotasChange}
            className="min-h-[100px] border-[#032221]/40 focus-visible:ring-1 focus-visible:ring-[#032221]/50 focus-visible:ring-offset-0 shadow-[1px_1px_3px_rgba(3,34,33,0.2)]"
          />
        </div>

        {/* Total a Pagar */}
        <div className='bg-[rgba(3,98,76,0.05)] w-full h-30 py-3 px-6 rounded-lg flex flex-col justify-around shadow-[1px_1px_3px_rgba(3,34,33,0.2)]'>
          <div>
            <span className='flex flex-row w-full justify-between text-base text-gray-600'>Sub Total
              <span className='text-base'>€{subtotal.toFixed(2)}</span>
            </span>
          </div>
          <div>
            <span className='flex flex-row w-full justify-between text-base text-gray-600 pb-1'>IVA
              <span className='text-base'>€{iva.toFixed(2)}</span>
            </span> 
          </div>
          <div>
            <span className='flex flex-row justify-between pt-2 border-t border-dashed w-full font-semibold text-lg'>Total a Pagar
              <span className='font-semibold text-lg'>€{total.toFixed(2)}</span>
            </span>
          </div>
        </div>
        
        {/* Botão de Place Order */}
        <div className="w-full h-20 flex items-center justify-between gap-4">
          {modoEdicao ? (
            <>
              <Button
                onClick={limparFormulario}
                variant="botaocancelar"
                className="h-12 w-42 text-base"
              >
                Cancelar Pedido
              </Button>
              <Button
                onClick={efetuarPedido}
                variant="botaoadicionar"
                className="h-12 w-42 text-base"
              >
                Alterar Pedido
              </Button>
            </>
          ) : (
            <Button
              onClick={efetuarPedido}
              variant="botaoadicionar"
              className="h-12 text-base w-full"
            >
              Efetuar Pedido
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerificacaoDePermissoes(RegistarPedido, ['Administrador', 'Funcionario de Banca']);