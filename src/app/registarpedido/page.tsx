'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

//Import de Icons
import { GoSearch } from "react-icons/go";
import { CiEdit } from "react-icons/ci";
import { IoCheckmarkOutline } from "react-icons/io5";

function RegistarPedido() {
  const [itensMenu, setItensMenu] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [nomeCliente, setNomeCliente] = useState("Nome & Sobrenome");
  const [contactoCliente, setContactoCliente] = useState("Contacto");
  const [isEditing, setIsEditing] = useState(false);
  const [campoEditavel, setCampoEditavel] = useState<"nome" | "contacto" | null>(null);


  useEffect(() => {
    const fetchItens = async () => {
      const { data, error } = await supabase
        .from('itens')
        .select('*')
        .eq('isMenu', true);

      if (error) setErro('Erro ao carregar itens do menu.');
      else setItensMenu(data || []);
    };

    fetchItens();
  }, []);

  return (
    <div className='flex flex-row w-full h-full'>
      {/* Coluna 1 - Lado Esquerdo */}
      <div className="flex flex-col justify-between gap-4 flex-1 p-3 min-w-150 h-full bg-[#eaf2e9] transition-all duration-500">
        {/* Barra de Pesquisa */}
        <div className='h-10 p-4 mt-4 flex justify-between gap-1 items-center bg-[#f1f6f7] w-full rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
          <GoSearch size={20}/>
          <input
            type="text"
            placeholder="Pesquisar..."
            className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
          />
        </div>

        {/* Filtros */}
        <div className='bg-gray-500 w-full h-60 p-4'></div>

        {/* Itens */}
        <div className='bg-gray-500 w-full h-200 p-4'></div>

        {/* Últimos Pedidos */}
        <div className='bg-gray-500 w-full h-20 p-4'></div>
      </div>
      
      {/* Coluna 2 - Lado Direito */}
      <div className='flex flex-col justify-between gap-4 w-[400px] p-3 h-full bg-[#f1f6f7]'>
        {/* Nome */}
        <div className='w-full h-20 p-2 flex flex-1 flex-row justify-between'>
          <div className='flex flex-col w-full justify-start'>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  className='text-[#032221] text-lg font-semibold bg-transparent focus:outline-none hover:'
                />
                <input
                  type="text"
                  value={contactoCliente}
                  onChange={(e) => setContactoCliente(e.target.value)}
                  className='text-gray-500 text-sm font-normal bg-transparent focus:outline-none'
                />
              </>
            ) : (
              <>
                <h1 className='min-w-70 text-[#032221] text-lg font-semibold'>{nomeCliente}</h1>
                <span className='min-w-70 text-gray-500 text-sm font-normal'>{contactoCliente}</span>
              </>
            )}
          </div>
          <div className='flex w-full justify-end items-center'>
            {isEditing ? (
              <IoCheckmarkOutline
                size={40}
                className='bg-[#03624c] text-[#f1f6f7] p-2 font-bold rounded-xl cursor-pointer'
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
        <div className='bg-gray-500 w-full h-20 p-4'></div>

        {/* Resumo do Pedido */}
        <div className='bg-gray-500 w-full h-200 p-4'></div>

        {/* Notas */}
        <div className='bg-gray-500 w-full h-30 p-4'></div>

        {/* Total a Pagar */}
        <div className='bg-[#F6F0F0] w-full h-30 py-4 px-6 rounded-lg flex flex-col justify-around'>
          <div>
            <span className='flex flex-row w-full justify-between text-base text-gray-600'>Sub Total
              <span className='text-base'>63.00€</span>
            </span>
          </div>
          <div>
            <span className='flex flex-row w-full justify-between text-base text-gray-600 pb-1'>IVA
              <span className='text-base'>7.00€</span>
            </span> 
          </div>
          <div>
            <span className='flex flex-row justify-between pt-2 border-t border-dashed w-full font-semibold text-lg'>Total a Pagar
              <span className=' font-semibold text-lg'>70.00€</span>
            </span>
          </div>
        </div>
        
        {/* Botão de Place Order */}
        <div className='w-full h-20'>
          <button
            /*onClick={handleClick}*/
            className="w-full bg-[#03624c] text-[#f1f6f7] text-sm font-semibold py-4 rounded-lg hover:bg-[#078a6b] transition-all duration-500"
          >
            Efetuar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerificacaoDePermissoes(RegistarPedido, ['Administrador', 'Funcionario de Banca']); 