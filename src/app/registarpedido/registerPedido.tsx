'use client';

import React, { useEffect, useState, useRef } from 'react';
import { registarPedido, atualizarPedido } from './actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast, Toaster } from 'sonner';
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
import { GoSearch } from 'react-icons/go';
import { CiEdit } from 'react-icons/ci';
import { PiSquaresFour } from 'react-icons/pi';
import { LuSoup } from 'react-icons/lu';
import { IoFastFoodOutline } from 'react-icons/io5';
import { LuDessert } from 'react-icons/lu';
import { RiDrinks2Line } from 'react-icons/ri';
import { BiDrink } from 'react-icons/bi';
import { GoGift } from 'react-icons/go';
import { MdDeleteOutline } from 'react-icons/md';

type MenuItem = {
  id: number;
  nome: string;
  preco: number;
  tipo: string;
  imagem_url: string | null;
  IVA: number;
  quantidade?: number;
};

type Evento = {
  id: number;
  nome: string;
  em_execucao: boolean;
};

type User = {
  id: string;
  email?: string;
};

type PedidoParaEdicao = {
  pedido: {
    id: number;
    nome_cliente: string;
    contacto: string | null;
    notas: string | null;
    tipo_de_pedido: string;
  };
  itens: Array<{
    quantidade: number;
    itens: MenuItem;
  }>;
} | null;

interface Props {
  initialItens: MenuItem[];
  evento: Evento;
  user: User;
  pedidoParaEdicao: PedidoParaEdicao;
}

export default function RegistarPedido({ initialItens, evento, user, pedidoParaEdicao }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  // States
  const [itens] = useState<MenuItem[]>(initialItens);
  const [itensFiltrados, setItensFiltrados] = useState<MenuItem[]>(initialItens);
  const [itensSelecionados, setItensSelecionados] = useState<Record<number, MenuItem>>({});
  const [nomeCliente, setNomeCliente] = useState('');
  const [contactoCliente, setContactoCliente] = useState('');
  const [notas, setNotas] = useState('');
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string>('Comer Aqui');
  const [filtroSelecionado, setFiltroSelecionado] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempNome, setTempNome] = useState('');
  const [tempContacto, setTempContacto] = useState('');
  const [modoEdicao, setModoEdicao] = useState(false);
  const [pedidoOriginalId, setPedidoOriginalId] = useState<number | null>(null);

  const itemsPerPage = 8;

  const filtros = [
    { nome: 'Todos os itens', id: 'todos', icon: PiSquaresFour },
    { nome: 'Sopas', id: 'Sopas', icon: LuSoup },
    { nome: 'Comida', id: 'Comida', icon: IoFastFoodOutline },
    { nome: 'Sobremesas', id: 'Sobremesas', icon: LuDessert },
    { nome: 'Bebida', id: 'Bebida', icon: RiDrinks2Line },
    { nome: 'Álcool', id: 'Álcool', icon: BiDrink },
    { nome: 'Brindes', id: 'Brindes', icon: GoGift },
  ];

  // Load data for editing
  useEffect(() => {
    if (pedidoParaEdicao) {
      setModoEdicao(true);
      setPedidoOriginalId(pedidoParaEdicao.pedido.id);
      setNomeCliente(pedidoParaEdicao.pedido.nome_cliente);
      setContactoCliente(pedidoParaEdicao.pedido.contacto || '');
      setNotas(pedidoParaEdicao.pedido.notas || '');
      setOpcaoSelecionada(pedidoParaEdicao.pedido.tipo_de_pedido);

      const itensCarregados: Record<number, MenuItem> = {};
      pedidoParaEdicao.itens.forEach((item) => {
        itensCarregados[item.itens.id] = {
          ...item.itens,
          quantidade: item.quantidade,
        };
      });
      setItensSelecionados(itensCarregados);
      toast.success('Pedido carregado para edição!');
    }
  }, [pedidoParaEdicao]);

  // Filter items
  useEffect(() => {
    let filtered = itens;
    if (filtroSelecionado !== 'todos') {
      filtered = filtered.filter((item) => item.tipo === filtroSelecionado);
    }
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.nome.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setItensFiltrados(filtered);
    setCurrentPage(1);
  }, [filtroSelecionado, searchQuery, itens]);

  // Calculate type counts
  const contagemPorTipo = itens.reduce(
    (acc, item) => {
      acc[item.tipo] = (acc[item.tipo] || 0) + 1;
      return acc;
    },
    { Todos: itens.length } as Record<string, number>
  );

  // Item manipulation functions
  const adicionarItem = (item: MenuItem) => {
    setItensSelecionados((prev) => ({
      ...prev,
      [item.id]: { ...item, quantidade: 1 },
    }));
  };

  const aumentarQuantidade = (itemId: number) => {
    setItensSelecionados((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: { ...prev[itemId], quantidade: (prev[itemId].quantidade || 0) + 1 },
      };
    });
  };

  const diminuirQuantidade = (itemId: number) => {
    setItensSelecionados((prev) => {
      if (!prev[itemId] || prev[itemId].quantidade! <= 1) {
        const newItems = { ...prev };
        delete newItems[itemId];
        return newItems;
      }
      return {
        ...prev,
        [itemId]: { ...prev[itemId], quantidade: prev[itemId].quantidade! - 1 },
      };
    });
  };

  const removerItem = (itemId: number) => {
    setItensSelecionados((prev) => {
      const newItems = { ...prev };
      delete newItems[itemId];
      return newItems;
    });
  };

  const limparTodosPedidos = () => {
    setItensSelecionados({});
  };

  // Dialog functions
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
    setDialogOpen(false);
  };

  // Icon mapping
  const getIconByType = (tipo: string) => {
    const icons: Record<string, React.ReactElement> = {
      Sopas: <LuSoup className="text-[#032221]" size={15} />,
      Brindes: <GoGift className="text-[#032221]" size={15} />,
      Bebida: <RiDrinks2Line className="text-[#032221]" size={15} />,
      Comida: <IoFastFoodOutline className="text-[#032221]" size={15} />,
      Sobremesas: <LuDessert className="text-[#032221]" size={15} />,
      Álcool: <BiDrink className="text-[#032221]" size={15} />,
    };
    return icons[tipo] || <LuSoup className="text-[#032221]" size={15} />;
  };

  // Calculate totals
  const calcularTotais = () => {
    let subtotalSemIVA = 0;
    let totalIVA = 0;

    Object.values(itensSelecionados).forEach((item) => {
      const quantidade = item.quantidade || 0;
      const precoUnitario = item.preco;
      const taxaIVA = item.IVA || 0;

      //Calcular o valor sem IVA - Subtotal
      const valorSemIVA = (precoUnitario - precoUnitario * taxaIVA * 0.01) * quantidade;

      //Calcular o valor do IVA
      const valorIVA = precoUnitario * taxaIVA * 0.01 * quantidade;

      subtotalSemIVA += valorSemIVA;
      totalIVA += valorIVA;
    });

    const total = subtotalSemIVA + totalIVA;

    return { subtotal: subtotalSemIVA, iva: totalIVA, total };
  };

  const { subtotal, iva, total } = calcularTotais();

  // Pagination
  const totalPages = Math.ceil(itensFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const itensParaExibir = itensFiltrados.slice(startIndex, endIndex);

  // Clear form
  const limparFormulario = () => {
    limparTodosPedidos();
    setNomeCliente('');
    setContactoCliente('');
    setNotas('');
    setOpcaoSelecionada('Comer Aqui');
    setModoEdicao(false);
    setPedidoOriginalId(null);
    router.push('/registarpedido');
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!nomeCliente.trim()) {
      toast.error('Por favor, preencha o campo nome.');
      return;
    }

    if (Object.keys(itensSelecionados).length === 0) {
      toast.error('Nenhum item selecionado.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('nome_cliente', nomeCliente);
      formData.append('contacto', contactoCliente);
      formData.append('tipo_de_pedido', opcaoSelecionada);
      formData.append('notas', notas);
      formData.append('registado_por', user.id);
      formData.append('id_evento', evento.id.toString());
      formData.append(
        'itens',
        JSON.stringify(
          Object.values(itensSelecionados).map((item) => ({
            id: item.id,
            quantidade: item.quantidade || 1,
          }))
        )
      );

      const result = modoEdicao && pedidoOriginalId
        ? await atualizarPedido(pedidoOriginalId.toString(), formData)
        : await registarPedido(formData);

      if (result.success) {
        toast.success(result.message);
        limparFormulario();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Erro ao submeter pedido:', error);
      toast.error('Erro inesperado ao processar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-row w-full h-full">
      <Toaster position="top-center" />
      {/* Left Column */}
      <div className="flex flex-col justify-between gap-2 flex-1 pt-1 pb-4 px-6 min-w-150 h-full bg-[#eaf2e9] transition-all duration-500">
        {/* Search Bar */}
        <div className="h-10 p-4 mt-4 flex justify-between gap-1 items-center bg-[#FFFDF6] w-full rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
          <GoSearch size={20} />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
            aria-label="Pesquisar itens do menu"
          />
        </div>

        {/* Filters */}
        <div className="w-full h-45 flex justify-between items-center">
          <Carousel className="w-full px-10" opts={{ align: 'start', loop: false }}>
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
                      role="button"
                      aria-label={`Filtrar por ${filtro.nome}`}
                    >
                      <Icone size={45} className={isActive ? 'text-[#FFFDF6]' : 'text-[#032221]'} />
                      <div className="flex flex-col justify-between">
                        <h1 className={`font-semibold text-lg truncate ${isActive ? 'text-[#FFFDF6]' : 'text-[#032221]'}`}>
                          {filtro.nome}
                        </h1>
                        <span className={`font-normal text-xs ${isActive ? 'text-[#FFFDF6]/80' : 'text-[#032221]/80'}`}>
                          {contagemPorTipo[filtro.id] || 0} itens
                        </span>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
          </Carousel>
        </div>

        {/* Items */}
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-4 gap-4 w-full h-full grid-rows-2">
              {itensParaExibir.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between bg-[#FFFDF6] rounded-2xl p-5 shadow-[1px_1px_3px_rgba(3,34,33,0.1)] ${itensSelecionados[item.id] ? 'ring-1 ring-[#03624c] ring-inset' : ''}`}
                  onClick={() => !itensSelecionados[item.id] && adicionarItem(item)}
                  role="button"
                  aria-label={`Adicionar ${item.nome} ao pedido`}
                >
                  <div className="relative w-full flex-1 rounded-2xl overflow-hidden mb-3">
                    <Image
                      src={item.imagem_url || '/CaldoVerde.jpg'}
                      alt={item.nome}
                      fill
                      className="object-cover rounded-2xl"
                      unoptimized
                    />
                  </div>
                  <div className="flex justify-start mb-2">
                    <h1 className="text-[#032221] text-xl font-semibold">{item.nome}</h1>
                  </div>
                  <div className="flex flex-row justify-between items-center mb-3">
                    <span className="text-[#3F7D58] text-base font-semibold">€{item.preco.toFixed(2)}</span>
                    <span className="flex flex-row items-center justify-center text-black font-normal text-base gap-2 text-gray-500">
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
                        aria-label={`Diminuir quantidade de ${item.nome}`}
                      >
                        -
                      </button>
                      <span className="font-semibold text-[#032221]">{itensSelecionados[item.id].quantidade || 0}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          aumentarQuantidade(item.id);
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-[#032221] text-[#FFFDF6] rounded-full font-bold text-xl cursor-pointer"
                        aria-label={`Aumentar quantidade de ${item.nome}`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
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
          {/* Pagination */}
          <div className="mt-4 flex justify-center h-10">
            {totalPages > 1 ? (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      aria-disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                        aria-current={currentPage === page ? 'page' : undefined}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      aria-disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : (
              <div className="h-10 w-full" />
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col justify-between gap-3 w-[400px] pt-3 px-3 pb-4 h-full bg-[#FFFDF6]">
        {/* Client Info */}
        <div className="w-full h-20 px-2 py-1 flex flex-1 flex-row justify-between">
          <div className="flex flex-col w-full justify-start">
            <h1 className="min-w-65 text-[#032221] text-lg font-semibold px-2 border border-transparent">
              {nomeCliente || 'Nome & Sobrenome'}
            </h1>
            <span className="min-w-65 text-gray-500 text-sm font-normal px-2 border border-transparent">
              {contactoCliente || 'Contacto'}
            </span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                onClick={handleOpenDialog}
                className="bg-gray-200 p-2 text-[#032221] font-bold rounded-xl cursor-pointer hover:bg-gray-300 transition-colors"
                aria-label="Editar informações do cliente"
              >
                <CiEdit size={40} />
              </button>
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
                    required
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
                <Button
                  type="button"
                  onClick={handleSaveChanges}
                  className="bg-[#032221] hover:bg-[#052e2d]"
                >
                  Guardar alterações
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Order Type */}
        <div className="bg-[rgba(3,98,76,0.05)] w-full h-14 flex flex-row justify-around items-stretch rounded-3xl border border-[rgba(209,213,219,0.3)]">
          {['Comer Aqui', 'Take Away', 'Entrega'].map((opcao) => (
            <button
              type="button"
              key={opcao}
              onClick={() => setOpcaoSelecionada(opcao)}
              className={`text-sm font-bold flex-1 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:-translate-y-1 rounded-3xl
                ${opcaoSelecionada === opcao ? 'bg-[#032221] text-[#FFFDF6] h-14' : 'bg-transparent text-[#032221] h-14 hover:bg-[rgba(220,230,231,0.5)]'}`}
              aria-label={`Selecionar ${opcao}`}
            >
              {opcao}
            </button>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full h-full px-4 py-3 overflow-y-auto bg-[rgba(3,98,76,0.05)] rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.2)]">
          <div className="flex flex-row justify-between mb-2 pb-1 border-b border-[rgba(3,98,76,0.1)] items-center">
            <h2 className="font-semibold text-lg text-[#032221]">Resumo do Pedido</h2>
            <button
              type="button"
              onClick={limparTodosPedidos}
              className="text-xs text-gray-600 cursor-pointer hover:text-red-500 transition-colors"
              aria-label="Limpar todos os itens do pedido"
            >
              <MdDeleteOutline size={20} />
            </button>
          </div>
          {Object.values(itensSelecionados).length === 0 ? (
            <p className="text-gray-500 text-center py-6">Nenhum item selecionado</p>
          ) : (
            <div className="space-y-0">
              {Object.values(itensSelecionados).map((item) => (
                <div key={item.id} className="flex justify-between items-start pb-2 border-b border-[rgba(3,98,76,0.1)]">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-lg text-[#032221]">{item.nome}</h3>
                      <button
                        type="button"
                        onClick={() => removerItem(item.id)}
                        className="text-gray-600 hover:text-gray-600 p-1"
                        aria-label={`Remover ${item.nome} do pedido`}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center bg-[rgba(3,98,76,0.1)] rounded-lg">
                        <button
                          type="button"
                          onClick={() => diminuirQuantidade(item.id)}
                          className="w-15 h-7 flex items-center justify-center text-[#032221] font-bold text-lg"
                          aria-label={`Diminuir quantidade de ${item.nome}`}
                        >
                          -
                        </button>
                        <span className="px-2 text-sm font-medium text-[#032221]">
                          {item.quantidade || 0}
                        </span>
                        <button
                          type="button"
                          onClick={() => aumentarQuantidade(item.id)}
                          className="w-15 h-7 flex items-center justify-center text-[#032221] font-bold text-lg"
                          aria-label={`Aumentar quantidade de ${item.nome}`}
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-600">
                          {item.quantidade}x €{item.preco.toFixed(2)}
                        </span>
                        <span className="font-semibold text-[#3F7D58]">
                          €{(item.preco * (item.quantidade || 1)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="w-full h-27 py-2 rounded-lg">
          <Textarea
            placeholder="Adicione notas sobre o pedido..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="min-h-[100px] border-[#032221]/40 focus-visible:ring-1 focus-visible:ring-[#032221]/50 focus-visible:ring-offset-0 shadow-[1px_1px_3px_rgba(3,34,33,0.2)]"
            aria-label="Notas do pedido"
          />
        </div>

        {/* Totals */}
        <div className="bg-[rgba(3,98,76,0.05)] w-full h-30 py-3 px-6 rounded-lg flex flex-col justify-around shadow-[1px_1px_3px_rgba(3,34,33,0.2)]">
          <div>
            <span className="flex flex-row w-full justify-between text-base text-gray-600">
              Sub Total <span className="text-base">€{subtotal.toFixed(2)}</span>
            </span>
          </div>
          <div>
            <span className="flex flex-row w-full justify-between text-base text-gray-600 pb-1">
              IVA <span className="text-base">€{iva.toFixed(2)}</span>
            </span>
          </div>
          <div>
            <span className="flex flex-row justify-between pt-2 border-t border-dashed w-full font-semibold text-lg">
              Total a Pagar <span className="font-semibold text-lg">€{total.toFixed(2)}</span>
            </span>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="w-full h-20 flex items-center justify-between gap-4">
          {modoEdicao ? (
            <>
              <Button
                type="button"
                onClick={limparFormulario}
                variant="botaocancelar"
                className="h-12 w-42 text-base"
                disabled={isSubmitting}
              >
                Cancelar Pedido
              </Button>
              <Button
                type="submit"
                variant="botaoadicionar"
                className="h-12 w-42 text-base"
                disabled={isSubmitting}
              >
                Alterar Pedido
              </Button>
            </>
          ) : (
            <Button
              type="submit"
              variant="botaoadicionar"
              className="h-12 text-base w-full"
              disabled={isSubmitting}
            >
              Efetuar Pedido
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}