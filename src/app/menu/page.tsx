'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Image from 'next/image';

//Import de Icons
import { GoSearch } from "react-icons/go";
import { LuSoup } from "react-icons/lu";
import { RiDrinks2Line } from "react-icons/ri";
import { IoFastFoodOutline } from "react-icons/io5";
import { LuDessert } from "react-icons/lu";
import { BiDrink } from "react-icons/bi";

type MenuItem = {
  id: number;
  nome: string;
  preco: number;
  tipo: string;
};

type GroupedMenu = {
  [tipo: string]: MenuItem[];
};

export default function Menu() {
  const [groupedMenuItems, setGroupedMenuItems] = useState<GroupedMenu>({});
  const [sortOrderMap, setSortOrderMap] = useState<Record<string, 'asc' | 'desc'>>({});

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('itens')
      .select('id, nome, preco, tipo')
      .eq('isMenu', true);

    if (error) {
      console.error('Erro ao carregar itens do menu', error);
      return;
    }

    const grouped: GroupedMenu = {};
    data.forEach((item: MenuItem) => {
      if (!grouped[item.tipo]) grouped[item.tipo] = [];
      grouped[item.tipo].push(item);
    });

    const sortedGrouped: GroupedMenu = {};
    for (const tipo in grouped) {
      const sortOrder = sortOrderMap[tipo] || 'asc';
      sortedGrouped[tipo] = grouped[tipo].sort((a, b) =>
        sortOrder === 'asc' ? a.preco - b.preco : b.preco - a.preco
      );
    }

    setGroupedMenuItems(sortedGrouped);
  };

  useEffect(() => {
    fetchMenuItems();
  }, [sortOrderMap]);

  const toggleSortOrder = (tipo: string) => {
    setSortOrderMap((prev) => ({
      ...prev,
      [tipo]: prev[tipo] === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    /*<main className="w-full px-6 py-10 overflow-y-scroll bg-[#f6faf5]">
      <h1 className="text-3xl font-semibold mb-8" style={{ color: '#2f2f2f' }}>
        Menu
      </h1>

      {Object.entries(groupedMenuItems).map(([tipo, items]) => (
        <section key={tipo} className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold" style={{ color: '#343a40' }}>
              {tipo}
            </h2>
            <button
              onClick={() => toggleSortOrder(tipo)}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
            >
              Ordenar por Preço ({sortOrderMap[tipo] === 'desc' ? 'Menor a Maior' : 'Maior a Menor'})
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="p-6 rounded shadow-md bg-white">
                <h3 className="text-xl font-medium mb-1">{item.nome}</h3>
                <p className="text-sm mb-2 text-gray-500">{item.tipo}</p>
                <p className="font-semibold text-gray-800">€{item.preco.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>*/

    <main className='flex flex-col justify-start items-center w-full h-full px-10 py-5 gap-5 overflow-y-scroll bg-[#eaf2e9]'>
      {/* Barra de Pesquisa */}
      <div className='flex justify-between gap-1 px-4 items-center bg-[#f1f6f7] w-full min-h-10 rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
        <GoSearch size={20}/>
        <input
          type="textopesquisa"
          placeholder="Pesquisar..."
          className="w-full p-2 focus:outline-none text-lg text-gray-500"
        />
      </div>

      {/* Itens */}
      <div className='grid grid-cols-4 gap-4 w-full h-full'>
        {Object.entries(groupedMenuItems).map(([tipo, items]) =>
          items.map((item) => (
            <div key={item.id} className="flex flex-col justify-start bg-[#f1f6f7] rounded-2xl p-5 shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
              {/* Imagem (mantida estática) */}
              <div className="relative w-full h-42 rounded-2xl overflow-hidden">
                <Image 
                  src="/CaldoVerde.jpg" 
                  alt={item.nome} 
                  fill
                  className="object-cover rounded-2xl" 
                />
              </div>

              {/* Título (nome do item) */}
              <div className="flex justify-start py-1">
                <h1 className='text-[#032221] text-xl font-semibold'>{item.nome}</h1>
              </div>

              {/* Preço e Categoria */}
              <div className="flex flex-row justify-between items-center">
                <span className='text-[#17876d] text-base font-semibold'>€{item.preco.toFixed(2)}</span>
                <span className='flex flex-row items-center text-black font-normal text-base gap-1 text-gray-500'>
                  <LuSoup className="text-[#032221]" size={15}/>
                  {item.tipo}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

    </main>
  );
}
