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
import { GoGift } from "react-icons/go";

type MenuItem = {
  id: number;
  nome: string;
  preco: number;
  tipo: string;
  imagem_url: string | null;
};

type GroupedMenu = {
  [tipo: string]: MenuItem[];
};

export default function Menu() {
  const [groupedMenuItems, setGroupedMenuItems] = useState<GroupedMenu>({});
  const [searchQuery, setSearchQuery] = useState<string>(''); 

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('itens')
      .select('id, nome, preco, tipo, imagem_url')
      .eq('isMenu', true);

    if (error) {
      console.error('Erro ao carregar itens do menu', error);
      return;
    }

    const filteredData = data.filter((item: MenuItem) =>
      item.nome.toLowerCase().includes(searchQuery.toLowerCase())  //Filtro baseado no nome do item
    );

    const grouped: GroupedMenu = {};
    filteredData.forEach((item: MenuItem) => {
      if (!grouped[item.tipo]) grouped[item.tipo] = [];
      grouped[item.tipo].push(item);
    });

    setGroupedMenuItems(grouped);
  };

  useEffect(() => {
    fetchMenuItems();
  }, [searchQuery]); //Chama a função sempre que o valor da searchQuery mudar

  //Função para colocar o icon correto baseado no tipo do item
  const getIconByType = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'sopa':
      case 'sopas':
        return <LuSoup className="text-[#032221]" size={15} />;
      case 'brindes':
      case 'Brindes':
        return <GoGift className="text-[#032221]" size={15} />;
      case 'bebida':
      case 'bebidas':
        return <RiDrinks2Line className="text-[#032221]" size={15} />;
      case 'comida':
      case 'pratos':
      case 'prato principal':
        return <IoFastFoodOutline className="text-[#032221]" size={15} />;
      case 'sobremesa':
      case 'sobremesas':
        return <LuDessert className="text-[#032221]" size={15} />;
      case 'álcool':
      case 'alcool':
      case 'bebidas alcoólicas':
        return <BiDrink className="text-[#032221]" size={15} />;
      default:
        return <LuSoup className="text-[#032221]" size={15} />;
    }
  };

  return (
    <main className='flex flex-col justify-start items-center w-full h-full px-10 py-5 gap-5 overflow-y-scroll bg-[#eaf2e9]'>
      {/* Barra de Pesquisa */}
      <div className='flex justify-between gap-1 px-4 items-center bg-[#f1f6f7] w-full min-h-10 rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
        <GoSearch size={20}/>
        <input
          type="text"
          placeholder="Pesquisar..."
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}  //Atualiza o estado conforme o utilizador digita
          className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
        />
      </div>

      {/* Itens */}
      <div className='grid grid-cols-4 gap-4 w-full h-full max-h-10'>
        {Object.entries(groupedMenuItems).map(([tipo, items]) =>
          items.map((item) => (
            <div key={item.id} className="flex flex-col justify-start bg-[#f1f6f7] rounded-2xl p-5 shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
              {/* Imagem (mantida estática) */}
              <div className="relative w-full h-42 rounded-2xl overflow-hidden">
                {item.imagem_url ? (
                  <Image 
                    src={item.imagem_url}
                    alt={item.nome} 
                    fill
                    className="object-cover rounded-2xl" 
                    unoptimized={true} // Importante para URLs externas
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
                <span className='text-[#17876d] text-base font-semibold'>€{item.preco.toFixed(2)}</span>
                <span className='flex flex-row items-center justify-center text-black font-normal text-base gap-2 text-gray-500'>
                  {getIconByType(item.tipo)}
                  <span className="relative top-[1px]">{item.tipo}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
