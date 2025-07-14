'use client';

import { useState } from 'react';
import SearchBar from '../../components/SearchBar';

export default function SearchBarWrapper() {
  const [search, setSearch] = useState('');

  return (
    <SearchBar
      search={search}
      setSearch={setSearch}
      PlaceHolder="Pesquisar item..."
    />
  );
}
