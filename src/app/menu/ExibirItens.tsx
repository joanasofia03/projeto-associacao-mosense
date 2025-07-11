'use client';

import SearchBar from "../components/SearchBar";
import {useState } from 'react';
import Image from 'next/image';

//Import de Icons
import { LuSoup } from "react-icons/lu";
import { RiDrinks2Line } from "react-icons/ri";
import { IoFastFoodOutline } from "react-icons/io5";
import { LuDessert } from "react-icons/lu";
import { BiDrink } from "react-icons/bi";
import { GoGift } from "react-icons/go";
import { RxQuestionMark } from "react-icons/rx";

type Item = {
  id: number;
  nome: string;
  preco: number;
  tipo: string;
  imagem_url: string;
};

type Props = {
  itens: Item[];
};

export default function ExibirItens({ itens }: Props) {
  const [search, setSearch] = useState(""); //Pesquisa da SearchBar
  const PlaceHolder = "Pesquisar..." //Placeholder da SearchBar

  const itensFiltrados = itens.filter((item) => //Filtrar os itens consoante o "search" que é introduzido na SearchBar;
    item.nome.toLowerCase().includes(search.toLowerCase()) 
  );

  const estilizarIcon = "text-[#032221]"
  const IconPorTipo = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case 'sopas':
        return <LuSoup className={estilizarIcon} size={15} />;
      case 'brindes':
        return <GoGift className={estilizarIcon} size={15} />;
      case 'bebida':
        return <RiDrinks2Line className={estilizarIcon} size={15} />;
      case 'comida':
        return <IoFastFoodOutline className={estilizarIcon} size={15} />;
      case 'sobremesas':
        return <LuDessert className={estilizarIcon} size={15} />;
      case 'álcool':
        return <BiDrink className={estilizarIcon} size={15} />;
      default:
        return <RxQuestionMark className={estilizarIcon} size={15} />;
    }
  }

  return (
    <div className="w-full">
      <SearchBar search={search} setSearch={setSearch} PlaceHolder={PlaceHolder}/>

      <div className="mt-4 grid grid-cols-4 gap-4 w-full h-full max-h-8">
        {itensFiltrados.map((item) => (
          <div key={item.id} className="flex flex-col justify-start bg-[var(--cor-fundo2)] rounded-2xl p-5 shadow-[1px_1px_3px_rgba(3,34,33,0.1)]">
            {/* Imagem */}
            <div className="relative w-full h-42 rounded-2xl overflow-hidden">
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
            <div className="flex justify-start pt-2">
              <h1 className='text-[#032221] text-2xl font-semibold'>{item.nome}</h1>
            </div>

            {/* Preço e Categoria */}
            <div className="flex flex-row justify-between items-center">
              <span className='text-[#3F7D58] text-lg font-semibold'>€{item.preco.toFixed(2)}</span>
              <span className='flex flex-row items-center justify-center text-black font-normal text-base gap-2 text-gray-500'>
                {IconPorTipo(item.tipo)}
                <span className="relative top-[1px]">{item.tipo}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
