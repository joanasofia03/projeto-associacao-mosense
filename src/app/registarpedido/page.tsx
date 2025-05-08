'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { VerificacaoDePermissoes } from '../components/VerificacaoDePermissoes';

function RegistarPedido() {
  const [itensMenu, setItensMenu] = useState<any[]>([]);
  const [erro, setErro] = useState<string | null>(null);

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
      <div className="flex flex-col justify-between gap-4 flex-1 p-3 min-w-150 h-full bg-[#f6faf5] transition-all duration-500">
        {/* Barra de Pesquisa */}
        <div className='bg-gray-500 w-full h-20 p-4'></div>

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
        <div className='bg-gray-500 w-full h-20 p-4'></div>

        {/* Tipo de Pedido (No Local/Take-Away) */}
        <div className='bg-gray-500 w-full h-20 p-4'></div>

        {/* Resumo do Pedido */}
        <div className='bg-gray-500 w-full h-200 p-4'></div>

        {/* Total a Pagar */}
        <div className='bg-[#F6F0F0] w-full h-60 py-4 px-6 rounded-lg flex flex-col justify-around'>
          <div>
            <span className='flex flex-row w-full justify-between text-base text-gray-600'>Sub Total
              <span className='text-base'>63.00€</span>
            </span>
          </div>
          <div>
            <span className='flex flex-row w-full justify-between text-base text-gray-600'>IVA
              <span className='text-base'>7.00€</span>
            </span> 
          </div>
          <div>
            <span className='flex flex-row justify-between py-2 border-t border-dashed w-full font-semibold text-lg'>Total a Pagar
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