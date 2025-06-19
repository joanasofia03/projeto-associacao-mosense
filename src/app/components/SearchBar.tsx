'use client';
import { GoSearch } from "react-icons/go";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  estilizar: string
  PlaceHolder: string
};

export default function SearchBar({ search, setSearch, estilizar, PlaceHolder }: Props) {
  return (
    <div className={estilizar}>
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