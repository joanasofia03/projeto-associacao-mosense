'use client';
import { GoSearch } from "react-icons/go";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  PlaceHolder: string
};

export default function SearchBar({ search, setSearch, PlaceHolder }: Props) {
  return (
    <div className= "flex justify-between gap-1 px-4 items-center bg-[var(--cor-fundo2)] w-full min-h-10 rounded-lg shadow-[3px_3px_3px_3px_var(--cor-texto)]/2">
      <GoSearch size={20}/>
      <input
        type="search"
        placeholder={PlaceHolder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
      />
    </div>
  );
}