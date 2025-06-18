'use client';
import { GoSearch } from "react-icons/go";

type Props = {
  search: string;
  setSearch: (value: string) => void;
};

export default function SearchBar({ search, setSearch }: Props) {
  return (
    <div className='flex justify-between gap-1 px-4 items-center bg-[#FFFDF6] w-full min-h-10 rounded-lg shadow-[1px_1px_3px_rgba(3,34,33,0.1)]'>
      <GoSearch size={20}/>
      <input
        type="search"
        placeholder="Pesquisar..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 focus:outline-none text-lg text-gray-500 transition-all duration-300 ease-in-out"
      />
    </div>
  );
}