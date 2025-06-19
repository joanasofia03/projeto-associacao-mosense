'use client';

import SearchBar from "../components/SearchBar";
import {useState } from 'react';

type Item = {
  id: number;
  nome: string;
};

type Props = {
  itens: Item[];
};

export default function ExibirItens({ itens }: Props) {
  const [search, setSearch] = useState("");
  const PlaceHolder = "Pesquisar..."

  const itensFiltrados = itens.filter((item) => 
    item.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      <SearchBar search={search} setSearch={setSearch} PlaceHolder={PlaceHolder}/>
      
      <div className="mt-4">
        {itensFiltrados.map((item) => (
          <h1 key={item.id}>Olá, {item.nome}</h1>
        ))}
      </div>
    </div>
  );
}
