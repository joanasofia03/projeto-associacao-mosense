'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';
import Image from 'next/image';
import Toast from '../components/toast';

//Import de Icons
import { GoSearch } from "react-icons/go";
import { CiEdit } from "react-icons/ci";
import { IoCheckmarkOutline } from "react-icons/io5";
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
  const [isEditing, setIsEditing] = useState(false);
  const [campoEditavel, setCampoEditavel] = useState<"nome" | "contacto" | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [filtroSelecionado, setFiltroSelecionado] = useState<string | null>("todos");
  const [contagemPorTipo, setContagemPorTipo] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eventoEmExecucao, setEventoEmExecucao] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [notas, setNotas] = useState<string>('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const filtros = [ //Organização dos filtros
    { nome: 'Todos os itens', id: 'todos', icon: PiSquaresFour },
    { nome: 'Sopas', id: 'Sopas', icon: LuSoup },
    { nome: 'Comida', id: 'Comida', icon: IoFastFoodOutline },
    { nome: 'Sobremesas', id: 'Sobremesas', icon: LuDessert },
    { nome: 'Bebida', id: 'Bebida', icon: RiDrinks2Line },
    { nome: 'Álcool', id: 'Álcool', icon: BiDrink },
    { nome: 'Brindes', id: 'Brindes', icon: GoGift },
  ];

  const handleNotasChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotas(event.target.value);
  };

  const handleNomeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNomeCliente(event.target.value);
  };

  const handleContactoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContactoCliente(event.target.value);
  };

  useEffect(() => {
    const fetchItens = async () => {
      const { data, error } = await supabase
        .from('itens')
        .select('*')

      if (error) {
        setErro('Erro ao carregar itens do menu.');
        setToastMessage('Erro ao carregar itens do menu.');
        setToastType('error');
        setToastVisible(true);
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

  // Filtrar itens baseado no filtro selecionado e pesquisa
  useEffect(() => {
    let itensFiltrados = itensMenu;

    // Filtrar por tipo (categoria)
    if (filtroSelecionado && filtroSelecionado !== 'todos') {
      itensFiltrados = itensFiltrados.filter(item => 
        item.tipo === filtroSelecionado
      );
    }

    // Filtrar por pesquisa
    if (searchQuery) {
      itensFiltrados = itensFiltrados.filter(item =>
        item.nome.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setItensFiltrados(itensFiltrados);
  }, [filtroSelecionado, searchQuery, itensMenu]);

 useEffect(() => {
    const fetchEventoEmExecucao = async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('em_execucao', true)
        .single();

      if (error) {
        setErro("Erro ao procurar evento");
        setToastMessage('Erro ao procurar evento.');
        setToastType('error');
        setToastVisible(true);
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
        setToastMessage('Utilizador não autenticado.');
        setToastType('error');
        setToastVisible(true);
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
      setErro('O nome do cliente é obrigatório.');
      setToastMessage('O nome do cliente é obrigatório.');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    if (Object.keys(itensSelecionados).length === 0) {
      setErro('Nenhum item selecionado.');
      setToastMessage('Nenhum item selecionado.');
      setToastType('error');
      setToastVisible(true);
      return;
    }
    
    const novoPedido = {
      nome_cliente: nomeCliente,
      contacto: contactoCliente || null,
      nota: notas || null,
      tipo_de_pedido: opcaoSelecionada || 'Comer Aqui',
      registado_por: userId,
      estado_validade: 'Confirmado',
      id_evento: eventoEmExecucao.id,
    };

    const { data: pedidoInserido, error: erroPedido } = await supabase
      .from('pedidos')
      .insert([novoPedido])
      .select()
      .single();

    if (erroPedido) {
      console.error(erroPedido.message);
      setErro('Erro ao registrar o pedido.');
      setToastMessage('Erro ao registar pedido!');
      setToastType('error');
      setToastVisible(true);
      return;
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
      console.error(erroItens.message);
      setErro('Erro ao registrar itens do pedido.');
      setToastMessage('Erro ao registar itens do pedido!');
      setToastType('error');
      setToastVisible(true);
      return;
    }

    setToastMessage('Pedido registado com sucesso!');
    setToastType('success');
    setToastVisible(true);

    limparTodosPedidos();
    setNomeCliente('');
    setContactoCliente('');
    setNotas('');
    setOpcaoSelecionada(null);

  }

  return (
    <div className='flex flex-row w-full h-full'>
      {/* Coluna 1 - Lado Esquerdo */}
      <div className="flex flex-col justify-between gap-4 flex-1 pt-1 pb-4 px-6 min-w-150 h-full bg-[#eaf2e9] transition-all duration-500">
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
        <div className='w-full h-50 grid grid-cols-7 gap-5'>
          {filtros.map((filtro) => {
            const Icone = filtro.icon;
            const isActive = filtroSelecionado === filtro.id;

            return (
              <div
                key={filtro.id}
                onClick={() => setFiltroSelecionado(filtro.id)}
                className={`cursor-pointer w-full flex flex-col justify-between py-4 px-5 rounded-3xl shadow-[1px_1px_3px_rgba(3,34,33,0.1)] transition-transform duration-300 hover:-translate-y-1
                  ${isActive ? 'bg-[#032221]' : 'bg-[#FFFDF6] hover:bg-[rgba(220,230,231,0.5)]'}`}
              >
                <Icone size={45} className={isActive ? 'text-[#FFFDF6]' : 'text-[#032221]'} />
                <div className='flex flex-col justify-between'>
                  <h1 className={`font-semibold text-lg truncate ${isActive ? 'text-[#FFFDF6]' : 'text-[#032221]'}`}>
                    {filtro.nome}
                  </h1>
                  <span className={`font-normal text-xs ${isActive ? 'text-[#FFFDF6]' : 'text-[#032221]'}`}>
                      {filtro.id === 'todos'
                        ? `${contagemPorTipo["Todos"] || 0} itens`
                        : `${contagemPorTipo[filtro.id] || 0} itens`}
                    </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Itens - Integração do Menu aqui */}
        <div className='w-full h-200 overflow-y-auto'>
          <div className='grid grid-cols-4 gap-4 w-full'>
            {itensFiltrados.map((item) => (
                              <div 
                key={item.id} 
                className={`flex flex-col justify-start bg-[#FFFDF6] rounded-2xl p-5 shadow-[1px_1px_3px_rgba(3,34,33,0.1)] cursor-pointer ${itensSelecionados[item.id] ? 'ring-1 ring-[#03624c] ring-inset' : ''}`}
                onClick={() => !itensSelecionados[item.id] && adicionarItem(item)}
              >
                {/* Imagem do item */}
                <div className="relative w-full h-40 rounded-2xl overflow-hidden">
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

                {/* Título (nome do item) */}
                <div className="flex justify-start py-1">
                  <h1 className='text-[#032221] text-xl font-semibold'>{item.nome}</h1>
                </div>

                {/* Preço e Categoria */}
                <div className="flex flex-row justify-between items-center">
                  <span className='text-[#3F7D58] text-base font-semibold'>€{item.preco.toFixed(2)}</span>
                  <span className='flex flex-row items-center justify-center text-black font-normal text-base gap-2 text-gray-500'>
                    {getIconByType(item.tipo)}
                    <span className="relative top-[1px]">{item.tipo}</span>
                  </span>
                </div>

                {/* Botão de Adicionar ou Controles de Quantidade */}
                {itensSelecionados[item.id] ? (
                  <div className="mt-2 flex items-center justify-between bg-[rgba(3,98,76,0.15)] rounded-lg p-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        diminuirQuantidade(item.id);
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-[#032221] text-[#FFFDF6] rounded-full font-bold text-xl"
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
                      className="w-8 h-8 flex items-center justify-center bg-[#032221] text-[#FFFDF6] rounded-full font-bold text-xl transition-transform duration-300 hover:scale-103 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      adicionarItem(item);
                    }}
                    className="mt-2 w-full py-2 bg-[#032221] text-[#FFFDF6] rounded-lg font-medium hover:bg-[#052e2d] transition-transform duration-300 hover:scale-105 cursor-pointer"
                  >
                    Adicionar ao pedido
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Coluna 2 - Lado Direito */}
      <div className='flex flex-col justify-between gap-4 w-[400px] pt-3 px-3 pb-4 h-full bg-[#FFFDF6]'>
        {/* Nome */}
        <div className='w-full h-20 p-2 flex flex-1 flex-row justify-between'>
          <div className="flex flex-col w-full justify-start">
            {isEditing ? (
              <>
                <input
                  type="text"
                  placeholder="Nome & Sobrenome"
                  value={nomeCliente}
                  onChange={handleNomeChange}
                  className="text-[#032221] min-w-65 text-lg font-semibold px-2 border border-transparent bg-[rgba(3,98,76,0.05)] rounded-t-lg focus:outline-none focus:ring-2 focus:ring-[#044a39]"
                />
                <input
                  type="text"
                  placeholder="Contacto"
                  value={contactoCliente}
                  onChange={handleContactoChange}
                  className="text-[#032221] min-w-65 text-sm font-normal px-2 border border-transparent bg-[rgba(3,98,76,0.05)] rounded-b-lg focus:outline-none focus:ring-2 focus:ring-[#044a39]"
                />
              </>
            ) : (
              <>
                <h1 className="min-w-65 text-[#032221] text-lg font-semibold px-2 border border-transparent">
                  {nomeCliente || "Nome & Sobrenome"}
                </h1>
                <span className="min-w-65 text-gray-500 text-sm font-normal px-2 border border-transparent">
                  {contactoCliente || "Contacto"}
                </span>
              </>
            )}
          </div>

          <div className='flex w-full justify-end items-center'>
            {isEditing ? (
              <IoCheckmarkOutline
                size={40}
                className='bg-[#03624c] text-[#FFFDF6] p-2 font-bold rounded-xl cursor-pointer'
                onClick={() => setIsEditing(false)}
              />
            ) : (
              <CiEdit
                size={40}
                className='bg-gray-200 p-2 text-[#032221] font-bold rounded-xl cursor-pointer'
                onClick={() => setIsEditing(true)}
              />
            )}
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
        <div className='w-full h-200 px-4 py-3 overflow-y-auto bg-[rgba(3,98,76,0.05)] rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.2)]'>
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
      <div className="w-full h-25 py-2 rounded-lg">
        <textarea
          className="w-full h-full p-3 border border-[rgba(3,98,76,0.4)] rounded-md text-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(3,98,76,0.5)] shadow-[1px_1px_3px_rgba(3,34,33,0.2)]"
          placeholder="Adicione notas sobre o pedido..."
          value={notas}
          onChange={handleNotasChange}
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
        <div className='w-full h-20'>
          <button
            onClick={efetuarPedido}
            className="w-full bg-[#032221] text-[#FFFDF6] text-sm font-semibold py-4 rounded-lg hover:bg-[#052e2d] transition-transform duration-300 hover:scale-103 cursor-pointer" 
          >
            Efetuar Pedido
          </button>

           <Toast
            message={toastMessage}
            visible={toastVisible}
            type={toastType}
            onClose={() => setToastVisible(false)}
            />
        </div>
      </div>
    </div>
  );
}

export default VerificacaoDePermissoes(RegistarPedido, ['Administrador', 'Funcionario de Banca']);